package handler

import (
	"game-api/internal/domain/models"
	"game-api/internal/interfaces"
	"game-api/pkg/logger"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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
	var loginReq AppLoginRequest
	if err := c.ShouldBindJSON(&loginReq); err != nil {
		h.log.Error("無效的登入請求", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "無效的請求", "details": err.Error()})
		return
	}

	h.log.Info("收到登入請求", zap.String("email", loginReq.Email), zap.String("username", loginReq.Username))

	// 這裡應該從數據庫獲取用戶並驗證密碼
	// 此處僅為示例，實際實現需要查詢數據庫

	// 示例用戶
	userID := uuid.New()
	now := time.Now()
	user := models.User{
		UserID:         userID,
		Username:       "testuser",
		Email:          "test@example.com",
		PasswordHash:   "", // 不返回密碼信息
		AuthProvider:   "email",
		AuthProviderID: "",
		Role:           "user",
		VipLevel:       0,
		Points:         100,
		AvatarURL:      "https://example.com/avatar.jpg",
		IsVerified:     true,
		IsActive:       true,
		CreatedAt:      now,
		UpdatedAt:      now,
		LastLoginAt:    now,
	}

	tokenData := models.TokenData{
		UserID: userID.String(),
		Role:   user.Role,
	}
	token, expiresAt, err := h.authService.GenerateToken(tokenData)
	if err != nil {
		h.log.Error("生成令牌失敗", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "登入失敗", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":      token,
		"token_type": "Bearer",
		"expires_in": expiresAt,
		"user": gin.H{
			"user_id":       user.UserID,
			"username":      user.Username,
			"email":         user.Email,
			"role":          user.Role,
			"vip_level":     user.VipLevel,
			"points":        user.Points,
			"avatar_url":    user.AvatarURL,
			"is_verified":   user.IsVerified,
			"is_active":     user.IsActive,
			"created_at":    user.CreatedAt,
			"updated_at":    user.UpdatedAt,
			"last_login_at": user.LastLoginAt,
		},
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
