#!/usr/bin/env bash
# 啟動 API 並自動載入 .env 環境變數

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ .env 檔案不存在"
  echo "請執行：cp .env.example .env 並填入真實值"
  exit 1
fi

echo "✓ 載入環境變數: $ENV_FILE"
set -a
source "$ENV_FILE"
set +a

echo "✓ 啟動 API..."
cd "$ROOT_DIR"
dotnet run --project apps/api/OotdPlatform.Api.csproj --no-launch-profile -- --urls "http://localhost:5282"
