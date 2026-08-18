# Music+Community App — Backend (MVP)

Node + Express + Socket.io + Prisma/Postgres backend. Covers auth, profiles, rooms, real-time chat, presence, and a basic playback-sync channel (for user-uploaded tracks).

## Setup in GitHub Codespaces

1. Open this folder in your Codespace.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Spin up a Postgres instance. Easiest options inside a Codespace:
   - Use the `postgres` devcontainer feature (add to `.devcontainer/devcontainer.json`), or
   - Run Postgres in Docker: `docker run --name musicapp-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=musicapp -p 5432:5432 -d postgres:16`
4. Copy `.env.example` to `.env` and fill in `DATABASE_URL` (and a real random `JWT_SECRET`).
5. Run the first migration:
   ```bash
   npx prisma migrate dev --name init
   ```
6. Start the dev server:
   ```bash
   npm run dev
   ```
7. Confirm it's alive: `curl http://localhost:4000/health`

## API overview

**Auth**
- `POST /auth/register` — `{ username, email, password }`
- `POST /auth/login` — `{ emailOrUsername, password }`

Both return `{ token, user }`. Send `Authorization: Bearer <token>` on protected routes.

**Users**
- `GET /users/me` (auth)
- `PATCH /users/me` (auth) — `{ bio?, avatarUrl?, genres? }`
- `GET /users/:username` — public profile

**Rooms**
- `GET /rooms` — list public rooms
- `POST /rooms` (auth) — `{ name, description?, isPrivate? }`
- `GET /rooms/:id` — room detail (members + recent messages)
- `POST /rooms/:id/join` (auth)
- `POST /rooms/:id/leave` (auth)

**Socket.io** (connect with `auth: { token }` in handshake)
- `room:join` `{ roomId }` → receive `presence:update`, `playback:state`
- `room:leave` `{ roomId }`
- `chat:message` `{ roomId, content }` → broadcasts `chat:message`
- `playback:update` `{ roomId, trackId, positionMs, isPlaying }` → broadcasts `playback:state`

## Notes / next steps

- Playback and presence state currently live in memory in `src/sockets/index.js`. Fine for one server instance; move to Redis before you scale to multiple instances or need persistence across restarts.
- No track upload/storage endpoint yet — add an `/tracks` route with S3-compatible storage (or your own VPS + object storage) when you're ready to wire up real audio.
- No role/permission checks on `playback:update` yet (any room member can drive playback) — add a "host" check once you decide the room ownership model.
- Rate limiting and input sanitization beyond the current zod schemas are worth adding before any public exposure.
