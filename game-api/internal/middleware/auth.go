package middleware

import (
	"game-api/internal/domain/interfaces"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware 認證中間件
func AuthMiddleware(authService interfaces.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 從 Authorization 頭部獲取 token
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "未提供授權 token"})
			c.Abort()
			return
		}

		// 檢查格式是否為 "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "授權格式錯誤"})
			c.Abort()
			return
		}

		token := parts[1]

		// 驗證 token
		userID, err := authService.ValidateToken(c, token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "無效的 token"})
			c.Abort()
			return
		}

		// 將用戶 ID 保存到上下文中
		c.Set("userID", userID)
		c.Next()
	}
}
