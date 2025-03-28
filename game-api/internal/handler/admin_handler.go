package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"game-api/internal/domain/models"
	"game-api/internal/interfaces"
	"game-api/pkg/logger"
)

// AdminHandler 處理管理員相關請求
type AdminHandler struct {
	adminService interfaces.AdminService
	log          logger.Logger
}

// NewAdminHandler 創建一個新的 AdminHandler 實例
func NewAdminHandler(adminService interfaces.AdminService, log logger.Logger) *AdminHandler {
	return &AdminHandler{
		adminService: adminService,
		log:          log,
	}
}

// AdminLogin 處理管理員登錄請求
// @Summary 管理員登入
// @Description 驗證管理員憑證並返回訪問令牌
// @Tags 管理後台
// @Accept json
// @Produce json
// @Param login body models.AdminLoginRequest true "管理員登入信息"
// @Success 200 {object} models.LoginResponse "成功"
// @Failure 400 {object} interfaces.ErrorResponse "請求錯誤"
// @Failure 401 {object} interfaces.ErrorResponse "未授權"
// @Failure 500 {object} interfaces.ErrorResponse "服務器錯誤"
// @Router /api/admin/login [post]
func (h *AdminHandler) AdminLogin(c *gin.Context) {
	var req models.AdminLoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "請求格式錯誤", "details": err.Error()})
		return
	}

	response, err := h.adminService.AdminLogin(c, req)
	if err != nil {
		h.log.Error("管理員登錄失敗", zap.Error(err))
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetUserList 獲取用戶列表
// @Summary 獲取用戶列表
// @Description 獲取系統中的用戶列表，支持分頁、搜索和狀態過濾
// @Tags 管理後台
// @Accept json
// @Produce json
// @Param page query int false "頁碼，默認1" default(1)
// @Param page_size query int false "每頁數量，默認10" default(10)
// @Param status query string false "用戶狀態過濾" Enums(active, inactive, suspended, all)
// @Param search query string false "搜索關鍵詞"
// @Success 200 {object} models.AdminUserListResponse "成功"
// @Failure 400 {object} interfaces.ErrorResponse "請求錯誤"
// @Failure 401 {object} interfaces.ErrorResponse "未授權"
// @Failure 403 {object} interfaces.ErrorResponse "禁止訪問"
// @Failure 500 {object} interfaces.ErrorResponse "服務器錯誤"
// @Security BearerAuth
// @Router /api/admin/users [get]
func (h *AdminHandler) GetUserList(c *gin.Context) {
	var req models.AdminUserListRequest

	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "請求參數錯誤", "details": err.Error()})
		return
	}

	// 設置默認值
	if req.Page < 1 {
		req.Page = 1
	}
	if req.PageSize < 1 {
		req.PageSize = 10
	} else if req.PageSize > 100 {
		req.PageSize = 100
	}

	response, err := h.adminService.GetUserList(c, req)
	if err != nil {
		h.log.Error("獲取用戶列表失敗", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "獲取用戶列表失敗", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// ChangeUserStatus 變更用戶狀態
// @Summary 變更用戶狀態
// @Description 管理員變更用戶的狀態（啟用/禁用等）
// @Tags 管理後台
// @Accept json
// @Produce json
// @Param request body models.AdminChangeUserStatusRequest true "變更狀態請求"
// @Success 200 {object} models.OperationResponse "成功"
// @Failure 400 {object} interfaces.ErrorResponse "請求錯誤"
// @Failure 401 {object} interfaces.ErrorResponse "未授權"
// @Failure 403 {object} interfaces.ErrorResponse "禁止訪問"
// @Failure 404 {object} interfaces.ErrorResponse "用戶不存在"
// @Failure 500 {object} interfaces.ErrorResponse "服務器錯誤"
// @Security BearerAuth
// @Router /api/admin/users/status [put]
func (h *AdminHandler) ChangeUserStatus(c *gin.Context) {
	var req models.AdminChangeUserStatusRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "請求格式錯誤", "details": err.Error()})
		return
	}

	response, err := h.adminService.ChangeUserStatus(c, req)
	if err != nil {
		h.log.Error("變更用戶狀態失敗", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "變更用戶狀態失敗", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// DepositForUser 為用戶儲值
// @Summary 為用戶儲值
// @Description 管理員為指定用戶增加餘額
// @Tags 管理後台
// @Accept json
// @Produce json
// @Param request body models.AdminDepositRequest true "儲值請求"
// @Success 200 {object} models.OperationResponse "成功"
// @Failure 400 {object} interfaces.ErrorResponse "請求錯誤"
// @Failure 401 {object} interfaces.ErrorResponse "未授權"
// @Failure 403 {object} interfaces.ErrorResponse "禁止訪問"
// @Failure 404 {object} interfaces.ErrorResponse "用戶不存在"
// @Failure 500 {object} interfaces.ErrorResponse "服務器錯誤"
// @Security BearerAuth
// @Router /api/admin/users/deposit [post]
func (h *AdminHandler) DepositForUser(c *gin.Context) {
	var req models.AdminDepositRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "請求格式錯誤", "details": err.Error()})
		return
	}

	// 驗證金額
	if req.Amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "儲值金額必須大於0"})
		return
	}

	response, err := h.adminService.DepositForUser(c, req)
	if err != nil {
		h.log.Error("為用戶儲值失敗", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "為用戶儲值失敗", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}
