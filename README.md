# Prajwal Mogaveera - Life Journey Portfolio (MERN + Tailwind)

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

## Photo
The photo is stored in the database (`profiles.photo`). `npm run seed` loads `client/public/profile.jpg` into it.
To change it later: Admin > Profile > Photo > choose a file > Save. If the field is empty the site falls back to `client/public/profile.jpg`.
