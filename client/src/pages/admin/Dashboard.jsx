import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { api, setToken } from '../../api.js';
import { useToast } from '../../components/Toast.jsx';
import { DEFAULT_FONT, FONTS, applyFont, savedFont } from '../../fonts.js';
import SearchSelect from '../../components/SearchSelect.jsx';
import { applyTheme, savedTheme } from '../../theme.js';

// Each entry: [fieldName, type, options]. Types: text (default), textarea, list (one per line), number, select
const CFG = {
  milestones: { label: 'Journey stops', fields: [['kind', 'select', ['education', 'work']], ['title'], ['org'], ['place'], ['from'], ['to'], ['grade'], ['story', 'textarea'], ['points', 'list'], ['order', 'number']] },
  skills: { label: 'Skills', fields: [['category'], ['items', 'list'], ['order', 'number']] },
  projects: { label: 'Projects', fields: [['title'], ['role'], ['description', 'textarea'], ['tech', 'list'], ['link'], ['github'], ['order', 'number']] },
  certifications: { label: 'Certifications', fields: [['title'], ['issuer'], ['link'], ['order', 'number']] },
};
const PROFILE = [['name'], ['title'], ['tagline'], ['roles', 'list'], ['summary', 'textarea'], ['journeyIntro', 'textarea'], ['location'], ['email'], ['phone'], ['linkedin'], ['github'], ['photo', 'image'], ['cv', 'pdf'], ['softSkills', 'list'], ['languages', 'list'], ['hobbies', 'list']];

const clean = (v, fields) => {
  const o = { ...v };
  fields.forEach(([k, t]) => { if (t === 'list') o[k] = (o[k] || []).map((s) => s.trim()).filter(Boolean); });
  return o;
};

// Resize an uploaded image to max 1100px and return a JPEG data URL (saved in the profile's "photo" field)
const shrink = (file, max = 1100) => new Promise((res, rej) => {
  const img = new Image();
  img.onload = () => {
    const s = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    res(c.toDataURL('image/jpeg', 0.85));
  };
  img.onerror = rej;
  img.src = URL.createObjectURL(file);
});

// Textarea that is exactly as tall as its text (no scrollbar inside the box); it grows and shrinks while you type.
function AutoArea(props) {
  const ref = useRef(null);
  const fit = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`; // +2 = the border
  };
  useEffect(fit, [props.value]);
  useEffect(() => {
    window.addEventListener('resize', fit);
    const t = setTimeout(fit, 60); // once more after the pop-up has finished laying out
    return () => { window.removeEventListener('resize', fit); clearTimeout(t); };
  }, []);
  return <textarea ref={ref} rows={1} className="autoarea" {...props} />;
}

// Profile fields the browser may autofill; every other admin field switches autofill off
const AUTOFILL = { name: 'name', email: 'email', phone: 'tel', location: 'address-level2' };

// Opens a stored data: URL (such as the CV) in a new tab. Browsers block data: links, so it goes through a Blob.
function openDataUrl(e, url) {
  e.preventDefault();
  e.stopPropagation();
  try {
    const [head, body] = url.split(',');
    const mime = head.match(/:(.*?);/)?.[1] || 'application/octet-stream';
    const bytes = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
    window.open(URL.createObjectURL(new Blob([bytes], { type: mime })), '_blank', 'noopener');
  } catch { /* not a valid file */ }
}

function Field({ f: [k, type = 'text', opts], v, set, cvName, photoName }) {
  const [fk, setFk] = useState(0); // changing it empties the native file input
  // Clear = set the stored value(s) to null; press Save to apply, like every other change on this page
  const clearFile = (keys) => { keys.forEach((x) => set(x, null)); setFk((n) => n + 1); };
  const val = type === 'list' ? (v || []).join('\n') : v ?? '';
  const wide = ['textarea', 'list', 'image', 'pdf'].includes(type) ? 'sm:col-span-2' : '';
  const curFile = (name, fallback, keys) => (
    <span className="adm-curfile">
      <span>
        Current file: <a href="#open" onClick={(e) => openDataUrl(e, v)}>{(name || fallback).replace(/\.[^.]+$/, '')}</a>
      </span>
      <button type="button" className="btn adm-btn-sm" onClick={() => clearFile(keys)}>Clear</button>
    </span>
  );
  if (type === 'image') return (
    <label className={wide}>
      <span className="adm-fieldhead">{k}</span>
      <input key={fk} type="file" name={k} id={`field-${k}`} autoComplete="off" accept="image/*" onChange={async (e) => { const f = e.target.files[0]; if (f) { set(k, await shrink(f)); set('photoName', f.name); } }} />
      {v && curFile(photoName, 'photo', [k, 'photoName'])}
      {v && <img src={v} alt="Current photo" className="mt-1 h-28 w-28 rounded-full border border-black/10 bg-white object-contain" />}
    </label>
  );
  if (type === 'pdf') return (
    <label className={wide}>
      <span className="adm-fieldhead">CV (PDF) <small>(max 2.5MB)</small></span>
      <input key={fk} type="file" name={k} id={`field-${k}`} autoComplete="off" accept="application/pdf" onChange={async (e) => {
        const f = e.target.files[0];
        if (!f) return;
        if (f.size > 2.5 * 1024 * 1024) return alert('Please pick a PDF under 2.5 MB.');
        const url = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
        set(k, url);
        set('cvName', f.name);
      }} />
      {v && curFile(cvName, 'CV', [k, 'cvName'])}
    </label>
  );
  const on = (e) => set(k, type === 'list' ? e.target.value.split('\n') : type === 'number' ? Number(e.target.value) : e.target.value);
  return (
    <label className={wide}>
      {k.replace(/([A-Z])/g, ' $1')}
      {type === 'textarea' || type === 'list' ? <AutoArea name={k} id={`field-${k}`} autoComplete="off" value={val} onChange={on} />
        : type === 'select' ? <select name={k} id={`field-${k}`} autoComplete="off" value={val} onChange={on}>{opts.map((o) => <option key={o}>{o}</option>)}</select>
        : <input type={type} name={k} id={`field-${k}`} autoComplete={AUTOFILL[k] || 'off'} value={val} onChange={on} />}
      {type === 'list' && <small>One item per line</small>}
    </label>
  );
}

function Form({ fields, value, onSave, onCancel }) {
  const [v, setV] = useState(value);
  const toast = useToast();
  const set = (k, x) => setV((o) => ({ ...o, [k]: x }));
  const submit = async (e) => {
    e.preventDefault();
    try { await onSave(clean(v, fields)); toast.success('Your changes were saved.', 'Saved'); } catch (x) { toast.error(x.message, 'Could not save'); }
  };
  return (
    <form className="aform sm:grid-cols-2" onSubmit={submit}>
      <div className="aform-fields">
        {fields.map((f) => <Field key={f[0]} f={f} v={v[f[0]]} set={set} cvName={v.cvName} photoName={v.photoName} />)}
      </div>
      <div className="row sm:col-span-2">
        <button className="btn gold">Save</button>
        {onCancel && <button type="button" className="btn" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

function Account() {
  const toast = useToast();
  const [a, setA] = useState(null);
  const [f, setF] = useState({ newPassword: '', confirm: '' });
  useEffect(() => { api('/auth/me').then(setA); }, []);
  if (!a) return <p>Loading...</p>;
  const submit = async (e) => {
    e.preventDefault();
    if (f.newPassword && f.newPassword !== f.confirm) return toast.error('Passwords do not match.', 'Passwords differ');
    try {
      const r = await api('/auth/account', { method: 'PUT', body: { username: a.username, email: a.email, newPassword: f.newPassword } });
      setA(r);
      setF({ newPassword: '', confirm: '' });
      toast.success('Your account was updated.', 'Saved');
    } catch (x) { toast.error(x.message, 'Could not save'); }
  };
  return (
    <form className="aform" onSubmit={submit} autoComplete="off">
      <label>Username<input name="username" id="acc-username" autoComplete="username" required minLength={3} value={a.username || ''} onChange={(e) => setA({ ...a, username: e.target.value })} /></label>
      <label>Email<input type="email" name="email" id="acc-email" autoComplete="email" required value={a.email || ''} onChange={(e) => setA({ ...a, email: e.target.value })} /><small>The password reset code is sent here.</small></label>
      <label>New password<input type="password" name="newPassword" id="acc-new" minLength={8} autoComplete="new-password" value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} /><small>Leave empty to keep your password. It is stored as a secure hash.</small></label>
      <label>Confirm password<input type="password" name="confirmPassword" id="acc-confirm" autoComplete="new-password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} /></label>
      <div className="row"><button className="btn gold">Save</button></div>
    </form>
  );
}

function Profile() {
  const [p, setP] = useState(null);
  useEffect(() => { api('/portfolio').then((d) => setP(d.profile)); }, []);
  if (!p) return <p>Loading...</p>;
  return <Form fields={PROFILE} value={p} onSave={(b) => api('/profile', { method: 'PUT', body: b })} />;
}

const PencilIco = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg>;
const TrashIco = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>;

function useEsc(fn) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && fn();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fn]);
}

// Centered pop-up. The body scrolls on small screens; the title bar stays visible.
const inPanel = (node) => createPortal(node, document.getElementById('adm-modal-root') || document.body);

function Modal({ title, onClose, children, small }) {
  useEsc(onClose);
  const bodyRef = useRef(null);
  // Keeps the inputs ending exactly 16px from the pop-up edge (same line as the x icon and the Save button),
  // whatever the scrollbar width is and whether or not a scrollbar is showing.
  useEffect(() => {
    const el = bodyRef.current?.querySelector('.adm-scrollarea, .aform-fields');
    if (!el) return undefined;
    const fit = () => {
      const bar = el.offsetWidth - el.clientWidth; // 0 when there is no scrollbar
      el.style.paddingRight = `${Math.max(16 - 4 - bar, 0)}px`; // 4px = the gap kept right of the scroll area
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    [...el.children].forEach((ch) => ro.observe(ch));
    return () => ro.disconnect();
  });
  return inPanel(
    <div className="adm-modal in-panel" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`adm-modal-box adm-modal-wide ${small ? 'adm-modal-sm' : ''}`}>
        <div className="adm-modal-head">
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg></button>
        </div>
        <div className="adm-modal-body" ref={bodyRef}>{children}</div>
      </div>
    </div>
  );
}

// "Are you sure?" pop-up used for deleting
function Confirm({ text, yes = 'Delete', onYes, onNo }) {
  useEsc(onNo);
  return inPanel(
    <div className="adm-modal in-panel" role="dialog" aria-modal="true" aria-label={text} onClick={onNo}>
      <div className="adm-modal-box" onClick={(e) => e.stopPropagation()}>
        <span className="adm-modal-ico" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8"><path d="M10.3 3.9L2.4 17.5A2 2 0 004.1 20.5h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /><path d="M12 9v4.5" /><path d="M12 17v.01" /></svg>
        </span>
        <h2>{text}</h2>
        <div className="adm-modal-row">
          <button className="btn gold" onClick={onYes}>{yes}</button>
          <button className="btn" onClick={onNo} autoFocus>Cancel</button>
        </div>
      </div>
    </div>
  );
}

const Actions = ({ onEdit, onDelete }) => (
  <span className="adm-acts">
    {onEdit && <button type="button" className="adm-act" onClick={onEdit} aria-label="Edit" title="Edit">{PencilIco}</button>}
    <button type="button" className="adm-act del" onClick={onDelete} aria-label="Delete" title="Delete">{TrashIco}</button>
  </span>
);

function Collection({ col }) {
  const toast = useToast();
  const { fields, label } = CFG[col];
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(null); // item being edited / created -> shown in a pop-up
  const [gone, setGone] = useState(null); // item waiting for delete confirmation
  const load = () => api('/' + col).then(setItems);
  useEffect(() => { setForm(null); setGone(null); load(); }, [col]);

  const save = async (body) => {
    await (form._id ? api(`/${col}/${form._id}`, { method: 'PUT', body }) : api('/' + col, { method: 'POST', body }));
    setForm(null);
    load();
  };
  const del = async () => {
    const it = gone;
    setGone(null);
    try { await api(`/${col}/${it._id}`, { method: 'DELETE' }); toast.success('The item was deleted.', 'Deleted'); load(); } catch (x) { toast.error(x.message, 'Could not delete'); }
  };

  return (
    <div>
      <button className="btn gold" onClick={() => setForm({ order: items.length + 1 })}>Add new</button>
      {!items.length && <p>Nothing here yet. Add your first item.</p>}
      <ul className="alist">
        {items.map((it) => (
          <li key={it._id}>
            <span className="min-w-0 flex-1 break-words">{it.title || it.category}{it.org ? ` - ${it.org}` : ''}</span>
            <Actions onEdit={() => setForm(it)} onDelete={() => setGone(it)} />
          </li>
        ))}
      </ul>
      {form && (
        <Modal title={`${form._id ? 'Edit' : 'Add'} - ${label}`} onClose={() => setForm(null)}>
          <Form key={form._id || 'new'} fields={fields} value={form} onSave={save} onCancel={() => setForm(null)} />
        </Modal>
      )}
      {gone && <Confirm text="Are you sure you want to delete?" onYes={del} onNo={() => setGone(null)} />}
    </div>
  );
}

function Messages() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [gone, setGone] = useState(null);
  const load = () => api('/messages').then(setItems);
  useEffect(() => { load(); }, []);
  const del = async () => {
    const m = gone;
    setGone(null);
    try { await api('/messages/' + m._id, { method: 'DELETE' }); toast.success('Message deleted.', 'Deleted'); load(); } catch (x) { toast.error(x.message, 'Could not delete'); }
  };
  if (!items.length) return <p>No messages yet. They appear here when visitors use the contact form.</p>;
  return (
    <>
      <ul className="alist msgs">
        {items.map((m) => (
          <li key={m._id}>
            <div className="min-w-0 flex-1 break-words"><b>{m.name}</b> ({m.email}) <small>{new Date(m.createdAt).toLocaleString()}</small><p>{m.message}</p></div>
            <Actions onDelete={() => setGone(m)} />
          </li>
        ))}
      </ul>
      {gone && <Confirm text="Are you sure you want to delete?" onYes={del} onNo={() => setGone(null)} />}
    </>
  );
}

const ICONS = {
  profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
  milestones: <><path d="M12 3v18" /><circle cx="12" cy="7" r="2.5" /><circle cx="12" cy="17" r="2.5" /></>,
  skills: <><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" /></>,
  projects: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18" /></>,
  certifications: <><circle cx="12" cy="9" r="5" /><path d="M8.5 13.5L7 21l5-3 5 3-1.5-7.5" /></>,
  account: <><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></>,
  messages: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
};
const Ico = ({ name }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0" aria-hidden>{ICONS[name]}</svg>
);

// SearchSelect (shared component, left untouched) renders its helper/search inputs without a name or id.
// This wrapper gives them one, so the browser does not report "A form field element should have an id or name attribute".
function Named({ name, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const fix = () => el.querySelectorAll('input').forEach((i) => {
      if (!i.name) i.name = `${name}-${i.readOnly ? 'helper' : 'search'}`;
      if (!i.id) i.id = i.name;
    });
    fix();
    const mo = new MutationObserver(fix);
    mo.observe(el, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [name]);
  return <div ref={ref} style={{ display: 'contents' }}>{children}</div>;
}

function Settings({ theme, setTheme }) {
  const dark = theme === 'dark';
  const toast = useToast();
  const [font, setFont] = useState(savedFont); // the font that is saved and in use (Quicksand until you save another one)
  const [draft, setDraft] = useState(savedFont); // what is chosen in the dropdown but not saved yet
  const [editing, setEditing] = useState(false); // the edit pop-up
  const [busy, setBusy] = useState(false);
  const dirty = draft !== font;
  // stays in step with changes made elsewhere (other tab, background sync)
  const fontRef = useRef(font);
  fontRef.current = font;
  useEffect(() => {
    // an unsaved choice (for example after "Set as default") is kept until you Save or close the pop-up
    const on = (e) => { setDraft((d) => (d === fontRef.current ? e.detail : d)); setFont(e.detail); };
    window.addEventListener('fontchange', on);
    return () => window.removeEventListener('fontchange', on);
  }, []);
  const fontOptions = FONTS.map((f) => ({ id: f.name, label: f.name }));
  const chooseFont = (value) => setDraft(value || DEFAULT_FONT);
  const setDefault = () => setDraft(DEFAULT_FONT); // Quicksand; press Save to keep it
  const save = async () => {
    if (!dirty || busy) return;
    const prev = font;
    setBusy(true);
    applyFont(draft); // the whole panel and website switch right away
    try {
      await api('/profile', { method: 'PUT', body: { fontFamily: draft } }); // saved for every visitor
      setFont(draft);
      setEditing(false);
      toast.success(`Font changed to ${draft}.`, 'Saved');
    } catch (x) {
      applyFont(prev);
      toast.error(x.message, 'Could not save');
    }
    setBusy(false);
  };
  const closeEdit = () => { setDraft(font); setEditing(false); };
  const FontButtons = ({ className = '' }) => (
    <span className={`adm-fontbtns ${className}`}>
      <button type="button" className="btn adm-btn-sm" onClick={setDefault} disabled={draft === DEFAULT_FONT}>Set as default</button>
      <button type="button" className="btn gold adm-btn-sm" onClick={save} disabled={!dirty || busy}>{busy ? 'Saving...' : 'Save'}</button>
    </span>
  );
  return (
    <section>
      <h2 className="adm-set-title">Theme</h2>
      <div className="adm-setrow">
        <div className="min-w-0">
          <b>Light / Dark mode</b>
          <small>Switch the website and this panel between light and dark.</small>
        </div>
      {/* knob on the left with a sun = light (default); slide it right and it becomes a moon = dark */}
      <button type="button" role="switch" aria-checked={dark} aria-label={dark ? 'Dark mode, switch to light' : 'Light mode, switch to dark'} className={`adm-switch ${dark ? 'on' : ''}`} onClick={() => setTheme(dark ? 'light' : 'dark')}>
        <span className="adm-switch-knob">
          {dark ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4" aria-hidden><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
          )}
        </span>
      </button>
      </div>

      <h2 className="adm-set-title mt-6">Font</h2>
      <div className="adm-setrow flex-wrap">
        <div className="min-w-0 flex-1">
          <b>Font family</b>
          <small>Applies live to the whole website and this panel.</small>
        </div>
        <div className="adm-fontrow">
          <div className="adm-fontpick">
            <Named name="font-current"><SearchSelect options={fontOptions} value={font} onChange={() => {}} placeholder="Select" disabled /></Named>
          </div>
          <button type="button" className="adm-act" onClick={() => setEditing(true)} aria-label="Edit font" title="Edit font">{PencilIco}</button>
        </div>
      </div>

      {editing && (
        <Modal title="Edit font" onClose={closeEdit} small>
          <div className="adm-scrollarea">
            <Named name="font-edit"><SearchSelect options={fontOptions} value={draft} onChange={chooseFont} placeholder="Select" /></Named>
          </div>
          <div className="adm-modal-end"><FontButtons /></div>
        </Modal>
      )}
    </section>
  );
}

// Every sidebar menu has its own page: /admin/profile, /admin/journey-stops, /admin/skills ...
export const ADMIN_SLUGS = { profile: 'profile', milestones: 'journey-stops', skills: 'skills', projects: 'projects', certifications: 'certifications', messages: 'messages', account: 'account', settings: 'settings' };
const KEY_OF = Object.fromEntries(Object.entries(ADMIN_SLUGS).map(([k, v]) => [v, k]));

export default function Dashboard() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const current = KEY_OF[pathname.replace(/^\/admin\/?/, '').replace(/\/$/, '')] || 'profile'; // which page the URL points at
  const tab = current;
  const onSettings = current === 'settings'; // the gear icon opens its own page
  const [menu, setMenu] = useState(false);
  const [dd, setDd] = useState(false); // user dropdown (Profile / Logout)
  const ddRef = useRef(null);
  const panelRef = useRef(null); // the right-hand panel is the only thing that scrolls
  const toast = useToast();
  const [theme, setThemeState] = useState(savedTheme);
  useEffect(() => {
    const on = (e) => setThemeState(e.detail);
    window.addEventListener('themechange', on);
    return () => window.removeEventListener('themechange', on);
  }, []);
  // switching the theme changes the whole website and this panel, and is saved in MongoDB
  const setTheme = async (t) => {
    const prev = theme;
    setThemeState(t);
    applyTheme(t);
    try {
      await api('/profile', { method: 'PUT', body: { theme: t } });
    } catch (x) {
      setThemeState(prev);
      applyTheme(prev);
      toast.error(x.message, 'Could not save theme');
    }
  };
  const tabs = ['profile', ...Object.keys(CFG), 'messages', 'account'];
  const label = (t) => (t === 'profile' ? 'Profile' : t === 'messages' ? 'Messages' : t === 'account' ? 'Account' : t === 'settings' ? 'Settings' : CFG[t].label);
  const sub = { profile: 'Your name, photo and about details', messages: 'Messages from the contact form', account: 'Username, email and password for logging in', settings: 'Choose the look of your admin panel' }[current] || 'Add, edit or remove items';
  const [me, setMe] = useState(null); // name + photo for the sidebar card (refreshed whenever you switch section)
  const [confirmExit, setConfirmExit] = useState(false);
  useEffect(() => { api('/portfolio').then((d) => { setMe(d.profile);  }).catch(() => {}); }, [current]);
  useEffect(() => {
    if (!confirmExit) return;
    const onKey = (e) => e.key === 'Escape' && setConfirmExit(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmExit]);
  useEffect(() => {
    if (!dd) return;
    const away = (e) => { if (ddRef.current && !ddRef.current.contains(e.target)) setDd(false); };
    const esc = (e) => e.key === 'Escape' && setDd(false);
    document.addEventListener('mousedown', away);
    window.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); window.removeEventListener('keydown', esc); };
  }, [dd]);
  const logout = () => { setToken(null); nav('/login'); };
  const pick = (t) => { setMenu(false); setDd(false); if (t !== current) nav(`/admin/${ADMIN_SLUGS[t]}`); panelRef.current?.scrollTo({ top: 0 }); };
  const askExit = () => { setMenu(false); setDd(false); setConfirmExit(true); };
  const LogoutIco = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0" aria-hidden><path d="M9 4H6a2 2 0 00-2 2v12a2 2 0 002 2h3" /><path d="M16 8l4 4-4 4" /><path d="M20 12H9" /></svg>;

  return (
    <div className={`adm ${theme === 'dark' ? 'dark' : ''}`}>
      {menu && <div className="adm-scrim" onClick={() => setMenu(false)} aria-hidden />}
      <aside className={`adm-side ${menu ? 'open' : ''}`}>
        <div className="adm-brand">
          <span className="adm-logo">P</span>
          <div><b>Portfolio</b><small>Admin panel</small></div>
        </div>
        <nav className="adm-nav" aria-label="Admin sections">
          {tabs.map((t) => (
            <button key={t} className={t === current ? 'on' : ''} onClick={() => pick(t)} aria-current={t === current ? 'page' : undefined}>
              <Ico name={t} />{label(t)}
            </button>
          ))}
          <button className="adm-logout" onClick={askExit}>{LogoutIco}Logout</button>
        </nav>
        <div className="adm-me">
          <span className="adm-me-photo">
            {me?.photo ? <img src={me.photo} alt="" /> : <b>{(me?.name || 'P').charAt(0)}</b>}
          </span>
          <div><b>{me?.name || 'Admin'}</b><small>{me?.title || 'Administrator'}</small></div>
        </div>
      </aside>

      <div className="adm-main">
        {/* black top bar (same colour as the sidebar): menu button on phones, settings + user icons on the right */}
        <div className="adm-bar">
          <button className="adm-burger" onClick={() => setMenu(true)} aria-label="Open menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-6 w-6"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <div className="adm-bar-right">
            <button className={`adm-iconbtn ${onSettings ? 'on' : ''}`} onClick={() => { setDd(false); nav(`/admin/${ADMIN_SLUGS.settings}`); }} aria-label="Settings" title="Settings">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></svg>
            </button>
            <div className="adm-user" ref={ddRef}>
              <button className={`adm-iconbtn adm-avatar ${dd ? 'on' : ''}`} onClick={() => setDd((v) => !v)} aria-haspopup="menu" aria-expanded={dd} aria-label="User menu" title="User menu">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
              </button>
              {dd && (
                <div className="adm-dd" role="menu">
                  <div className="adm-dd-head"><b>{me?.name || 'Admin'}</b><small>{me?.title || 'Administrator'}</small></div>
                  <button role="menuitem" onClick={() => pick('profile')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
                    Profile
                  </button>
                  <button role="menuitem" className="out" onClick={askExit}>{LogoutIco}Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="adm-panel" id="adm-modal-root">
        <div className="adm-scroll" ref={panelRef}>
        <div className="adm-content">
          <header className="adm-top">
            <div>
              <h1>{label(current)}</h1>
              <p>{sub}</p>
            </div>
          </header>
          <main className={current === 'settings' ? '' : 'adm-card'}>
            {current === 'settings' ? <Settings theme={theme} setTheme={setTheme} /> : tab === 'profile' ? <Profile /> : tab === 'messages' ? <Messages /> : tab === 'account' ? <Account /> : <Collection col={tab} />}
          </main>
        </div>
        </div>
        </div>
      </div>
      {confirmExit && (
        <div className="adm-modal" role="dialog" aria-modal="true" aria-labelledby="exit-q" onClick={() => setConfirmExit(false)}>
          <div className="adm-modal-box" onClick={(e) => e.stopPropagation()}>
            <span className="adm-modal-ico" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8"><path d="M10.3 3.9L2.4 17.5A2 2 0 004.1 20.5h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /><path d="M12 9v4.5" /><path d="M12 17v.01" /></svg>
            </span>
            <h2 id="exit-q">Are you sure you want to exit?</h2>
            <div className="adm-modal-row">
              <button className="btn gold" onClick={logout}>Yes</button>
              <button className="btn" onClick={() => setConfirmExit(false)} autoFocus>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
