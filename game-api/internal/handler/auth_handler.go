package handler

import (
	"game-api/internal/domain/models"
	"game-api/internal/interfaces"
	"game-api/pkg/utils"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// AuthHandler 認證處理程序
type AuthHandler struct {
	authService interfaces.AuthService
	logger      *zap.Logger
}

// AppLogin App用戶登入
// @Summary App用戶登入
// @Description App用戶使用用戶名和密碼登入
// @Tags 認證
// @Accept json
// @Produce json
// @Param request body models.AppLoginRequest true "登入請求"
// @Success 200 {object} models.LoginResponse "登入成功"
// @Failure 400 {object} utils.ErrorResponse "請求錯誤"
// @Failure 401 {object} utils.ErrorResponse "認證失敗"
// @Failure 500 {object} utils.ErrorResponse "伺服器錯誤"
// @Router /api/auth/login [post]
func (h *AuthHandler) AppLogin(c *gin.Context) {
	var req models.AppLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse{Error: "無效的請求格式: " + err.Error()})
		return
	}

	// 調用服務進行登入
	response, err := h.authService.AppLogin(c.Request.Context(), req)
	if err != nil {
		h.logger.Error("App用戶登入失敗", zap.Error(err), zap.String("username", req.Username))
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse{Error: err.Error()})
		return
	}

	h.logger.Info("App用戶登入成功", zap.String("username", req.Username))
	c.JSON(http.StatusOK, response)
}

// AdminLogin 管理員登入
// @Summary 管理員登入
// @Description 管理員使用電子郵件和密碼登入
// @Tags 管理員
// @Accept json
// @Produce json
// @Param request body models.AdminLoginRequest true "登入請求"
// @Success 200 {object} models.LoginResponse "登入成功"
// @Failure 400 {object} utils.ErrorResponse "請求錯誤"
// @Failure 401 {object} utils.ErrorResponse "認證失敗"
// @Failure 500 {object} utils.ErrorResponse "伺服器錯誤"
// @Router /api/admin/auth/login [post]
func (h *AuthHandler) AdminLogin(c *gin.Context) {
	var req models.AdminLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse{Error: "無效的請求格式: " + err.Error()})
		return
	}

	// 調用服務進行登入
	response, err := h.authService.AdminLogin(c.Request.Context(), req)
	if err != nil {
		h.logger.Error("管理員登入失敗", zap.Error(err), zap.String("email", req.Email))
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse{Error: err.Error()})
		return
	}

	h.logger.Info("管理員登入成功", zap.String("email", req.Email))
	c.JSON(http.StatusOK, response)
}
