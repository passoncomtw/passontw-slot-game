#!/bin/bash
# 初始化 Linode 服務器上的部署環境
# 在首次部署前在 Linode 服務器上執行此腳本

# 確保腳本以 root 權限運行
if [ "$(id -u)" != "0" ]; then
   echo "此腳本需要 root 權限，請使用 sudo 運行" 1>&2
   exit 1
fi

# 設定變數
DEPLOY_PATH="/var/www/html/game-web"
BACKUP_PATH="/var/www/html/game-web-backups"
WEB_USER="www-data" # 預設 Nginx 用戶
WEB_GROUP="www-data" # 預設 Nginx 群組
DOMAIN="game-admin.example.com" # 替換為您的域名

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# 函數定義
echo_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

echo_info() {
    echo -e "${YELLOW}➜ $1${NC}"
}

echo_error() {
    echo -e "${RED}✗ $1${NC}"
}

# 確認繼續
echo_info "此腳本將設置 Linode 服務器以部署 Game Web 應用。"
echo_info "它將創建目錄結構、設置權限，並安裝必要的軟件。"
read -p "是否繼續？(y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo_info "已取消操作"
    exit 0
fi

# 檢查和更新套件
echo_info "更新套件列表..."
apt-get update

# 檢查並安裝 Nginx (如果尚未安裝)
if ! command -v nginx &> /dev/null; then
    echo_info "安裝 Nginx..."
    apt-get install -y nginx
    systemctl enable nginx
    systemctl start nginx
    echo_success "Nginx 已安裝並啟動"
else
    echo_success "Nginx 已安裝"
fi

# 創建部署目錄結構
echo_info "創建部署目錄..."
mkdir -p "$DEPLOY_PATH"
mkdir -p "$BACKUP_PATH"
echo_success "目錄結構已創建"

# 設置目錄權限
echo_info "設置權限..."
chown -R "$WEB_USER:$WEB_GROUP" "$DEPLOY_PATH"
chown -R "$WEB_USER:$WEB_GROUP" "$BACKUP_PATH"
chmod -R 755 "$DEPLOY_PATH"
chmod -R 755 "$BACKUP_PATH"
echo_success "權限已設置"

# 創建測試頁面
echo_info "創建測試頁面..."
cat > "$DEPLOY_PATH/index.html" << EOF
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Game Web 測試頁面</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f5f5f5; }
        .container { text-align: center; background-color: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); max-width: 600px; }
        h1 { color: #6200EA; margin-bottom: 1rem; }
        p { color: #333; line-height: 1.6; margin-bottom: 1.5rem; }
        .success { color: #00C853; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Game Web 部署環境已就緒</h1>
        <p>恭喜！您的 Linode 服務器已經成功設置用於部署 Game Web 應用。</p>
        <p>當 GitHub Actions 部署流程執行後，您將在此看到 Game Web 管理後台。</p>
        <p class="success">設置完成於：$(date)</p>
    </div>
</body>
</html>
EOF
echo_success "測試頁面已創建"

# 創建 Nginx 配置
echo_info "創建 Nginx 配置..."
cat > "/etc/nginx/sites-available/game-web.conf" << 'EOF'
server {
    listen 80;
    server_name game-admin.example.com; # 替換為您的網域名稱或 IP

    # 日誌設定
    access_log /var/log/nginx/game-web-access.log;
    error_log /var/log/nginx/game-web-error.log;

    # 靜態文件目錄
    root /var/www/html/game-web;
    index index.html;

    # 啟用 gzip 壓縮
    gzip on;
    gzip_min_length 1000;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css application/json application/javascript application/x-javascript text/xml application/xml application/xml+rss text/javascript;

    # 為靜態資源添加緩存頭
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://localhost:3000/; # 指向後端 API 服務
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 處理 Vue Router 的 history 模式 (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 安全設定
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # 禁止訪問 . 開頭的檔案
    location ~ /\.(?!well-known) {
        deny all;
    }
}
EOF

# 修改域名
sed -i "s/game-admin.example.com/$DOMAIN/g" "/etc/nginx/sites-available/game-web.conf"

# 啟用站點配置
ln -sf "/etc/nginx/sites-available/game-web.conf" "/etc/nginx/sites-enabled/"

# 測試 Nginx 配置
nginx -t

if [ $? -ne 0 ]; then
    echo_error "Nginx 配置測試失敗，請檢查錯誤"
else
    # 重新載入 Nginx
    systemctl reload nginx
    echo_success "Nginx 配置已應用並重新載入"
fi

echo_info "============================================="
echo_info "設置摘要："
echo_info "• 部署路徑：$DEPLOY_PATH"
echo_info "• 備份路徑：$BACKUP_PATH"
echo_info "• 網站用戶：$WEB_USER:$WEB_GROUP"
echo_info "• 域名配置：$DOMAIN"
echo_info "============================================="
echo_success "Linode 服務器設置完成！"
echo_info "請確保 GitHub Actions 工作流程中的環境變數已設置為以下值："
echo_info "DEPLOY_PATH=$DEPLOY_PATH"
echo_info "DEPLOY_BACKUP_PATH=$BACKUP_PATH"
echo_info "WEB_USER=$WEB_USER"
echo_info "WEB_GROUP=$WEB_GROUP"
echo_info "============================================="
echo_info "現在，您可以觸發 GitHub Actions 工作流程進行首次部署。" 