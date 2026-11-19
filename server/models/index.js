import mongoose from 'mongoose';
const m = (name, def) => mongoose.model(name, new mongoose.Schema(def, { timestamps: true }));

export const Admin = m('Admin', { email: { type: String, unique: true, lowercase: true }, password: String });

export const Profile = m('Profile', {
  name: String, title: String, tagline: String, summary: String, location: String,
  email: String, phone: String, linkedin: String, github: String, photo: String,
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
