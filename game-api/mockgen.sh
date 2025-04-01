#!/bin/bash

# 設置顏色
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}開始生成 mock 檔案...${NC}"

# 確保 mockgen 已安裝
echo -e "${BLUE}檢查 mockgen 是否已安裝...${NC}"
command -v mockgen >/dev/null 2>&1 || { 
    echo -e "${RED}錯誤: mockgen 未安裝, 正在安裝...${NC}"; 
    go get github.com/golang/mock/mockgen
    go install github.com/golang/mock/mockgen
}

# 創建 mocks 目錄
mkdir -p internal/mocks

# 為各種服務接口生成 mock
INTERFACES=(
    "admin_log_service"
    "admin_service"
    "app_service"
    "auth_service"
    "dashboard_service"
    "game_engine"
    "game_service"
    "transaction_service"
    "user_service"
)

for interface in "${INTERFACES[@]}"; do
    echo -e "${BLUE}生成 ${interface} mock...${NC}"
    if [ -f "internal/interfaces/${interface}.go" ]; then
        mockgen -source="internal/interfaces/${interface}.go" -destination="internal/mocks/mock_${interface}.go" -package=mocks
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}成功生成 ${interface} mock${NC}"
        else
            echo -e "${RED}無法生成 ${interface} mock${NC}"
        fi
    else
        echo -e "${RED}找不到文件 internal/interfaces/${interface}.go${NC}"
    fi
done

echo -e "${GREEN}所有 mock 檔案已生成！${NC}"
ls -la internal/mocks 