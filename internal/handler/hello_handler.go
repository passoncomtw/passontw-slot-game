package handler

import (
	"net/http"
	"passontw-slot-game/internal/service"

	"github.com/gin-gonic/gin"
)

// MessageResponse 表示返回的消息结构
type MessageResponse struct {
	Message string `json:"message" example:"hello world!"`
}

// NewMessageResponse 创建一个带有默认值的 MessageResponse
// func NewMessageResponse() MessageResponse {
// 	return MessageResponse{
// 		Message: "hello world",
// 	}
// }

type HelloHandler struct {
	helloService service.HelloService
}

func NewHelloHandler(helloService service.HelloService) *HelloHandler {
	return &HelloHandler{
		helloService: helloService,
	}
}

// HelloWorld godoc
// @Summary      Show hello world message
// @Description  get hello world message
// @Tags         hello
// @Accept       json
// @Produce      json
// @Success      200  {object}  MessageResponse
// @Router       /hello [get]
func (h *HelloHandler) HelloWorld(c *gin.Context) {
	message := h.helloService.GetGreeting()
	c.JSON(http.StatusOK, gin.H{
		"message": message,
	})
}
