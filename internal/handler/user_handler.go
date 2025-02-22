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
	Name           string  `json:"name" binding:"required,min=1,max=20" example:"testdemo001"`
	Phone          string  `json:"phone" binding:"required,min=1,max=20" example:"0987654321"`
	Password       string  `json:"password" binding:"required,min=6,max=50" example:"a12345678"`
	InitialBalance float64 `json:"initial_balance,omitempty" example:"1000.00"`
}

type CreateUserResponse struct {
	ID               int     `json:"id" example:"1"`
	Name             string  `json:"name" example:"testdemo001"`
	Phone            string  `json:"phone" example:"0987654321"`
	AvailableBalance float64 `json:"available_balance" example:"1000.00"`
	FrozenBalance    float64 `json:"frozen_balance" example:"0.00"`
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
// @Security     Bearer
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
// @Security     Bearer
// @Param        request body     CreateUserRequest true "Create User Request"
// @Success      201  {object}  CreateUserResponse
// @Failure      400  {object}  ErrorResponse
// @Router       /api/v1/users [post]
func (h *UserHandler) CreateUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: "Invalid request parameters",
			Code:  http.StatusBadRequest,
		})
		return
	}

	if req.InitialBalance < 0 {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: "Initial balance cannot be negative",
			Code:  http.StatusBadRequest,
		})
		return
	}

	user, err := h.userService.CreateUser(service.CreateUserParams{
		Name:           req.Name,
		Phone:          req.Phone,
		Password:       req.Password,
		InitialBalance: req.InitialBalance,
	})

	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: err.Error(),
			Code:  http.StatusBadRequest,
		})
		return
	}

	response := CreateUserResponse{
		ID:               user.ID,
		Name:             user.Name,
		Phone:            user.Phone,
		AvailableBalance: user.AvailableBalance,
		FrozenBalance:    user.FrozenBalance,
	}

	c.JSON(http.StatusCreated, response)
}
