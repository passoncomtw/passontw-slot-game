package handler

import (
	"game-api/internal/domain/models"
	"game-api/internal/interfaces"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// UserHandler 處理用戶相關的HTTP請求
type UserHandler struct {
	userService interfaces.UserService
	logger      *zap.Logger
}

// NewUserHandler 創建一個新的用戶處理器
func NewUserHandler(userService interfaces.UserService, logger *zap.Logger) *UserHandler {
	return &UserHandler{
		userService: userService,
		logger:      logger,
	}
}

// Register godoc
// @Summary 註冊新用戶
// @Description 創建一個新的用戶帳號
// @Tags users
// @Accept json
// @Produce json
// @Param request body models.RegisterRequest true "註冊信息"
// @Success 200 {object} models.User
// @Failure 400 {object} interfaces.ErrorResponse
// @Failure 500 {object} interfaces.ErrorResponse
// @Router /api/v1/users [post]
func (h *UserHandler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, interfaces.ErrorResponse{Error: err.Error()})
		return
	}

	user, err := h.userService.Register(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, interfaces.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
}

// Login godoc
// @Summary 用戶登入
// @Description 使用電子郵件和密碼登入
// @Tags users
// @Accept json
// @Produce json
// @Param request body models.LoginRequest true "登入信息"
// @Success 200 {object} models.TokenResponse
// @Failure 401 {object} interfaces.ErrorResponse
// @Failure 500 {object} interfaces.ErrorResponse
// @Router /api/v1/users/login [post]
func (h *UserHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, interfaces.ErrorResponse{Error: err.Error()})
		return
	}

	token, err := h.userService.Login(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, interfaces.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.TokenResponse{Token: token})
}

// GetProfile godoc
// @Summary 獲取用戶資料
// @Description 獲取當前登入用戶的個人資料
// @Tags users
// @Accept json
// @Produce json
// @Security Bearer
// @Success 200 {object} models.UserProfileResponse
// @Failure 401 {object} interfaces.ErrorResponse
// @Failure 500 {object} interfaces.ErrorResponse
// @Router /api/v1/users/profile [get]
func (h *UserHandler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, interfaces.ErrorResponse{Error: "未授權訪問"})
		return
	}

	profile, err := h.userService.GetProfile(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, interfaces.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// UpdateProfile godoc
// @Summary 更新用戶資料
// @Description 更新當前登入用戶的個人資料
// @Tags users
// @Accept json
// @Produce json
// @Security Bearer
// @Param request body models.UpdateProfileRequest true "更新信息"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} interfaces.ErrorResponse
// @Failure 401 {object} interfaces.ErrorResponse
// @Failure 500 {object} interfaces.ErrorResponse
// @Router /api/v1/users/profile [put]
func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, interfaces.ErrorResponse{Error: "未授權訪問"})
		return
	}

	var req models.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, interfaces.ErrorResponse{Error: err.Error()})
		return
	}

	err := h.userService.UpdateProfile(c.Request.Context(), userID.(string), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, interfaces.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{Message: "更新成功"})
}

// UpdateSettings godoc
// @Summary 更新用戶設定
// @Description 更新當前登入用戶的個人設定
// @Tags users
// @Accept json
// @Produce json
// @Security Bearer
// @Param request body models.AppUpdateSettingsRequest true "設定信息"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} interfaces.ErrorResponse
// @Failure 401 {object} interfaces.ErrorResponse
// @Failure 500 {object} interfaces.ErrorResponse
// @Router /api/v1/users/settings [put]
func (h *UserHandler) UpdateSettings(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, interfaces.ErrorResponse{Error: "未授權訪問"})
		return
	}

	var req models.AppUpdateSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, interfaces.ErrorResponse{Error: err.Error()})
		return
	}

	err := h.userService.UpdateSettings(c.Request.Context(), userID.(string), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, interfaces.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{Message: "更新成功"})
}
