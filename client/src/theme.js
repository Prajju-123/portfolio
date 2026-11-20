// Light / dark theme chosen in Admin > Settings. Saved in MongoDB (profile.theme) so it applies to the whole
// website and the admin panel. Light is the default.
const KEY = 'site_theme';

export function applyTheme(t) {
  const dark = t === 'dark';
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  try { localStorage.setItem(KEY, dark ? 'dark' : 'light'); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent('themechange', { detail: dark ? 'dark' : 'light' }));
}
export const savedTheme = () => { try { return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'; } catch { return 'light'; } };
// applied instantly on load (no flash), the value from MongoDB is applied right after
export const applySavedTheme = () => applyTheme(savedTheme());
