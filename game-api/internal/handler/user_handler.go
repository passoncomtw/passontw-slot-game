package handler

import (
	"game-api/internal/domain/models"
	"game-api/internal/interfaces"
	"game-api/pkg/utils"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// UserHandler 用戶處理程序
type UserHandler struct {
	userService interfaces.UserService
	authService interfaces.AuthService
	logger      *zap.Logger
}

// GetUsers 獲取用戶列表
// @Summary 獲取用戶列表
// @Description 獲取系統用戶列表，支持分頁和過濾
// @Tags 管理員-用戶管理
// @Accept json
// @Produce json
// @Param page query int false "頁碼" default(1)
// @Param page_size query int false "每頁數量" default(10)
// @Param status query string false "狀態" Enums(active, inactive, pending)
// @Param role query string false "角色" Enums(user, vip, admin)
// @Param search query string false "搜索關鍵詞"
// @Security Bearer
// @Success 200 {object} models.UserListResponse "用戶列表"
// @Failure 401 {object} utils.ErrorResponse "未授權"
// @Failure 500 {object} utils.ErrorResponse "伺服器錯誤"
// @Router /api/admin/users [get]
func (h *UserHandler) GetUsers(c *gin.Context) {
	var filter models.UserListFilterRequest
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse{Error: "無效的查詢參數: " + err.Error()})
		return
	}

	// 設置默認值
	if filter.Page == 0 {
		filter.Page = 1
	}
	if filter.PageSize == 0 {
		filter.PageSize = 10
	}

	// 獲取用戶列表
	response, err := h.userService.GetUsers(c.Request.Context(), filter)
	if err != nil {
		h.logger.Error("獲取用戶列表失敗", zap.Error(err))
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse{Error: "獲取用戶列表失敗: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetUserByID 獲取用戶詳情
// @Summary 獲取用戶詳情
// @Description 根據用戶ID獲取用戶詳細信息
// @Tags 管理員-用戶管理
// @Accept json
// @Produce json
// @Param user_id path string true "用戶ID"
// @Security Bearer
// @Success 200 {object} models.UserResponse "用戶詳情"
// @Failure 400 {object} utils.ErrorResponse "無效請求"
// @Failure 401 {object} utils.ErrorResponse "未授權"
// @Failure 404 {object} utils.ErrorResponse "用戶不存在"
// @Failure 500 {object} utils.ErrorResponse "伺服器錯誤"
// @Router /api/admin/users/{user_id} [get]
func (h *UserHandler) GetUserByID(c *gin.Context) {
	userID := c.Param("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse{Error: "用戶ID不能為空"})
		return
	}

	// 獲取用戶詳情
	user, err := h.userService.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		h.logger.Error("獲取用戶詳情失敗", zap.Error(err), zap.String("user_id", userID))
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse{Error: "獲取用戶詳情失敗: " + err.Error()})
		return
	}

	if user == nil {
		c.JSON(http.StatusNotFound, utils.ErrorResponse{Error: "用戶不存在"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// CreateUser 創建用戶
// @Summary 創建用戶
// @Description 創建新用戶
// @Tags 管理員-用戶管理
// @Accept json
// @Produce json
// @Param request body models.CreateUserRequest true "創建用戶請求"
// @Security Bearer
// @Success 200 {object} models.UserResponse "創建的用戶"
// @Failure 400 {object} utils.ErrorResponse "無效請求"
// @Failure 401 {object} utils.ErrorResponse "未授權"
// @Failure 500 {object} utils.ErrorResponse "伺服器錯誤"
// @Router /api/admin/users [post]
func (h *UserHandler) CreateUser(c *gin.Context) {
	var req models.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse{Error: "無效的請求數據: " + err.Error()})
		return
	}

	// 創建用戶
	user, err := h.userService.CreateUser(c.Request.Context(), req)
	if err != nil {
		h.logger.Error("創建用戶失敗", zap.Error(err), zap.String("username", req.Username))
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse{Error: "創建用戶失敗: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
}

// DepositToUser 用戶儲值
// @Summary 用戶儲值
// @Description 為用戶增加餘額
// @Tags 管理員-用戶管理
// @Accept json
// @Produce json
// @Param request body models.DepositRequest true "儲值請求"
// @Security Bearer
// @Success 200 {object} models.OperationResponse "操作結果"
// @Failure 400 {object} utils.ErrorResponse "無效請求"
// @Failure 401 {object} utils.ErrorResponse "未授權"
// @Failure 500 {object} utils.ErrorResponse "伺服器錯誤"
// @Router /api/admin/users/deposit [post]
func (h *UserHandler) DepositToUser(c *gin.Context) {
	var req models.DepositRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse{Error: "無效的請求數據: " + err.Error()})
		return
	}

	// 執行儲值
	result, err := h.userService.DepositToUser(c.Request.Context(), req)
	if err != nil {
		h.logger.Error("用戶儲值失敗", zap.Error(err), zap.String("user_id", req.UserID), zap.Float64("amount", req.Amount))
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse{Error: "儲值失敗: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// ChangeUserStatus 更改用戶狀態
// @Summary 凍結/解凍用戶
// @Description 更改用戶的凍結狀態
// @Tags 管理員-用戶管理
// @Accept json
// @Produce json
// @Param request body models.ChangeUserStatusRequest true "狀態變更請求"
// @Security Bearer
// @Success 200 {object} models.OperationResponse "操作結果"
// @Failure 400 {object} utils.ErrorResponse "無效請求"
// @Failure 401 {object} utils.ErrorResponse "未授權"
// @Failure 500 {object} utils.ErrorResponse "伺服器錯誤"
// @Router /api/admin/users/status [put]
func (h *UserHandler) ChangeUserStatus(c *gin.Context) {
	var req models.ChangeUserStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse{Error: "無效的請求數據: " + err.Error()})
		return
	}

	// 執行狀態變更
	result, err := h.userService.ChangeUserStatus(c.Request.Context(), req)
	if err != nil {
		h.logger.Error("更改用戶狀態失敗", zap.Error(err), zap.String("user_id", req.UserID), zap.Bool("active", req.Active))
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse{Error: "更改用戶狀態失敗: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}
