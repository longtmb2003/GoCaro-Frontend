# GoCaro Frontend

A modern, real-time multiplayer Gomoku (Caro) web client. Players register, are
matched against an opponent, and play a live 15×15 game over a WebSocket, with a
leaderboard, match history, and move-by-move replay.

The frontend is presentation only — all game rules, move validation, win
detection, and matchmaking are owned by the backend.

## Tech stack

- **Vue 3** (Composition API, `<script setup>`) + **TypeScript** (strict)
- **Vite** build tooling
- **Pinia** state management
- **Vue Router**
- **TailwindCSS v4** (CSS-first `@theme`, dark mode by default)
- **Axios** for REST, native **WebSocket** for realtime
- **ESLint** + **Prettier**

## Requirements

- Node.js 22+
- A running [GoCaro backend](https://github.com/longtmb2003/GoCaro-Backend)
  (listens on `:8080` by default)

## Getting started

```bash
npm install
cp .env.example .env
npm run dev
```

The app runs at the URL Vite prints (default `http://localhost:5173`).

In development the backend serves no CORS headers, so the Vite dev server proxies
`/api` (REST) and `/ws` (WebSocket) to `http://localhost:8080`. Leave
`VITE_API_BASE_URL` empty for this same-origin setup; set it to the backend
origin for a production build.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run type-check` | Run `vue-tsc` |
| `npm run lint` | Lint and auto-fix with ESLint |
| `npm run format` | Format `src/` with Prettier |

## Project structure

```
src/
  api/          REST modules and the WebSocket manager (the only Axios/WS callers)
  assets/       Global styles and design tokens
  components/   Presentational and feature components
  composables/  Reusable composition logic
  layouts/      App and auth layouts
  pages/        Routed pages
  router/       Routes and navigation guards
  stores/       Pinia stores (auth, socket, game, leaderboard, history)
  types/        Shared TypeScript types
  utils/        Small pure helpers
```

Data flows one direction: pages and components read from stores; stores talk to
the API and WebSocket layers; only those layers reach the backend. A single
WebSocket connection per authenticated user carries both matchmaking and
gameplay.

## Features

- Authentication (register, login, JWT persistence, auto-login, route guards)
- Lobby with profile, Elo, and a leaderboard preview
- Realtime matchmaking with a searching/cancel flow
- Live 15×15 gameplay: turn state, resign, disconnect handling
- Match result screen (victory / defeat / draw, play again)
- Full leaderboard page
- Paginated match history
- Move-by-move replay with play/pause and speed control
