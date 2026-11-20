import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/admin/Login.jsx';
import ForgotPassword from './pages/admin/ForgotPassword.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import { api, getToken } from './api.js';
import { applyFont, applySavedFont } from './fonts.js';
import { applyTheme, applySavedTheme } from './theme.js';

// Only /admin is protected. The public site opens at /home for everyone.
const Private = ({ children }) => (getToken() ? children : <Navigate to="/login" replace />);

export default function App() {
  // Font family + light/dark theme chosen in Admin > Settings are applied live, without a refresh:
  // - other tabs of this browser update at once (storage event)
  // - every visitor picks up the saved value from MongoDB every few seconds and when the tab gets focus
  useEffect(() => {
    applySavedFont();
    applySavedTheme();
    const sync = () =>
      api('/portfolio')
        .then((d) => {
          applyFont(d.profile?.fontFamily);
          applyTheme(d.profile?.theme || 'light');
        })
        .catch(() => {});
    sync();
    const onStorage = (e) => {
      if (e.key === 'site_font') applyFont(e.newValue);
      if (e.key === 'site_theme') applyTheme(e.newValue);
    };
    const onVisible = () => document.visibilityState === 'visible' && sync();
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', sync);
    const t = setInterval(onVisible, 10000);
    return () => {
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', sync);
      clearInterval(t);
    };
  }, []);
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      {['home', 'journey', 'toolkit', 'projects', 'contact'].map((id) => (
        <Route key={id} path={`/${id}`} element={<Home />} />
      ))}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      <Route path="/admin" element={<Private><Dashboard /></Private>} />
      <Route path="/admin/settings" element={<Private><Dashboard /></Private>} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
