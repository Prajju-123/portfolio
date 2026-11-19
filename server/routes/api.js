import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import auth from '../middleware/auth.js';
import crypto from 'crypto';
import { sendContactMail, sendResetCodeMail } from '../utils/mailer.js';
import { Admin, isHash, Profile, Milestone, Skill, Project, Certification, Message } from '../models/index.js';

const r = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cols = { milestones: Milestone, skills: Skill, projects: Project, certifications: Certification };

// ---- Auth (admin only) ----
const sign = (admin) => jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
const limiter = (max, ms) => {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const recent = (hits.get(req.ip) || []).filter((t) => now - t < ms);
    if (recent.length >= max) return res.status(429).json({ message: 'Too many attempts. Please try again in a few minutes.' });
    hits.set(req.ip, [...recent, now]);
    next();
  };
};
const clean = (v) => String(v || '').trim().toLowerCase();

r.post('/auth/login', limiter(20, 15 * 60 * 1000), async (req, res) => {
  const username = clean(req.body.username);
  const password = String(req.body.password || '');
  const admin = username && (await Admin.findOne({ username }));
  let ok = false;
  if (admin?.password) {
    if (isHash(admin.password)) ok = await bcrypt.compare(password, admin.password);
    else if (password === admin.password) { ok = true; admin.password = password; await admin.save(); } // plain text typed in Compass -> hash it now
  }
  if (!ok) return res.status(401).json({ message: 'Wrong username or password' });
  res.json({ token: sign(admin), username: admin.username });
});

r.get('/auth/me', auth, (req, res) => res.json({ username: req.admin.username, email: req.admin.email }));

// Change username / email / password from the admin panel (you are already logged in, so no current password is asked)
r.put('/auth/account', auth, async (req, res) => {
  const admin = req.admin;
  const { newPassword = '' } = req.body;
  const username = clean(req.body.username);
  const email = clean(req.body.email);
  if (username.length < 3) return res.status(400).json({ message: 'Username must be at least 3 characters' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Please enter a valid email address' });
  if (newPassword && newPassword.length < 8) return res.status(400).json({ message: 'New password must be at least 8 characters' });
  if (username !== admin.username && (await Admin.exists({ username }))) return res.status(409).json({ message: 'That username is already taken' });
  admin.username = username;
  admin.email = email;
  if (newPassword) admin.password = newPassword; // hashed by the model
  await admin.save();
  res.json({ username: admin.username, email: admin.email });
});

// Forgot password, step 1: e-mail a 6-digit code (valid 10 min) to the admin's email address
r.post('/auth/forgot', limiter(5, 15 * 60 * 1000), async (req, res) => {
  const admin = await Admin.findOne({ username: clean(req.body.username) });
  if (!admin || !admin.email) return res.status(404).json({ message: 'No account found with this username' });
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  admin.resetCode = await bcrypt.hash(code, 8);
  admin.resetExpires = new Date(Date.now() + 10 * 60 * 1000);
  admin.resetTries = 0;
  await admin.save();
  try {
    await sendResetCodeMail({ to: admin.email, username: admin.username, code });
  } catch (e) {
    console.error('Reset mail error:', e.message);
    return res.status(502).json({ message: 'Could not send the email right now. Please try again.' });
  }
  const [name, domain] = admin.email.split('@');
  res.json({ ok: true, sentTo: `${name.slice(0, 2)}${'*'.repeat(Math.max(name.length - 2, 1))}@${domain}` });
});

// Forgot password, step 2: check the code and set the new password
r.post('/auth/reset-password', limiter(10, 15 * 60 * 1000), async (req, res) => {
  const admin = await Admin.findOne({ username: clean(req.body.username) });
  const code = String(req.body.code || '').trim();
  const password = String(req.body.password || '');
  if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });
  if (!admin?.resetCode || !admin.resetExpires || admin.resetExpires < new Date())
    return res.status(400).json({ message: 'This code has expired. Please request a new one.' });
  if (admin.resetTries >= 5) return res.status(429).json({ message: 'Too many wrong codes. Please request a new one.' });
  if (!(await bcrypt.compare(code, admin.resetCode))) {
    admin.resetTries += 1;
    await admin.save();
    return res.status(400).json({ message: 'That code is not correct' });
  }
  admin.password = password;
  admin.resetCode = undefined;
  admin.resetExpires = undefined;
  admin.resetTries = 0;
  await admin.save();
  res.json({ ok: true });
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
