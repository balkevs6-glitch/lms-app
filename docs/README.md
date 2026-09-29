# School Platform

A Discord-inspired platform for school classes: auth, class feeds, file/folder uploads, live chat, and voice/video calls (via embedded Jitsi Meet).

Student project, built solo with AI-assisted coding + manual review, over ~2 months at ~8-10 hrs/week.

## Tech Stack

- **Frontend:** React
- **Backend:** Node.js + Express
- **Database:** Supabase (Postgres)
- **Auth:** Supabase Auth
- **File storage:** Supabase Storage
- **Realtime chat:** Socket.io
- **Calls:** Jitsi Meet (embedded iframe, no custom WebRTC)

See [`docs/decisions.md`](./docs/decisions.md) for why these were chosen and what was cut from the original scope.

## Setup

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** → run `schema.sql` (repo root) to create all tables, indexes, and starter RLS policies.
3. Confirm all 7 tables exist in **Table Editor**: `users`, `classes`, `class_members`, `folders`, `files`, `posts`, `messages`.
4. Go to **Project Settings → API** and copy your Project URL and `anon` public key.

### 2. Environment variables

Create a `.env` file in the frontend root:

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install & run

```bash
# frontend
npm install
npm run dev

# backend (Socket.io server)
cd server
npm install
npm run dev
```

## Project Structure

```
├── src/
│   ├── pages/          # sign_up.jsx, login.jsx, dashboard.jsx, class page, etc.
│   ├── services/        # supabase queries (users.js, classes.js, ...)
│   └── app.jsx           # session listener + router
├── server/                # Socket.io server for chat
├── schema.sql             # Supabase table + RLS definitions
└── docs/
    └── decisions.md        # scope decisions + build log
```

## Status

Currently in **Week 1-2: Auth + Dashboard + Create/Join Class**. See `docs/decisions.md` for the full build log and week-by-week plan.
