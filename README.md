# Swagger UI

## HotReload

```
$ go install github.com/air-verse/air@latest
```

**.air.toml**

```toml
root = "."
tmp_dir = "tmp"

[build]
  cmd = "go build -o ./tmp/app ./cmd/api/main.go"
  bin = "./tmp/app"
  delay = 1000
  exclude_dir = ["assets", "tmp", "vendor", "redis_data"]
  exclude_file = []
  exclude_regex = ["_test.go"]
  include_ext = ["go", "json", "yaml", "toml"]

[log]
  time = true

[color]
  app = ""
  build = "yellow"
  main = "magenta"
  runner = "green"
  watcher = "cyan"
```

## Build

```
$ swag init -g cmd/api/main.go -o docs
```

[Swagger UI URL](http://localhost:3000/api-docs/index.html)

# Go 專案架構分析報告

## 1. 整體架構概述

這是一個採用現代化 Go 專案結構的應用程式，遵循了清晰的關注點分離原則和領域驅動設計(DDD)的概念。整體架構採用分層設計，確保了代碼的可維護性、可測試性和可擴展性。

### 1.1 主要目錄結構

```
project-root/
├── cmd/          # 主程序入口
├── internal/     # 私有應用邏輯
├── pkg/          # 公共包
├── api/          # API 相關文件
├── web/          # 前端資源
├── configs/      # 配置文件
├── migrations/   # 數據庫遷移
├── scripts/      # 工具腳本
├── test/         # 測試文件
└── docs/         # 項目文檔
```

## 2. 核心組件詳解

### 2.1 cmd/ 目錄
- **用途**：包含所有可執行程序的主入口點
- **特點**：
  - 保持主入口檔案簡潔
  - 主要負責配置初始化和服務啟動
  - 依賴注入的配置點

### 2.2 internal/ 目錄
- **功能**：私有應用程序代碼，不可被外部引用
- **子目錄結構**：
  1. `config/`: 配置處理
  2. `domain/`: 領域模型和核心業務邏輯
  3. `handler/`: HTTP 請求處理
  4. `middleware/`: HTTP 中間件
  5. `service/`: 業務邏輯實現
  6. `pkg/`: 內部共用工具

### 2.3 pkg/ 目錄
- **定位**：可被外部應用引用的公共代碼
- **特點**：
  - 高度可重用性
  - 穩定的 API 設計
  - 完整的文檔和測試

### 2.4 數據層設計
- **位置**：`internal/domain/`
- **組件**：
  1. `entity/`: 數據實體定義
  2. `repository/`: 數據訪問接口
- **特點**：
  - 清晰的數據模型定義
  - 數據訪問抽象化
  - 支持多種數據源

## 3. 技術架構特點

### 3.1 分層架構
1. **表示層** (Presentation Layer)
   - 位置：`internal/handler/`
   - 職責：處理 HTTP 請求和響應
   - 特點：輕量級，只做請求轉發和響應格式化

2. **業務層** (Business Layer)
   - 位置：`internal/service/`
   - 職責：實現核心業務邏輯
   - 特點：不依賴特定的數據存儲方式

3. **數據層** (Data Layer)
   - 位置：`internal/domain/repository/`
   - 職責：數據訪問和持久化
   - 特點：支持多種數據源切換

### 3.2 中間件設計
- **位置**：`internal/middleware/`
- **功能**：
  1. 認證和授權 (`auth.go`)
  2. 日誌記錄 (`logger.go`)
- **特點**：
  - 可組合性
  - 可配置性
  - 獨立性

## 4. 部署和運維支持

### 4.1 容器化支持
- `Dockerfile`: 定義應用運行環境
- `docker-compose.yml`: 定義服務編排
- 特點：支持多環境部署

### 4.2 數據庫管理
- **位置**：`migrations/`
- **功能**：
  - 版本化的數據庫結構管理
  - 支持自動化遷移
  - 回滾機制

### 4.3 配置管理
- **位置**：`configs/`
- **特點**：
  - 環境特定配置
  - 敏感信息處理
  - 動態配置支持

## 5. 開發工具支持

### 5.1 構建和測試
- **位置**：`scripts/`
- **功能**：
  - 自動化構建腳本
  - 測試運行腳本
  - 代碼質量檢查

### 5.2 API 文檔
- **位置**：`api/`
- **特點**：
  - Swagger 文檔支持
  - Protocol Buffers 定義
  - API 版本控制

## 6. 最佳實踐建議

### 6.1 代碼組織
1. 保持包的單一職責
2. 避免循環依賴
3. 使用依賴注入
4. 遵循接口隔離原則

### 6.2 錯誤處理
1. 統一錯誤處理機制
2. 適當的錯誤日誌級別
3. 友好的錯誤響應

### 6.3 測試策略
1. 單元測試覆蓋核心邏輯
2. 集成測試確保組件協作
3. 使用 mock 進行隔離測試

## 7. 擴展性考慮

### 7.1 水平擴展
- 無狀態設計
- 配置中心支持
- 分布式會話處理

### 7.2 模塊化設計
- 鬆耦合架構
- 插件化支持
- 服務化準備

## 8. 結論

這個專案架構展現了現代 Go 應用程序的最佳實踐，具有以下優勢：

1. **清晰的職責分離**
   - 每個組件都有明確的職責
   - 便於團隊協作和代碼維護

2. **高度的可測試性**
   - 完整的測試支持
   - 易於編寫單元測試和集成測試

3. **良好的可擴展性**
   - 模塊化設計
   - 支持未來功能擴展

4. **完整的開發支持**
   - 開發工具鏈整合
   - 自動化腳本支持

這個架構適合中大型的 Go 服務端應用，特別是需要長期維護和迭代的專案。

## Types 檔案結構

```
./internal/interfaces
├── auth.go #登入的 interface
├── common.go #共用的 interface
├── games.go #遊戲的 interface
├── types
│   ├── errors.go # 錯誤的 types
│   └── games.go  # 遊戲的基本 types
├── users.go # 玩家的 interfaces
└── websocket.go # Websocket 的基本 interfaces
```
