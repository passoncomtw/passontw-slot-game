package handler

import (
	"net/http"
	"passontw-slot-game/apps/auth-service/interfaces"
	"passontw-slot-game/apps/auth-service/service"
	"strings"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authService service.AuthService
	userService service.UserService
}

func NewAuthHandler(authService service.AuthService, userService service.UserService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		userService: userService,
	}
}

// 用戶登入
// @Summary 用戶登入
// @Description 驗證用戶憑據並返回 JWT 令牌
// @Tags auth
// @Accept json
// @Produce json
// @Param data body interfaces.LoginRequest true "登入信息"
// @Success 200 {object} interfaces.LoginResponse "登入成功"
// @Failure 400 {object} interfaces.ErrorResponse "請求錯誤"
// @Failure 401 {object} interfaces.ErrorResponse "登入失敗"
// @Router /api/v1/auth [post]
func (h *AuthHandler) UserLogin(c *gin.Context) {
	var req interfaces.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	token, err := h.authService.Login(req.Phone, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, interfaces.LoginResponse{Token: token})
}

// 用戶登出
// @Summary 用戶登出
// @Description 使當前 JWT 令牌無效
// @Tags auth
// @Accept json
// @Produce json
// @Security Bearer
// @Success 200 {object} interfaces.SuccessResponse "登出成功"
// @Failure 401 {object} interfaces.ErrorResponse "未授權"
// @Router /api/v1/auth/logout [post]
func (h *AuthHandler) UserLogout(c *gin.Context) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未提供授權令牌"})
		return
	}

	// 從授權頭部提取令牌
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "授權格式無效"})
		return
	}

	token := parts[1]
	err := h.authService.Logout(token)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "成功登出"})
}
