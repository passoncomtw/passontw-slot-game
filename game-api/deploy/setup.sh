#!/bin/bash
set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 輔助函數
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 檢查 Docker 是否已安裝
check_docker() {
    log_info "檢查 Docker 是否已安裝..."
    if ! command -v docker &> /dev/null; then
        log_error "找不到 Docker！請先安裝 Docker"
        log_info "安裝說明: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "找不到 Docker Compose！請先安裝 Docker Compose"
        log_info "安裝說明: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    log_success "Docker 和 Docker Compose 已安裝"
}

# 創建環境變數文件
setup_env_file() {
    log_info "設置環境變數文件..."
    
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            log_success "已從 .env.example 創建 .env 文件"
            log_info "請根據需要編輯 .env 文件配置環境變數"
        else
            log_error "找不到 .env.example 文件！"
            exit 1
        fi
    else
        log_warn ".env 文件已存在，跳過創建"
        log_info "如需重置環境變數，請刪除 .env 文件後重新運行此腳本"
    fi
}

# 創建日誌目錄
create_log_dir() {
    log_info "創建日誌目錄..."
    
    # 從 .env 文件中獲取 LOG_PATH，如果未設置則使用默認值
    LOG_PATH=$(grep LOG_PATH .env | cut -d '=' -f2 || echo "./logs")
    
    # 如果 LOG_PATH 以 ./ 開頭，則使其相對於當前目錄
    if [[ "$LOG_PATH" == ./* ]]; then
        LOG_PATH="${LOG_PATH:2}"  # 移除開頭的 ./
        LOG_PATH="$(pwd)/$LOG_PATH"
    fi
    
    mkdir -p "$LOG_PATH"
    log_success "已創建日誌目錄: $LOG_PATH"
}

# 啟動服務
start_services() {
    log_info "啟動服務..."
    
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        log_success "服務已成功啟動！"
        log_info "使用以下命令查看容器狀態：docker-compose ps"
        log_info "使用以下命令查看日誌：docker-compose logs -f"
    else
        log_error "服務啟動失敗！請檢查錯誤信息"
        exit 1
    fi
}

# 顯示服務信息
show_service_info() {
    log_info "獲取服務信息..."
    
    API_PORT=$(grep API_PORT .env | cut -d '=' -f2 || echo "8080")
    CONTAINER_NAME=$(grep CONTAINER_NAME .env | cut -d '=' -f2 || echo "game-api")
    
    log_success "服務已部署！"
    echo -e "\n${GREEN}=================================${NC}"
    echo -e "${GREEN}   Game API 服務部署信息   ${NC}"
    echo -e "${GREEN}=================================${NC}"
    echo -e "API 端點: ${BLUE}http://localhost:$API_PORT${NC}"
    echo -e "健康檢查: ${BLUE}http://localhost:$API_PORT/health${NC}"
    echo -e "容器名稱: ${BLUE}$CONTAINER_NAME${NC}"
    echo -e "日誌命令: ${YELLOW}docker-compose logs -f${NC}"
    echo -e "狀態命令: ${YELLOW}docker-compose ps${NC}"
    echo -e "${GREEN}=================================${NC}\n"
}

# 主函數
main() {
    echo -e "\n${GREEN}=========================================${NC}"
    echo -e "${GREEN}   Game API 服務部署設置腳本   ${NC}"
    echo -e "${GREEN}=========================================${NC}\n"
    
    check_docker
    setup_env_file
    create_log_dir
    
    # 詢問是否啟動服務
    read -p "是否要現在啟動服務？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start_services
        show_service_info
    else
        log_info "跳過啟動服務"
        log_info "您可以稍後使用 'docker-compose up -d' 命令啟動服務"
    fi
}

# 執行主函數
main 