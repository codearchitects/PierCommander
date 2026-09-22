# FilesystemApi -- the PierCommander backend container.
#
# Two stages so the runtime image carries the installed dependencies but
# none of the build tooling. The confined filesystem root is a VOLUME:
# the image never ships the data it manages.
FROM python:3.14-slim AS builder

WORKDIR /build
ENV PIP_DISABLE_PIP_VERSION_CHECK=1 PIP_NO_CACHE_DIR=1

COPY pyproject.toml ./
COPY src ./src
RUN python -m venv /opt/venv \
 && /opt/venv/bin/pip install --upgrade pip \
 && /opt/venv/bin/pip install .

FROM python:3.14-slim AS runtime

ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    FS_ROOT=/data

COPY --from=builder /opt/venv /opt/venv

WORKDIR /app
COPY app.py ./
COPY src ./src

# The API only ever touches FS_ROOT, and it does it as a non-root user.
RUN useradd --create-home --uid 10001 pier \
 && mkdir -p /data \
 && chown -R pier:pier /data /app
USER pier
VOLUME ["/data"]

LABEL org.opencontainers.image.title="PierCommander FilesystemApi" \
      org.opencontainers.image.description="Essential filesystem operations, confined to FS_ROOT" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.source="https://github.com/codearchitects/PierCommander"

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/fs?path=', timeout=2).status == 200 else 1)"

CMD ["uvicorn", "app:api", "--host", "0.0.0.0", "--port", "8000"]
