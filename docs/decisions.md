# Project Decisions & Build Log

## Context

- Student project, built alongside an existing ongoing project
- Time budget: ~2 hrs/day, some days skipped but made up later (~8-10 hrs/week)
- Timeline: 2 months
- Approach: AI-assisted coding, all code reviewed manually before merging — used as a learning opportunity, not just a shortcut

## Original Idea (full scope)

A Discord-like platform for school with:

- Live voice/video calling
- Low-level Google Classroom features
- Live chat
- Folder/file uploads (most important feature)

## Scope Decision

Full scope was too large for 2 months solo at this time budget — voice/video calling alone (WebRTC) is a multi-month effort even for experienced teams.

**Decision:** cut custom voice/video, use an embedded third-party widget (Jitsi Meet) instead of building calling from scratch.

Other options considered for calls: Daily.co / Whereby Embedded (nicer UI, still low-integration), LiveKit/Agora (more control, more work — deferred), linking directly to Discord (simplest, but less "native" feeling). Jitsi chosen for zero backend work and fastest path to shipping.

## Final Feature Set (v1)

1. Auth — student/teacher roles, login/signup
2. Classes — create a class, join via code, list members
3. Posts/Feed — simple assignment/announcement posts per class
4. File & folder uploads — tied to a class, organized, downloadable
5. Chat — real-time, per class
6. Call — "Start Call" button embedding a Jitsi Meet room per class

## Tech Stack

- Frontend: React
- Backend: Node.js + Express
- Database: Supabase (Postgres)
- Auth: Supabase Auth
- File storage: Supabase Storage
- Realtime chat: Socket.io
- Calls: Jitsi Meet (embedded iframe)

**Decision note:** Chose "Supabase for everything" (auth + DB + storage) over mixing Firebase Auth with Supabase storage, to reduce integration complexity and glue code.

## Database Schema

Full schema lives in `schema.sql` at repo root. Summary:

1. **users** — id, name, email, role (student/teacher), avatar
2. **classes** — id, name, subject, teacher_id, join_code
3. **class_members** — class_id, user_id, role
4. **posts** — id, class_id, author_id, title, content, created_at
5. **files** — id, class_id, uploaded_by, folder_id, file_url, filename, created_at
6. **folders** — id, class_id, name, parent_folder_id (nullable, for nesting)
7. **messages** — id, class_id, sender_id, content, created_at

RLS is enabled on all tables. Starter policies cover select access (members-only); insert/update/delete policies are added per-feature as each week's work requires them — not all upfront.

## Build Order (8 weeks)

- **Week 1-2:** Auth + Dashboard + Create/Join class
- **Week 3-4:** Class page shell + Posts/Feed
- **Week 5-6:** File upload + folders
- **Week 7:** Chat (Socket.io)
- **Week 8:** Jitsi call button + polish/bug fixes

## Review Workflow (AI-generated code)

Since code is AI-written and human-reviewed, each week includes a specific review focus rather than a generic "check it works" pass:

- **Week 1-2:** Test as both roles end-to-end. Verify RLS isn't silently too permissive (a policy that "works" can still leak data).
- **Week 3-4:** Confirm teacher checks are scoped to _that specific class_, not just "is a teacher" — try posting into a class you don't belong to.
- **Week 5-6:** Most important feature — slow down. Test cross-class file access by guessing/editing URLs. Storage bucket policies are separate from table RLS and easy for AI to forget.
- **Week 7:** Confirm Socket.io rooms are scoped per class_id, not broadcasting globally — test with two classes open in two tabs.
- **Week 8:** Jitsi rooms are public by default to anyone with the link — check whether a room password or access restriction is needed.

**Running habit:** end of each week, spend 10-15 min actively trying to access something you shouldn't (another class's data). Cheaper to catch permission bugs the week they're introduced than to find them later.

## Build Log

### Week 1-2 (in progress)

- Supabase project created, `schema.sql` run, all 7 tables verified.
- Auth flow implemented: sign up (`src/pages/sign_up.jsx`) → Supabase Auth creates `auth.users` row → trigger copies `name`/`role` into `public.users`.
- Login (`src/pages/login.jsx`) → Supabase issues JWT session, persisted to `localStorage` by the Supabase client.
- `App.jsx` listens via `onAuthStateChange`, renders `<Dashboard session={session} />` once a session exists.
- Dashboard fetches user profile (`public.users`) and joined classes (`class_members` → `classes`) in parallel on mount, keyed off `session.user.id`.
- **Open item to verify:** confirm the `auth.users` → `public.users` trigger actually exists in Supabase (Database → Triggers) — easy for AI-generated docs to describe this step without the trigger SQL having actually been written and run.
