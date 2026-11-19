import jwt from 'jsonwebtoken';
import { Admin } from '../models/index.js';

// Checks the JWT, then makes sure that admin still exists (so a deleted account is locked out immediately).
export default async function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(id);
    if (!admin) throw new Error('no admin');
    req.admin = admin;
    next();
  } catch {
    res.status(401).json({ message: 'Please log in again' });
  }
}
