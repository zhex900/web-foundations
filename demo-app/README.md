## Demo App (MiniBook)

Simple Facebook-style feed for teaching server + client concepts.

### Features
- **Bun** native server ([Bun.serve](https://bun.com/docs/runtime/http/server)), [bun:sqlite](https://bun.com/docs/runtime/sqlite), [Bun.password](https://bun.com/docs/api/hashing), [cookies](https://bun.com/docs/runtime/http/cookies)
- Login via demo account
- Create posts, reply, like
- Tailwind UI with light/dark mode

### Setup
1. Install [Bun](https://bun.sh) (no npm dependencies).
2. Start the server:
   - `bun run dev` or `bun --watch server.js`
3. Open `http://localhost:3000`

### Demo account
- Username: `demo`
- Password: `password` (override with `DEMO_PASSWORD`)

### Environment
Copy `.env.example` to `.env` if you want to customize values.

### Deploy on Render

This app uses **Bun** (`bun run start`) and SQLite. Render’s [Node runtime](https://docs.render.com/docs/native-runtimes) includes **Bun** when you set a Bun version (e.g. `demo-app/.bun-version`) or add a lockfile—see [Setting your Bun version](https://docs.render.com/docs/bun-version).

1. **Connect the repo** in the [Render Dashboard](https://dashboard.render.com/) and use **Blueprint** (or create a **Web Service** manually).
2. If the repo root is this workshop (not only `demo-app`), the included `render.yaml` at the repo root sets **`rootDir: demo-app`**. If you deploy from a repo that only contains `demo-app`, point **Root Directory** at `.` and skip `rootDir` in the blueprint (or copy `render.yaml` into that repo).
3. **Build command:** `bun install`  
   **Start command:** `bun run start`
4. **Environment:** Render sets `PORT` automatically. Optionally set `DEMO_PASSWORD` in the dashboard.
5. **SQLite persistence:** The filesystem on a web service is [ephemeral](https://docs.render.com/deploys#ephemeral-filesystem) unless you attach a **persistent disk** (paid plans). Without a disk, `demo.sqlite` is recreated when the instance restarts. To keep the DB across deploys:
   - Add a disk (e.g. mount path `/data`) in the service settings.
   - Set `DB_PATH=/data/demo.sqlite` (or another path under the mount).
6. **Uploaded avatars** live under `public/uploads/` in the app tree; they are also lost on redeploy unless you store them on a disk or external storage (e.g. R2/S3). For a teaching demo, ephemeral data is often fine.

If you are not using Blueprints, create a **Web Service**, choose **Node**, set **Root Directory** to `demo-app`, and use the build/start commands above.
