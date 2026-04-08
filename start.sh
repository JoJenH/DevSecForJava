#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$PROJECT_DIR/server"
JAVA_DIR="$PROJECT_DIR/java-vul-verify"
GO_BINARY="$SERVER_DIR/devsec-server"

CMD="${1:-run}"

build_frontend() {
  echo "📦 Building frontend..."
  cd "$PROJECT_DIR"
  npm run build
}

build_backend() {
  echo "📦 Building Go backend..."
  cd "$SERVER_DIR"
  go build -o devsec-server .
}

build_java() {
  echo "📦 Building Java service..."
  cd "$JAVA_DIR"
  mvn compile -q
}

build() {
  build_frontend
  build_java
  build_backend
  echo "✅ Build complete!"
}

start_java() {
  cd "$JAVA_DIR"
  mvn spring-boot:run > /dev/null 2>&1 &
  JAVA_PID=$!
  echo "   Java service started (PID: $JAVA_PID)"

  for i in {1..30}; do
    if curl -s http://localhost:8081/vul/health > /dev/null 2>&1; then
      echo "   Java service ready"
      break
    fi
    sleep 1
  done
}

run() {
  echo ""
  echo "🚀 Starting services..."

  echo "   Starting Java service..."
  cd "$JAVA_DIR"
  mvn spring-boot:run 2>&1 &
  JAVA_PID=$!

  for i in {1..30}; do
    if curl -s http://localhost:8081/vul/health > /dev/null 2>&1; then
      echo "   Java service ready (PID: $JAVA_PID)"
      break
    fi
    if [ $i -eq 30 ]; then
      echo "   ⚠️  Java service failed to start"
      kill $JAVA_PID 2>/dev/null || true
    fi
    sleep 1
  done

  echo "   Starting Go server..."
  cd "$PROJECT_DIR"
  export EDIT_TOKEN="123"
  exec "$GO_BINARY"
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
    echo "✅ Go backend build complete!"
    ;;
  java)
    build_java
    echo "✅ Java service build complete!"
    ;;
  *)
    echo "Usage: $0 {build|run|frontend|backend|java}"
    echo ""
    echo "  build    - Build frontend, Java and Go backend"
    echo "  run      - Build and start all services"
    echo "  frontend - Build frontend only"
    echo "  backend  - Build Go backend only"
    echo "  java     - Build Java service only"
    exit 1
    ;;
esac
