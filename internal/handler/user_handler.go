package handler

import (
	"net/http"
	"passontw-slot-game/internal/service"

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
	Name     string `json:"name" binding:"required,min=1,max=20"`
	Phone    string `json:"phone" binding:"required,min=1,max=20"`
	Password string `json:"password" binding:"required,min=6,max=50"`
}

// GetUsers godoc
// @Summary      Get users message
// @Description  get users message
// @Tags         users
// @Accept       json
// @Produce      json
// @Success      200  {object}  map[string]string
// @Router       /api/v1/users [get]
func (h *UserHandler) GetUsers(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "get users",
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
