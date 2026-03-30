# Full-stack web development — 5-day lesson plan (2 hours/day)

This plan uses **`demo-app` (MiniBook)** as the running example: a small social feed with login, posts, replies, likes, profiles, and avatars, built with **HTML, CSS, JavaScript**, **Bun**, **SQLite**, and **cookie-based sessions**.

**Total time:** 10 hours (5 sessions × 2 hours)

**Assumptions:** Learners can use a terminal and editor. No prior backend experience required.

---

## How to use each session (2 hours)

| Segment            | Time   | Focus |
|--------------------|--------|--------|
| Warm-up / review   | ~10 min | Questions from last time |
| Concept + demo     | ~40 min | Instructor walks code and browser |
| Hands-on           | ~45 min | Pairs or solo, concrete tasks |
| Wrap-up            | ~15 min | Recap, preview tomorrow, Q&A |

Adjust pacing if the cohort is faster or slower on the tools.

---

## Day 1 — The web stack and the “full stack” picture

**Objectives**

- Name the main layers: **browser (client)**, **network (HTTP)**, **server**, **database**.
- Read a URL and describe what happens on first request vs. subsequent requests.
- Open `demo-app` locally and map **screens** to **files** (HTML vs. JS vs. server).

**Concepts**

- HTTP verbs at a high level: GET (read), POST (submit / change state).
- Static files (`/public/…`) vs. dynamic routes (`/api/…`, `/login`).
- Why HTML/CSS/JS in `public/` are “the client”; why `server.js` is “the server.”

**Demo (instructor)**

1. Run `bun run dev` from `demo-app`; open `/`, `/login`, `/register`.
2. Use browser **DevTools → Network**: show HTML document, then CSS/JS, then XHR/fetch to `/api/posts`.
3. Trace one path: “Click Sign in” → `login.html` → form POST → redirect.

**Hands-on**

1. Change one string in `public/login.html` (title or heading); reload and verify.
2. In DevTools, find the request for `app.js` and note its status and type.
3. Sketch a diagram: browser ↔ server ↔ SQLite (no code change required).

**Take-home (optional)**

- Read `demo-app/README.md` and list three features in your own words.

---

## Day 2 — HTML, forms, and the client (JavaScript)

**Objectives**

- Use **semantic HTML** for structure and accessibility (labels, buttons, headings).
- Explain how a **native form** submits to a URL with a given method.
- Describe what **`fetch`** does and why `app.js` uses it for the feed.

**Concepts**

- `action`, `method`, `name` on forms; `application/x-www-form-urlencoded` vs `multipart/form-data` (mention avatars).
- Minimal JS: loading data after page load, updating the DOM (`userBadge`, `#feed`).
- Cookies in the browser: sent automatically on same-site requests when using `credentials: "include"`.

**Demo**

1. `login.html`: form posts to `/api/login` — show redirect response in Network tab.
2. `index.html` + `app.js`: `loadPosts()` → `GET /api/posts` → JSON → `renderPosts()`.
3. Show `deletePost` using `fetch` with `method: "DELETE"` (contrast with form POST).

**Hands-on**

1. Add a harmless `data-*` attribute to a button or link; read it in the console.
2. Temporarily `console.log` the JSON from `/api/posts` in `loadPosts()` and inspect `user` and `posts` shape.
3. **Stretch:** Add a short static paragraph under the feed title in `index.html` (practice editing HTML).

**Take-home**

- Write two sentences: “What is the difference between a form POST and `fetch` DELETE?”

---

## Day 3 — Server, routing, and static assets (Bun)

**Objectives**

- Explain **one process** listening on a **port** and handling **requests**.
- Map **URLs** to **handlers** in `server.js`, `backend/routes.js`, and `backend/api.js`.
- Describe how **static files** are served from `public/` safely.

**Concepts**

- `Bun.serve`: `routes` object vs. `fetch` fallback for `/public/*`.
- Separation of concerns: **`routes.js`** (pages), **`api.js`** (JSON and redirects), **`db.js`** (data access).
- Environment variables: `PORT`, `DB_PATH` (see `.env.example`).

**Demo**

1. Walk through `server.js`: merge `pageRoutes` and `apiRoutes`; static file path join and `..` guard.
2. Open `backend/routes.js`: `/` redirects if not logged in; `/profile` serves HTML only when authenticated.
3. Show a 404 for a missing static file vs. a missing API route.

**Hands-on**

1. Add a trivial **read-only** page route (e.g. `/health` returning plain text `"ok"`) *or* document the steps without merging to main (instructor’s choice).
2. List five paths from the codebase: which are **pages**, which are **API**?
3. Change `PORT` locally via `.env` and confirm the app binds to the new port.

**Take-home**

- Draw the request path for `GET /api/me` from browser to response.

---

## Day 4 — Authentication, sessions, and APIs

**Objectives**

- Contrast **authentication** (who you are) with **authorization** (what you may do).
- Explain **session cookies**: opaque token, stored server-side or in DB, sent on each request.
- Reason about **REST-ish** patterns: GET for reads, POST for actions, DELETE for remove.

**Concepts**

- Password storage: **hashing** (`Bun.password`), never store plaintext.
- Session table: token → `user_id`; `getUserFromRequest` reads cookie.
- Redirects after login/logout; query params for errors (`?login=failed`).

**Demo**

1. `backend/api.js`: `/api/login` POST → verify password → `createSession` → `Set-Cookie`.
2. `/api/posts` GET: attach `user` from session; POST: `requireUser`.
3. `/api/posts/:id` DELETE: `getPostOwner` vs. current user → 403 if mismatch.

**Hands-on**

1. In DevTools → Application → Cookies, find the session cookie after login (name and scope).
2. Trace in code: from `deletePost` in `app.js` to the DELETE handler in `api.js`.
3. Discuss: “Why can’t the client alone prove identity without the server?”

**Take-home**

- Three bullet points: what the server must check before deleting a post.

---

## Day 5 — Database, SQL, persistence, and deployment

**Objectives**

- Describe **tables** and **relations** (users, posts, likes; parent for replies).
- Run simple **read** queries mentally: “posts with author name.”
- Outline **deploy** concerns: **PORT**, **ephemeral disk**, **env vars** (e.g. Render).

**Concepts**

- SQLite file location (`DB_PATH`); migrations implied by `CREATE TABLE IF NOT EXISTS`.
- Foreign keys and cascading deletes (likes when post deleted).
- **Production:** Render (or similar): build/start commands, persistent disk optional for SQLite, secrets for `DEMO_PASSWORD`.

**Demo**

1. Open `backend/db.js`: schema for `users`, `sessions`, `posts`, `likes`; seed demo user.
2. Show `getAllPosts` JOIN with `users` for `username` / `avatar_url`.
3. Walk through `README.md` “Deploy on Render” and `render.yaml` at repo root.

**Hands-on**

1. Write (on paper) a SQL `SELECT` that lists post `id` and author `username` (compare with `getAllPosts`).
2. List what **resets** if the server filesystem is ephemeral without a disk.
3. **Group discussion:** one feature to add next (e.g. pagination, email reset) and which layer it touches.

**Take-home**

- Short reflection: “What is one thing you would test before shipping this app?”

---

## Suggested progression of difficulty

| Day | Emphasis                         | demo-app anchors |
|-----|----------------------------------|------------------|
| 1   | Big picture, HTTP, file layout   | Run app, DevTools Network |
| 2   | HTML/CSS/JS client             | Forms, `app.js`, fetch |
| 3   | Bun server, routing, static      | `server.js`, `routes.js`, `api.js` |
| 4   | Sessions, auth, API design       | login, cookies, DELETE ownership |
| 5   | SQL + deploy                     | `db.js`, Render section in README |

---

## Materials checklist

- [ ] `demo-app` running on instructor machine
- [ ] Projector or shared screen for DevTools
- [ ] Printed or shared link to this file + `demo-app/README.md`
- [ ] Optional: `.env` with non-default `DEMO_PASSWORD` for a security discussion

---

## Instructor notes

- **Pacing:** If Day 2 runs long, shorten Day 3 demo and assign route-tracing as homework.
- **Safety:** Use a throwaway DB for class; remind learners not to commit real secrets.
- **Extensions** for fast groups: read `profile` multipart upload path; add a `/api/health` JSON endpoint; sketch D1 or Postgres migration (conceptual only).

This plan is intentionally tied to **one codebase** so learners always have a concrete place to look when vocabulary (SPA, API, cookie, migration) appears.
