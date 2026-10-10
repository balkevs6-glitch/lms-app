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

## Direction Change (Oct 10)

The platform is now mainly for students to **share and store their code folders** in private projects. It is not a classroom tool anymore.

- **Private, invite-only.** Nothing is public. Access comes from being on the `member_list` (can sign in) and then joining a project with its code.
- **Renamed** to match: Classes → **Projects**, teacher → **Maintainer**, student → **Contributor**. These roles exist only inside a project: whoever creates a project is its maintainer, whoever joins is a contributor. "Dev/member" was rejected: everyone is a dev, so the name says nothing about permissions.
- Posts/Feed stays but is now about project updates. Files/folders is still the core feature.

## Scope Decision

Full scope was too large for 2 months solo at this time budget — voice/video calling alone (WebRTC) is a multi-month effort even for experienced teams.

**Decision:** cut custom voice/video, use an embedded third-party widget (Jitsi Meet) instead of building calling from scratch.

Other options considered for calls: Daily.co / Whereby Embedded (nicer UI, still low-integration), LiveKit/Agora (more control, more work — deferred), linking directly to Discord (simplest, but less "native" feeling). Jitsi chosen for zero backend work and fastest path to shipping.

## Final Feature Set (v1)

1. Auth — login/signup, invite-only via `member_list`
2. Projects — create a project, join via code, list members
3. Posts/Feed — simple updates/announcements per project
4. File & folder uploads — tied to a project, organized, downloadable
5. Chat — real-time, per project
6. Call — "Start Call" button embedding a Jitsi Meet room per project

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

The Supabase database itself is the source of truth. The early `schema.sql` draft does not match it (it used uuid ids and had `email`/`avatar_url` on users), so don't run it. Current tables, after `migration_projects_roles.sql`:

1. **users** — id (= auth.users id), name, is_active, created_at (no role: roles are per project)
2. **projects** — id (bigint), name, description, join_code (unique), created_by, created_at
3. **project_members** — project_id, user_id, role (maintainer/contributor), joined_at (primary key on project_id + user_id, which blocks double joins)
4. **posts** — id (bigint), project_id, author_id, title, content, created_at
5. **member_list** — email, added_at (who may sign up)

Not created yet: **folders**, **files**, **messages**. They get created in Weeks 5-7 with `project_id bigint` to match.

RLS is enabled on `projects`, `project_members`, `posts` and `member_list`. Policies cover select access (members-only). Writes to `projects` and `project_members` have no direct policies: they only happen through `create_project()` and `join_project()`. Posts: members can read, and only a maintainer of that specific project can insert (with `author_id` forced to the caller). File policies come in Weeks 5-6.

## Build Order (8 weeks)

- **Week 1-2:** Auth + Dashboard + Create/Join project
- **Week 3-4:** Project page shell + Posts/Feed
- **Week 5-6:** File upload + folders
- **Week 7:** Chat (Socket.io)
- **Week 8:** Jitsi call button + polish/bug fixes

## Review Workflow (AI-generated code)

Since code is AI-written and human-reviewed, each week includes a specific review focus rather than a generic "check it works" pass:

- **Week 1-2:** Test as both roles (maintainer and contributor) end-to-end. Verify RLS isn't silently too permissive (a policy that "works" can still leak data).
- **Week 3-4:** Confirm maintainer checks are scoped to _that specific project_, not just "is a maintainer" — try posting into a project you don't belong to.
- **Week 5-6:** Most important feature — slow down. Test cross-project file access by guessing/editing URLs. Storage bucket policies are separate from table RLS and easy for AI to forget.
- **Week 7:** Confirm Socket.io rooms are scoped per project_id, not broadcasting globally — test with two projects open in two tabs.
- **Week 8:** Jitsi rooms are public by default to anyone with the link — check whether a room password or access restriction is needed.

**Running habit:** end of each week, spend 10-15 min actively trying to access something you shouldn't (another project's data). Cheaper to catch permission bugs the week they're introduced than to find them later.

## Session & Browser Storage

How the frontend stays connected to Supabase across page loads:

- After `supabase.auth.signInWithPassword()` succeeds, the Supabase client library automatically saves the returned session (access token + refresh token) into the browser's `localStorage`, under a key like `sb-<project-id>-auth-token`. This is handled entirely by the client library — no custom code required.
- On every page load, the client checks `localStorage` for that key. If a valid (or refreshable) session exists, `onAuthStateChange` fires with it, which is what lets `App.jsx` render `<Dashboard>` directly instead of showing the login screen again.
- Access tokens expire (~1 hour by default); the refresh token lets the client silently renew the session in the background without logging the user out.
- **To verify it's working:** after logging in, check browser devtools → Application → Local Storage for the `sb-...-auth-token` key.
- **Why `localStorage` and not `sessionStorage`:** `localStorage` persists across tab/browser restarts, giving "stay logged in" behavior for free — the right default for this kind of app. `sessionStorage` would log users out whenever they closed the tab, which isn't a tradeoff worth making here.

## Access Control: member_list and per-project roles

**Platform access** is private and invite-only. A `member_list` table holds the emails allowed to sign up. The `handle_new_user()` trigger rejects any other email. Supabase hides that error behind "Database error saving new user", so the signup form maps it to "This email isn't on the member list". Nothing the signup form sends is trusted.

**Roles are per project, not global.** `users` has no role column. Every member can create projects and join projects:

- Creating a project makes you its **maintainer**. Maintainers can post updates there and see the join code.
- Joining with a code makes you a **contributor** in that project.
- Being a maintainer of one project gives no power in another. The role is read from `project_members` for that exact project.

This replaced two earlier designs (a global student/teacher role, then a global maintainer/contributor role), because "who can do what" only makes sense inside a project on a code-sharing platform.

**Create and join go through database functions** (`create_project()` and `join_project()`), not direct table inserts:

- Both check the caller's account is active, and the role is set inside the function. A plain insert policy on `project_members` would let a user add themselves to any project as a maintainer by sending `role: 'maintainer'` from the browser.
- The old `using (true)` select policy that exposed every class row is gone. The join code is looked up inside the function, so projects are only visible to their members.

**Notes**

- No admin UI yet. `member_list` rows are added by hand in the SQL editor, fine for a small known group.
- Join codes are 6 characters. Anyone on the member list who has a code can join, so treat codes like invites. If it matters later, add rotation or expiry.
- Considered and rejected: a shared signup code. If it leaks, anyone can sign up.

## Build Log

### Week 1-2 (in progress)

- Supabase project created with users, classes, class_members and posts tables.
- Auth flow implemented: sign up (`src/pages/sign_up.jsx`) → Supabase Auth creates `auth.users` row → trigger copies `name`/`role` into `public.users`.
- Login (`src/pages/login.jsx`) → Supabase issues JWT session, persisted to `localStorage` by the Supabase client.
- `App.jsx` listens via `onAuthStateChange`, renders `<Dashboard session={session} />` once a session exists.
- **Open item to verify:** confirm the `auth.users` → `public.users` trigger actually exists in Supabase (Database → Triggers) — easy for AI-generated docs to describe this step without the trigger SQL having actually been written and run.
- Dashboard fetches user profile (`public.users`) and joined projects (`project_members` → `projects`) in parallel on mount, keyed off `session.user.id`.

### Oct 10: direction change

- Renamed classes → projects, teacher/student → maintainer/contributor (`migration_projects_roles.sql`).
- Replaced `instructor_allowlist` with `member_list` (invite-only signup).
- Create/join moved into database functions. Frontend now uses `CreateProjectModal.jsx` and `JoinProjectModal.jsx`; `joinCode.js` is no longer needed.
- Migration v2 was rewritten against the real database (bigint ids, `created_by`, no `subject`/`email` columns). Added `projects.description`.
- Still to do: rename the dashboard's `class_members`/`classes` queries and any `teacher`/`student` checks (for example the "+ Create class" button gate) to `project_members`/`projects` and `maintainer`/`contributor`.
- Week 3-4 is already under way: `project_page.jsx` (formerly `class_page.jsx`) shows the feed and lets maintainers post; posts service is `services/post.js`.
- Converted dashboard, project page, posts service, signup and login to projects/maintainer/contributor. Removed the role picker from signup and the debug `console.log`/`getUser` calls from the post form.
- Supabase hides trigger errors behind "Database error saving new user", so signup maps that message to "This email isn't on the member list".

### Oct 10: roles removed from users

- Dropped `users.role`. Any member can create or join projects; the role lives only in `project_members`.
- `member_list` is now just emails. Dashboard shows both "Create Project" and "Join Project" to everyone, and no global role badge.
- `getUserProfile` no longer selects `role` (selecting a dropped column would error).
