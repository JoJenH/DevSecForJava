FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY frontend/ ./

RUN if [ -d "dist" ] && [ "$(ls -A dist 2>/dev/null)" ]; then \
        echo "Using existing frontend dist, skipping build"; \
    else \
        echo "Building frontend..."; \
        npm install && npm run build; \
    fi

FROM golang:1.24-alpine AS go-builder

WORKDIR /build

ENV GOPROXY=https://goproxy.cn,direct

COPY server/ ./
COPY config/docker-config.yaml ./config/config.yaml
COPY data ./data/
COPY --from=frontend-builder /app/dist ./dist

RUN if [ -f "devsec-server" ] && [ -s "devsec-server" ]; then \
        echo "Using existing devsec-server binary, skipping build"; \
    else \
        echo "Building devsec-server..."; \
        go mod download && \
        CGO_ENABLED=0 GOOS=linux go build -o devsec-server .; \
    fi

FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata && \
    addgroup -g 1000 appgroup && \
    adduser -u 1000 -G appgroup -s /bin/sh -D appuser

WORKDIR /app

COPY --from=go-builder /build/devsec-server ./server
COPY --from=go-builder /build/dist ./dist
COPY --from=go-builder /build/data ./data
COPY --from=go-builder /build/config ./config

RUN chown -R appuser:appgroup /app

USER appuser

ENV PORT=8080
ENV DATA_PATH=/app/data
ENV DIST_PATH=/app/dist

EXPOSE 8080

CMD ["./server"]
