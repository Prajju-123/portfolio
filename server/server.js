import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import api from './routes/api.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', api);
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ message: 'Something went wrong' }); });

connectDB().then(() => app.listen(process.env.PORT || 5000, () => console.log('API on port', process.env.PORT || 5000)));
