import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
const m = (name, def) => mongoose.model(name, new mongoose.Schema(def, { timestamps: true }));

// Admin account. Log in with username + password. Passwords are always stored as bcrypt hashes:
// if you type a plain password straight into MongoDB Compass, it is hashed automatically the next time that admin logs in.
const adminSchema = new mongoose.Schema({
  username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  password: String,
  resetCode: String, resetExpires: Date, resetTries: { type: Number, default: 0 }, // "Forgot password" one-time code (hashed)
}, { timestamps: true });
export const isHash = (v = '') => /^\$2[aby]\$\d{2}\$.{53}$/.test(v);
adminSchema.pre('save', async function () {
  if (this.isModified('password') && !isHash(this.password)) this.password = await bcrypt.hash(this.password, 10);
});
export const Admin = mongoose.model('Admin', adminSchema);

export const Profile = m('Profile', {
  name: String, title: String, tagline: String, summary: String, location: String,
  email: String, phone: String, linkedin: String, github: String, photo: String,
  journeyIntro: String, cv: String, cvName: String, // cv = PDF stored as a data URL
  roles: [String], softSkills: [String], languages: [String], hobbies: [String],
});

// One stop on the life journey: education or work
export const Milestone = m('Milestone', {
  kind: { type: String, enum: ['education', 'work'], default: 'education' },
  title: String, org: String, place: String, from: String, to: String, grade: String,
  story: String, points: [String], order: { type: Number, default: 0 },
});

export const Skill = m('Skill', { category: String, items: [String], order: { type: Number, default: 0 } });

export const Project = m('Project', {
  title: String, role: String, description: String, tech: [String],
  link: String, github: String, order: { type: Number, default: 0 },
});

export const Certification = m('Certification', {
  title: String, issuer: String, link: String, order: { type: Number, default: 0 },
});

export const Message = m('Message', { name: String, email: String, message: String });
