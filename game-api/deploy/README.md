# Game API 部署指南

本目錄包含使用 Docker Compose 部署 Game API 服務的配置文件和說明。

## 快速開始

### 1. 準備環境變數文件

複製示例環境變數文件並根據需要修改：

```bash
cp .env.example .env
```

### 2. 編輯環境變數

編輯 `.env` 文件，配置所需的環境變數。所有變數都提供了默認值，可以按需修改。

### 3. 啟動服務

使用 Docker Compose 啟動服務：

```bash
docker-compose up -d
```

### 4. 檢查服務狀態

```bash
docker-compose ps
docker-compose logs -f
```

## 環境變數說明

環境變數文件（`.env`）支持以下配置：

### 基本配置

| 變數名 | 描述 | 默認值 |
|-------|------|-------|
| APP_ENV | 運行環境 | development |
| CONTAINER_NAME | 容器名稱 | game-api |
| API_PORT | API 監聽端口 | 8080 |
| DOCKER_IMAGE | Docker 映像名稱 | game-api:local |
| LOG_PATH | 日誌保存路徑 | ./logs |

### 數據庫配置

| 變數名 | 描述 | 默認值 |
|-------|------|-------|
| DB_HOST | 數據庫主機 | localhost |
| DB_PORT | 數據庫端口 | 5432 |
| DB_USER | 數據庫用戶 | postgres |
| DB_PASSWORD | 數據庫密碼 | postgres |
| DB_NAME | 數據庫名稱 | game_dev |
| DB_SSL_MODE | SSL 模式 | disable |

### Redis 配置

| 變數名 | 描述 | 默認值 |
|-------|------|-------|
| REDIS_HOST | Redis 主機 | localhost |
| REDIS_PORT | Redis 端口 | 6379 |
| REDIS_PASSWORD | Redis 密碼 | (空) |
| REDIS_DB | Redis 數據庫索引 | 0 |

### 更多配置選項

查看 `.env.example` 文件以了解所有可用的配置選項。

## 自定義部署

### 使用預構建的映像

如果您有預構建的 Docker 映像，可以在 `.env` 文件中設置：

```
DOCKER_IMAGE=username/game-api:tag
```

然後修改 `docker-compose.yml` 文件，刪除 `build` 部分：

```yaml
services:
  game-api:
    image: ${DOCKER_IMAGE:-game-api:local}
    # 其他配置...
```

### 多環境部署

對於多環境部署，您可以為每個環境創建不同的環境變數文件：

```bash
# 開發環境
docker-compose --env-file .env.development up -d

# 測試環境
docker-compose --env-file .env.testing up -d

# 生產環境
docker-compose --env-file .env.production up -d
```

## 運行時覆蓋變數

您可以在運行時覆蓋環境變數：

```bash
API_PORT=9090 docker-compose up -d
```

## 維護操作

### 查看日誌

```bash
docker-compose logs -f
```

### 重啟服務

```bash
docker-compose restart
```

### 更新映像

```bash
docker-compose pull  # 如果使用預構建映像
docker-compose up -d --build  # 如果需要重建
```

### 停止服務

```bash
docker-compose down
```

## 健康檢查

服務配置了健康檢查，您可以通過以下命令查看健康狀態：

```bash
docker inspect --format='{{json .State.Health}}' game-api | jq
```

或者直接訪問健康檢查端點：

```bash
curl http://localhost:8080/health
```

## 故障排除

如果服務啟動失敗，請檢查以下問題：

1. 確保環境變數已正確設置
2. 查看容器日誌以獲取詳細錯誤信息：`docker-compose logs -f`
3. 檢查數據庫和 Redis 連接是否可以從容器內訪問
4. 確保端口沒有被其他服務占用 