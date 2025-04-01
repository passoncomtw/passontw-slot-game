#!/bin/sh
set -e

# 定義變數
HEALTH_ENDPOINT="http://localhost:8080/health"
TIMEOUT=5
STATUS_CODE=0

# 檢查健康狀態端點
echo "正在檢查 API 健康狀態..."
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time ${TIMEOUT} ${HEALTH_ENDPOINT})

# 驗證狀態碼
if [ $STATUS_CODE -eq 200 ]; then
    echo "健康檢查成功: HTTP $STATUS_CODE"
    exit 0
else
    echo "健康檢查失敗: HTTP $STATUS_CODE"
    exit 1
fi 