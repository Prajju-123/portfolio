import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { api } from '../api.js';

const PHOTO = '/profile.png'; // your photo from the resume (client/public/profile.png)
const glass = 'rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-md';

const Reveal = ({ children, className = '', x = 0 }) => (
  <motion.div className={className} initial={{ opacity: 0, y: 36, x }} whileInView={{ opacity: 1, y: 0, x: 0 }}
    viewport={{ once: true, margin: '-70px' }} transition={{ duration: 0.7, ease: 'easeOut' }}>
    {children}
  </motion.div>
);

const Section = ({ id, title, sub, children }) => (
  <section id={id} className="mx-auto max-w-6xl scroll-mt-16 px-5 pb-10 pt-20 sm:px-8 md:pt-28">
    <h2 className="text-4xl font-extrabold sm:text-5xl md:text-6xl">{title}</h2>
    {sub && <p className="mt-4 max-w-xl text-paper/70">{sub}</p>}
    {children}
  </section>
);

// Background: the sky moves from midnight violet to a rose dawn as you travel down the page
function Sky() {
  const { scrollYProgress } = useScroll();
  const backgroundColor = useTransform(scrollYProgress, [0, 0.35, 0.7, 1], ['#120a2a', '#2a1659', '#4a1d6b', '#7a2e5f']);
  return (
    <motion.div className="fixed inset-0 -z-10 overflow-hidden" style={{ backgroundColor }} aria-hidden>
      <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-violet-500/25 blur-[110px]" />
      <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-orchid/20 blur-[120px]" />
      <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-gold/10 blur-[120px]" />
    </motion.div>
  );
}

function Nav({ name }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  const [open, setOpen] = useState(false);
  const links = [['journey', 'Journey'], ['toolkit', 'Toolkit'], ['work', 'Projects'], ['contact', 'Contact']];
  return (
    <nav className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-night/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <a href="#top" className="font-display text-xl font-extrabold">{name?.split(' ')[0]}</a>
        <div className="hidden gap-8 md:flex">
          {links.map(([id, l]) => <a key={id} href={`#${id}`} className="text-sm font-medium text-paper/80 transition hover:text-gold">{l}</a>)}
        </div>
        <button className="rounded-full border border-white/25 px-4 py-1.5 text-sm md:hidden" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? 'Close' : 'Menu'}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div className="overflow-hidden md:hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <div className="flex flex-col px-5 pb-4">
              {links.map(([id, l]) => <a key={id} href={`#${id}`} onClick={() => setOpen(false)} className="border-t border-white/10 py-3 text-paper/90">{l}</a>)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.i style={{ scaleX }} className="absolute bottom-0 left-0 h-[3px] w-full origin-left bg-gold" />
    </nav>
  );
}

function Hero({ p }) {
  const roles = p.roles?.length ? p.roles : [p.title];
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((n) => (n + 1) % roles.length), 2600); return () => clearInterval(t); }, [roles.length]);
  return (
    <header id="top" className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 pb-20 pt-28 sm:px-8 lg:grid-cols-[1.35fr_1fr]">
      <div className="order-2 text-center lg:order-1 lg:text-left">
        <motion.p className="font-semibold text-gold" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>Hello, I'm</motion.p>
        <h1 aria-label={p.name} className="mt-2 text-[clamp(2.6rem,9.5vw,6rem)] font-extrabold">
          {(p.name || '').split(' ').map((w, wi) => (
            <span key={wi} className="mr-[0.25em] inline-block overflow-hidden whitespace-nowrap align-bottom">
              {[...w].map((c, k) => (
                <motion.span key={k} className="inline-block" initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 + (wi * 8 + k) * 0.045, duration: 0.6 }}>{c}</motion.span>
              ))}
            </span>
          ))}
        </h1>
        <div className="mt-3 h-10 font-display text-xl font-bold text-mint sm:text-2xl md:text-3xl">
          <AnimatePresence mode="wait">
            <motion.span key={i} className="inline-block" initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -18, opacity: 0 }}>{roles[i]}</motion.span>
          </AnimatePresence>
        </div>
        <p className="mx-auto mt-3 max-w-md text-lg text-paper/70 lg:mx-0">{p.tagline}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
          <a className="btn gold" href="#journey">Start the journey</a>
          <a className="btn" href="#contact">Say hello</a>
        </div>
      </div>

      <motion.div className="order-1 justify-self-center lg:order-2" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, type: 'spring', stiffness: 90 }}>
        <div className="relative">
          <motion.div className="absolute -inset-3 rounded-full bg-[conic-gradient(from_0deg,#ffc15e,#5eead4,#f472b6,#ffc15e)] opacity-80 blur-[3px]" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 20, ease: 'linear' }} />
          <div className="relative aspect-square w-56 overflow-hidden rounded-full border-4 border-night bg-black shadow-2xl shadow-violet-900/60 sm:w-72 lg:w-80">
            <img src={p.photo || PHOTO} alt={p.name} className="h-full w-full object-cover" onError={(e) => { if (!e.target.src.endsWith(PHOTO)) e.target.src = PHOTO; }} />
          </div>
        </div>
      </motion.div>

      <motion.p className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap text-sm text-paper/60 sm:block" animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}>
        Scroll and the road starts here
      </motion.p>
    </header>
  );
}

function About({ p }) {
  const facts = [['Based in', p.location && [p.location]], ['Speaks', p.languages], ['Strengths', p.softSkills], ['Off the clock', p.hobbies]].filter(([, v]) => v?.length);
  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-5 pb-4 sm:px-8 md:grid-cols-[1.5fr_1fr] md:items-start md:gap-12">
      <Reveal><p className="text-xl leading-relaxed sm:text-2xl">{p.summary}</p></Reveal>
      <Reveal className={`${glass} grid gap-3 p-6`}>
        {facts.map(([k, v]) => <p key={k}><b className="mr-2 text-gold">{k}</b><span className="text-paper/80">{v.join(', ')}</span></p>)}
      </Reveal>
    </section>
  );
}

function Journey({ items }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 65%', 'end 55%'] });
  const fill = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });
  const top = useTransform(fill, (v) => `${v * 100}%`);
  return (
    <Section id="journey" title="The journey so far" sub="From a school in Kundapura to enterprise apps in Bengaluru. Keep scrolling to follow the road.">
      <div className="relative mt-14" ref={ref}>
        <div className="absolute inset-y-0 left-[18px] w-1 -translate-x-1/2 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,.28)_0_14px,transparent_14px_28px)] md:left-1/2" />
        <motion.div className="absolute inset-y-0 left-[18px] w-1 origin-top -translate-x-1/2 rounded bg-gold md:left-1/2" style={{ scaleY: fill }} />
        <motion.div className="absolute left-[18px] z-10 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold shadow-[0_0_0_8px_rgba(255,193,94,.25),0_0_34px_#ffc15e] md:left-1/2" style={{ top }} />
        {items.map((m, i) => {
          const left = i % 2 === 0;
          const work = m.kind === 'work';
          return (
            <Reveal key={m._id} x={left ? -50 : 50} className={`relative mb-12 w-full pl-12 md:w-1/2 md:px-12 ${left ? 'md:text-right' : 'md:ml-[50%]'}`}>
              <span className={`absolute top-6 h-4 w-4 rounded-full left-[10px] ${left ? 'md:left-auto md:-right-2' : 'md:-left-2'} ${work ? 'bg-mint shadow-[0_0_0_6px_rgba(94,234,212,.22)]' : 'bg-gold shadow-[0_0_0_6px_rgba(255,193,94,.22)]'}`} />
              <div className={`${glass} p-5 text-left sm:p-6 ${left ? 'md:text-right' : ''}`}>
                <small className="font-medium text-paper/60">{m.from}{m.to && ` to ${m.to}`}</small>
                <h3 className="mt-1 text-2xl font-bold">{m.title}</h3>
                <p className="font-semibold">{m.org}{m.place && `, ${m.place}`}</p>
                {m.grade && <p className={`font-semibold ${work ? 'text-mint' : 'text-gold'}`}>{m.grade}</p>}
                {m.story && <p className="mt-2 text-paper/70">{m.story}</p>}
                {!!m.points?.length && <ul className="mt-3 list-disc space-y-1 pl-5 text-left text-sm text-paper/90">{m.points.map((t) => <li key={t}>{t}</li>)}</ul>}
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

const Skills = ({ items }) => (
  <Section id="toolkit" title="What I carry with me">
    <div className="mt-10 grid gap-5 md:grid-cols-3">
      {items.map((g) => (
        <Reveal key={g._id} className={`${glass} p-6`}>
          <h3 className="mb-4 text-xl font-bold text-mint">{g.category}</h3>
          <div className="flex flex-wrap gap-2">
            {g.items.map((s) => <motion.span key={s} whileHover={{ y: -3, scale: 1.06 }} className="cursor-default rounded-full border border-white/15 bg-white/5 px-3.5 py-1 text-sm font-medium">{s}</motion.span>)}
          </div>
        </Reveal>
      ))}
    </div>
  </Section>
);

const Projects = ({ items, certs }) => (
  <Section id="work" title="Things I've built">
    <div className="mt-10">
      {items.map((p) => (
        <Reveal key={p._id} className="grid gap-3 border-t border-white/10 py-7 md:grid-cols-[1fr_2fr] md:gap-10">
          <div><h3 className="text-2xl font-bold">{p.title}</h3><p className="text-gold">{p.role}</p></div>
          <div>
            <p className="text-paper/80">{p.description}</p>
            <div className="my-3 flex flex-wrap gap-2">{p.tech?.map((t) => <span key={t} className="rounded-full border border-mint/40 px-3 py-0.5 text-xs font-medium text-mint">{t}</span>)}</div>
            <div className="flex gap-4 text-sm">
              {p.link && <a className="text-gold underline underline-offset-4" href={p.link} target="_blank" rel="noreferrer">Live site</a>}
              {p.github && <a className="text-gold underline underline-offset-4" href={p.github} target="_blank" rel="noreferrer">Code</a>}
            </div>
          </div>
        </Reveal>
      ))}
    </div>
    {!!certs.length && (
      <Reveal className={`${glass} mt-12 p-6`}>
        <h3 className="mb-3 text-2xl font-bold">Certifications</h3>
        <ul className="list-disc space-y-1 pl-5">{certs.map((c) => <li key={c._id}>{c.link ? <a className="text-gold underline underline-offset-4" href={c.link} target="_blank" rel="noreferrer">{c.title}</a> : c.title}, <span className="text-paper/70">{c.issuer}</span></li>)}</ul>
      </Reveal>
    )}
  </Section>
);

const ICONS = {
  mail: <><path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" /><path d="M22 6l-10 7L2 6" /></>,
  phone: <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z" />,
  pin: <><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></>,
  linkedin: <><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></>,
  github: <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 00-.9-2.6c3-.3 6.2-1.5 6.2-6.7a5.2 5.2 0 00-1.4-3.6 4.8 4.8 0 00-.1-3.6s-1.1-.3-3.7 1.4a12.8 12.8 0 00-6.7 0C6.8 2.8 5.7 3.1 5.7 3.1a4.8 4.8 0 00-.1 3.6A5.2 5.2 0 004.2 10.3c0 5.2 3.2 6.4 6.2 6.7a3.4 3.4 0 00-.9 2.6V22" />,
  user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  message: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />,
  send: <><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></>,
};
const Icon = ({ name, className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>{ICONS[name]}</svg>
);

function Contact({ p }) {
  const [f, setF] = useState({ name: '', email: '', message: '' });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async (e) => {
    e.preventDefault();
    setMsg('');
    setBusy(true);
    try { await api('/messages', { method: 'POST', body: f }); setF({ name: '', email: '', message: '' }); setMsg('Message sent. I will get back to you soon.'); }
    catch (x) { setMsg(x.message); }
    setBusy(false);
  };
  const rows = [
    ['mail', 'Email', p.email, p.email && `mailto:${p.email}`],
    ['phone', 'Phone', p.phone, p.phone && `tel:${p.phone}`],
    ['pin', 'Location', p.location, null],
    ['linkedin', 'LinkedIn', p.linkedin && 'Connect with me', p.linkedin],
    ['github', 'GitHub', p.github && 'See my code', p.github],
  ].filter((r) => r[2]);
  const field = 'relative';
  const ico = 'pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-gold';
  return (
    <Section id="contact" title="Get in touch" sub="The road continues. Tell me about your next stop and I will reply soon.">
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <Reveal className={`${glass} grid content-start gap-5 p-6 sm:p-8`}>
          {rows.map(([icon, label, value, href]) => {
            const body = (
              <>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold transition group-hover:bg-gold group-hover:text-night"><Icon name={icon} /></span>
                <span className="min-w-0"><span className="block text-sm text-paper/60">{label}</span><span className="block break-words font-semibold sm:text-lg">{value}</span></span>
              </>
            );
            const cls = 'group flex items-center gap-4';
            return href
              ? <a key={label} className={cls} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{body}</a>
              : <div key={label} className={cls}>{body}</div>;
          })}
        </Reveal>
        <Reveal className={`${glass} p-6 sm:p-8`}>
          <form className="aform" onSubmit={send}>
            <label>Name<span className={field}><Icon name="user" className={ico} /><input className="pl-11" required placeholder="Your name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></span></label>
            <label>Email<span className={field}><Icon name="mail" className={ico} /><input className="pl-11" type="email" required placeholder="you@example.com" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></span></label>
            <label>Message<span className={field}><Icon name="message" className={ico} /><textarea className="pl-11" rows="5" required placeholder="How can I help?" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></span></label>
            <div className="row">
              <button className="btn gold inline-flex items-center gap-2" disabled={busy}><Icon name="send" className="h-4 w-4" />{busy ? 'Sending...' : 'Send message'}</button>
              <span role="status" className="text-sm text-paper/80">{msg}</span>
            </div>
          </form>
        </Reveal>
      </div>
    </Section>
  );
}

export default function Home() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(false);
  useEffect(() => { api('/portfolio').then(setD).catch(() => setErr(true)); }, []);
  if (err) return <p className="grid min-h-screen place-items-center px-6 text-center">Could not reach the server. Check that the API is running.</p>;
  if (!d) return <p className="grid min-h-screen place-items-center">Loading the journey...</p>;
  return (
    <>
      <Sky />
      <Nav name={d.profile.name} />
      <Hero p={d.profile} />
      <About p={d.profile} />
      <Journey items={d.milestones} />
      <Skills items={d.skills} />
      <Projects items={d.projects} certs={d.certifications} />
      <Contact p={d.profile} />
      <footer className="px-5 py-16 text-center text-sm text-paper/60">{d.profile.name} <a href="/admin/login" className="ml-2 underline underline-offset-4">Admin</a></footer>
    </>
  );
}
