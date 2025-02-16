package handler

import (
	"net/http"
	"passontw-slot-game/internal/service"

	"strconv"

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

type CreateUserRequest struct {
	Name     string `json:"name" binding:"required,min=1,max=20" example:"testdemo001"`
	Phone    string `json:"phone" binding:"required,min=1,max=20" example:"0987654321"`
	Password string `json:"password" binding:"required,min=6,max=50" example:"a12345678"`
}

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total" example:"200"`
	Page       int         `json:"page" example:"1"`
	PageSize   int         `json:"page_size" example:"10"`
	TotalPages int         `json:"total_pages" example:"20"`
}

// GetUsers godoc
// @Summary      Get users list
// @Description  get paginated users list
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        page query     int false "Page number (default: 1)"
// @Param        page_size query int false "Page size (default: 10)"
// @Success      200  {object}  PaginatedResponse
// @Router       /api/v1/users [get]
func (h *UserHandler) GetUsers(c *gin.Context) {
	// 獲取分頁參數
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}

	pageSize, err := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	if err != nil || pageSize < 1 {
		pageSize = 10
	}

	// 限制最大頁面大小
	if pageSize > 100 {
		pageSize = 100
	}

	// 獲取用戶列表
	users, total, err := h.userService.GetUsers(page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get users"})
		return
	}

	// 計算總頁數
	totalPages := (int(total) + pageSize - 1) / pageSize

	c.JSON(http.StatusOK, PaginatedResponse{
		Data:       users,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	})
}

// CreateUser godoc
// @Summary      Create user
// @Description  create new user
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        request body     CreateUserRequest true "Create User Request"
// @Success      201  {object}  entity.User
// @Failure      400  {object}  map[string]string
// @Router       /api/v1/users [post]
func (h *UserHandler) CreateUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.userService.CreateUser(req.Name, req.Phone, req.Password)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, user)
}
