import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../../api.js';
import { useToast } from '../../components/Toast.jsx';

export default function Login() {
  const nav = useNavigate();
  const [f, setF] = useState({ email: '', password: '' });
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { token } = await api('/auth/login', { method: 'POST', body: f });
      setToken(token);
      toast.success('Welcome back.', 'Logged in');
      nav('/admin');
    } catch (x) {
      toast.error(x.message, 'Login failed');
    }
  };

  return (
    <div className="admin login">
      <form className="aform" onSubmit={submit}>
        <h1>Admin login</h1>
        <label>Email<input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label>Password<input type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
        <button className="btn gold">Log in</button>
      </form>
    </div>
  );
}
