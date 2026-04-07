#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$PROJECT_DIR/server"
BINARY="$SERVER_DIR/devsec-server"

CMD="${1:-run}"

build_frontend() {
  echo "📦 Building frontend..."
  cd "$PROJECT_DIR"
  npm run build
}

build_backend() {
  echo "📦 Building backend..."
  cd "$SERVER_DIR"
  go build -o devsec-server .
}

build() {
  build_frontend
  build_backend
  echo "✅ Build complete!"
}

run() {
  echo ""
  echo "🚀 Starting server..."
  cd "$PROJECT_DIR"
  export ADMIN_PASSWORD="123"
  exec "$BINARY"
}

case "$CMD" in
  build)
    build
    run
    ;;
  run)
    run
    ;;
  frontend)
    build_frontend
    echo "✅ Frontend build complete!"
    ;;
  backend)
    build_backend
    echo "✅ Backend build complete!"
    ;;
  *)
    echo "Usage: $0 {build|run|frontend|backend}"
    echo ""
    echo "  build    - Build frontend and backend"
    echo "  run      - Build and start the server"
    echo "  frontend - Build frontend only"
    echo "  backend  - Build backend only"
    exit 1
    ;;
esac
