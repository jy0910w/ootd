#!/usr/bin/env bash
# E2E API validation script for OOTD Platform
# Usage: ./scripts/e2e-api-test.sh [BASE_URL]
# Default BASE_URL: http://localhost:5282/api/v1

set -euo pipefail

BASE="${1:-http://localhost:5282/api/v1}"
PASS=0
FAIL=0
ERRORS=()

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓${NC} $1"; PASS=$((PASS+1)); }
fail() { echo -e "  ${RED}✗${NC} $1"; FAIL=$((FAIL+1)); ERRORS+=("$1"); }
info() { echo -e "${YELLOW}▶${NC} $1"; }

assert_status() {
  local label="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then ok "$label (HTTP $actual)";
  else fail "$label (expected $expected, got $actual)"; fi
}

# curl helper: sets BODY and STATUS
do_curl() {
  local tmp
  tmp=$(mktemp)
  STATUS=$(curl -s -o "$tmp" -w "%{http_code}" "$@")
  BODY=$(cat "$tmp")
  rm -f "$tmp"
}

extract() {
  echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('$1',''))" 2>/dev/null || echo ""
}

SUFFIX=$(date +%s)
USER_EMAIL="e2e_${SUFFIX}@test.com"
USER_PASS="Test1234!"

echo ""
echo "=== OOTD Platform E2E API Test ==="
echo "Base URL: $BASE"
echo "Test user: $USER_EMAIL"
echo ""

# ─── 1. Health ────────────────────────────────────────────────────────────────
info "1. Health checks"
do_curl "$BASE/health/live"
assert_status "GET /health/live" "200" "$STATUS"
do_curl "$BASE/health/ready"
assert_status "GET /health/ready" "200" "$STATUS"

# ─── 2. Auth ──────────────────────────────────────────────────────────────────
info "2. Auth"

do_curl -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"password\":\"$USER_PASS\",\"displayName\":\"E2E User\"}"
assert_status "POST /auth/register" "201" "$STATUS"
TOKEN=$(extract "accessToken")

do_curl -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"password\":\"$USER_PASS\"}"
assert_status "POST /auth/login" "200" "$STATUS"
TOKEN=$(extract "accessToken")

if [ -z "$TOKEN" ]; then
  fail "Could not extract accessToken — aborting"
  echo "Response: $BODY"
  exit 1
fi
ok "Got access token"

AUTH="Authorization: Bearer $TOKEN"

do_curl -H "$AUTH" "$BASE/me"
assert_status "GET /me" "200" "$STATUS"

# ─── 3. Items ─────────────────────────────────────────────────────────────────
info "3. Wardrobe items"

do_curl -X POST "$BASE/items" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"name":"白色T-shirt","category":"top","color":"white","tags":["casual"]}'
assert_status "POST /items" "201" "$STATUS"
ITEM_ID=$(extract "id")
[ -n "$ITEM_ID" ] && ok "Created item: $ITEM_ID" || fail "Could not extract item id"

do_curl -X POST "$BASE/items" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"name":"黑色牛仔褲","category":"bottom","color":"black","tags":["casual"]}'
assert_status "POST /items (2nd)" "201" "$STATUS"
ITEM_ID2=$(extract "id")

do_curl -H "$AUTH" "$BASE/items"
assert_status "GET /items" "200" "$STATUS"

if [ -n "$ITEM_ID" ]; then
  do_curl -H "$AUTH" "$BASE/items/$ITEM_ID"
  assert_status "GET /items/:id" "200" "$STATUS"
fi

# ─── 4. Outfits ───────────────────────────────────────────────────────────────
info "4. Outfits"

ITEM_IDS="[]"
if [ -n "$ITEM_ID" ] && [ -n "$ITEM_ID2" ]; then
  ITEM_IDS="[\"$ITEM_ID\",\"$ITEM_ID2\"]"
fi

do_curl -X POST "$BASE/outfits" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d "{\"title\":\"E2E 測試穿搭\",\"description\":\"自動測試\",\"itemIds\":$ITEM_IDS,\"occasion\":\"casual\",\"season\":\"spring\"}"
assert_status "POST /outfits" "201" "$STATUS"
OUTFIT_ID=$(extract "id")
[ -n "$OUTFIT_ID" ] && ok "Created outfit: $OUTFIT_ID" || fail "Could not extract outfit id"

do_curl -H "$AUTH" "$BASE/outfits/mine"
assert_status "GET /outfits/mine" "200" "$STATUS"

if [ -n "$OUTFIT_ID" ]; then
  do_curl -H "$AUTH" "$BASE/outfits/$OUTFIT_ID"
  assert_status "GET /outfits/:id" "200" "$STATUS"
fi

# ─── 5. Recommendations ───────────────────────────────────────────────────────
info "5. Recommendations"

do_curl -X POST "$BASE/recommendations/query" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d "{\"itemIds\":$ITEM_IDS,\"occasion\":\"casual\",\"season\":\"spring\",\"weather\":\"sunny\",\"styleHints\":[]}"
assert_status "POST /recommendations/query" "200" "$STATUS"
REC_ID=$(extract "recommendationId")
[ -n "$REC_ID" ] && ok "Got recommendation: $REC_ID" || fail "Could not extract recommendationId"

if [ -n "$REC_ID" ]; then
  do_curl -H "$AUTH" "$BASE/recommendations/$REC_ID"
  assert_status "GET /recommendations/:id" "200" "$STATUS"
fi

# ─── 6. Feedback ──────────────────────────────────────────────────────────────
info "6. Feedback"

if [ -n "$REC_ID" ]; then
  do_curl -X POST "$BASE/feedback" \
    -H "Content-Type: application/json" -H "$AUTH" \
    -d "{\"recommendationId\":\"$REC_ID\",\"helpful\":true,\"reason\":\"E2E test\"}"
  assert_status "POST /feedback" "201" "$STATUS"
fi

# ─── 7. Admin ─────────────────────────────────────────────────────────────────
info "7. Admin (admin@example.com / Admin123!)"

do_curl -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}'
assert_status "POST /auth/login (admin)" "200" "$STATUS"
ADMIN_TOKEN=$(extract "accessToken")

if [ -n "$ADMIN_TOKEN" ]; then
  ADMIN_AUTH="Authorization: Bearer $ADMIN_TOKEN"
  ok "Got admin token"

  do_curl -H "$ADMIN_AUTH" "$BASE/admin/moderation/outfits?status=pending"
  assert_status "GET /admin/moderation/outfits" "200" "$STATUS"

  do_curl -H "$ADMIN_AUTH" "$BASE/admin/users"
  assert_status "GET /admin/users" "200" "$STATUS"

  if [ -n "$OUTFIT_ID" ]; then
    do_curl -X POST -H "Content-Type: application/json" -H "$ADMIN_AUTH" \
      "$BASE/admin/moderation/outfits/$OUTFIT_ID/approve" -d '{}'
    assert_status "POST /admin/moderation/outfits/:id/approve" "200" "$STATUS"
  fi
else
  fail "Admin login failed — seed account may not exist if DB is non-empty"
fi

# ─── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "=== Results ==="
echo -e "  ${GREEN}Passed: $PASS${NC}"
if [ $FAIL -gt 0 ]; then
  echo -e "  ${RED}Failed: $FAIL${NC}"
  for e in "${ERRORS[@]}"; do echo -e "    ${RED}✗${NC} $e"; done
  echo ""
  exit 1
else
  echo -e "  ${GREEN}All tests passed!${NC}"
  echo ""
fi
