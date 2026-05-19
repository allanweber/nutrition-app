#!/bin/bash

# E2E Test Runner Script
# This script manages an isolated Docker database for E2E tests
#
# Usage: ./scripts/run-e2e.sh [playwright-args]
# Example: ./scripts/run-e2e.sh --headed
# Example: ./scripts/run-e2e.sh --ui

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.test.yml"
CONTAINER_NAME="nutrition_db_test"
ENV_FILE=".env.test"
TEST_PORT=3014
MAX_RETRIES=30
RETRY_INTERVAL=2

# Flags (default: safest, cleanest run)
REUSE_DB=false
SKIP_MIGRATIONS=false
SKIP_SEED=false
SERVER_MODE="dev" # dev | prod
PLAYWRIGHT_ARGS=()

# Store the script's directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Track dev server PID
DEV_PID=""

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse script args (non-Playwright flags) while passing the rest through.
#
# Usage:
#   ./scripts/run-e2e.sh --prod --reuse-db --skip-seed -- -g "Meal planner"
#
# Notes:
# - `--` ends script flag parsing; everything after is passed to Playwright.
parse_args() {
    local parsing_flags=true
    while [ $# -gt 0 ]; do
        if [ "$parsing_flags" = true ] && [ "$1" = "--" ]; then
            parsing_flags=false
            shift
            continue
        fi

        if [ "$parsing_flags" = true ]; then
            case "$1" in
                --reuse-db)
                    REUSE_DB=true
                    shift
                    continue
                    ;;
                --skip-migrations)
                    SKIP_MIGRATIONS=true
                    shift
                    continue
                    ;;
                --skip-seed)
                    SKIP_SEED=true
                    shift
                    continue
                    ;;
                --prod)
                    SERVER_MODE="prod"
                    shift
                    continue
                    ;;
                *)
                    # fallthrough to playwright args
                    ;;
            esac
        fi

        PLAYWRIGHT_ARGS+=("$1")
        shift
    done
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    
    # Stop dev server if running
    if [ -n "$DEV_PID" ]; then
        log_info "Stopping dev server (PID: $DEV_PID)..."
        kill $DEV_PID 2>/dev/null || true
        wait $DEV_PID 2>/dev/null || true
    fi
    
    kill_port "$TEST_PORT"
    
    # Remove Next.js lock file if exists
    rm -rf .next/dev/lock 2>/dev/null || true
    
    # Stop test database
    if [ "$REUSE_DB" = false ]; then
        log_info "Stopping test database..."
        docker-compose -f "$COMPOSE_FILE" down -v --remove-orphans 2>/dev/null || true
    else
        log_info "Leaving test database running (--reuse-db)"
    fi
    
    log_success "Cleanup complete"
}

# Trap to ensure cleanup on script exit
trap cleanup EXIT INT TERM

# Check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Free the test port (pkill alone is unreliable on Windows Git Bash).
kill_port() {
    local port=$1

    # Windows: PowerShell is the most reliable way to stop listeners on a port.
    if command -v powershell.exe >/dev/null 2>&1; then
        powershell.exe -NoProfile -Command "
            \$conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
            if (\$conns) {
                \$conns | ForEach-Object {
                    Stop-Process -Id \$_.OwningProcess -Force -ErrorAction SilentlyContinue
                }
            }
        " >/dev/null 2>&1 || true
    fi

    if command -v netstat >/dev/null 2>&1 && command -v taskkill >/dev/null 2>&1; then
        local line pid
        while IFS= read -r line; do
            pid=$(echo "$line" | awk '{print $NF}')
            if [ -n "$pid" ] && [ "$pid" != "0" ]; then
                taskkill //F //PID "$pid" >/dev/null 2>&1 || true
            fi
        done < <(netstat -ano 2>/dev/null | grep LISTENING | grep ":$port" || true)
    fi

    if command -v lsof >/dev/null 2>&1; then
        local pid
        for pid in $(lsof -ti ":$port" 2>/dev/null || true); do
            kill -9 "$pid" 2>/dev/null || true
        done
    fi

    pkill -f "next dev.*--port $port" 2>/dev/null || true
    pkill -f "next start.*--port $port" 2>/dev/null || true

    sleep 2
}

port_is_listening() {
    local port=$1
    if command -v powershell.exe >/dev/null 2>&1; then
        local count
        count=$(powershell.exe -NoProfile -Command "@(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue).Count" 2>/dev/null || echo "0")
        [ "${count:-0}" != "0" ]
        return $?
    fi
    netstat -ano 2>/dev/null | grep LISTENING | grep -q ":$port"
}

# Kill any existing processes that might conflict
kill_existing() {
    log_info "Checking for existing processes..."

    kill_port "$TEST_PORT"

    # Remove lock file
    rm -rf .next/dev/lock 2>/dev/null || true

    sleep 1
}

# Start the test database
start_database() {
    log_info "Starting test database container..."
    
    if [ "$REUSE_DB" = false ]; then
        # Stop any existing test container (fresh, isolated run)
        docker-compose -f "$COMPOSE_FILE" down -v --remove-orphans 2>/dev/null || true
    fi
    
    # Start fresh container
    docker-compose -f "$COMPOSE_FILE" up -d
    
    log_info "Waiting for database to be ready..."
    
    local retries=0
    while [ $retries -lt $MAX_RETRIES ]; do
        if docker exec "$CONTAINER_NAME" pg_isready -U postgres -d nutrition_app_test >/dev/null 2>&1; then
            log_success "Database is ready!"
            return 0
        fi
        retries=$((retries + 1))
        echo -n "."
        sleep $RETRY_INTERVAL
    done
    
    echo ""
    log_error "Database failed to start after $MAX_RETRIES attempts"
    exit 1
}

# Run database migrations
run_migrations() {
    if [ "$SKIP_MIGRATIONS" = true ]; then
        log_info "Skipping database migrations (--skip-migrations)"
        return 0
    fi

    log_info "Running database migrations..."
    
    # Use dotenv-cli with --override to ensure .env.test takes precedence
    npx dotenv -e .env.test -o -- npx drizzle-kit push --force
    
    log_success "Migrations complete"
}

# Start dev server
start_dev_server() {
    local dev_log=".next/e2e-dev-server.log"
    mkdir -p .next

    if [ "$SERVER_MODE" = "prod" ]; then
        log_info "Building app (prod mode)..."
        npx dotenv -e .env.test -o -- npm run build
        log_success "Build complete"

        log_info "Starting production server on port $TEST_PORT..."
        npx dotenv -e .env.test -o -- npm run start -- --port $TEST_PORT >>"$dev_log" 2>&1 &
        DEV_PID=$!
    else
        kill_port "$TEST_PORT"
        if port_is_listening "$TEST_PORT"; then
            log_error "Port $TEST_PORT is still in use after cleanup. Stop other dev servers and retry."
            exit 1
        fi

        log_info "Starting dev server on port $TEST_PORT (logs: $dev_log)..."

        # Use `next dev` directly so DEV_PID tracks the Node process (not a short-lived npm wrapper).
        npx dotenv -e .env.test -o -- npx next dev --port "$TEST_PORT" >>"$dev_log" 2>&1 &
        DEV_PID=$!
    fi

    log_info "Waiting for dev server to be ready..."
    local retries=0
    while [ $retries -lt 60 ]; do
        if ! kill -0 "$DEV_PID" 2>/dev/null; then
            echo ""
            log_error "Dev server process exited during startup (port $TEST_PORT may be in use)."
            log_error "Last lines from $dev_log:"
            tail -n 25 "$dev_log" >&2 || true
            exit 1
        fi

        if curl -sf "http://localhost:$TEST_PORT/login" >/dev/null 2>&1; then
            log_success "Dev server is ready on port $TEST_PORT!"
            return 0
        fi

        retries=$((retries + 1))
        echo -n "."
        sleep 2
    done

    echo ""
    log_error "Dev server failed to respond within $((60 * 2))s"
    log_error "Last lines from $dev_log:"
    tail -n 25 "$dev_log" >&2 || true
    exit 1
}

# Seed the database
seed_database() {
    if [ "$SKIP_SEED" = true ]; then
        log_info "Skipping seed (--skip-seed)"
        return 0
    fi

    log_info "Seeding database with test data..."
    
    # Run seed with test env
    npx dotenv -e .env.test -o -- npx tsx src/server/db/seed.ts
    
    log_success "Database seeded"
}

# Run Playwright tests
run_tests() {
    log_info "Running E2E tests..."
    log_info "Auth setup runs first (11 users) — expect 1–2 minutes before specs start."

    # Server is already running; skip Playwright webServer (avoids EADDRINUSE hang on Windows).
    PLAYWRIGHT_MANAGED_SERVER=1 \
    PLAYWRIGHT_TEST_BASE_URL="http://localhost:$TEST_PORT" \
    npx dotenv -e .env.test -o -- npx playwright test --project=chromium "$@"
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        log_success "All tests passed!"
    else
        log_error "Some tests failed"
    fi
    
    return $exit_code
}

# Main execution
main() {
    echo ""
    echo "========================================"
    echo "  Nutrition App E2E Test Runner"
    echo "========================================"
    echo ""

    parse_args "$@"
    
    check_docker
    kill_existing
    start_database
    run_migrations
    start_dev_server
    seed_database
    run_tests "${PLAYWRIGHT_ARGS[@]}"
}

main "$@"
