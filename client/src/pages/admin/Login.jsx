import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, setToken } from '../../api.js';
import { useToast } from '../../components/Toast.jsx';

const Svg = ({ children, className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>{children}</svg>
);

export default function Login() {
  const nav = useNavigate();
  const [f, setF] = useState({ username: '', password: '' });
  const [remember, setRemember] = useState(false);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { token } = await api('/auth/login', { method: 'POST', body: f });
      setToken(token, remember);
      toast.success('Welcome back.', 'Logged in');
      nav('/admin');
    } catch (x) {
      toast.error(x.message, 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-glow login-glow-a" aria-hidden />
      <div className="login-glow login-glow-b" aria-hidden />
      <form className="aform login-box" onSubmit={submit}>
        <div className="login-head">
          <h1>Login</h1>
          <p>Sign in to manage your portfolio</p>
        </div>

        <label className="field">
          <span className="sr-only">Username</span>
          <Svg className="field-icon"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></Svg>
          <input type="text" name="username" id="username" required placeholder="Username" autoComplete="username" autoCapitalize="none" spellCheck={false} value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
        </label>

        <label className="field">
          <span className="sr-only">Password</span>
          <Svg className="field-icon"><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></Svg>
          <input type={show ? 'text' : 'password'} name="password" id="password" required placeholder="Password" autoComplete="current-password" className="!pr-12" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          <button type="button" className="login-eye" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>
            {show ? (
              <Svg><path d="M3 3l18 18" /><path d="M10.6 6.1A9.8 9.8 0 0112 6c5 0 9 6 9 6a15 15 0 01-3.2 3.7M6.5 6.9C4.3 8.4 3 12 3 12s4 6 9 6c1.3 0 2.5-.3 3.6-.8" /><path d="M9.9 9.9a3 3 0 004.2 4.2" /></Svg>
            ) : (
              <Svg><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Svg>
            )}
          </button>
        </label>

        <div className="login-opts">
          <label className="login-remember">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <span>Remember me</span>
          </label>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        <button className="btn gold login-submit" disabled={busy}>{busy ? 'Signing in...' : 'Log in'}</button>
      </form>
    </div>
  );
}
