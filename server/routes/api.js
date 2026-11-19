import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import auth from '../middleware/auth.js';
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
r.post('/messages', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ message: 'Please fill every field' });
  await Message.create({ name, email, message });
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
