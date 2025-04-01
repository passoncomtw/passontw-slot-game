#!/bin/bash

# 設置顏色
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 獲取指定的處理程序名稱
HANDLER=$1

# 創建一個臨時目錄來保存覆蓋率文件
mkdir -p tmp/coverage

# 移除舊的覆蓋率文件
rm -f tmp/coverage/*.out

# 清理舊的測試結果
rm -f tmp/coverage/coverage.html

# 首先運行 mockgen 生成測試所需的 mocks
echo -e "${BLUE}生成測試需要的 mock 文件...${NC}"
./mockgen.sh

# 檢查是否有特定處理程序被指定
if [ -n "$HANDLER" ]; then
    echo -e "${BLUE}執行 ${HANDLER}_handler 測試...${NC}"
    
    # 執行特定處理程序測試並生成覆蓋率報告
    HANDLER_FILE="./internal/handler/${HANDLER}_handler_test.go"
    
    if [ ! -f "$HANDLER_FILE" ]; then
        echo -e "${RED}錯誤: 找不到測試文件 $HANDLER_FILE${NC}"
        exit 1
    fi
    
    COVERAGE_FILE="tmp/coverage/${HANDLER}_handler.out"
    
    # 使用過濾表達式運行特定處理程序的測試
    TEST_FILTER="Test.*${HANDLER}.*"
    go test -v -race -coverprofile=$COVERAGE_FILE -covermode=atomic ./internal/handler -run "$TEST_FILTER"
    
    # 檢查測試是否成功
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}${HANDLER}_handler 測試已成功通過！${NC}"
    else
        echo -e "${RED}測試失敗！請檢查上面的錯誤信息。${NC}"
        exit 1
    fi
    
    # 生成 HTML 覆蓋率報告
    echo -e "${BLUE}生成 HTML 覆蓋率報告...${NC}"
    go tool cover -html=$COVERAGE_FILE -o tmp/coverage/${HANDLER}_coverage.html
    
    # 顯示覆蓋率摘要
    echo -e "${BLUE}${HANDLER}_handler 覆蓋率摘要:${NC}"
    go tool cover -func=$COVERAGE_FILE
    
    echo -e "${GREEN}完成！覆蓋率報告已保存至 tmp/coverage/${HANDLER}_coverage.html${NC}"
else
    echo -e "${BLUE}執行所有 handler 測試...${NC}"
    
    # 執行所有 handler 測試並生成覆蓋率報告
    HANDLERS_COVERAGE="tmp/coverage/handlers.out"
    go test -v -race -coverprofile=$HANDLERS_COVERAGE -covermode=atomic ./internal/handler
    
    # 檢查測試是否成功
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}所有測試已成功通過！${NC}"
    else
        echo -e "${RED}測試失敗！請檢查上面的錯誤信息。${NC}"
        exit 1
    fi
    
    # 生成 HTML 覆蓋率報告
    echo -e "${BLUE}生成 HTML 覆蓋率報告...${NC}"
    go tool cover -html=$HANDLERS_COVERAGE -o tmp/coverage/coverage.html
    
    # 顯示覆蓋率摘要
    echo -e "${BLUE}覆蓋率摘要:${NC}"
    go tool cover -func=$HANDLERS_COVERAGE
    
    echo -e "${GREEN}完成！覆蓋率報告已保存至 tmp/coverage/coverage.html${NC}"
fi

echo -e "${BLUE}可以使用瀏覽器打開覆蓋率報告查看詳細情況。${NC}" 
echo -e "${YELLOW}使用說明:${NC}"
echo -e "${YELLOW}  ./run_tests.sh         - 執行所有處理程序的測試${NC}"
echo -e "${YELLOW}  ./run_tests.sh game    - 僅執行 game_handler 的測試${NC}"
echo -e "${YELLOW}  ./run_tests.sh auth    - 僅執行 auth_handler 的測試${NC}"
echo -e "${YELLOW}  ./run_tests.sh admin   - 僅執行 admin_handler 的測試${NC}" 