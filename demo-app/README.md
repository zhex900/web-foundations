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
