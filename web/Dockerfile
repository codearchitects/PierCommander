# PierCommanderWeb -- the browser client, built once and served by nginx.
#
# The bundle is static, so the API base URL is baked in at BUILD time:
# pass VITE_FS_API_URL to point the client at an API on another origin,
# or leave it empty and let nginx proxy /fs to the api service (the
# default in deploy/docker-compose.yml).
FROM node:26-alpine AS builder

WORKDIR /build
ENV CI=true

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG VITE_FS_API_URL=""
ENV VITE_FS_API_URL=$VITE_FS_API_URL
RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /build/dist /usr/share/nginx/html

LABEL org.opencontainers.image.title="PierCommander Web" \
      org.opencontainers.image.description="Two-panel browser file manager" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.source="https://github.com/codearchitects/PierCommander"

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --spider -q http://127.0.0.1/ || exit 1
