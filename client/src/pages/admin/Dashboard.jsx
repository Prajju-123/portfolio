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
const PROFILE = [['name'], ['title'], ['tagline'], ['roles', 'list'], ['summary', 'textarea'], ['location'], ['email'], ['phone'], ['linkedin'], ['github'], ['photo', 'image'], ['softSkills', 'list'], ['languages', 'list'], ['hobbies', 'list']];

const clean = (v, fields) => {
  const o = { ...v };
  fields.forEach(([k, t]) => { if (t === 'list') o[k] = (o[k] || []).map((s) => s.trim()).filter(Boolean); });
  return o;
};

// Resize an uploaded image to max 600px and return a JPEG data URL (saved in the profile's "photo" field)
const shrink = (file, max = 600) => new Promise((res, rej) => {
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

function Field({ f: [k, type = 'text', opts], v, set }) {
  const val = type === 'list' ? (v || []).join('\n') : v ?? '';
  if (type === 'image') return (
    <label>
      {k}
      <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files[0]; if (f) set(k, await shrink(f)); }} />
      {v && <img src={v} alt="Current photo" className="mt-1 h-24 w-24 rounded-full border border-black/10 object-cover" />}
      <small>Pick an image. It is resized and saved in the database. Click Save to apply.</small>
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
      {fields.map((f) => <Field key={f[0]} f={f} v={v[f[0]]} set={set} />)}
      <div className="row">
        <button className="btn gold">Save</button>
        {onCancel && <button type="button" className="btn" onClick={onCancel}>Cancel</button>}
      </div>
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

export default function Dashboard() {
  const nav = useNavigate();
  const [tab, setTab] = useState('profile');
  const tabs = ['profile', ...Object.keys(CFG), 'messages'];
  const label = (t) => (t === 'profile' ? 'Profile' : t === 'messages' ? 'Messages' : CFG[t].label);
  const logout = () => { setToken(null); nav('/admin/login'); };

  return (
    <div className="admin">
      <header className="abar">
        <h1>Portfolio admin</h1>
        <span><a href="/" target="_blank" rel="noreferrer">View site</a> <button className="btn" onClick={logout}>Log out</button></span>
      </header>
      <nav className="tabs">
        {tabs.map((t) => <button key={t} className={t === tab ? 'on' : ''} onClick={() => setTab(t)}>{label(t)}</button>)}
      </nav>
      <main>
        {tab === 'profile' ? <Profile /> : tab === 'messages' ? <Messages /> : <Collection col={tab} />}
      </main>
    </div>
  );
}
