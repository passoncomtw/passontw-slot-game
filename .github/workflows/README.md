# GitHub Actions 工作流程說明文件

本文檔說明了本專案中的 GitHub Actions 工作流程配置和使用方法。

## 工作流程清單

### 1. 部署遊戲與後台 API服務 (deploy-game-api.yml)

此工作流程用於自動構建和部署遊戲API服務 (game-api) 到目標服務器上。

#### 觸發條件
- 推送到 `develop` 分支時，且更改路徑包含 `game-api/**` 或 `.github/workflows/deploy-game-api.yml`
- 手動觸發 (workflow_dispatch)，可選擇部署環境和版本號

#### 執行步驟
1. 檢出代碼
2. 設置 QEMU 和 Docker Buildx
3. 登錄到 DockerHub
4. 設置版本變數 (版本號、時間戳、提交 SHA)
5. 構建並推送 Docker 鏡像
6. 通過 SSH 部署到遠程服務器
7. 發送部署結果通知

#### 部署流程
1. 備份目標服務器上的現有環境文件
2. 下載最新的 docker-compose.yml 文件
3. 創建新的環境配置文件 (.env)
4. 拉取最新的鏡像並重啟服務
5. 清理舊鏡像
6. 輸出部署日誌

## 所需的 Secrets

以下 Secrets 需要在 GitHub 存儲庫設置中配置：

1. `DOCKERHUB_USERNAME`: DockerHub 用戶名
2. `DOCKERHUB_PASSWORD`: DockerHub 密碼或訪問令牌
3. `SERVER_HOST`: 部署服務器的主機地址
4. `SERVER_SSH_USER`: SSH 用戶名
5. `SERVER_SSH_KEY`: SSH 私鑰
6. `DB_PASSWORD`: 數據庫密碼
7. `JWT_SECRET`: JWT 密鑰
8. `SLACK_WEBHOOK`: Slack 通知網址 (可選)

## 如何使用

### 自動觸發

當推送符合條件的更改到 `develop` 分支時，工作流程將自動觸發。

### 手動觸發

1. 前往 GitHub 存儲庫頁面
2. 點擊 "Actions" 選項卡
3. 從左側選擇 "部署遊戲與後台 API服務" 工作流程
4. 點擊 "Run workflow" 按鈕
5. 選擇分支並填寫所需參數
6. 點擊 "Run workflow" 開始執行

## 本地測試

可以使用 [act](https://github.com/nektos/act) 工具在本地測試工作流程：

```bash
# 安裝 act
# Mac: brew install act
# Linux: curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# 運行完整工作流程
act -j build-and-deploy -s DOCKERHUB_USERNAME=xxx -s DOCKERHUB_PASSWORD=xxx

# 使用 DryRun 模式
act -j build-and-deploy -n
```

參見項目根目錄的 `test-workflow.sh` 腳本，用於更方便地在本地測試工作流程。

## 故障排除

如果工作流程失敗，請檢查：

1. GitHub Secrets 是否正確配置
2. Docker 構建是否出錯 (查看構建日誌)
3. 服務器連接是否正常
4. 服務器上的目錄權限是否適當
5. 服務器環境是否滿足需求

如需更多幫助，請聯繫開發團隊。 