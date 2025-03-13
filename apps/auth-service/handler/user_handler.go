package handler

import (
	"net/http"
	"passontw-slot-game/apps/auth-service/service"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	userService service.UserService
}

func NewUserHandler(userService service.UserService) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

// 創建用戶
// @Summary 創建新用戶
// @Description 使用提供的信息創建新用戶
// @Tags users
// @Accept json
// @Produce json
// @Param data body service.CreateUserParams true "用戶信息"
// @Success 201 {object} service.User "創建成功"
// @Failure 400 {object} interfaces.ErrorResponse "請求錯誤"
// @Failure 500 {object} interfaces.ErrorResponse "服務器錯誤"
// @Router /api/v1/users [post]
func (h *UserHandler) CreateUser(c *gin.Context) {
	var params service.CreateUserParams
	if err := c.ShouldBindJSON(&params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.userService.CreateUser(&params)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, user)
}

// 獲取用戶列表
// @Summary 獲取所有用戶
// @Description 返回系統中的所有用戶
// @Tags users
// @Accept json
// @Produce json
// @Security Bearer
// @Success 200 {array} service.User "用戶列表"
// @Failure 401 {object} interfaces.ErrorResponse "未授權"
// @Failure 500 {object} interfaces.ErrorResponse "服務器錯誤"
// @Router /api/v1/users [get]
func (h *UserHandler) GetUsers(c *gin.Context) {
	users, err := h.userService.GetUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, users)
}
