import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import auth from '../middleware/auth.js';
import { sendContactMail } from '../utils/mailer.js';
import { Admin, Profile, Milestone, Skill, Project, Certification, Message } from '../models/index.js';

const r = Router();
const cols = { milestones: Milestone, skills: Skill, projects: Project, certifications: Certification };

// ---- Auth (admin only) ----
r.post('/auth/login', async (req, res) => {
  const { email = '', password = '' } = req.body;
  const admin = await Admin.findOne({ email: email.toLowerCase() });
  if (!admin || !(await bcrypt.compare(password, admin.password)))
    return res.status(401).json({ message: 'Wrong email or password' });
  res.json({ token: jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1d' }) });
});

// ---- Public: everything the website needs in one call ----
r.get('/portfolio', async (_req, res) => {
  const keys = Object.keys(cols);
  const [profile, ...rest] = await Promise.all([Profile.findOne(), ...keys.map((k) => cols[k].find().sort('order'))]);
  res.json({ profile: profile || {}, ...Object.fromEntries(keys.map((k, i) => [k, rest[i]])) });
});

r.put('/profile', auth, async (req, res) =>
  res.json(await Profile.findOneAndUpdate({}, req.body, { upsert: true, new: true, setDefaultsOnInsert: true })));

// ---- Contact messages ----
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hits = new Map(); // tiny in-memory rate limit: 5 messages / 10 min per IP
r.post('/messages', async (req, res) => {
  const ip = req.ip;
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  if (recent.length >= 5) return res.status(429).json({ message: 'Too many messages. Please try again in a few minutes.' });

  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim();
  const message = String(req.body.message || '').trim();
  if (req.body.website) return res.status(201).json({ ok: true }); // honeypot: bots fill this hidden field
  if (!name || !email || !message) return res.status(400).json({ message: 'Please fill every field' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Please enter a valid email address' });
  if (name.length > 100 || email.length > 150 || message.length > 5000) return res.status(400).json({ message: 'Your message is too long' });

  hits.set(ip, [...recent, now]);
  await Message.create({ name, email, message }).catch((e) => console.error('Could not save message', e.message)); // backup copy for the admin panel
  try {
    await sendContactMail({ name, email, message });
  } catch (e) {
    console.error('Mail error:', e.message);
    return res.status(502).json({ message: 'Could not send your message right now. Please email me directly.' });
  }
  res.status(201).json({ ok: true });
});
r.get('/messages', auth, async (_req, res) => res.json(await Message.find().sort('-createdAt')));
r.delete('/messages/:id', auth, async (req, res) => { await Message.findByIdAndDelete(req.params.id); res.json({ ok: true }); });

// ---- Generic CRUD for journey stops, skills, projects, certifications ----
for (const [key, Model] of Object.entries(cols)) {
  r.get(`/${key}`, async (_req, res) => res.json(await Model.find().sort('order')));
  r.post(`/${key}`, auth, async (req, res) => res.status(201).json(await Model.create(req.body)));
  r.put(`/${key}/:id`, auth, async (req, res) => res.json(await Model.findByIdAndUpdate(req.params.id, req.body, { new: true })));
  r.delete(`/${key}/:id`, auth, async (req, res) => { await Model.findByIdAndDelete(req.params.id); res.json({ ok: true }); });
}

export default r;
