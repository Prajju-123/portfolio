// Saves an image file as the profile photo in MongoDB.   node set-photo.js <path-to-image>
import 'dotenv/config';
import fs from 'fs';
import mongoose from 'mongoose';
import { Profile } from './models/index.js';

const file = process.argv[2];
if (!file || !fs.existsSync(file)) { console.error('Usage: node set-photo.js <image file>'); process.exit(1); }
const mime = /\.png$/i.test(file) ? 'image/png' : 'image/jpeg';
await mongoose.connect(process.env.MONGO_URI);
await Profile.findOneAndUpdate({}, { photo: `data:${mime};base64,${fs.readFileSync(file).toString('base64')}` }, { upsert: true });
console.log('Photo saved:', Math.round(fs.statSync(file).size / 1024), 'KB');
await mongoose.disconnect();
