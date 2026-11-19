import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../../api.js';

// Each entry: [fieldName, type, options]. Types: text (default), textarea, list (one per line), number, select
const CFG = {
  milestones: { label: 'Journey stops', fields: [['kind', 'select', ['education', 'work']], ['title'], ['org'], ['place'], ['from'], ['to'], ['grade'], ['story', 'textarea'], ['points', 'list'], ['order', 'number']] },
  skills: { label: 'Skills', fields: [['category'], ['items', 'list'], ['order', 'number']] },
  projects: { label: 'Projects', fields: [['title'], ['role'], ['description', 'textarea'], ['tech', 'list'], ['link'], ['github'], ['order', 'number']] },
  certifications: { label: 'Certifications', fields: [['title'], ['issuer'], ['link'], ['order', 'number']] },
};
const PROFILE = [['name'], ['title'], ['tagline'], ['roles', 'list'], ['summary', 'textarea'], ['location'], ['email'], ['phone'], ['linkedin'], ['github'], ['photo'], ['softSkills', 'list'], ['languages', 'list'], ['hobbies', 'list']];

const clean = (v, fields) => {
  const o = { ...v };
  fields.forEach(([k, t]) => { if (t === 'list') o[k] = (o[k] || []).map((s) => s.trim()).filter(Boolean); });
  return o;
};

function Field({ f: [k, type = 'text', opts], v, set }) {
  const val = type === 'list' ? (v || []).join('\n') : v ?? '';
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
  const [msg, setMsg] = useState('');
  const set = (k, x) => setV((o) => ({ ...o, [k]: x }));
  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    try { await onSave(clean(v, fields)); setMsg('Saved'); } catch (x) { setMsg(x.message); }
  };
  return (
    <form className="aform" onSubmit={submit}>
      {fields.map((f) => <Field key={f[0]} f={f} v={v[f[0]]} set={set} />)}
      <div className="row">
        <button className="btn gold">Save</button>
        {onCancel && <button type="button" className="btn" onClick={onCancel}>Cancel</button>}
        <span role="status">{msg}</span>
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
  const del = async (it) => { if (confirm('Delete this item?')) { await api(`/${col}/${it._id}`, { method: 'DELETE' }); load(); } };

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
  const [items, setItems] = useState([]);
  const load = () => api('/messages').then(setItems);
  useEffect(() => { load(); }, []);
  if (!items.length) return <p>No messages yet. They appear here when visitors use the contact form.</p>;
  return (
    <ul className="alist msgs">
      {items.map((m) => (
        <li key={m._id}>
          <div><b>{m.name}</b> ({m.email}) <small>{new Date(m.createdAt).toLocaleString()}</small><p>{m.message}</p></div>
          <button className="btn" onClick={async () => { await api('/messages/' + m._id, { method: 'DELETE' }); load(); }}>Delete</button>
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
