import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { api } from "../api.js";
import { useToast } from "../components/Toast.jsx";

const card =
  "rounded-3xl border border-black/10 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)]";
const darkCard = "rounded-3xl border border-white/10 bg-white/5";

const Reveal = ({ children, className = "", x = 0 }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 36, x }}
    whileInView={{ opacity: 1, y: 0, x: 0 }}
    viewport={{ once: false, amount: 0.15, margin: "0px 0px -60px 0px" }}
    transition={{ duration: 0.7, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

// tone: light (white), mist (soft gray), dark (black band)
const TONES = {
  light: "bg-paper text-ink",
  mist: "bg-mist text-ink",
  dark: "bg-ink text-white on-dark",
};
// Parallax: an element drifts up/down by +-speed px while its section crosses the screen.
function useParallax(speed = 60) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [speed, -speed]);
  return { ref, y };
}
const Blob = ({ className, speed }) => {
  const { ref, y } = useParallax(speed);
  return (
    <motion.div
      ref={ref}
      style={{ y }}
      className={`pointer-events-none absolute rounded-full ${className}`}
      aria-hidden
    />
  );
};
const BLOBS = {
  light: ["bg-amber-200/40", "bg-stone-300/40"],
  mist: ["bg-amber-200/50", "bg-white/70"],
  dark: ["bg-amber-500/20", "bg-white/5"],
};
function Section({ id, title, sub, tone = "light", children }) {
  const h = useParallax(16);
  const [b1, b2] = BLOBS[tone];
  return (
    <section
      id={id}
      className={`${TONES[tone]} relative scroll-mt-12 overflow-clip`}
    >
      <Blob
        speed={110}
        className={`-right-24 top-8 h-56 w-56 blur-[90px] sm:h-96 sm:w-96 sm:blur-[110px] ${b1}`}
      />
      <Blob
        speed={-80}
        className={`-left-28 bottom-10 h-48 w-48 blur-[90px] sm:h-80 sm:w-80 ${b2}`}
      />
      <div className="relative mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
        <motion.h2
          ref={h.ref}
          style={{ y: h.y }}
          className="text-[1.7rem] font-extrabold leading-tight sm:text-4xl md:text-5xl lg:text-6xl"
        >
          {title}
          <span className="text-gold">.</span>
        </motion.h2>
        {sub && (
          <p
            className={`mt-2 max-w-xl text-sm sm:mt-3 sm:text-base ${tone === "dark" ? "text-white/70" : "text-gray-600"}`}
          >
            {sub}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}

function Nav() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  const [open, setOpen] = useState(false);
  const goTo = useSectionNav();
  const { pathname } = useLocation();
  const fromPath = pathname.replace(/^\//, "") || "home";
  const [active, setActive] = useState(fromPath);
  const lockUntil = useRef(0);
  // clicking / opening a path highlights that tab right away (scroll-spy pauses while the page scrolls there)
  useEffect(() => {
    setActive(fromPath);
    lockUntil.current = Date.now() + 1200;
  }, [fromPath]);
  // scrolling by hand moves the highlight to the section in view
  useEffect(() => {
    const ids = [["home", "home"], ["journey", "journey"], ["toolkit", "toolkit"], ["projects", "work"], ["contact", "contact"]];
    const onScroll = () => {
      if (Date.now() < lockUntil.current) return;
      const line = 48 + window.innerHeight * 0.35;
      let cur = "home";
      for (const [key, el] of ids) {
        const n = document.getElementById(el);
        if (n && n.getBoundingClientRect().top <= line) cur = key;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = "contact";
      setActive(cur);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const links = [
    ["home", "Home"],
    ["journey", "Journey"],
    ["toolkit", "Toolkit"],
    ["projects", "Projects"],
    ["contact", "Contact"],
  ];
  return (
    <nav className="fixed inset-x-0 top-0 z-30 border-b border-black/10 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-12 max-w-6xl items-center px-4 sm:px-8 md:justify-center">
        <div className="hidden gap-10 md:flex">
          {links.map(([id, l]) => (
            <a
              key={id}
              href={`/${id}`}
              onClick={(e) => goTo(e, id)}
              aria-current={active === id ? "page" : undefined}
              className={`border-b-[3px] py-1 text-sm font-medium transition hover:text-ink ${active === id ? "border-gold text-ink" : "border-transparent text-gray-600"}`}
            >
              {l}
            </a>
          ))}
        </div>
        <button
          type="button"
          className="-ml-1 grid h-9 w-9 place-items-center rounded-full text-ink transition hover:bg-black/5 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="h-6 w-6"
            aria-hidden
          >
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            className="overflow-hidden md:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="flex flex-col px-5 pb-2">
              {links.map(([id, l]) => (
                <a
                  key={id}
                  href={`/${id}`}
                  onClick={(e) => {
                    setOpen(false);
                    goTo(e, id);
                  }}
                  aria-current={active === id ? "page" : undefined}
                  className="border-t border-black/10 py-2"
                >
                  <span
                    className={`inline-block border-b-[3px] py-1 text-sm font-medium ${active === id ? "border-gold text-ink" : "border-transparent text-gray-600"}`}
                  >
                    {l}
                  </span>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.i
        style={{ scaleX }}
        className="absolute bottom-0 left-0 h-[3px] w-full origin-left bg-gold"
      />
    </nav>
  );
}

// Sections live on one page; each has its own clean path (/home, /journey, /toolkit, /work, /contact).
function scrollToSection(id) {
  const el = id === "home" ? null : document.getElementById(id === "projects" ? "work" : id);
  const top = el ? el.getBoundingClientRect().top + window.scrollY - 48 : 0; // fixed nav is 48px tall
  window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
}

function useSectionNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    const path = `/${id}`;
    if (pathname === path) requestAnimationFrame(() => scrollToSection(id));
    else navigate(path);
  };
}

function Hero({ p }) {
  const goTo = useSectionNav();
  const roles = p.roles?.length ? p.roles : [p.title];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % roles.length), 2600);
    return () => clearInterval(t);
  }, [roles.length]);

  // scroll parallax: every layer of the hero drifts at its own speed while the hero scrolls away
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const yHello = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const yName = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const yRole = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const yTag = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const yCta = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const yPhoto = useTransform(scrollYProgress, [0, 1], [0, 110]);
  const yGlowA = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const yGlowB = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const fade = useTransform(scrollYProgress, [0, 0.9], [1, 0.15]);

  // mouse parallax: the photo group leans one way, the floating dots the other, which gives depth
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 70, damping: 16 });
  const sy = useSpring(my, { stiffness: 70, damping: 16 });
  // the photo circle leans gently with the mouse
  const discX = useTransform(sx, [-1, 1], [10, -10]);
  const discY = useTransform(sy, [-1, 1], [6, -6]);
  const dotX = useTransform(sx, [-1, 1], [-28, 28]);
  const dotY = useTransform(sy, [-1, 1], [-18, 18]);
  const onMove = (e) => {
    mx.set((e.clientX / window.innerWidth) * 2 - 1);
    my.set((e.clientY / window.innerHeight) * 2 - 1);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <header
      id="home"
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative overflow-hidden bg-gradient-to-b from-white to-stone-100"
    >
      <motion.div
        style={{ y: yGlowA }}
        className="pointer-events-none absolute -right-16 top-8 h-56 w-56 rounded-full bg-amber-200/50 blur-[90px] sm:-right-24 sm:top-24 sm:h-96 sm:w-96 sm:blur-[110px]"
        aria-hidden
      />
      <motion.div
        style={{ y: yGlowB }}
        className="pointer-events-none absolute -left-20 bottom-10 h-48 w-48 rounded-full bg-stone-300/40 blur-[90px] sm:h-80 sm:w-80"
        aria-hidden
      />
      {/* Same design on every screen: text on the left, photo on the right. Areas are defined in index.css (.hero-grid). */}
      <div className="hero-grid relative mx-auto max-w-6xl px-5 pb-10 pt-20 sm:px-8 sm:pb-14 sm:pt-24 lg:min-h-screen lg:pb-20">
        <motion.p
          style={{ y: yHello, opacity: fade }}
          className="hero-hello font-semibold text-amber-600"
        >
          Hello, I'm
        </motion.p>

        <motion.h1
          style={{ y: yName, opacity: fade }}
          className="hero-name font-extrabold"
        >
          {p.name}
        </motion.h1>

        <motion.div
          style={{ y: yRole, opacity: fade }}
          className="hero-role font-display font-bold text-gray-500"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={i}
              className="inline-block border-b-4 border-gold"
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -18, opacity: 0 }}
            >
              {roles[i]}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        <motion.p
          style={{ y: yTag, opacity: fade }}
          className="hero-tag text-sm text-gray-600 sm:text-base lg:text-lg"
        >
          {p.tagline}
        </motion.p>

        <motion.div
          style={{ y: yCta, opacity: fade }}
          className="hero-cta flex flex-wrap gap-3"
        >
          <a
            className="btn gold"
            href="/journey"
            onClick={(e) => goTo(e, "journey")}
          >
            Start the journey
          </a>
          {p.cv && (
            <a
              className="btn inline-flex items-center gap-2"
              href={p.cv}
              download={p.cvName || "CV.pdf"}
            >
              <Icon name="download" className="h-4 w-4" />
              Download CV
            </a>
          )}
        </motion.div>

        <motion.div className="hero-photo" style={{ y: yPhoto }}>
          {/* the whole group floats gently up and down */}
          <motion.div
            className="hero-photo-inner relative"
            animate={{ y: [0, -12, 0] }}
            transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut" }}
          >
            {/* spinning conic ring */}
            <motion.div
              className="absolute -inset-1.5 rounded-full bg-[conic-gradient(from_0deg,#f59e0b,#111111,#9ca3af,#f59e0b)] sm:-inset-3"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
            />
            {/* dashed orbit with two travelling dots */}
            <motion.div
              className="absolute -inset-3 rounded-full border border-dashed border-amber-500/60 sm:-inset-7"
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
            >
              <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold shadow-[0_0_12px_#f59e0b]" />
              <span className="absolute bottom-[14%] right-[4%] h-1.5 w-1.5 rounded-full bg-ink" />
            </motion.div>

            {/* the photo lives inside the circle: warm studio backdrop, white background of the photo melts into it (multiply) */}
            <motion.div
              style={{ x: discX, y: discY }}
              className="relative aspect-square w-[var(--s)] overflow-hidden rounded-full border-4 border-white bg-[radial-gradient(circle_at_50%_30%,#fffdf8_0%,#fdecc2_55%,#f6c25e_100%)] shadow-[0_25px_60px_-15px_rgba(120,70,0,0.45)] sm:border-[6px]"
            >
              {p.photo ? (
                <>
                  <motion.img
                    src={p.photo}
                    alt={p.name}
                    className="absolute left-[11.5%] top-[6%] block w-[77%] max-w-none mix-blend-multiply"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{
                      repeat: Infinity,
                      duration: 9,
                      ease: "easeInOut",
                    }}
                  />
                  {/* soft floor glow under the chair so the scene feels grounded */}
                  <span className="pointer-events-none absolute bottom-[8%] left-[18%] h-[9%] w-[64%] rounded-[50%] bg-amber-700/25 blur-md" />
                  {/* soft vignette + glass shine for a realistic, polished finish */}
                  <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_45%,transparent_55%,rgba(90,50,0,0.22)_100%)]" />
                  <motion.span
                    className="pointer-events-none absolute -left-1/4 top-0 h-full w-1/4 -skew-x-12 bg-white/30 blur-md"
                    animate={{ x: ["-40%", "520%"] }}
                    transition={{
                      repeat: Infinity,
                      duration: 4.5,
                      ease: "easeInOut",
                      repeatDelay: 3,
                    }}
                  />
                </>
              ) : (
                <span className="grid h-full w-full place-items-center font-display text-5xl font-extrabold text-ink">
                  {(p.name || "?").charAt(0)}
                </span>
              )}
            </motion.div>

            {/* floating decorations that move opposite to the mouse */}
            <motion.span
              style={{ x: dotX, y: dotY }}
              className="absolute -left-3 top-[18%] h-3 w-3 rounded-full border-2 border-gold sm:-left-8 sm:h-5 sm:w-5"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 3 }}
            />
            <motion.span
              style={{ x: dotX, y: dotY }}
              className="absolute -right-2 top-[8%] h-2 w-2 rounded-full bg-ink sm:-right-7 sm:h-3 sm:w-3"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3.6, ease: "easeInOut" }}
            />
            <motion.span
              className="absolute -bottom-2 left-[8%] text-lg font-bold leading-none text-gold sm:-bottom-6 sm:text-3xl"
              animate={{ rotate: [0, 90, 0], scale: [1, 1.25, 1] }}
              transition={{ repeat: Infinity, duration: 5 }}
            >
              +
            </motion.span>
          </motion.div>
        </motion.div>
      </div>
    </header>
  );
}

function About({ p }) {
  const facts = [
    ["Based in", p.location && [p.location]],
    ["Speaks", p.languages],
    ["Strengths", p.softSkills],
    ["Off the clock", p.hobbies],
  ].filter(([, v]) => v?.length);
  return (
    <section className="overflow-x-clip bg-stone-100">
      <div className="mx-auto grid max-w-6xl gap-6 px-5 pb-12 pt-2 sm:px-8 sm:pb-16 md:grid-cols-[1.5fr_1fr] md:items-start md:gap-12 lg:pb-20">
        <Reveal>
          <p className="border-l-4 border-gold pl-4 text-justify text-[0.95rem] leading-[1.8] text-gray-800 [hyphens:auto] [text-justify:inter-word] sm:pl-6 sm:text-lg lg:text-xl lg:leading-[1.85]">
            {p.summary}
          </p>
        </Reveal>
        <Reveal className={`${card} grid gap-4 p-5 text-sm sm:p-6 sm:text-base`}>
          {facts.map(([k, v]) => (
            <p key={k} className="leading-relaxed">
              <b className="mr-2 block text-xs uppercase tracking-wider text-amber-600 sm:inline sm:text-sm sm:normal-case sm:tracking-normal">{k}</b>
              <span className="text-gray-700">{v.join(", ")}</span>
            </p>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

function Journey({ items, intro }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 65%", "end 55%"],
  });
  const fill = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });
  const top = useTransform(fill, (v) => `${v * 100}%`);
  return (
    <Section
      id="journey"
      title="The journey so far"
      sub={intro}
    >
      <div className="relative mt-8 sm:mt-12" ref={ref}>
        <div className="absolute inset-y-0 left-[18px] w-1 -translate-x-1/2 bg-[repeating-linear-gradient(to_bottom,rgba(0,0,0,.22)_0_14px,transparent_14px_28px)] md:left-1/2" />
        <motion.div
          className="absolute inset-y-0 left-[18px] w-1 origin-top -translate-x-1/2 rounded bg-gold md:left-1/2"
          style={{ scaleY: fill }}
        />
        <motion.div
          className="absolute left-[18px] z-10 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-gold shadow-[0_0_0_6px_rgba(245,158,11,.3)] md:left-1/2"
          style={{ top }}
        />
        {items.map((m, i) => {
          const left = i % 2 === 0;
          const work = m.kind === "work";
          return (
            <Reveal
              key={m._id}
              x={left ? -50 : 50}
              className={`relative mb-7 w-full pl-12 sm:mb-10 md:w-1/2 md:px-12 ${left ? "md:text-right" : "md:ml-[50%]"}`}
            >
              <span
                className={`absolute left-[10px] top-6 h-4 w-4 rounded-full ${left ? "md:left-auto md:-right-2" : "md:-left-2"} ${work ? "bg-ink shadow-[0_0_0_6px_rgba(17,17,17,.12)]" : "bg-gold shadow-[0_0_0_6px_rgba(245,158,11,.25)]"}`}
              />
              <div
                className={`${card} p-5 text-left sm:p-6 ${left ? "md:text-right" : ""}`}
              >
                <small className="font-medium text-gray-500">
                  {m.from}
                  {m.to && ` to ${m.to}`}
                </small>
                <h3 className="mt-1 text-xl font-bold sm:text-2xl">
                  {m.title}
                </h3>
                <p className="font-semibold text-gray-800">
                  {m.org}
                  {m.place && `, ${m.place}`}
                </p>
                {m.grade && (
                  <p className="font-semibold text-amber-600">{m.grade}</p>
                )}
                {m.story && <p className="mt-2 text-gray-600">{m.story}</p>}
                {!!m.points?.length && (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-left text-sm text-gray-700">
                    {m.points.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                )}
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

const Skills = ({ items }) => (
  <Section id="toolkit" title="What I carry with me" tone="dark">
    <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((g) => (
        <Reveal key={g._id} className={`${darkCard} p-6`}>
          <h3 className="mb-3 text-lg font-bold text-gold sm:mb-4 sm:text-xl">
            {g.category}
          </h3>
          <div className="flex flex-wrap gap-2">
            {g.items.map((s) => (
              <motion.span
                key={s}
                whileHover={{ y: -3, scale: 1.06 }}
                className="cursor-default rounded-full border border-white/20 px-3.5 py-1 text-sm font-medium transition-colors hover:border-gold hover:text-gold"
              >
                {s}
              </motion.span>
            ))}
          </div>
        </Reveal>
      ))}
    </div>
  </Section>
);

const Projects = ({ items, certs }) => (
  <Section id="work" title="Things I've built" tone="mist">
    <div className="mt-6 sm:mt-8">
      {items.map((p) => (
        <Reveal
          key={p._id}
          className="grid gap-2 border-t border-black/10 py-5 sm:py-6 md:grid-cols-[1fr_2fr] md:gap-10"
        >
          <div>
            <h3 className="text-xl font-bold sm:text-2xl">{p.title}</h3>
            <p className="text-amber-600">{p.role}</p>
          </div>
          <div>
            <p className="text-gray-700">{p.description}</p>
            <div className="my-3 flex flex-wrap gap-2">
              {p.tech?.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-amber-500 bg-amber-50 px-3 py-0.5 text-xs font-medium text-amber-800"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="flex gap-4 text-sm">
              {p.link && (
                <a
                  className="font-semibold text-ink underline decoration-gold decoration-2 underline-offset-4"
                  href={p.link}
                  target="_blank"
                  rel="noreferrer"
                >
                  Live site
                </a>
              )}
              {p.github && (
                <a
                  className="font-semibold text-ink underline decoration-gold decoration-2 underline-offset-4"
                  href={p.github}
                  target="_blank"
                  rel="noreferrer"
                >
                  Code
                </a>
              )}
            </div>
          </div>
        </Reveal>
      ))}
    </div>
    {!!certs.length && (
      <Reveal className={`${card} mt-8 p-5 sm:mt-10 sm:p-6`}>
        <h3 className="mb-3 text-xl font-bold sm:text-2xl">Certifications</h3>
        <ul className="list-disc space-y-1 pl-5 marker:text-gold">
          {certs.map((c) => (
            <li key={c._id}>
              {c.link ? (
                <a
                  className="underline decoration-gold decoration-2 underline-offset-4"
                  href={c.link}
                  target="_blank"
                  rel="noreferrer"
                >
                  {c.title}
                </a>
              ) : (
                c.title
              )}
              , <span className="text-gray-600">{c.issuer}</span>
            </li>
          ))}
        </ul>
      </Reveal>
    )}
  </Section>
);

const ICONS = {
  mail: (
    <>
      <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
      <path d="M22 6l-10 7L2 6" />
    </>
  ),
  phone: (
    <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z" />
  ),
  pin: (
    <>
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  linkedin: (
    <>
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </>
  ),
  github: (
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 00-.9-2.6c3-.3 6.2-1.5 6.2-6.7a5.2 5.2 0 00-1.4-3.6 4.8 4.8 0 00-.1-3.6s-1.1-.3-3.7 1.4a12.8 12.8 0 00-6.7 0C6.8 2.8 5.7 3.1 5.7 3.1a4.8 4.8 0 00-.1 3.6A5.2 5.2 0 004.2 10.3c0 5.2 3.2 6.4 6.2 6.7a3.4 3.4 0 00-.9 2.6V22" />
  ),
  user: (
    <>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  message: (
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  ),
  download: (
    <>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </>
  ),
  send: (
    <>
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </>
  ),
};
const Icon = ({ name, className = "h-5 w-5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    {ICONS[name]}
  </svg>
);

function Contact({ p }) {
  const toast = useToast();
  const [f, setF] = useState({ name: "", email: "", message: "", website: "" });
  const [busy, setBusy] = useState(false);
  const send = async (e) => {
    e.preventDefault();
    if (busy) return;
    const name = f.name.trim(),
      email = f.email.trim(),
      message = f.message.trim();
    if (!name) return toast.error("Please enter your name.", "Name is missing");
    if (!email)
      return toast.error(
        "Please enter your email address.",
        "Email is missing",
      );
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return toast.error(
        "That email address does not look right.",
        "Check your email",
      );
    if (!message)
      return toast.error(
        "Write a few words so I know how to help.",
        "Message is empty",
      );
    setBusy(true);
    try {
      await api("/messages", {
        method: "POST",
        body: { ...f, name, email, message },
      });
      setF({ name: "", email: "", message: "", website: "" });
      toast.success(
        "Thanks! I will get back to you soon.",
        "Message sent",
      );
    } catch (x) {
      toast.error(
        x.message === "Failed to fetch"
          ? "Cannot reach the server. Try again."
          : x.message,
        "Message not sent",
      );
    }
    setBusy(false);
  };
  const rows = [
    ["mail", "Email", p.email, p.email && `mailto:${p.email}`],
    ["phone", "Phone", p.phone, p.phone && `tel:${p.phone}`],
    ["pin", "Location", p.location, null],
    ["linkedin", "LinkedIn", p.linkedin && "Connect with me", p.linkedin],
    ["github", "GitHub", p.github && "See my code", p.github],
  ].filter((r) => r[2]);
  return (
    <Section
      id="contact"
      title="Get in touch"
      tone="dark"
      sub="The road continues. Tell me about your next stop and I will reply soon."
    >
      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Reveal
          className={`${darkCard} grid content-start gap-4 p-5 sm:gap-5 sm:p-8`}
        >
          {rows.map(([icon, label, value, href]) => {
            const body = (
              <>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl sm:h-12 sm:w-12 bg-gold/15 text-gold transition group-hover:bg-gold group-hover:text-ink">
                  <Icon name={icon} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-white/60">{label}</span>
                  <span className="block text-[0.85rem] font-semibold [overflow-wrap:anywhere] min-[400px]:text-[0.95rem] sm:text-lg">
                    {value}
                  </span>
                </span>
              </>
            );
            const cls = "group flex items-center gap-3 sm:gap-4";
            return href ? (
              <a
                key={label}
                className={cls}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
              >
                {body}
              </a>
            ) : (
              <div key={label} className={cls}>
                {body}
              </div>
            );
          })}
        </Reveal>
        <Reveal className={`${darkCard} p-5 sm:p-8`}>
          <form className="aform dark-form" onSubmit={send} noValidate>
            <label>
              Name
              <span className="field">
                <Icon name="user" className="field-icon" />
                <input
                  name="name"
                  autoComplete="name"
                  maxLength={100}
                  placeholder="Your name"
                  value={f.name}
                  onChange={(e) => setF({ ...f, name: e.target.value })}
                />
              </span>
            </label>
            <label>
              Email
              <span className="field">
                <Icon name="mail" className="field-icon" />
                <input
                  name="email"
                  autoComplete="email"
                  type="email"
                  maxLength={150}
                  placeholder="you@example.com"
                  value={f.email}
                  onChange={(e) => setF({ ...f, email: e.target.value })}
                />
              </span>
            </label>
            <label>
              Message
              <span className="field field-area">
                <Icon name="message" className="field-icon" />
                <textarea
                  name="message"
                  rows="5"
                  maxLength={5000}
                  placeholder="How can I help?"
                  value={f.message}
                  onChange={(e) => setF({ ...f, message: e.target.value })}
                />
              </span>
            </label>
            {/* honeypot: hidden from people, bots fill it in */}
            <input
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              name="website"
              value={f.website}
              onChange={(e) => setF({ ...f, website: e.target.value })}
            />
            <div className="row">
              <button
                className="btn gold inline-flex items-center gap-2"
                disabled={busy}
              >
                <Icon name="send" className="h-4 w-4" />
                {busy ? "Sending..." : "Send message"}
              </button>
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
  const { pathname } = useLocation();
  // scroll to the section named by the path once the page content is on screen
  useEffect(() => {
    if (!d) return;
    const id = pathname.replace(/^\//, "");
    if (!id) return;
    const t = setTimeout(() => scrollToSection(id), 150);
    return () => clearTimeout(t);
  }, [pathname, d]);
  // browser tab title comes from the database too
  useEffect(() => {
    const pr = d?.profile;
    if (pr?.name) document.title = `${pr.name}${pr.title ? ` | ${pr.title}` : ""}`;
  }, [d]);
  useEffect(() => {
    api("/portfolio")
      .then(setD)
      .catch(() => setErr(true));
  }, []);
  if (err)
    return (
      <p className="grid min-h-screen place-items-center px-6 text-center">
        Could not reach the server. Check that the API is running.
      </p>
    );
  if (!d)
    return (
      <p className="grid min-h-screen place-items-center">
        Loading the journey...
      </p>
    );
  return (
    <>
      <Nav />
      <Hero p={d.profile} />
      <About p={d.profile} />
      <Journey items={d.milestones} intro={d.profile.journeyIntro} />
      <Skills items={d.skills} />
      <Projects items={d.projects} certs={d.certifications} />
      <Contact p={d.profile} />
    </>
  );
}
