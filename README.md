# OpenStream

## 🎬 About the Project

**OpenStream** is a video uploading and streaming platform in development. Uploaded videos will be encoded into multiple resolutions and formats to support smooth playback across devices and connection speeds.

<br />

## 🧰 Technologies Used

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-E36002?style=for-the-badge&logo=hono&logoColor=white)

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TanStack Start](https://img.shields.io/badge/TanStack_Start-FF4154?style=for-the-badge&logo=tanstack&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)

![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)

<br />

## 📁 Project Structure

- `apps/web` — TanStack Start frontend with React.
- `apps/api` — Hono API running on Bun.
- `packages/ui` — Shared UI components built with shadcn/ui and Tailwind CSS.
- `packages/email-templates` — React Email templates rendered by the API worker (preview them with `bun run --cwd packages/email-templates dev:email`).
- `packages/shared` — Constants, zod schemas and utilities used by both the API and the web app (built with tsup; `bun run dev` and other Turbo tasks build it first).

<br />

## 🚀 Getting Started

Install [Caddy](https://caddyserver.com/docs/install#homebrew-mac) (`brew install caddy`) and trust its local certificate authority once, so the HTTPS dev domains work:

```bash
caddy trust
```

Start Postgres, Redis and Mailpit, then create your local environment file:

```bash
docker compose up -d
cp .env.example .env # set AUTH_SECRET, e.g. `openssl rand -hex 32`
```

Install dependencies, apply database migrations and start everything from the repository root:

```bash
bun install
bun run db:migrate
bun run dev
```

`bun run dev` starts the web app, the API, the outbox worker and the Caddy reverse proxy (`apps/reverse-proxy`). Open the app through the proxy; the `http://localhost:3000` URL Vite prints cannot reach the API:

| URL                                  | Service                                    |
| ------------------------------------ | ------------------------------------------ |
| https://app.openstream.localhost     | Web app (`/api/*` is forwarded to the API) |
| https://mailbox.openstream.localhost | Mailpit (sent emails)                      |

Side effects such as emails are written to a transactional outbox together with the change that causes them. The worker relays outbox messages to a BullMQ queue (Redis) and handles them with retries.

### Tests

The API has end-to-end tests that run the real app in-process against a dedicated `open_stream_test` database (created and migrated automatically; it only needs the Postgres container):

```bash
bun run test                     # every package
bun run --cwd apps/api test:e2e  # only the API e2e specs
```

Specs live next to the code in `__tests__/` folders (`*.e2e.spec.ts`, with `it.each` data in `*.scenarios.ts`). Shared helpers are in `apps/api/test/helpers` and data factories in `apps/api/test/factory`.

### API client

The API documents itself with OpenAPI (served at https://app.openstream.localhost/api/v1/openapi.json). The web app's client in `apps/web/src/api/generated-api.ts` is generated from the exported schema, so after changing an API route or its schemas run:

```bash
bun run generate:api
```

It exports `apps/api/src/openapi/api-schema.json` (reads the root `.env`) and regenerates the client. Never edit either file by hand.
