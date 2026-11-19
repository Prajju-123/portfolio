import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../../api.js';

export default function Login() {
  const nav = useNavigate();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const { token } = await api('/auth/login', { method: 'POST', body: f });
      setToken(token);
      nav('/admin');
    } catch (x) {
      setErr(x.message);
    }
  };

  return (
    <div className="admin login">
      <form className="aform" onSubmit={submit}>
        <h1>Admin login</h1>
        <label>Email<input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label>Password<input type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
        <button className="btn gold">Log in</button>
        {err && <p className="err" role="alert">{err}</p>}
      </form>
    </div>
  );
}
