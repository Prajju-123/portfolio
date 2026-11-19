// One-off: gives the existing admin a username and stores the password as a bcrypt hash.
// Run from /server:  node migrate-admin.js [username]     (default username: prajju)
import 'dotenv/config';
import mongoose from 'mongoose';
import { Admin, isHash } from './models/index.js';

await mongoose.connect(process.env.MONGO_URI);
const a = await Admin.findOne();
if (!a) console.log('No admin found. Run: npm run seed');
else {
  if (!a.username) a.username = (process.argv[2] || 'prajju').toLowerCase();
  if (!isHash(a.password)) a.markModified('password'); // pre-save hook hashes it
  await a.save();
  console.log('Admin ready. username:', a.username, '| email:', a.email, '| password hashed:', isHash(a.password));
}
await mongoose.disconnect();
