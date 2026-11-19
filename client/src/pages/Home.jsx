import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { api } from '../api.js';

const Reveal = ({ children, className, x = 0 }) => (
  <motion.div className={className} initial={{ opacity: 0, y: 36, x }} whileInView={{ opacity: 1, y: 0, x: 0 }}
    viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7, ease: 'easeOut' }}>
    {children}
  </motion.div>
);

// The sky shifts from night to dawn as you travel down the page
function Sky() {
  const { scrollYProgress } = useScroll();
  const backgroundColor = useTransform(scrollYProgress, [0, 0.35, 0.7, 1], ['#0b1226', '#16264d', '#1d4a5c', '#5b3a52']);
  return <motion.div className="sky" style={{ backgroundColor }} aria-hidden />;
}

function Nav({ name }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  return (
    <nav className="nav">
      <a href="#top" className="brand">{name?.split(' ')[0]}</a>
      <div>{[['journey', 'Journey'], ['toolkit', 'Toolkit'], ['work', 'Projects'], ['contact', 'Contact']].map(([id, l]) => <a key={id} href={`#${id}`}>{l}</a>)}</div>
      <motion.i className="progress" style={{ scaleX }} />
    </nav>
  );
}

function Hero({ p }) {
  const roles = p.roles?.length ? p.roles : [p.title];
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((n) => (n + 1) % roles.length), 2600); return () => clearInterval(t); }, [roles.length]);
  return (
    <header id="top" className="hero">
      <div>
        <motion.p className="hello" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>Hello, I'm</motion.p>
        <h1 aria-label={p.name}>
          {[...(p.name || '')].map((c, k) => (
            <motion.span key={k} initial={{ y: '90%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 + k * 0.045, duration: 0.6 }}>
              {c === ' ' ? '\u00A0' : c}
            </motion.span>
          ))}
        </h1>
        <div className="role">
          <AnimatePresence mode="wait">
            <motion.span key={i} initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -18, opacity: 0 }}>{roles[i]}</motion.span>
          </AnimatePresence>
        </div>
        <p className="tag">{p.tagline}</p>
        <div className="cta"><a className="btn gold" href="#journey">Start the journey</a><a className="btn" href="#contact">Say hello</a></div>
      </div>
      <motion.div className="portrait" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.6, type: 'spring', stiffness: 90 }}>
        {p.photo ? <img src={p.photo} alt={p.name} /> : <span>{(p.name || '').split(' ').map((w) => w[0]).join('')}</span>}
      </motion.div>
      <motion.p className="hint" animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}>Scroll and the road starts here</motion.p>
    </header>
  );
}

function About({ p }) {
  return (
    <section className="sec about">
      <Reveal><p className="lead">{p.summary}</p></Reveal>
      <Reveal className="facts">
        {p.location && <p><b>Based in</b> {p.location}</p>}
        {!!p.languages?.length && <p><b>Speaks</b> {p.languages.join(', ')}</p>}
        {!!p.softSkills?.length && <p><b>Strengths</b> {p.softSkills.join(', ')}</p>}
        {!!p.hobbies?.length && <p><b>Off the clock</b> {p.hobbies.join(', ')}</p>}
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
    <section id="journey" className="sec">
      <h2>The journey so far</h2>
      <p className="sub">From a school in Kundapura to enterprise apps in Bengaluru. Keep scrolling to follow the road.</p>
      <div className="road" ref={ref}>
        <div className="line" />
        <motion.div className="line fill" style={{ scaleY: fill }} />
        <motion.div className="rider" style={{ top }} />
        {items.map((m, i) => (
          <Reveal key={m._id} x={i % 2 ? 60 : -60} className={`stop ${i % 2 ? 'r' : 'l'} ${m.kind}`}>
            <span className="dot" />
            <div className="card">
              <small>{m.from}{m.to && ` to ${m.to}`}</small>
              <h3>{m.title}</h3>
              <b>{m.org}{m.place && `, ${m.place}`}</b>
              {m.grade && <em>{m.grade}</em>}
              {m.story && <p className="story">{m.story}</p>}
              {!!m.points?.length && <ul>{m.points.map((t) => <li key={t}>{t}</li>)}</ul>}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const Skills = ({ items }) => (
  <section id="toolkit" className="sec">
    <h2>What I carry with me</h2>
    {items.map((g) => (
      <Reveal key={g._id} className="group">
        <h3>{g.category}</h3>
        <div className="chips">{g.items.map((s) => <motion.span key={s} className="chip" whileHover={{ y: -4, scale: 1.07 }}>{s}</motion.span>)}</div>
      </Reveal>
    ))}
  </section>
);

const Projects = ({ items, certs }) => (
  <section id="work" className="sec">
    <h2>Things I've built</h2>
    {items.map((p) => (
      <Reveal key={p._id} className="proj">
        <div><h3>{p.title}</h3><em>{p.role}</em></div>
        <div>
          <p>{p.description}</p>
          <div className="chips sm">{p.tech?.map((t) => <span key={t} className="chip">{t}</span>)}</div>
          {p.link && <a href={p.link} target="_blank" rel="noreferrer">Live site</a>} {p.github && <a href={p.github} target="_blank" rel="noreferrer">Code</a>}
        </div>
      </Reveal>
    ))}
    {!!certs.length && (
      <Reveal className="certs">
        <h3>Certifications</h3>
        <ul>{certs.map((c) => <li key={c._id}>{c.link ? <a href={c.link} target="_blank" rel="noreferrer">{c.title}</a> : c.title}, {c.issuer}</li>)}</ul>
      </Reveal>
    )}
  </section>
);

function Contact({ p }) {
  const [f, setF] = useState({ name: '', email: '', message: '' });
  const [msg, setMsg] = useState('');
  const send = async (e) => {
    e.preventDefault();
    setMsg('');
    try { await api('/messages', { method: 'POST', body: f }); setF({ name: '', email: '', message: '' }); setMsg('Message sent. I will get back to you soon.'); }
    catch (x) { setMsg(x.message); }
  };
  return (
    <section id="contact" className="sec contact">
      <h2>The road continues. Join me?</h2>
      <div className="cgrid">
        <Reveal>
          {p.email && <p><a href={`mailto:${p.email}`}>{p.email}</a></p>}
          {p.phone && <p><a href={`tel:${p.phone}`}>{p.phone}</a></p>}
          {p.linkedin && <p><a href={p.linkedin} target="_blank" rel="noreferrer">LinkedIn</a></p>}
          {p.github && <p><a href={p.github} target="_blank" rel="noreferrer">GitHub</a></p>}
        </Reveal>
        <Reveal>
          <form className="aform" onSubmit={send}>
            <label>Name<input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
            <label>Email<input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
            <label>Message<textarea rows="4" required value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></label>
            <button className="btn gold">Send message</button>
            <p role="status">{msg}</p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

export default function Home() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(false);
  useEffect(() => { api('/portfolio').then(setD).catch(() => setErr(true)); }, []);
  if (err) return <p className="center">Could not reach the server. Check that the API is running.</p>;
  if (!d) return <p className="center">Loading the journey...</p>;
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
      <footer>{d.profile.name} <a href="/admin/login">Admin</a></footer>
    </>
  );
}
