# GEMINI.md — School Platform (Frontend Focus)

This file gives context for AI-assisted frontend work on this project. Read this before generating or editing any frontend code.

## Project Summary

A school platform (Discord-inspired) where teachers/students can:

- Create/join classes
- Post announcements/assignments (Feed)
- Upload & organize files in folders
- Chat in real time per class
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

1. **Supabase client talks directly to the DB** for simple reads/writes (list classes, read posts, list files). Only go through the Express backend for: joining a class by code, admin-only actions.
2. **Auth state** comes from Supabase Auth (`supabase.auth.getUser()` / `onAuthStateChange`). Wrap the app in an Auth context/provider so any page can check `user` and `role` (student/teacher).
3. **Never expose the Supabase `service_role` key in frontend code.** Only the public `anon` key belongs in React.
4. **Data fetching:** use simple hooks (`useEffect` + `useState`) or a lightweight data-fetching lib if introduced later (e.g. React Query) — don't over-engineer state management for a project this size. No Redux.
5. **Realtime chat:** subscribe to Supabase Realtime channels per class, unsubscribe on unmount.

## Pages / Routes (v1)

| Route               | Purpose                                             |
| ------------------- | --------------------------------------------------- |
| `/login`, `/signup` | Auth                                                |
| `/dashboard`        | List of classes (join or create)                    |
| `/class/:id`        | Class page — Feed / Files / Chat tabs + Call button |
| `/class/:id/files`  | Folder browser + upload                             |

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
- `classes` — id, name, subject, teacher_id, join_code
- `class_members` — class_id, user_id, role
- `posts` — id, class_id, author_id, title, content, created_at
- `files` — id, class_id, uploaded_by, folder_id, file_url, filename, created_at
- `folders` — id, class_id, name, parent_folder_id
- `messages` — id, class_id, sender_id, content, created_at

## Conventions

- Functional components, hooks only.
- One component per file, matching filename.
- Keep Supabase queries in a small `lib/` or `services/` folder (e.g. `services/classes.js`, `services/files.js`) instead of inline in components — makes review easier and keeps components clean.
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
