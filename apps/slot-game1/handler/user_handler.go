package handler

import (
	"net/http"
	"passontw-slot-game/apps/slot-game1/interfaces"
	"passontw-slot-game/apps/slot-game1/interfaces/types"
	"passontw-slot-game/apps/slot-game1/service"
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

// GetUsers godoc
// @Summary      Get users list
// @Description  get paginated users list
// @Tags         users
// @Accept       json
// @Produce      json
// @Security     Bearer
// @Param        page query     int false "Page number (default: 1)"
// @Param        page_size query int false "Page size (default: 10)"
// @Success      200  {object}  interfaces.PaginatedResponse
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

	c.JSON(http.StatusOK, interfaces.PaginatedResponse{
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
// @Param        request body interfaces.CreateUserRequest true "Create User Request"
// @Success      201  {object}  interfaces.CreateUserResponse
// @Failure      400  {object}  types.ErrorResponse
// @Router       /api/v1/users [post]
func (h *UserHandler) CreateUser(c *gin.Context) {
	var req interfaces.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error: "Invalid request parameters",
			Code:  http.StatusBadRequest,
		})
		return
	}

	if req.InitialBalance < 0 {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
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
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error: err.Error(),
			Code:  http.StatusBadRequest,
		})
		return
	}

	response := interfaces.CreateUserResponse{
		ID:               user.ID,
		Name:             user.Name,
		Phone:            user.Phone,
		AvailableBalance: user.AvailableBalance,
		FrozenBalance:    user.FrozenBalance,
	}

	c.JSON(http.StatusCreated, response)
}
