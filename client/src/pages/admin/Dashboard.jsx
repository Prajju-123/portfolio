import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../../api.js';
import { useToast } from '../../components/Toast.jsx';

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

function Field({ f: [k, type = 'text', opts], v, set, cvName }) {
  const val = type === 'list' ? (v || []).join('\n') : v ?? '';
  if (type === 'image') return (
    <label>
      {k}
      <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files[0]; if (f) set(k, await shrink(f)); }} />
      {v && <img src={v} alt="Current photo" className="mt-1 h-24 w-24 rounded-full border border-black/10 object-cover" />}
      <small>Pick an image. It is resized and saved in the database. Click Save to apply.</small>
    </label>
  );
  if (type === 'pdf') return (
    <label>
      CV (PDF)
      <input type="file" accept="application/pdf" onChange={async (e) => {
        const f = e.target.files[0];
        if (!f) return;
        if (f.size > 2.5 * 1024 * 1024) return alert('Please pick a PDF under 2.5 MB.');
        const url = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
        set(k, url);
        set('cvName', f.name);
      }} />
      {v && <small className="!text-amber-700">Current file: {cvName || 'CV.pdf'}. The Download CV button shows on the site.</small>}
      <small>Pick a PDF (max 2.5 MB), then click Save.</small>
    </label>
  );
  const on = (e) => set(k, type === 'list' ? e.target.value.split('\n') : type === 'number' ? Number(e.target.value) : e.target.value);
  return (
    <label>
      {k.replace(/([A-Z])/g, ' $1')}
      {type === 'textarea' || type === 'list' ? <textarea rows={type === 'list' ? 4 : 3} value={val} onChange={on} />
        : type === 'select' ? <select value={val} onChange={on}>{opts.map((o) => <option key={o}>{o}</option>)}</select>
        : <input type={type} value={val} onChange={on} />}
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
    <form className="aform" onSubmit={submit}>
      {fields.map((f) => <Field key={f[0]} f={f} v={v[f[0]]} set={set} cvName={v.cvName} />)}
      <div className="row">
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
    if (f.newPassword && f.newPassword !== f.confirm) return toast.error('New password and confirm password do not match.', 'Passwords differ');
    try {
      const r = await api('/auth/account', { method: 'PUT', body: { username: a.username, email: a.email, newPassword: f.newPassword } });
      setA(r);
      setF({ newPassword: '', confirm: '' });
      toast.success('Your account was updated.', 'Saved');
    } catch (x) { toast.error(x.message, 'Could not save'); }
  };
  return (
    <form className="aform" onSubmit={submit} autoComplete="off">
      <label>Username<input required minLength={3} value={a.username || ''} onChange={(e) => setA({ ...a, username: e.target.value })} /></label>
      <label>Email<input type="email" required value={a.email || ''} onChange={(e) => setA({ ...a, email: e.target.value })} /><small>The password reset code is sent here.</small></label>
      <label>New password<input type="password" minLength={8} autoComplete="new-password" value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} /><small>Leave empty to keep your password. It is stored as a secure hash.</small></label>
      <label>Confirm password<input type="password" autoComplete="new-password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} /></label>
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

function Collection({ col }) {
  const toast = useToast();
  const { fields } = CFG[col];
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(null);
  const load = () => api('/' + col).then(setItems);
  useEffect(() => { setForm(null); load(); }, [col]);

  const save = async (body) => {
    await (form._id ? api(`/${col}/${form._id}`, { method: 'PUT', body }) : api('/' + col, { method: 'POST', body }));
    setForm(null);
    load();
  };
  const del = async (it) => {
    if (!confirm('Delete this item?')) return;
    try { await api(`/${col}/${it._id}`, { method: 'DELETE' }); toast.success('The item was deleted.', 'Deleted'); load(); } catch (x) { toast.error(x.message, 'Could not delete'); }
  };

  if (form) return <Form key={form._id || 'new'} fields={fields} value={form} onSave={save} onCancel={() => setForm(null)} />;
  return (
    <div>
      <button className="btn gold" onClick={() => setForm({ order: items.length + 1 })}>Add new</button>
      {!items.length && <p>Nothing here yet. Add your first item.</p>}
      <ul className="alist">
        {items.map((it) => (
          <li key={it._id}>
            <span>{it.title || it.category}{it.org ? ` - ${it.org}` : ''}</span>
            <span><button className="btn" onClick={() => setForm(it)}>Edit</button> <button className="btn" onClick={() => del(it)}>Delete</button></span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Messages() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const load = () => api('/messages').then(setItems);
  useEffect(() => { load(); }, []);
  if (!items.length) return <p>No messages yet. They appear here when visitors use the contact form.</p>;
  return (
    <ul className="alist msgs">
      {items.map((m) => (
        <li key={m._id}>
          <div><b>{m.name}</b> ({m.email}) <small>{new Date(m.createdAt).toLocaleString()}</small><p>{m.message}</p></div>
          <button className="btn" onClick={async () => { try { await api('/messages/' + m._id, { method: 'DELETE' }); toast.success('Message deleted.', 'Deleted'); load(); } catch (x) { toast.error(x.message, 'Could not delete'); } }}>Delete</button>
        </li>
      ))}
    </ul>
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

export default function Dashboard() {
  const nav = useNavigate();
  const [tab, setTab] = useState('profile');
  const [menu, setMenu] = useState(false);
  const tabs = ['profile', ...Object.keys(CFG), 'messages', 'account'];
  const label = (t) => (t === 'profile' ? 'Profile' : t === 'messages' ? 'Messages' : t === 'account' ? 'Account' : CFG[t].label);
  const logout = () => { setToken(null); nav('/login'); };
  const pick = (t) => { setTab(t); setMenu(false); window.scrollTo({ top: 0 }); };

  return (
    <div className="adm">
      {menu && <div className="adm-scrim" onClick={() => setMenu(false)} aria-hidden />}
      <aside className={`adm-side ${menu ? 'open' : ''}`}>
        <div className="adm-brand">
          <span className="adm-logo">P</span>
          <div><b>Portfolio</b><small>Admin panel</small></div>
        </div>
        <nav className="adm-nav" aria-label="Admin sections">
          <small>Manage</small>
          {tabs.map((t) => (
            <button key={t} className={t === tab ? 'on' : ''} onClick={() => pick(t)} aria-current={t === tab ? 'page' : undefined}>
              <Ico name={t} />{label(t)}
            </button>
          ))}
        </nav>
        <div className="adm-foot">
          <a href="/home" target="_blank" rel="noreferrer">View site</a>
          <button onClick={logout}>Log out</button>
        </div>
      </aside>

      <div className="adm-main">
        <header className="adm-top">
          <button className="adm-burger" onClick={() => setMenu(true)} aria-label="Open menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-6 w-6"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <div>
            <h1>{label(tab)}</h1>
            <p>{tab === 'profile' ? 'Your name, photo and about details' : tab === 'messages' ? 'Messages from the contact form' : tab === 'account' ? 'Username, email and password for logging in' : 'Add, edit or remove items'}</p>
          </div>
        </header>
        <main className="adm-card">
          {tab === 'profile' ? <Profile /> : tab === 'messages' ? <Messages /> : tab === 'account' ? <Account /> : <Collection col={tab} />}
        </main>
      </div>
    </div>
  );
}
