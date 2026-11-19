import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import api from './routes/api.js';
import { checkMail } from './utils/mailer.js';

const app = express();
app.set('trust proxy', 1); // correct client IP behind Render/Railway/Vercel proxies
// CLIENT_URL can hold several origins separated by commas, e.g. http://localhost:5173,https://yoursite.com
app.use(cors({ origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map((u) => u.trim()) : true }));
app.use(express.json({ limit: '5mb' }));
app.use('/api', api);
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ message: 'Something went wrong' }); });

connectDB().then(() => app.listen(process.env.PORT || 5000, () => { console.log('API on http://localhost:' + (process.env.PORT || 5000)); checkMail(); }));
