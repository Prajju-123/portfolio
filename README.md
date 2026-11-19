# Prajwal Mogaveera - Life Journey Portfolio (MERN)

Public site at `/` (no login). Admin panel at `/admin` (JWT login). All content comes from MongoDB.

## Run locally
1. Start MongoDB (local or Atlas).
2. Server:
   ```
   cd server && cp .env.example .env   # edit JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
   npm install && npm run seed && npm run dev
   ```
3. Client (new terminal):
   ```
   cd client && npm install && npm run dev
   ```
4. Open http://localhost:5173 and log in at http://localhost:5173/admin/login

`npm run seed` loads your resume data and creates the admin user (re-running it resets all content).

## Deploy
- API: any Node host (Render, Railway). Set the .env values and CLIENT_URL to your site URL.
- Client: `npm run build` and host `dist` (Vercel, Netlify). Set VITE_API_URL to `https://your-api/api`.
