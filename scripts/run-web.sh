#!/usr/bin/env bash
# 啟動 Web 前端

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "✓ 啟動 Web 前端..."
cd "$ROOT_DIR"
npm run dev --prefix apps/web
