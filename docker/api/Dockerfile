FROM oven/bun:1.3.11 AS base
ENV TURBO_TELEMETRY_DISABLED=1
WORKDIR /app

FROM base AS pruner
COPY . .
RUN bunx turbo@2.11.10 prune api --docker

FROM base AS builder
COPY --from=pruner /app/out/json/ .
RUN bun install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
COPY tsconfig.json .
RUN bun run --filter=@workspace/shared --filter=@workspace/email-templates build
RUN cd apps/api && bun build src/index.ts src/worker.ts src/db/migrate.ts \
    --target=bun --splitting --sourcemap=linked \
    --minify-whitespace --minify-identifiers \
    --external=msgpackr-extract \
    --outdir=dist

FROM oven/bun:1.3.11-alpine AS runtime
RUN apk add --no-cache ffmpeg \
    && mkdir -p /var/tmp/openstream \
    && chown bun:bun /var/tmp/openstream
ENV NODE_ENV=production \
    PORT=3001 \
    FFMPEG_PATH=/usr/bin/ffmpeg \
    FFPROBE_PATH=/usr/bin/ffprobe \
    VIDEO_PROCESSING_TEMP_DIR=/var/tmp/openstream
WORKDIR /app
COPY --from=builder /app/apps/api/drizzle ./drizzle
COPY --from=builder /app/apps/api/dist ./dist
COPY --chmod=755 docker/api/entrypoint.sh /app/entrypoint.sh
USER bun
EXPOSE 3001
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["server"]
