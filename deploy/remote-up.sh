#!/usr/bin/env bash
# Runs ON THE TARGET HOST, from the deployment directory that already
# holds docker-compose.yml and the .env written by the Deploy workflow.
# Kept as a file rather than an inline ssh string so it can be read,
# reviewed and run by hand:  bash remote-up.sh
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "No .env beside this script -- copy deploy/.env.example and fill it in." >&2
  exit 1
fi

# GHCR_TOKEN is exported by the caller only when the packages are private.
if [ -n "${GHCR_TOKEN:-}" ]; then
  printf '%s' "$GHCR_TOKEN" | docker login ghcr.io -u "${GHCR_USER:?GHCR_USER required}" --password-stdin
fi

set -a
. ./.env
set +a

# The managed root must exist before the api container mounts it.
mkdir -p "${FS_HOST_ROOT:-./data}"

docker compose pull
docker compose up -d --remove-orphans
docker image prune -f
docker compose ps
