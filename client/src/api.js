const BASE = import.meta.env.VITE_API_URL || '/api';
// "Remember me" keeps the token in localStorage; otherwise it lives only until the tab is closed.
export const getToken = () => localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
export const setToken = (t, remember = true) => {
  localStorage.removeItem('admin_token');
  sessionStorage.removeItem('admin_token');
  if (t) (remember ? localStorage : sessionStorage).setItem('admin_token', t);
};

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
    body: body && JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}
