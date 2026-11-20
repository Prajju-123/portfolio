// Font families the admin can pick in Settings > Font. The choice is saved in MongoDB (profile.fontFamily)
// so it applies to every page for every visitor, and it updates live (no refresh).
// Quicksand is the default.
export const DEFAULT_FONT = 'Quicksand';

// Google web fonts: loaded for every visitor.
const WEB = ['Quicksand', 'Inter', 'Poppins', 'Roboto', 'Montserrat', 'Open Sans', 'Nunito', 'DM Sans', 'Manrope', 'Raleway', 'Lato', 'Space Grotesk', 'Playfair Display', 'Merriweather'];
const WEB_WEIGHTS = { Lato: '400;700', Merriweather: '400;700', Roboto: '400;500;700' };

// Microsoft Office / Excel fonts. They show on devices that have them installed (Windows / Office).
// Where Google has a metric-compatible twin (Calibri -> Carlito ...), that is loaded as the fallback for everybody else.
const OFFICE = [
  ['Arial', 'sans-serif', 'Arimo'], ['Arial Black', 'sans-serif'], ['Arial Narrow', 'sans-serif'], ['Bahnschrift', 'sans-serif'],
  ['Book Antiqua', 'serif'], ['Bookman Old Style', 'serif'], ['Calibri', 'sans-serif', 'Carlito'], ['Calibri Light', 'sans-serif', 'Carlito'],
  ['Cambria', 'serif', 'Caladea'], ['Candara', 'sans-serif'], ['Century Gothic', 'sans-serif'], ['Comic Sans MS', 'cursive'],
  ['Consolas', 'monospace'], ['Constantia', 'serif'], ['Corbel', 'sans-serif'], ['Courier New', 'monospace', 'Cousine'],
  ['Ebrima', 'sans-serif'], ['Franklin Gothic Medium', 'sans-serif'], ['Gabriola', 'cursive'], ['Gadugi', 'sans-serif'],
  ['Garamond', 'serif'], ['Georgia', 'serif'], ['Gill Sans MT', 'sans-serif'], ['Impact', 'sans-serif'],
  ['Lucida Console', 'monospace'], ['Lucida Sans Unicode', 'sans-serif'], ['Microsoft Sans Serif', 'sans-serif', 'Arimo'], ['Palatino Linotype', 'serif'],
  ['Rockwell', 'serif'], ['Segoe Print', 'cursive'], ['Segoe Script', 'cursive'], ['Segoe UI', 'sans-serif'],
  ['Sitka Text', 'serif'], ['Tahoma', 'sans-serif'], ['Times New Roman', 'serif', 'Tinos'], ['Trebuchet MS', 'sans-serif'], ['Verdana', 'sans-serif'],
].map(([name, generic, alt]) => ({ name, group: 'office', generic, alt }));

export const FONTS = [
  ...WEB.map((name) => ({ name, group: 'web', generic: 'sans-serif' })),
  ...OFFICE,
];

const KEY = 'site_font';

const gfont = (family, weights) => {
  const id = 'dyn-font-' + family;
  if (document.getElementById(id)) return;
  const l = document.createElement('link');
  l.id = id;
  l.rel = 'stylesheet';
  l.href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weights}&display=swap`;
  document.head.appendChild(l);
};

// Loads the font and points the page's font variables at it. Unknown names fall back to the default.
export function applyFont(name) {
  const f = FONTS.find((x) => x.name === name) || FONTS.find((x) => x.name === DEFAULT_FONT);
  if (f.group === 'web') gfont(f.name, WEB_WEIGHTS[f.name] || '400;500;600;700');
  else if (f.alt) gfont(f.alt, '400;700');
  const stack = `"${f.name}", ${f.alt ? `"${f.alt}", ` : ''}${f.generic}`;
  const root = document.documentElement;
  root.style.setProperty('--font-display', stack);
  root.style.setProperty('--font-body', stack);
  try { localStorage.setItem(KEY, f.name); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent('fontchange', { detail: f.name }));
  return f.name;
}

export const savedFont = () => { try { return localStorage.getItem(KEY) || DEFAULT_FONT; } catch { return DEFAULT_FONT; } };
// applied instantly on load (no flash), the value from MongoDB is applied right after
export const applySavedFont = () => applyFont(savedFont());
