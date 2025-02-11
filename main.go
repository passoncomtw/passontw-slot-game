// main.go
package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/fx"
)

// Handler 包含所有 HTTP handlers
type Handler struct{}

// NewHandler 創建一個新的 Handler 實例
func NewHandler() *Handler {
	return &Handler{}
}

// HelloWorld 處理 hello world 請求
func (h *Handler) HelloWorld(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Hello, World!",
	})
}

// Router 設定路由
func NewRouter(handler *Handler) *gin.Engine {
	router := gin.Default()

	router.GET("/hello", handler.HelloWorld)

	return router
}

// 啟動 HTTP 服務器
func StartServer(router *gin.Engine) {
	router.Run(":8080")
}

func main() {
	app := fx.New(
		// 提供所有需要的依賴
		fx.Provide(
			NewHandler,
			NewRouter,
		),
		// 調用啟動函數
		fx.Invoke(StartServer),
	)

	app.Run()
}
