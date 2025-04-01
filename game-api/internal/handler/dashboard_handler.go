package handler

import (
	"game-api/internal/domain/models"
	"game-api/internal/interfaces"
	"game-api/pkg/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	dashboardService interfaces.DashboardService
}

// NewDashboardHandler 創建儀表板處理器
func NewDashboardHandler(
	dashboardService interfaces.DashboardService,
) *DashboardHandler {
	return &DashboardHandler{
		dashboardService: dashboardService,
	}
}

// RegisterRoutes 註冊路由
func (h *DashboardHandler) RegisterRoutes(api *gin.RouterGroup, auth gin.HandlerFunc) {
	dashboard := api.Group("/dashboard")
	dashboard.Use(auth)
	{
		dashboard.GET("/data", h.GetDashboardData)
		dashboard.POST("/notifications/read", h.MarkAllNotificationsAsRead)
	}
}

// @Summary 獲取儀表板數據
// @Description 獲取管理員儀表板所需的所有數據，包括摘要、收入圖表、熱門遊戲和通知等
// @Tags 儀表板
// @Accept json
// @Produce json
// @Security Bearer
// @Param time_range query string false "時間範圍：today/week/month/year"
// @Success 200 {object} utils.Response{data=models.DashboardResponse}
// @Failure 400 {object} utils.Response
// @Failure 401 {object} utils.Response
// @Failure 500 {object} utils.Response
// @Router /api/dashboard/data [get]
func (h *DashboardHandler) GetDashboardData(c *gin.Context) {
	timeRange := c.DefaultQuery("time_range", "today")

	req := models.DashboardRequest{
		TimeRange: timeRange,
	}

	data, err := h.dashboardService.GetDashboardData(c, req)
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "獲取儀表板數據失敗："+err.Error())
		return
	}

	utils.Success(c, data)
}

// @Summary 將所有通知標記為已讀
// @Description 將當前管理員的所有未讀通知標記為已讀
// @Tags 儀表板
// @Accept json
// @Produce json
// @Security Bearer
// @Success 200 {object} utils.Response
// @Failure 401 {object} utils.Response
// @Failure 500 {object} utils.Response
// @Router /api/dashboard/notifications/read [post]
func (h *DashboardHandler) MarkAllNotificationsAsRead(c *gin.Context) {
	// 從上下文中獲取管理員 ID
	adminID, exists := c.Get("adminID")
	if !exists {
		utils.Error(c, http.StatusUnauthorized, "未找到管理員信息")
		return
	}

	err := h.dashboardService.MarkAllNotificationsAsRead(c, adminID.(string))
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "標記通知為已讀失敗："+err.Error())
		return
	}

	utils.Success(c, gin.H{"message": "已將所有通知標記為已讀"})
}
