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
TEST_PORT=3002
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
    
    # Kill any remaining next dev processes on test port
    pkill -f "next dev.*--port $TEST_PORT" 2>/dev/null || true
    pkill -f "next start.*--port $TEST_PORT" 2>/dev/null || true
    
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

# Kill any existing processes that might conflict
kill_existing() {
    log_info "Checking for existing processes..."
    
    # Kill any next dev on test port
    pkill -f "next dev.*--port $TEST_PORT" 2>/dev/null || true
    
    # Remove lock file
    rm -rf .next/dev/lock 2>/dev/null || true
    
    # Small delay to ensure processes are terminated
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
    if [ "$SERVER_MODE" = "prod" ]; then
        log_info "Building app (prod mode)..."
        npx dotenv -e .env.test -o -- npm run build
        log_success "Build complete"

        log_info "Starting production server on port $TEST_PORT..."
        npx dotenv -e .env.test -o -- npm run start -- --port $TEST_PORT &
        DEV_PID=$!
    else
        log_info "Starting dev server on port $TEST_PORT..."
    
        # Start the dev server in background
        npx dotenv -e .env.test -o -- npm run dev -- --port $TEST_PORT &
        DEV_PID=$!
    fi
    
    # Wait for server to be ready
    log_info "Waiting for dev server to be ready..."
    local retries=0
    while [ $retries -lt 30 ]; do
        if curl -s "http://localhost:$TEST_PORT/api/auth/session" >/dev/null 2>&1; then
            log_success "Dev server is ready on port $TEST_PORT!"
            return 0
        fi
        retries=$((retries + 1))
        echo -n "."
        sleep 2
    done
    
    echo ""
    log_error "Dev server failed to start"
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
    
    # Run Playwright with test environment
    # Server is already running, so tell Playwright not to start its own
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
