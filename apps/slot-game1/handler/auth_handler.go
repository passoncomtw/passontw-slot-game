package handler

import (
	"fmt"
	"net/http"

	"passontw-slot-game/apps/slot-game1/interfaces"
	"passontw-slot-game/apps/slot-game1/interfaces/types"
	"passontw-slot-game/apps/slot-game1/service"

	redis "passontw-slot-game/pkg/redisManager"
	"time"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	userService  service.UserService
	redisManager redis.RedisManager
}

func NewAuthHandler(userService service.UserService, redisManager redis.RedisManager) *AuthHandler {
	return &AuthHandler{
		userService:  userService,
		redisManager: redisManager,
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

	tokenKey := fmt.Sprintf("user:token:%d", user.ID)
	err = h.redisManager.Set(c, tokenKey, token, 24*time.Hour)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store token"})
		return
	}

	c.JSON(http.StatusOK, interfaces.LoginResponse{
		Token: token,
		User:  user,
	})
}

// Logout godoc
// @Summary      User logout
// @Description  Logout
// @Tags         auth
// @Accept       json
// @Produce      json
// @Security     Bearer
// @Success      200  {object}  nil
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Router       /api/v1/auth/logout [post]
func (h *AuthHandler) UserLogout(c *gin.Context) {
	userID, ok := c.Get("userId")
	if !ok {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error: "User not authenticated",
			Code:  http.StatusUnauthorized,
		})
		return
	}

	tokenKey := fmt.Sprintf("user:token:%d", userID)
	err := h.redisManager.Delete(c, tokenKey)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to logout"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}
