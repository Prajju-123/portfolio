import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/admin/Login.jsx';
import ForgotPassword from './pages/admin/ForgotPassword.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import { getToken } from './api.js';

// Only /admin is protected. The public site opens at /home for everyone.
const Private = ({ children }) => (getToken() ? children : <Navigate to="/login" replace />);

export default function App() {
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
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
