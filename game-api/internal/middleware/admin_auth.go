package middleware

import (
	"game-api/internal/interfaces"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// AdminAuthMiddleware 管理員認證中間件
func AdminAuthMiddleware(authService interfaces.AuthService) gin.HandlerFunc {
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

		// 解析 token 以獲取數據
		tokenData, err := authService.ParseAdminToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "無效的 token"})
			c.Abort()
			return
		}

		// 檢查是否有管理員角色
		if tokenData.Role == "" || !strings.HasPrefix(tokenData.Role, "admin") {
			c.JSON(http.StatusForbidden, gin.H{"error": "權限不足"})
			c.Abort()
			return
		}

		// 驗證 token 有效性
		userID, err := authService.ValidateAdminToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "無效的 token"})
			c.Abort()
			return
		}

		// 將管理員 ID 和角色保存到上下文中
		c.Set("adminID", userID)
		c.Set("adminRole", tokenData.Role)
		c.Next()
	}
}
