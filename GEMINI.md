# GEMINI.md — School Platform (Frontend Focus)

This file gives context for AI-assisted frontend work on this project. Read this before generating or editing any frontend code.

## Project Summary

A private project platform where maintainers/contributors can:

- Create/join projects
- Post project updates (Feed)
- Upload & organize project files in folders
- Chat in real time per project
- Start a video call via an embedded Jitsi Meet room

Student solo project, built with heavy AI assistance + manual review. Priority: working features over polish, but code should stay clean enough to actually understand and extend.

## Tech Stack (Frontend Relevant)

- **Framework:** React (functional components + hooks only, no class components)
- **Backend:** Node.js + Express (for join-by-code, admin actions; most reads/writes go direct to Supabase)
- **Database/Auth/Storage:** Supabase (Postgres, Supabase Auth, Supabase Storage)
- **Realtime:** Supabase Realtime (chat), not Socket.io
- **Calls:** Jitsi Meet embedded via iframe (no custom WebRTC)
- **Styling:** (fill in once decided — e.g. Tailwind CSS recommended for speed)

## Frontend Architecture Rules

1. **Supabase client talks directly to the DB** for simple reads/writes (list projects, read posts, list files). Use database functions for protected project actions such as joining by code.
2. **Auth state** comes from Supabase Auth (`supabase.auth.getUser()` / `onAuthStateChange`). Project roles come from `project_members` and are scoped to each project.
3. **Never expose the Supabase `service_role` key in frontend code.** Only the public `anon` key belongs in React.
4. **Data fetching:** use simple hooks (`useEffect` + `useState`) or a lightweight data-fetching lib if introduced later (e.g. React Query) — don't over-engineer state management for a project this size. No Redux.
5. **Realtime chat:** subscribe to Supabase Realtime channels per class, unsubscribe on unmount.

## Pages / Routes (v1)

| Route               | Purpose                                             |
| ------------------- | --------------------------------------------------- |
| `/login`, `/signup` | Auth                                                |
| `/dashboard`        | List of projects (join or create)                    |
| `/project/:id`      | Project page — Feed / Files / Chat tabs + Call button |
| `/project/:id/files`| Folder browser + upload                             |

## Core Components (suggested)

- `AuthProvider` / `useAuth()`
- `ClassCard`, `ClassList`
- `CreateClassModal`, `JoinClassModal`
- `Feed`, `PostCard`, `NewPostForm`
- `FileBrowser`, `FolderRow`, `FileRow`, `UploadButton`
- `ChatPanel`, `MessageBubble`, `MessageInput`
- `CallButton` (opens Jitsi room in iframe/modal using `class_id` as room name)

## Database Tables (for reference — don't invent new fields without checking this)

- `users` — id, name, email, role, avatar
- `projects` — id, name, description, join_code, created_by
- `project_members` — project_id, user_id, role
- `posts` — id, project_id, author_id, title, content, created_at
- Project files and folders — stored under the project ID in Supabase Storage
- `messages` — id, project_id, sender_id, content, created_at

## Conventions

- Functional components, hooks only.
- One component per file, matching filename.
- Supabase queries live in the feature’s own file, like `features/files/files.js`. Don’t create a separate services folder.
- Handle loading and error states explicitly on every data fetch (no silent failures).
- File/folder paths in Supabase Storage follow `class_id/folder_path/filename` so storage RLS policies can check class membership.

## What NOT to do

- Don't build custom WebRTC — calls are Jitsi only.
- Don't add Socket.io — Supabase Realtime handles chat.
- Don't put the Supabase service_role key anywhere in frontend code.
- Don't add extra pages/features outside the v1 scope above without checking against the project plan first.

## Known Gaps (fill in as decided)

- Styling approach not finalized
- Component library (if any) not finalized
- Design/theme not finalized
