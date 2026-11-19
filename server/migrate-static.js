// One-off: moves the last hard-coded bits of the website (journey intro text, CV file) into MongoDB.
// Run once from /server:  node migrate-static.js   (safe to re-run, it only fills empty fields)
import 'dotenv/config';
import fs from 'fs';
import mongoose from 'mongoose';
import { Profile } from './models/index.js';

await mongoose.connect(process.env.MONGO_URI);
const p = (await Profile.findOne()) || new Profile();

if (!p.journeyIntro)
  p.journeyIntro = 'From a school in Kundapura to enterprise apps in Bengaluru. Keep scrolling to follow the road.';

const cvFile = new URL('../client/public/Prajwal_Mogaveera_CV.pdf', import.meta.url);
if (!p.cv && fs.existsSync(cvFile)) {
  p.cv = 'data:application/pdf;base64,' + fs.readFileSync(cvFile).toString('base64');
  p.cvName = 'Prajwal_Mogaveera_CV.pdf';
}
await p.save();
console.log('Profile updated. journeyIntro:', !!p.journeyIntro, 'cv:', !!p.cv);
await mongoose.disconnect();
