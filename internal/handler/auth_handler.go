package handler

import (
	"net/http"
	"passontw-slot-game/internal/interfaces"
	"passontw-slot-game/internal/service"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	userService service.UserService
}

func NewAuthHandler(userService service.UserService) *AuthHandler {
	return &AuthHandler{
		userService: userService,
	}
}

// Login godoc
// @Summary      User login
// @Description  Login with phone and password
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        request body interfaces.LoginRequest true "Login credentials"
// @Success      200  {object}  interfaces.LoginResponse
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Router       /api/v1/auth [post]
func (h *AuthHandler) userLogin(c *gin.Context) {
	var req interfaces.LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, token, err := h.userService.Login(req.Phone, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, interfaces.LoginResponse{
		Token: token,
		User:  user,
	})
}
