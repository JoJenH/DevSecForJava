#!/bin/bash
# DevSec 本地开发脚本
set -eo pipefail

# ─────────────────────────────────────────────
# 配置
# ─────────────────────────────────────────────
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="/tmp/devsec/logs"
PID_DIR="/tmp/devsec"
mkdir -p "$LOG_DIR" "$PID_DIR"

HEALTH_TIMEOUT=60
HEALTH_INTERVAL=2

# 服务配置: name|port|dir|binary|health_endpoint
SERVICE_VUL="java-vul|8081|$PROJECT_DIR/java/java-vul|target/vulnerability-*.jar|/vul/health"
SERVICE_FIXED="java-fixed|8082|$PROJECT_DIR/java/java-fixed|target/vul-fixed-*.jar|/fixed/health"
SERVICE_SERVER="go-server|8080|$PROJECT_DIR/server|devsec-server|/api/auth/check"

# ─────────────────────────────────────────────
# 工具函数
# ─────────────────────────────────────────────
log() { echo "  $*"; }
ok()  { echo "  ✅ $*"; }
warn() { echo "  ⚠️  $*"; }
err() { echo "  ❌ $*" >&2; }

wait_health() {
    local url="$1" name="$2" elapsed=0
    log "Waiting for $name..."
    while ! curl -sf "$url" >/dev/null 2>&1; do
        if (( elapsed >= HEALTH_TIMEOUT )); then
            err "$name timeout"
            return 1
        fi
        sleep "$HEALTH_INTERVAL"
        (( elapsed += HEALTH_INTERVAL ))
    done
    ok "$name ready (${elapsed}s)"
}

port_used() { lsof -ti tcp:"$1" >/dev/null 2>&1; }

kill_port() {
    local pids
    pids=$(lsof -ti tcp:"$1" 2>/dev/null) || return 0
    [[ -n "$pids" ]] && echo "$pids" | xargs kill 2>/dev/null
}

# ─────────────────────────────────────────────
# 服务解析
# ─────────────────────────────────────────────
parse_service() {
    local key="$1"
    case "$key" in
        vul)    SERVICE="$SERVICE_VUL" ;;
        fixed)  SERVICE="$SERVICE_FIXED" ;;
        server) SERVICE="$SERVICE_SERVER" ;;
        *)      err "Unknown service: $key"; err "Available: vul, fixed, server"; exit 1 ;;
    esac
    IFS='|' read -r NAME PORT DIR BINARY HEALTH <<< "$SERVICE"
    PID_FILE="$PID_DIR/devsec-$key.pid"
    LOG_FILE="$LOG_DIR/$key.log"
}

resolve_binary() {
    if [[ "$BINARY" == target/*.jar ]]; then
        BINARY=$(ls "$DIR"/$BINARY 2>/dev/null | head -1)
        [[ -f "$BINARY" ]] || { err "Jar not found. Run: $0 build $1"; exit 1; }
    else
        BINARY="$DIR/$BINARY"
        [[ -x "$BINARY" ]] || { err "Binary not found. Run: $0 build $1"; exit 1; }
    fi
}

# ─────────────────────────────────────────────
# 构建命令
# ─────────────────────────────────────────────
build_frontend() {
    log "📦 Building frontend..."
    cd "$PROJECT_DIR/frontend"
    npm install --prefer-offline >/dev/null 2>&1
    npm run build >/dev/null 2>&1
    ok "Frontend built"
}

build_service() {
    local key="$1"
    parse_service "$key"
    log "📦 Building $NAME..."
    cd "$DIR"
    case "$key" in
        vul|fixed) mvn package -DskipTests -q ;;
        server) go build -o devsec-server . ;;
    esac
    ok "$NAME built"
}

build_all() {
    build_frontend
    build_service vul
    build_service fixed
    build_service server
}

# ─────────────────────────────────────────────
# 启动命令
# ─────────────────────────────────────────────
start_service() {
    local key="$1"
    parse_service "$key"
    resolve_binary "$key"

    echo "🚀 Starting $NAME (:$PORT)..."
    port_used "$PORT" && { warn "Port $PORT in use, skipping"; return 0; }

    cd "$DIR"
    case "$key" in
        vul|fixed)
            nohup java -jar "$BINARY" >"$LOG_FILE" 2>&1 &
            ;;
        server)
            PORT=":$PORT" LOCAL_MODE=true \
            JAVA_SERVICE_ADDR="http://localhost:8081" \
            JAVA_FIXED_SERVICE_ADDR="http://localhost:8082" \
            DATA_PATH="$PROJECT_DIR/data" \
            DIST_PATH="$PROJECT_DIR/frontend/dist" \
            EDIT_TOKEN=dev \
            nohup ./devsec-server >"$LOG_FILE" 2>&1 &
            ;;
    esac
    echo $! > "$PID_FILE"
    log "PID: $(cat $PID_FILE)"
    wait_health "http://localhost:$PORT$HEALTH" "$NAME"
}

start_all() {
    echo ""
    echo "===== DevSec ====="
    start_service vul || exit 1
    start_service fixed || exit 1
    start_service server || exit 1
    echo ""
    echo "🎉 All services running at http://localhost:8080"
    echo "Logs: $LOG_DIR"
    echo ""
}

# ─────────────────────────────────────────────
# 停止命令
# ─────────────────────────────────────────────
stop_service() {
    local key="$1"
    parse_service "$key"
    echo "🛑 Stopping $NAME..."
    [[ -f "$PID_FILE" ]] && { kill "$(cat "$PID_FILE")" 2>/dev/null || true; rm -f "$PID_FILE"; }
    kill_port "$PORT"
    ok "$NAME stopped"
}

stop_all() {
    echo "🛑 Stopping all services..."
    for key in vul fixed server; do
        parse_service "$key"
        [[ -f "$PID_FILE" ]] && { kill "$(cat "$PID_FILE")" 2>/dev/null || true; rm -f "$PID_FILE"; }
        kill_port "$PORT"
    done
    ok "All services stopped"
}

# ─────────────────────────────────────────────
# 状态命令
# ─────────────────────────────────────────────
status_all() {
    echo ""
    echo "📊 Service Status"
    echo "─────────────────────────────────"
    for key in vul fixed server; do
        parse_service "$key"
        printf "  %-18s" "$NAME (:$PORT)"
        if curl -sf "http://localhost:$PORT$HEALTH" >/dev/null 2>&1; then
            local pid=""
            [[ -f "$PID_FILE" ]] && pid=" (PID $(cat "$PID_FILE"))"
            echo "✅ Running$pid"
        else
            echo "❌ Stopped"
        fi
    done
    echo "─────────────────────────────────"
    echo ""
}

# ─────────────────────────────────────────────
# 日志命令
# ─────────────────────────────────────────────
show_logs() {
    local key="${1:-all}"
    case "$key" in
        all) tail -f "$LOG_DIR"/*.log ;;
        vul|fixed|server)
            parse_service "$key"
            tail -f "$LOG_FILE"
            ;;
        *) err "Usage: $0 logs [vul|fixed|server|all]"; exit 1 ;;
    esac
}

# ─────────────────────────────────────────────
# 入口
# ─────────────────────────────────────────────
usage() {
    cat <<EOF
Usage: $0 <command> [service]

Commands:
  start [service]   启动服务 (默认全部)
  stop [service]    停止服务 (默认全部)
  restart [service] 重启服务 (默认全部)
  status            查看状态
  build [service]   构建 (默认全部，service: vul/fixed/server/frontend)
  logs [service]    查看日志 (默认全部)

Services: vul, fixed, server
EOF
}

cmd="${1:-start}"
arg="${2:-}"

case "$cmd" in
    start)   [[ -n "$arg" ]] && start_service "$arg" || start_all ;;
    stop)    [[ -n "$arg" ]] && stop_service "$arg" || stop_all ;;
    restart) [[ -n "$arg" ]] && { stop_service "$arg"; sleep 1; start_service "$arg"; } || { stop_all; sleep 1; start_all; } ;;
    status)  status_all ;;
    build)
        case "$arg" in
            "") build_all ;;
            frontend) build_frontend ;;
            vul|fixed|server) build_service "$arg" ;;
            *) err "Unknown target: $arg"; exit 1 ;;
        esac
        ;;
    logs) show_logs "$arg" ;;
    -h|--help|help) usage ;;
    *) err "Unknown command: $cmd"; usage; exit 1 ;;
esac
