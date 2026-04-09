#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "===== DevSec 本地开发启动脚本 ====="
echo ""

build_frontend() {
    echo "📦 Building frontend..."
    echo ""
    cd "$PROJECT_DIR/frontend"
    # npm install
    npm run build
    echo ""
}

build_java-vul() {
    echo "📦 Building Java services..."
    echo ""
    cd "$PROJECT_DIR/java/java-vul-fixed"
    mvn package -DskipTests -q
    echo ""
}

build_java-fixed() {
    echo "📦 Building Java fixed service..."
    echo ""
    cd "$PROJECT_DIR/java/java-vul-fixed"
    mvn package -DskipTests -q
    echo ""
}

build_go() {
    echo "📦 Building Go server..."
    echo ""
}

build_all() {
    build_frontend
    build_java-vul
    build_java-fixed
    build_go
}

start_all() {
    echo "🚀 Starting all services..."
    echo ""

    echo "Starting Java vul-verify (8081)..."
    cd "$PROJECT_DIR/java/java-vul-verify"
    mvn spring-boot:run > /tmp/java-verify.log 2>&1 &
    JAVA_VERIFY_PID=$!
    echo "   PID: $JAVA_VERIFY_PID"

    echo "Waiting for Java verify service..."
    for i in {1..30}; do
        if curl -s http://localhost:8081/vul/health > /dev/null 2>&1; then
            echo "   ✅ Ready"
            break
        fi
        sleep 1
    done

    echo ""
    echo "Starting Java vul-fixed (8082)..."
    cd "$PROJECT_DIR/java/java-vul-fixed"
    mvn spring-boot:run > /tmp/java-fixed.log 2>&1 &
    JAVA_FIXED_PID=$!
    echo "   PID: $JAVA_FIXED_PID"

    echo "Waiting for Java fixed service..."
    for i in {1..30}; do
        if curl -s http://localhost:8082/vul/health > /dev/null 2>&1; then
            echo "   ✅ Ready"
            break
        fi
        sleep 1
    done

    echo ""
    echo "Starting Go server (8080)..."
    cd "$PROJECT_DIR/server"
    export PORT=8080
    export JAVA_SERVICE_ADDR=http://localhost:8081
    export JAVA_FIXED_SERVICE_ADDR=http://localhost:8082
    export DATA_PATH="$PROJECT_DIR/data"
    export DIST_PATH="$PROJECT_DIR/frontend/dist"
    export EDIT_TOKEN=dev
    ./devsec-server > /tmp/go-server.log 2>&1 &
    GO_PID=$!
    echo "   PID: $GO_PID"

    echo ""
    echo "Waiting for Go server..."
    for i in {1..30}; do
        if curl -s http://localhost:8080/api/auth/check > /dev/null 2>&1; then
            echo "   ✅ Ready"
            break
        fi
        sleep 1
    done

    echo ""
    echo "======================================"
    echo "🎉 All services started!"
    echo ""
    echo "服务地址:"
    echo "  - 前端:     http://localhost:8080"
    echo "  - Go API:   http://localhost:8080/api"
    echo "  - Java verify:  http://localhost:8081/vul"
    echo "  - Java fixed:  http://localhost:8082/vul"
    echo ""
    echo "日志位置:"
    echo "  - Java verify: /tmp/java-verify.log"
    echo "  - Java fixed:  /tmp/java-fixed.log"
    echo "  - Go server:  /tmp/go-server.log"
    echo ""
    echo "停止所有服务:"
    echo "  $0 stop"
    echo "======================================"

    echo "$JAVA_VERIFY_PID" > /tmp/devsec-java-verify.pid
    echo "$JAVA_FIXED_PID" > /tmp/devsec-java-fixed.pid
    echo "$GO_PID" > /tmp/devsec-go-server.pid
}

stop_all() {
    echo "🛑 Stopping all services..."
    if [ -f /tmp/devsec-java-verify.pid ]; then
        kill $(cat /tmp/devsec-java-verify.pid) 2>/dev/null || true
        rm /tmp/devsec-java-verify.pid
    fi
    if [ -f /tmp/devsec-java-fixed.pid ]; then
        kill $(cat /tmp/devsec-java-fixed.pid) 2>/dev/null || true
        rm /tmp/devsec-java-fixed.pid
    fi
    if [ -f /tmp/devsec-go-server.pid ]; then
        kill $(cat /tmp/devsec-go-server.pid) 2>/dev/null || true
        rm /tmp/devsec-go-server.pid
    fi
    echo "✅ All services stopped"
}

status_all() {
    echo "📊 Service Status:"
    echo ""
    echo -n "Java verify (8081):  "
    if curl -s http://localhost:8081/vul/health > /dev/null 2>&1; then
        echo "✅ Running"
    else
        echo "❌ Stopped"
    fi

    echo -n "Java fixed (8082):  "
    if curl -s http://localhost:8082/vul/health > /dev/null 2>&1; then
        echo "✅ Running"
    else
        echo "❌ Stopped"
    fi

    echo -n "Go server (8080):   "
    if curl -s http://localhost:8080/api/auth/check > /dev/null 2>&1; then
        echo "✅ Running"
    else
        echo "❌ Stopped"
    fi
}

case "${1:-start}" in
    start)
        start_all
        ;;
    stop)
        stop_all
        ;;
    restart)
        stop_all
        sleep 2
        start_all
        ;;
    frontend)
        build_frontend
        ;;
    java-vul)
        build_java-vul
        ;;
    java-fixed)
        build_java-fixed
        ;;
    go)
        build_go
        ;;
    build)
        build_all
        ;;
    status)
        status_all
        ;;
    logs)
        shift
        case "${1:-all}" in
            verify) tail -f /tmp/java-verify.log ;;
            fixed) tail -f /tmp/java-fixed.log ;;
            server) tail -f /tmp/go-server.log ;;
            all) tail -f /tmp/java-verify.log /tmp/java-fixed.log /tmp/go-server.log ;;
            *) echo "Usage: $0 logs {verify|fixed|server|all}" ;;
        esac
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|build|status|logs}"
        echo ""
        echo "Commands:"
        echo "  start   - Start all services"
        echo "  stop    - Stop all services"
        echo "  restart - Restart all services"
        echo "  build   - Build all services"
        echo "  status  - Check service status"
        echo "  logs    - View logs (verify|fixed|server|all)"
        exit 1
        ;;
esac
