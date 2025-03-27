package middleware

import (
	"game-api/internal/interfaces"
	"game-api/pkg/utils"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware JWT認證中間件
func AuthMiddleware(authService interfaces.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, utils.ErrorResponse{Error: "未提供授權令牌"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, utils.ErrorResponse{Error: "授權格式無效"})
			c.Abort()
			return
		}

		token := parts[1]
		userID, err := authService.ValidateToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, utils.ErrorResponse{Error: err.Error()})
			c.Abort()
			return
		}

		// 設置用戶ID到上下文
		c.Set("userID", userID)

		// 獲取並設置用戶角色
		tokenData, err := authService.ParseToken(token)
		if err == nil && tokenData != nil {
			c.Set("role", tokenData.Role)
		}

		c.Next()
	}
}
