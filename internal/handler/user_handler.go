package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type UserHandler struct{}

func NewUserHandler() *UserHandler {
	return &UserHandler{}
}

// GetUsers godoc
// @Summary      Get users
// @Description  get users message
// @Tags         users
// @Accept       json
// @Produce      json
// @Success      200  {object}  map[string]string
// @Router       /users [get]
func (h *UserHandler) GetUsers(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "get users",
	})
}
