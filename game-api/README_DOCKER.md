# Game API Docker 部署指南

本文檔提供有關 Game API 服務的 Docker 部署資訊，包括 CI/CD 自動化部署、手動構建和運行容器的說明。

## Docker 部署流程

### CI/CD 自動化部署

本專案已配置 GitHub Actions 工作流程，實現自動化測試和 Docker 映像構建：

1. 當代碼推送到 `develop` 或 `main` 分支時，自動觸發構建流程
2. 工作流程將先執行單元測試和代碼質量檢查
3. 然後構建 Docker 映像並推送到 Docker Hub
4. 最後執行安全掃描並生成部署摘要
5. 生成部署資源包，包含 `docker-compose.yml`、`.env.example` 和部署腳本

所有配置文件位於 `.github/workflows/deploy-game-api.yml`。

### 手動觸發部署

您也可以在 GitHub 網站上手動觸發部署：

1. 進入專案的 GitHub 頁面
2. 點擊 "Actions" 選項卡
3. 從左側列表選擇 "部署 Game API 服務" 工作流程
4. 點擊 "Run workflow" 按鈕，選擇環境（開發或生產）並確認

## Docker 映像結構

Game API 使用多階段構建的 Dockerfile，包含以下階段：

1. **構建階段**：使用 golang:1.22-alpine 映像編譯 Go 代碼
2. **運行階段**：使用 alpine:3.19 映像，僅包含必要的運行時組件

映像特點：
- 輕量化：最終映像大小約 20-30MB
- 安全性：使用非 root 用戶運行應用
- 內建健康檢查：定期檢查 `/health` 端點確保服務正常運行

## 使用 Docker Compose 部署

GitHub Actions 工作流程會生成一個包含所有必要文件的部署資源包，可在任何支持 Docker 和 Docker Compose 的環境中使用。

### 快速部署步驟

1. 下載並解壓部署資源包：
   ```bash
   tar -xzf game-api-deploy.tar.gz -C /path/to/deploy
   cd /path/to/deploy
   ```

2. 運行設置腳本：
   ```bash
   ./setup.sh
   ```

   此腳本將：
   - 檢查 Docker 和 Docker Compose 是否已安裝
   - 從 `.env.example` 創建 `.env` 文件（如果不存在）
   - 創建日誌目錄
   - 啟動服務（如果您選擇是）

3. 自定義環境變數：
   根據需要編輯 `.env` 文件，設置實際的數據庫和 Redis 連接信息

### 環境變數配置

服務使用 `.env` 文件進行配置，支持以下環境變數：

#### 基本配置
- `APP_ENV`: 運行環境 (development/production)
- `CONTAINER_NAME`: 容器名稱
- `API_PORT`: API 服務端口
- `DOCKER_IMAGE`: Docker 映像名稱
- `LOG_PATH`: 日誌路徑

#### 數據庫和 Redis 配置
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: 數據庫連接信息
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`: Redis 連接信息

#### 其他配置
- `JWT_SECRET`: JWT 簽名密鑰
- `LOG_LEVEL`: 日誌級別
- 以及更多可選配置（見 `.env.example`）

## 本地構建與運行

### 本地構建 Docker 映像

如需在本地構建 Docker 映像，可以使用以下命令：

```bash
# 構建映像（開發環境）
docker build -f Dockerfile.api -t game-api:local --build-arg APP_ENV=development .

# 構建映像（生產環境）
docker build -f Dockerfile.api -t game-api:prod --build-arg APP_ENV=production .
```

### 使用 Docker Compose 本地運行

1. 進入部署目錄：
   ```bash
   cd game-api/deploy
   ```

2. 複製並編輯環境變數文件：
   ```bash
   cp .env.example .env
   # 編輯 .env 文件設置環境變數
   ```

3. 啟動服務：
   ```bash
   docker-compose up -d
   ```

4. 查看日誌：
   ```bash
   docker-compose logs -f
   ```

## 生產環境部署

### 使用預構建映像

如果使用 GitHub Actions 構建的映像，在 `.env` 文件中設置：

```
DOCKER_IMAGE=username/game-api:tag
```

然後運行：
```bash
docker-compose up -d
```

### 多環境部署

對於多環境部署，您可以為每個環境創建不同的環境變數文件：

```bash
# 開發環境
docker-compose --env-file .env.development up -d

# 生產環境
docker-compose --env-file .env.production up -d
```

## 運行時覆蓋變數

您可以在運行時覆蓋環境變數：

```bash
API_PORT=9090 docker-compose up -d
```

## 維護操作

### 更新服務

對於使用預構建映像的部署：

```bash
# 拉取最新映像
docker-compose pull

# 重新啟動服務
docker-compose up -d
```

對於本地構建的部署：

```bash
# 重新構建並啟動
docker-compose up -d --build
```

### 查看日誌和狀態

```bash
# 查看日誌
docker-compose logs -f

# 查看容器狀態
docker-compose ps

# 查看健康狀態
docker inspect --format='{{json .State.Health}}' game-api
```

## 故障排除

常見問題和解決方案：

1. **容器無法啟動**：
   - 檢查 `.env` 文件中的環境變數是否正確設置
   - 查看容器日誌 `docker-compose logs`
   - 確保數據庫和 Redis 可以連接

2. **API 無法訪問**：
   - 檢查端口映射 `docker-compose ps`
   - 確認防火牆設置
   - 使用 `curl http://localhost:<API_PORT>/health` 檢查服務狀態

3. **環境變數問題**：
   - 確保 `.env` 文件存在且權限正確
   - 檢查 `.env` 文件格式是否正確（無多餘空格等） 