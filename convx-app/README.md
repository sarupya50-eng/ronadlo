# Music+Community App — Mobile (Expo, web-first for now)

React Native app (Expo) for auth, room list, and live room chat/presence. Configured to run in the browser via `expo start --web` so you can test it inside Codespaces without an emulator.

## Setup

1. Make sure the backend (`convx-backend`) is already running on port 4000.
2. In this folder:
   ```bash
   npm install
   npm run web
   ```
3. Expo will print a local URL (usually `http://localhost:8081` or similar) and, in Codespaces, prompt you to open it in the forwarded-port browser tab. Open that.

## Important: backend URL in Codespaces

`src/api/client.js` currently points at `http://localhost:4000`. That works if the web app and backend are both being viewed through the same Codespace (Codespaces proxies `localhost` correctly inside its own browser preview). If you open the web app in a regular external browser tab instead, you'll need to:

1. Go to the **Ports** tab in your Codespace
2. Make sure port `4000` is set to **Public** visibility (right-click it → Port Visibility → Public)
3. Copy that forwarded URL
4. Replace `API_BASE_URL` in `src/api/client.js` with that URL

## What's wired up

- **Auth** — register/login screen, JWT stored via AsyncStorage, auto-restores session on reload
- **Room list** — fetch public rooms, create a room, join a room
- **Room screen** — live chat via Socket.io, live presence (who's online), auto-joins the socket room on open and leaves on close

## Not built yet (next steps)

- Playback UI (the backend already has a `playback:update` / `playback:state` socket channel ready — no player UI consumes it yet)
- Track upload
- Profile editing screen (backend route `PATCH /users/me` already exists)
- Private rooms / invites
