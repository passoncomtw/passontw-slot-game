package handler

import (
	"net/http"
	"passontw-slot-game/internal/service"

	"github.com/gin-gonic/gin"
)

type HelloHandler struct {
	helloService service.HelloService
}

func NewHelloHandler(helloService service.HelloService) *HelloHandler {
	return &HelloHandler{
		helloService: helloService,
	}
}

func (h *HelloHandler) HelloWorld(c *gin.Context) {
	message := h.helloService.GetGreeting()
	c.JSON(http.StatusOK, gin.H{
		"message": message,
	})
}
