FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY ../frontend/package*.json ./
RUN npm install

COPY ../frontend/ ./
RUN npm run build

FROM golang:1.24-alpine AS go-builder

WORKDIR /build

ENV GOPROXY=https://goproxy.cn,direct

COPY ../server/go.mod ../server/go.sum ./
RUN go mod download

COPY ../server/ ./
COPY ../data ./data/

COPY --from=frontend-builder /app/dist ./dist

RUN CGO_ENABLED=0 GOOS=linux go build -o server .

FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata && \
    addgroup -g 1000 appgroup && \
    adduser -u 1000 -G appgroup -s /bin/sh -D appuser

WORKDIR /app

COPY --from=go-builder /build/server ./
COPY --from=go-builder /build/dist ./dist
COPY --from=go-builder /build/data ./data

RUN chown -R appuser:appgroup /app

USER appuser

ENV PORT=8080
ENV JAVA_SERVICE_ADDR=http://java-verify:8081
ENV JAVA_FIXED_SERVICE_ADDR=http://java-fixed:8082
ENV DATA_PATH=/app/data
ENV DIST_PATH=/app/dist

EXPOSE 8080

CMD ["./server"]
