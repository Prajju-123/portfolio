import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Usage:  const toast = useToast();  toast.success('Saved'); toast.error('Oops'); toast.info('FYI');
// Optional second argument is a title:  toast.success('I will reply soon.', 'Message sent')
const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

const DURATION = 5000;
const STYLES = {
  success: { title: 'Success', ring: 'text-emerald-300 bg-emerald-400/15', bar: 'bg-emerald-400', path: <path d="M5 13l4 4L19 7" /> },
  error: { title: 'Something went wrong', ring: 'text-red-300 bg-red-400/15', bar: 'bg-red-400', path: <><path d="M12 8v5" /><path d="M12 16.5v.01" /><path d="M10.3 3.9L2.4 17.5A2 2 0 004.1 20.5h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /></> },
  info: { title: 'Heads up', ring: 'text-gold bg-gold/15', bar: 'bg-gold', path: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 7.5v.01" /></> },
};

function Toast({ t, onClose }) {
  const s = STYLES[t.type];
  const [paused, setPaused] = useState(false);
  return (
    <motion.div
      layout
      role={t.type === 'error' ? 'alert' : 'status'}
      initial={{ opacity: 0, x: 60, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.96, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      onHoverStart={() => setPaused(true)}
      onHoverEnd={() => setPaused(false)}
      className="pointer-events-auto relative overflow-hidden rounded-xl border border-white/10 bg-ink/95 text-white shadow-[0_12px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl"
    >
      <span className="absolute inset-y-0 left-0 w-[3px] bg-gold" aria-hidden />
      {/* compact: icon + "Title  message" on ONE line (ellipsis only if it is wider than the screen) */}
      <div className="flex items-center gap-2.5 py-2 pl-4 pr-2">
        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg ${s.ring}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>{s.path}</svg>
        </span>
        <p className="min-w-0 flex-1 truncate text-[0.8rem] leading-tight" title={`${t.title || s.title}: ${t.text}`}>
          <b className="font-display font-bold">{t.title || s.title}</b>
          <span className="mx-1.5 text-white/30">|</span>
          <span className="text-white/75">{t.text}</span>
        </p>
        <button type="button" onClick={onClose} aria-label="Dismiss notification" className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3.5 w-3.5" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
      {/* auto-dismiss timer; pauses while the mouse is over the toast */}
      <motion.i
        className={`absolute bottom-0 left-0 h-[2px] w-full origin-left ${s.bar}`}
        initial={{ scaleX: 1 }}
        animate={{ scaleX: paused ? undefined : 0 }}
        transition={{ duration: DURATION / 1000, ease: 'linear' }}
        onAnimationComplete={onClose}
      />
    </motion.div>
  );
}

export function ToastProvider({ children }) {
  const [list, setList] = useState([]);
  const id = useRef(0);
  const close = useCallback((i) => setList((l) => l.filter((t) => t.id !== i)), []);
  const push = useCallback((type) => (text, title) => {
    const i = ++id.current;
    setList((l) => [...l.slice(-3), { id: i, type, text, title }]); // keep at most 4 on screen
  }, []);
  const api = useMemo(() => ({ success: push('success'), error: push('error'), info: push('info') }), [push]);
  return (
    <ToastCtx.Provider value={api}>
      {children}
      {/* top-right, just under the fixed nav; full width (with gutters) on phones */}
      <div className="pointer-events-none fixed inset-x-4 top-[4.5rem] z-[60] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-6 sm:top-20 sm:w-max sm:max-w-[32rem] sm:min-w-[18rem]" aria-live="polite">
        <AnimatePresence initial={false}>
          {list.map((t) => <Toast key={t.id} t={t} onClose={() => close(t.id)} />)}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
