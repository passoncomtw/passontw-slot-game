package handler

import (
	"game-api/internal/domain/models"
	"game-api/internal/interfaces"
	"game-api/pkg/logger"
	"net/http"

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

// 擴展登入請求，支持多種登入方式
type AppLoginRequest struct {
	Email    string `json:"email,omitempty"`
	Username string `json:"username,omitempty"`
	Password string `json:"password" binding:"required"`
}

// Login 處理用戶登入請求
// @Summary 用戶登入 (正式版本)
// @Description 驗證用戶憑證並返回訪問令牌
// @Tags 授權
// @Accept json
// @Produce json
// @Param login body models.AppLoginRequest true "登入信息"
// @Success 200 {object} models.LoginResponse "成功"
// @Failure 400 {object} interfaces.ErrorResponse "請求錯誤"
// @Failure 401 {object} interfaces.ErrorResponse "未授權"
// @Failure 500 {object} interfaces.ErrorResponse "服務器錯誤"
// @Router /api/v1/auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var loginReq models.AppLoginRequest
	if err := c.ShouldBindJSON(&loginReq); err != nil {
		h.log.Error("無效的登入請求", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "無效的請求", "details": err.Error()})
		return
	}

	h.log.Info("收到登入請求", zap.String("email", loginReq.Username))

	// 使用 authService 處理登入請求
	response, err := h.authService.AppLogin(c.Request.Context(), loginReq)
	if err != nil {
		h.log.Error("登入處理失敗", zap.Error(err))
		c.JSON(http.StatusUnauthorized, gin.H{"error": "登入失敗", "details": err.Error()})
		return
	}

	// 返回登入成功響應
	c.JSON(http.StatusOK, response)
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

		userID, err := h.authService.ValidateToken(token)
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
