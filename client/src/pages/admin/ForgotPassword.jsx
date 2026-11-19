import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api.js';
import { useToast } from '../../components/Toast.jsx';

const Svg = ({ children, className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>{children}</svg>
);
const Eye = ({ off }) => off
  ? <Svg><path d="M3 3l18 18" /><path d="M10.6 6.1A9.8 9.8 0 0112 6c5 0 9 6 9 6a15 15 0 01-3.2 3.7M6.5 6.9C4.3 8.4 3 12 3 12s4 6 9 6c1.3 0 2.5-.3 3.6-.8" /><path d="M9.9 9.9a3 3 0 004.2 4.2" /></Svg>
  : <Svg><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Svg>;
const LOCK = <><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></>;

function Password({ value, onChange, placeholder, auto }) {
  const [show, setShow] = useState(false);
  return (
    <label className="field">
      <span className="sr-only">{placeholder}</span>
      <Svg className="field-icon">{LOCK}</Svg>
      <input type={show ? 'text' : 'password'} required minLength={8} placeholder={placeholder} autoComplete={auto} className="!pr-12" value={value} onChange={onChange} />
      <button type="button" className="login-eye" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'}>
        <Eye off={show} />
      </button>
    </label>
  );
}

export default function ForgotPassword() {
  const nav = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(1); // 1 = ask for username, 2 = enter the e-mailed code + new password
  const [sentTo, setSentTo] = useState('');
  const [f, setF] = useState({ username: '', code: '', password: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const sendCode = async (e) => {
    e?.preventDefault();
    setBusy(true);
    try {
      const r = await api('/auth/forgot', { method: 'POST', body: { username: f.username } });
      setSentTo(r.sentTo);
      setStep(2);
      toast.success(`We sent a 6-digit code to ${r.sentTo}.`, 'Check your email');
    } catch (x) {
      toast.error(x.message, 'Could not send the code');
    } finally {
      setBusy(false);
    }
  };

  const reset = async (e) => {
    e.preventDefault();
    if (f.password !== f.confirm) return toast.error('New password and confirm password do not match.', 'Passwords differ');
    setBusy(true);
    try {
      await api('/auth/reset-password', { method: 'POST', body: { username: f.username, code: f.code, password: f.password } });
      toast.success('Your password was changed. Please log in with the new password.', 'Password changed');
      nav('/login');
    } catch (x) {
      toast.error(x.message, 'Could not change password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-glow login-glow-a" aria-hidden />
      <div className="login-glow login-glow-b" aria-hidden />
      <form className="aform login-box" onSubmit={step === 1 ? sendCode : reset}>
        <div className="login-head">
          <h1>Forgot password?</h1>
          <p>{step === 1 ? 'Enter your username and we will email you a code' : `Enter the code sent to ${sentTo} and choose a new password`}</p>
        </div>

        {step === 1 ? (
          <>
            <label className="field">
              <span className="sr-only">Username</span>
              <Svg className="field-icon"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></Svg>
              <input type="text" required placeholder="Username" autoComplete="username" autoCapitalize="none" value={f.username} onChange={set('username')} />
            </label>
            <button className="btn gold login-submit" disabled={busy}>{busy ? 'Sending...' : 'Send code'}</button>
          </>
        ) : (
          <>
            <label className="field">
              <span className="sr-only">Verification code</span>
              <Svg className="field-icon">{LOCK}</Svg>
              <input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required placeholder="6-digit code" autoComplete="one-time-code" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.replace(/\D/g, '') })} />
            </label>
            <Password value={f.password} onChange={set('password')} placeholder="New password" auto="new-password" />
            <Password value={f.confirm} onChange={set('confirm')} placeholder="Confirm password" auto="new-password" />
            <button className="btn gold login-submit" disabled={busy}>{busy ? 'Submitting...' : 'Submit'}</button>
            <button type="button" className="login-back" onClick={sendCode} disabled={busy}>Resend code</button>
          </>
        )}
        <Link className="login-back" to="/login">
          <span aria-hidden>👈</span> Back to login
        </Link>
      </form>
    </div>
  );
}
