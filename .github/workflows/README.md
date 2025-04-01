# GitHub Actions 工作流程

本目錄包含專案的自動化 CI/CD 工作流程配置，使用 GitHub Actions 實現自動測試和部署。

## 工作流程列表

| 工作流程 | 描述 | 觸發條件 |
|---------|------|---------|
| [deploy-game-web.yml](./deploy-game-web.yml) | 部署 Game Web 後台管理系統到 Linode 服務器 | 推送到 develop 分支時觸發，或手動觸發 |

## deploy-game-web.yml

此工作流程用於自動部署 Game Web 後台管理系統到 Linode 服務器，包含以下步驟：

1. **檢出代碼**: 獲取最新代碼
2. **設置 Node.js 環境**: 使用 Node.js 20
3. **安裝依賴**: 執行 `npm ci`
4. **檢查代碼格式**: 執行 `npm run lint`
5. **創建環境配置文件**: 生成 `.env.production` 環境變數文件
6. **構建專案**: 執行 `npm run build`
7. **上傳構建產物**: 為後續部署準備文件
8. **SSH 部署到 Linode**: 通過 SSH 將構建產物部署到 Linode 服務器
   - 創建部署配置文件 (deploy-config.env)
   - 備份現有部署
   - 清空部署目錄
   - 上傳和解壓新的部署文件
   - 創建版本信息文件
   - 設定適當的權限

## 環境變數文件

工作流程使用兩種環境變數文件：

### 1. 前端應用環境變數 (.env.production)

在構建階段生成，包含以下變數：
```
VITE_API_BASE_URL=https://api.example.com
VITE_APP_ENV=production
VITE_APP_VERSION={commit-hash}
VITE_APP_BUILD_TIME={timestamp}
```

### 2. 部署配置環境變數 (deploy-config.env)

在部署階段生成，包含以下變數：
```
DEPLOY_PATH=/var/www/html/game-web
DEPLOY_BACKUP_PATH=/var/www/html/game-web-backups
WEB_USER=www-data
WEB_GROUP=www-data
APP_ENV=production
DEPLOY_TIMESTAMP={timestamp}
DEPLOY_VERSION={commit-hash}
```

## 運行方式

### 自動觸發

當符合以下條件時，工作流程將自動觸發：

- 代碼推送到 `develop` 分支
- 修改了 `game-web/` 目錄下的文件

### 手動觸發

也可以通過 GitHub 網頁界面手動觸發工作流程：

1. 前往專案的 GitHub 頁面
2. 點擊 "Actions" 選項卡
3. 從左側列表選擇 "部署 Game Web 後台管理系統"
4. 點擊 "Run workflow" 按鈕

## 環境變數與 Secrets

工作流程使用以下 GitHub Secrets：

- `VITE_API_BASE_URL`: API 服務器的基本 URL
- `LINODE_SSH_PRIVATE_KEY`: 用於連接 Linode 服務器的 SSH 私鑰
- `LINODE_KNOWN_HOSTS`: Linode 服務器的 known_hosts 內容
- `LINODE_HOST`: Linode 服務器的主機名或 IP 地址
- `LINODE_USERNAME`: Linode 服務器的 SSH 用戶名
- `DEPLOY_PATH`: 在 Linode 服務器上的部署路徑
- `DEPLOY_BACKUP_PATH`: 在 Linode 服務器上的部署備份路徑
- `WEB_USER`: 網頁文件的所有者用戶名
- `WEB_GROUP`: 網頁文件的所有者群組

可以在專案的 Settings > Secrets and variables > Actions 頁面中設置這些值。

## Linode 服務器準備工作

在首次部署前，需要在 Linode 服務器上準備以下事項：

1. 創建部署目錄和備份目錄：
   ```bash
   mkdir -p /var/www/html/game-web
   mkdir -p /var/www/html/game-web-backups
   ```

2. 確保 Web 伺服器已正確配置（如 Nginx 或 Apache）以提供 /var/www/html/game-web 目錄中的檔案。

3. 設定部署用戶的 SSH 密鑰和權限。

## 版本追蹤

每次部署時，工作流程會在部署目錄中創建一個 `version.json` 文件，包含以下信息：
```json
{
  "version": "commit-hash",
  "buildTime": "build-timestamp",
  "environment": "production",
  "deployTime": "deploy-datetime"
}
```

這可用於識別當前部署的版本和時間。

## 故障排除

如果部署失敗，可以查看工作流程執行日誌獲取詳細信息：

1. 前往 Actions 頁面
2. 點擊失敗的工作流程運行
3. 展開失敗的作業查看詳細日誌

常見問題：
- SSH 連接失敗：檢查 SSH 密鑰和 known_hosts 設置
- 權限問題：確保 Linode 用戶對部署目錄有寫入權限
- 空間不足：檢查 Linode 服務器的磁盤空間
- 環境變數錯誤：檢查 GitHub Secrets 是否正確設置 