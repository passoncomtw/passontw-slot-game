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

// Login godoc
// @Summary 用戶登入
// @Description 用戶登入並獲取認證令牌
// @Tags auth
// @Accept json
// @Produce json
// @Param request body models.AppLoginRequest true "登入信息"
// @Success 200 {object} models.TokenResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /v1/auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.AppLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "無效的請求參數: " + err.Error()})
		return
	}

	token, err := h.authService.Login(req.Username, req.Password)
	if err != nil {
		h.log.Error("登入失敗", zap.Error(err))
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "登入失敗: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.TokenResponse{Token: token})
}

// GetUserProfile godoc
// @Summary 獲取用戶資料
// @Description 獲取當前登入用戶的資料
// @Tags auth
// @Accept json
// @Produce json
// @Security Bearer
// @Success 200 {object} models.UserProfileResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /v1/auth/profile [get]
func (h *AuthHandler) GetUserProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "未授權訪問"})
		return
	}

	profile, err := h.authService.GetUserProfile(c.Request.Context(), userID.(string))
	if err != nil {
		h.log.Error("獲取用戶資料失敗", zap.Error(err))
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, profile)
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
