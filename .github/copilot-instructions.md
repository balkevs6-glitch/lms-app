# Copilot instructions for this repository

## Project snapshot

This repo is a Vite + React frontend for a private, invite-only project-sharing platform. The product was originally planned as a classroom tool, but the current implementation focuses on projects, roles, and permission boundaries inside each project.

Key facts that matter for future changes:

- The UI and business logic mostly use the term "project" instead of "class".
- Access is invite-only via `member_list` and database authorization rules.
- Users do not have a global role column; project membership (`project_members`) determines whether a user is a `maintainer` or `contributor` for a specific project.
- Features are built around Supabase for auth, DB access, and storage, not a custom backend for normal reads/writes.
- This project uses embedded Jitsi for calls rather than custom WebRTC.

## Build, test, and validation commands

This repo currently exposes only the Vite app scripts from `package.json`:

- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Create a production build: `npm run build`
- Preview the built app: `npm run preview`

There is no lint script configured and no automated test runner configured in this repo right now. For validation, prefer `npm run build` after changes that affect routing, state, or Supabase integration. If a test runner is added later, keep checks targeted instead of broad suites (for example, a single Vitest/Jest file or pattern, not a whole repo run unless needed).

## High-level architecture

The app is intentionally small and direct:

- `src/app.jsx` bootstraps Supabase auth state and decides whether to show login, signup, or the dashboard.
- `src/pages/dashboard.jsx` loads the signed-in user's profile and current project memberships, then renders either a project detail view or the project list.
- `src/pages/project_page.jsx` is the main project workspace; it is where project-specific actions and tabs are composed.
- Supabase queries live in the feature’s own file, like `src/features/files/files.js`. Don’t create a separate services folder.
- `src/supabaseClient.js` is the shared Supabase client entry point. Do not add service-role secrets or public-write credentials to frontend code.

The repo is organized around a few conventions that are important for correctness:

- Read and write project data through Supabase methods, not ad hoc fetches in components.
- Match the real schema names used by the database. The current docs and earlier code may still mention "classes" or "teachers/students"; current behavior is project-based and role-based within each project.
- Permission checks and access control are enforced in database functions such as `create_project`, `join_project`, `rename_project`, and `leave_project`, not by trusting browser state.

## Key conventions specific to this codebase

- Prefer the project vocabulary used in the live database: `projects`, `project_members`, `posts`, `member_list`, and `users`.
- Do not invent a global `role` column or assume a user is globally a maintainer or contributor; the role is only valid inside the specific project.
- Keep frontend code in functional React components with hooks. Avoid class components or Redux-style state management.
- Use `useEffect` + `useState` for simple data loads and session handling. The app is small enough that a lightweight local state pattern is the default.
- When a feature needs DB access, prefer a helper in its feature file and return an explicit `{ data, error }` object rather than silently swallowing failures.
- The codebase is intentionally frontend-first. Most direct DB reads/writes happen from the browser through Supabase; only use a server-side path when the repo explicitly requires it.
- For auth and session restoration, rely on Supabase's browser session handling (`getSession`, `onAuthStateChange`) instead of custom token logic.
- Do not add custom WebRTC or Socket.IO patterns for chat/calls unless the architecture is intentionally changed; this project relies on Supabase auth and Jitsi for calls.

## Repository-specific guardrails

- The project evolved from a classroom model to a code/project-sharing model. When working on new code, do not reintroduce teacher/student assumptions from earlier docs unless the DB schema actually matches them.
- The docs call out that the database schema is the source of truth and that a few early planning artifacts (`schema.sql`, older naming, earlier role model) are stale. Favor the actual runtime code and active DB functions over old docs.
- For member access and project creation, assume database functions are doing the important permission checks. Never trust browser-only role indicators.
- Use the existing service layer and naming conventions to keep changes easy to review and consistent with the rest of the app.

## Working style for this repo

- Keep changes narrow and repo-consistent; this app is small and feature-focused.
- Prefer updating the existing Supabase service layer rather than introducing new abstraction layers.
- When editing auth, dashboard, or project membership flows, verify that the new behavior still respects project-scoped roles and the `member_list` invite-only gate.
- Errors should be visible and explicit in the UI when a fetch or RPC fails; avoid silent fallback behavior that hides the real problem.

## Project rules (school platform)

- Frontend: Vite + React (functional components and hooks only).
- Backend: Node.js + Express, in a separate backend folder.
- Supabase handles database, auth, storage and realtime chat. Do NOT add Socket.io.
- Video calls: embedded Jitsi Meet only. No custom WebRTC.
- Never put the Supabase service_role key in frontend code. Use only the anon key there.
- Supabase queries live in the feature’s own file, like `features/files/files.js`. Don’t create a separate services folder.
- Handle loading and error states on every data fetch.
- Tables and concepts: users, projects, project_members, posts, files, folders, messages. Don't invent new ones without asking.
- Don't add features outside the v1 plan.
