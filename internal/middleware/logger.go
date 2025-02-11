package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
)

func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 開始時間
		start := time.Now()

		// 處理請求
		c.Next()

		// 結束時間
		end := time.Now()

		// 日誌記錄
		println("API Request -", c.Request.Method, c.Request.URL.Path, c.Writer.Status(), end.Sub(start))
	}
}
