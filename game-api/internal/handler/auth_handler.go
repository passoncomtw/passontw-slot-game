package handler

import (
	"net/http"

	"game-api/internal/domain/interfaces"
	"game-api/internal/domain/models"
	"game-api/pkg/logger"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// AuthHandler 處理身份驗證相關請求
type AuthHandler struct {
	authService interfaces.AuthService
	log         logger.Logger
}

// NewAuthHandler 創建一個新的 AuthHandler 實例
func NewAuthHandler(authService interfaces.AuthService, log logger.Logger) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		log:         log,
	}
}

// Login 處理用戶登入請求
// @Summary 用戶登入
// @Description 驗證用戶憑證並返回訪問令牌
// @Tags 授權
// @Accept json
// @Produce json
// @Param login body models.LoginRequest true "登入信息"
// @Success 200 {object} models.LoginResponse "成功"
// @Failure 400 {object} interfaces.ErrorResponse "請求錯誤"
// @Failure 401 {object} interfaces.ErrorResponse "未授權"
// @Failure 500 {object} interfaces.ErrorResponse "服務器錯誤"
// @Router /api/auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.log.Error("無效的登入請求", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "無效的請求"})
		return
	}

	// 這裡應該從數據庫獲取用戶
	// 此處僅為示例，實際實現需要查詢數據庫
	userID := "user123" // 示例用戶 ID

	token, err := h.authService.GenerateToken(c.Request.Context(), userID)
	if err != nil {
		h.log.Error("生成令牌失敗", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "登入失敗"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":      token,
		"token_type": "Bearer",
		"expires_in": 3600, // 示例過期時間
	})
}

// AuthMiddleware 身份驗證中間件
func (h *AuthHandler) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader("Authorization")
		if token == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "未授權"})
			return
		}

		// 去除 "Bearer " 前綴
		if len(token) > 7 && token[:7] == "Bearer " {
			token = token[7:]
		}

		userID, err := h.authService.ValidateToken(c.Request.Context(), token)
		if err != nil {
			h.log.Error("無效的令牌", zap.Error(err))
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "未授權"})
			return
		}

		// 將用戶 ID 存儲在上下文中
		c.Set("userID", userID)
		c.Next()
	}
}
