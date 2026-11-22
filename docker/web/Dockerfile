FROM oven/bun:1.3.11 AS base
ENV TURBO_TELEMETRY_DISABLED=1
WORKDIR /app

FROM base AS pruner
COPY . .
RUN bunx turbo@2.11.10 prune web --docker

FROM base AS builder
COPY --from=pruner /app/out/json/ .
RUN bun install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
COPY tsconfig.json .

ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}

RUN bun run --filter=@workspace/shared build
RUN bun run --cwd apps/web build
RUN bun build apps/web/dist/server/server.js \
    --target=bun --splitting --sourcemap=linked \
    --minify-whitespace --minify-identifiers \
    --define=process.env.NODE_ENV='"production"' \
    --outdir=/app/out/server

FROM oven/bun:1.3.11-distroless AS web
ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app
COPY --from=builder /app/out/server ./server
USER 65532:65532
EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/bun"]
CMD ["server/server.js"]

FROM nginx:1.29-alpine AS nginx
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/apps/web/dist/client /usr/share/nginx/html
