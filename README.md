# 微服務架構項目

這是一個基於 Go 的微服務架構項目，使用 fx 依賴注入框架和模組化設計，提供遊戲和認證相關服務。

## 目錄

- [架構概述](#架構概述)
- [技術堆疊](#技術堆疊)
- [項目結構](#項目結構)
- [模組說明](#模組說明)
- [開始使用](#開始使用)
- [環境配置](#環境配置)
- [開發指南](#開發指南)
- [API 文檔](#api-文檔)
- [WebSocket 使用](#websocket-使用)
- [依賴注入機制](#依賴注入機制)
- [貢獻指南](#貢獻指南)

## 架構概述

本項目採用模組化的微服務架構，包含以下主要組件：

1. **核心基礎設施** - 提供通用功能如數據庫連接、Redis 緩存、Nacos 配置等
2. **業務服務** - 提供業務邏輯，如用戶認證、遊戲邏輯等
3. **API 層** - 提供 RESTful API 和 WebSocket 接口
4. **配置管理** - 支持本地和 Nacos 配置中心

系統採用微服務架構，目前包含：
- **auth-service** - 處理用戶認證和用戶管理
- **slot-game1** - 處理遊戲業務邏輯

## 技術堆疊

- **Go 1.21+** - 核心編程語言
- **Gin** - Web 框架
- **GORM** - ORM 數據庫操作
- **fx** - 依賴注入框架
- **PostgreSQL** - 關係型數據庫
- **Redis** - 緩存和會話管理
- **Nacos** - 配置中心和服務發現
- **WebSocket** - 實時通訊
- **Swagger** - API 文檔
- **JWT** - 用戶認證

## 項目結構

```
├── main.go                 # 主程序入口
├── .air.toml               # Air 熱重載配置
├── .env                    # 環境變量
├── .env.auth-service       # 認證服務環境變量
├── .env.slot-game1         # 遊戲服務環境變量
├── go.mod                  # Go 模組定義
├── src/                    # 應用程序源碼
│   ├── config/             # 配置管理
│   ├── handler/            # HTTP 處理程序
│   ├── middleware/         # 中間件
│   ├── service/            # 業務服務
│   └── interfaces/         # 接口定義
├── pkg/                    # 核心基礎設施包
│   ├── core/               # 核心模組整合
│   ├── databaseManager/    # 數據庫管理
│   ├── redisManager/       # Redis 管理
│   ├── nacosManager/       # Nacos 管理
│   ├── websocketManager/   # WebSocket 管理
│   ├── logger/             # 日誌管理
│   └── utils/              # 通用工具
├── docs/                   # Swagger 文檔
└── migrations/             # 數據庫遷移腳本
```

## 模組說明

### 核心模組 (pkg/core)

核心模組整合所有基礎設施，提供一致的訪問接口。包含：

- **DatabaseModule** - 數據庫連接和操作
- **RedisModule** - Redis 緩存和會話管理
- **WebSocketModule** - WebSocket 實時通訊
- **LoggerModule** - 日誌管理

### 配置模組 (src/config)

處理應用程序配置，支持從環境變量和 Nacos 加載配置。

### 服務模組 (src/service)

提供業務邏輯實現：

- **UserService** - 用戶管理
- **AuthService** - 認證服務

### 處理程序模組 (src/handler)

處理 HTTP 請求和路由：

- **AuthHandler** - 處理認證相關請求
- **UserHandler** - 處理用戶相關請求
- **WebSocketHandler** - 處理 WebSocket 連接

## 開始使用

### 前置要求

- Go 1.21+
- PostgreSQL
- Redis
- Nacos (可選)

### 安裝

1. 複製代碼庫：

```bash
git clone https://github.com/your-username/passontw-slot-game.git
cd passontw-slot-game
```

2. 安裝依賴：

```bash
go mod download
```

3. 安裝 air 工具 (用於熱重載)：

```bash
go install github.com/cosmtrek/air@latest
```

### 啟動服務

啟動認證服務：

```bash
air auth-service
```

啟動遊戲服務：

```bash
air slot-game1
```

## 環境配置

專案使用 `.env` 文件進行環境配置，各服務使用獨立的環境配置：

- `.env.auth-service` - 認證服務配置
- `.env.slot-game1` - 遊戲服務配置

主要配置項：

```
# 服務配置
SERVER_HOST=localhost
SERVER_PORT=3000
API_HOST=localhost:3000
VERSION=1.0.0

# 數據庫配置
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=postgres

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=
REDIS_DB=0

# JWT 配置
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Nacos 配置
ENABLE_NACOS=false
NACOS_HOST=localhost
NACOS_PORT=8848
NACOS_NAMESPACE=
NACOS_GROUP=DEFAULT_GROUP
NACOS_DATAID=service_config
NACOS_USERNAME=
NACOS_PASSWORD=
NACOS_SERVICE_NAME=service-name
```

## 開發指南

### 添加新的 API 端點

1. 在適當的處理程序文件中添加處理函數：

```go
func (h *ExampleHandler) HandleSomething(c *gin.Context) {
    c.JSON(http.StatusOK, SuccessResponse{Message: "成功"})
}
```

2. 在路由器中註冊端點：

```go
func configurePublicRoutes(api *gin.RouterGroup, ..., exampleHandler *ExampleHandler) {
    api.GET("/examples", exampleHandler.HandleSomething)
}
```

### 添加新的服務

1. 創建服務接口：

```go
type ExampleService interface {
    DoSomething() error
}
```

2. 實現服務：

```go
type exampleService struct {
    db *gorm.DB
}

func NewExampleService(db *gorm.DB) ExampleService {
    return &exampleService{db: db}
}

func (s *exampleService) DoSomething() error {
    return nil
}
```

3. 將服務添加到模組：

```go
var Module = fx.Options(
    fx.Provide(
        NewExampleService,
    ),
)
```

## WebSocket 使用

### 客戶端連接 WebSocket

使用標準 WebSocket API 連接到服務器：

```javascript
const socket = new WebSocket('ws://localhost:3000/ws');
socket.onopen = function(event) {
    console.log('WebSocket 連接已開啟');
    
    socket.send(JSON.stringify({
        type: 'auth',
        content: 'your-jwt-token'
    }));
};

socket.onmessage = function(event) {
    const message = JSON.parse(event.data);
    console.log('收到訊息:', message);
    
    switch(message.type) {
        case 'auth_success':
            console.log('認證成功');
            break;
        case 'error':
            console.log('錯誤:', message.content);
            break;
    }
};

socket.onclose = function(event) {
    console.log('WebSocket 連接已關閉');
};

function sendMessage(type, content) {
    socket.send(JSON.stringify({
        type: type,
        content: content
    }));
}
```

### WebSocket 認證流程

1. 客戶端與 `/ws` 端點建立 WebSocket 連接
2. 客戶端發送 JWT 令牌進行認證：

```json
{
    "type": "auth",
    "content": "your-jwt-token"
}
```

3. 服務器驗證令牌並回應：

```json
{
    "type": "auth_success",
    "content": "Authentication successful"
}
```

或者回應錯誤：

```json
{
    "type": "error",
    "content": "Authentication failed: invalid token"
}
```

4. 認證成功後，客戶端可以發送和接收訊息

### 處理 WebSocket 消息

在服務器端處理 WebSocket 消息的範例：

```go
func (client *Client) ReadPump() {    
    for {
        _, message, err := client.Conn.ReadMessage()
        if err != nil {
            break
        }
        
        var msg Message
        if err := json.Unmarshal(message, &msg); err != nil {
            continue
        }
        
        switch msg.Type {
        case "auth":
            // 處理認證...
        case "chat":
            // 處理聊天消息...
        case "game_action":
            // 處理遊戲動作...
        default:
            // 未知消息類型...
        }
    }
}
```

## 依賴注入機制

項目使用 `fx` 框架實現依賴注入，主要優點：

1. **模組化** - 將相關功能分組為模組
2. **生命週期管理** - 處理組件啟動和關閉
3. **依賴管理** - 自動注入所需的依賴項

範例：

```go
func main() {
    app := fx.New(
        core.Module,
        
        config.Module,
        service.Module,
        handler.Module,
    )
    
    app.Run()
}

var Module = fx.Options(
    fx.Provide(
        ProvideGormDB,
        NewUserService,
        NewAuthService,
    ),
)

var Module = fx.Options(
    fx.Provide(
        NewUserHandler,
        NewAuthHandler,
        NewRouter,
    ),
    fx.Invoke(StartServer),
)
```

## API 文檔

- http://localhost:3000/api-docs/index.html (認證服務)
