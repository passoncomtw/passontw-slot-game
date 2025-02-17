package handler

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type WebSocketHandler struct {
	clients map[*websocket.Conn]bool
}

func NewWebSocketHandler() *WebSocketHandler {
	return &WebSocketHandler{
		clients: make(map[*websocket.Conn]bool),
	}
}

func (h *WebSocketHandler) HandleWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade connection: %v", err)
		return
	}

	h.clients[conn] = true

	defer func() {
		conn.Close()
		delete(h.clients, conn)
	}()

	for {
		messageType, message, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket read error: %v", err)
			}
			break
		}
		h.broadcast(messageType, message)
	}
}

// broadcast 將訊息發送給所有連線的客戶端
func (h *WebSocketHandler) broadcast(messageType int, message []byte) {
	for client := range h.clients {
		err := client.WriteMessage(messageType, message)
		if err != nil {
			log.Printf("WebSocket write error: %v", err)
			client.Close()
			delete(h.clients, client)
		}
	}
}
