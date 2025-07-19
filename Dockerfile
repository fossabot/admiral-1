FROM alpine:3.22.1@sha256:4bcff63911fcb4448bd4fdacec207030997caf25e9bea4045fa6c8c44de311d1

ARG USER=admiral
ARG UID=1000
ARG GID=1000
ARG ADMIRAL_PORT=8080

ENV ADMIRAL_PORT=${ADMIRAL_PORT}

EXPOSE ${ADMIRAL_PORT}

HEALTHCHECK --interval=1m --timeout=3s --retries=3 \
  CMD curl -f http://localhost:${ADMIRAL_PORT}/healthcheck || exit 1

# Create non-root user and group
RUN addgroup -S -g "$GID" "$USER" && \
    adduser -S -u "$UID" -G "$USER" "$USER"

# Minimal upgrade & install only what's necessary
RUN apk add --no-cache \
      ca-certificates~=20241121-r1 \
      curl~=8 \
    && apk upgrade --no-cache \
    && update-ca-certificates \
    && rm -rf /var/cache/apk/*

# Set working dir and switch to non-root user
WORKDIR /app
USER "$USER"

# Copy application files with ownership
COPY --chown=${USER}:${USER} admiral-server config.yaml /app/

# Set entrypoint and default command
ENTRYPOINT ["/app/admiral-server"]
CMD ["start", "--config", "config.yaml"]
