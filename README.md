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

Create your local environment file, then start Postgres, Redis, Mailpit and RustFS (S3-compatible object storage; its bucket is created on startup from `OBJECT_STORAGE_BUCKET`):

```bash
cp .env.example .env # set AUTH_SECRET (`openssl rand -hex 32`) and STORAGE_ENCRYPTION_KEY (`openssl rand -base64 32`)
docker compose up -d
```

Install dependencies, apply database migrations and start everything from the repository root:

```bash
bun install
bun run db:migrate
bun run dev
```

`bun run dev` starts the web app, the API, the outbox worker and the Caddy reverse proxy (`apps/reverse-proxy`). Open the app through the proxy; the `http://localhost:3000` URL Vite prints cannot reach the API:

| URL                                  | Service                                        |
| ------------------------------------ | ---------------------------------------------- |
| https://app.openstream.localhost     | Web app (`/api/*` is forwarded to the API)     |
| https://mailbox.openstream.localhost | Mailpit (sent emails)                          |
| https://storage.openstream.localhost | RustFS console (`rustfsadmin` / `rustfsadmin`) |

Side effects such as emails are written to a transactional outbox together with the change that causes them. The worker relays outbox messages to a BullMQ queue (Redis) and handles them with retries.

### Video libraries and uploads

Organizations keep videos in libraries. Video files are uploaded with the resumable [tus](https://tus.io) protocol: the web app sends 16 MiB chunks with `tus-js-client`, and the API forwards each one as a part of an object storage multipart upload, so an interrupted upload resumes where it stopped. Only MP4 and MOV files are accepted, judged by their first bytes rather than their name.

Files are stored at `<organization-id>/<library-id>/<video-id>/source` in the default storage (`OBJECT_STORAGE_*`). An organization owner can instead connect their own S3-compatible buckets as storages (**Storages** in the sidebar, or from a library's storage tab), test their connection, and assign one storage to any number of libraries. Each storage chooses its folder layout from the variables `{organizationId}`, `{libraryId}`, `{videoId}`, `{year}`, `{month}` and `{day}` (`{videoId}` is required). Credentials are envelope-encrypted with `STORAGE_ENCRYPTION_KEY` and never returned by the API. A library's storage is fixed once the library holds a video file, and a storage's bucket and path template are fixed once any library has written to it; storages still used by libraries cannot be deleted.

After an upload completes, the worker (`bun run dev:worker`) transcodes the video to HLS with **ffmpeg and ffprobe, which must be installed on the worker's host** (`brew install ffmpeg`, `apt install ffmpeg`; or set `FFMPEG_PATH` and `FFPROBE_PATH`). Each library chooses its qualities, 360p, 480p, 720p and 1080p (all by default), measured on the short side so portrait videos get the same ladder; nothing is upscaled. The worker also records the duration, size and codecs, and makes a poster and a storyboard (a sprite of seek previews with a WebVTT index). ffmpeg reads the source straight from storage through a short-lived signed URL, so nothing is downloaded first, and one ffmpeg run decodes it once into every quality and the storyboard, while the poster is captured alongside. Encoding is most of the time: `VIDEO_ENCODER` picks x264 on the CPU (default) or a GPU encoder (`videotoolbox`, `nvenc`), and `VIDEO_X264_PRESET` trades x264 speed for quality (`veryfast` by default; `superfast` was 30% faster in our measurements). The outputs sit next to the source under `hls/` and `thumbnails/`. Processing runs on its own BullMQ queue (`VIDEO_PROCESSING_CONCURRENCY`, default 1; `VIDEO_PROCESSING_MAX_ATTEMPTS`, default 3), and a video whose qualities changed can be processed again.

Each library also has a public API at `/api/v1/libraries/<library-id>` for the owner's own servers, set up in the library's **API** tab. A library can have up to 25 named API keys, each limited to its scopes: `videos:read`, `videos:upload` (create videos and upload with tus), `videos:manage` (rename and delete) and `playback:sign`. Requests send a key as `Authorization: Bearer osk_…`; keys are stored as SHA-256 hashes, and a secret is shown only when the key is created or given a new secret. With it, servers create, list, rename and delete videos, upload files with tus at `…/videos/<video-id>/uploads`, and sign playback URLs. Processed videos play as HLS from `…/videos/<video-id>/hls/master.m3u8`, with `…/thumbnails/poster.jpg` and `…/thumbnails/storyboard.vtt`; the uploaded file itself plays from `…/videos/<video-id>/stream` with HTTP range requests. None of these needs a key. Instead, the library's security settings decide who may watch: a list of allowed sites (checked against `Origin`/`Referer`) and an option to accept only signed, expiring URLs. A signed URL names the key that signed it, so giving that key a new secret, revoking it or removing its `playback:sign` scope revokes the URL. The library API sends no cookies, so it allows any CORS origin and skips the web app's CSRF origin check.

To follow a library's videos, its owner can add a webhook in the library's **Webhooks** tab. OpenStream then POSTs `video.created`, `video.updated`, `video.deleted`, `video.uploaded`, `video.upload_failed` and `video.processing.queued`/`started`/`ready`/`failed` events to its URL, each carrying the video's status, signed per the [Standard Webhooks](https://www.standardwebhooks.com) specification (`webhook-id`, `webhook-timestamp` and `webhook-signature` headers; the `whsec_…` signing secret is shown once and stored encrypted with `STORAGE_ENCRYPTION_KEY`). Events are recorded in the same transaction as the change and sent by the worker on their own BullMQ queue; anything other than a 2xx answer is retried with doubling delays (`WEBHOOK_MAX_ATTEMPTS`, default 8, from `WEBHOOK_RETRY_DELAY_MS`, default 30 s), redirects are not followed, and in production the URL must be public HTTPS and is resolved before each delivery to refuse private addresses. The tab lists the last 30 days of deliveries with their outcome, and can send a test event or resend a delivery. Servers that prefer polling read the same status from `GET …/videos/<video-id>/status` with a `videos:read` key.

Deleting a video removes it right away; its source, renditions, thumbnails and any unfinished upload are removed from storage by the worker afterwards, through a `storage_cleanups` record written in the same transaction and retried through the outbox until the storage answers. Deleting an organization schedules the same cleanup for every video in it, including those in its own storages, whose connection is kept (credentials still encrypted) until the files are gone.

Activity is recorded in the same transaction as the change it describes: who did it (a member, a library API key, someone not signed in, or OpenStream itself), with the client address from `X-Forwarded-For` and the user agent; what happened; which resource it affected; the changed fields before and after; and context such as the library. Secrets are never recorded.

- **Organization activity** covers the organization's settings, its scheduled, canceled and completed deletion, invitations, members leaving or being removed, ownership transfers, storages, libraries, API keys, webhooks and videos, whether changed from the dashboard or with an API key. The owner reads it under **Activity** in the sidebar, searched and filtered on the server; it stays readable while the organization is pending deletion.
- **Account activity** covers sign-ups, email verification, sign-ins, failed sign-ins (with the reason), sign-outs and password resets. Each member reads their own from the account menu → **Account activity**; it never appears in organization logs. A failed sign-in for an email without an account is recorded for no one to see in the app.
- **Deleted organizations** keep their activity: entries have no foreign key to the organization, and the deletion itself, by the owner's link or by the worker once the grace period ends, also shows in the owner's account activity.

In production, give the bucket a lifecycle rule that aborts incomplete multipart uploads (the local bucket gets one), so abandoned uploads do not keep their parts.

### Logs

The API and the worker log through one logger (`apps/api/src/common/logging`). In development lines are colored and aligned: time, level, the module that wrote them (`http`, `video-processing`, `webhooks`, `outbox`, …), the message and `key=value` fields, with an error's stack below its line. In production (`NODE_ENV=production`) each record is one JSON object, ready for a log collector. Set `LOG_LEVEL=debug` for more detail, or `LOG_FORMAT` to choose the format.

- **API:** one line per request with its method, path, status and duration; the query string is never logged, as it can carry tokens. Client errors are warnings and server errors are errors, with their stack.
- **Worker:** every queue job as it starts and, when it fails, whether it will be retried (`attempt=2/3`). Processing a video logs each step with its timing: downloading the source, probing it, transcoding (with progress every 10%), creating the poster and storyboard, uploading the files and finishing. Webhook deliveries, storage cleanups and organization sweeps log their outcome too.

Tests run with `LOG_LEVEL=silent`; specs that check logs pass a log sink to `createTestApp`.

### Tests

The API has end-to-end tests that run the real app in-process against a dedicated `open_stream_test` database (created and migrated automatically; it only needs the Postgres container). The worker specs also run the background worker against Redis, in database 15 by default (`TEST_REDIS_URL`), which they empty before each test:

```bash
bun run test                              # every package
bun run --cwd apps/api test:e2e           # only the API e2e specs
bun run test:coverage                     # e2e specs with the coverage check
```

**Every feature needs at least 80% line coverage from e2e specs**; `test:coverage` fails otherwise, naming the features below it. A feature is a top-level folder of `apps/api/src/`, and files no spec loads count as untested. The full rule is in [AGENTS.md](AGENTS.md).

Specs live next to the code in `__tests__/` folders (`*.e2e.spec.ts`, with `it.each` data in `*.scenarios.ts`). Shared helpers are in `apps/api/test/helpers` (including a local SMTP server and webhook receiver) and data factories in `apps/api/test/factory`.

### API client

The API documents itself with OpenAPI (served at https://app.openstream.localhost/api/v1/openapi.json). The web app's client in `apps/web/src/api/generated-api.ts` is generated from the exported schema, so after changing an API route or its schemas run:

```bash
bun run generate:api
```

It exports `apps/api/src/openapi/api-schema.json` (reads the root `.env`) and regenerates the client. Never edit either file by hand.
