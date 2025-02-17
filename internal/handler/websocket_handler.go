package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"passontw-slot-game/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Client struct {
	conn     *websocket.Conn
	handler  *WebSocketHandler
	send     chan []byte
	userID   string
	userName string
}

type Message struct {
	Type    string      `json:"type"`
	Content interface{} `json:"content"`
}

type WebSocketHandler struct {
	clients     map[*Client]bool
	broadcast   chan []byte
	authService service.AuthService
}

func NewWebSocketHandler(authService service.AuthService) *WebSocketHandler {
	return &WebSocketHandler{
		clients:     make(map[*Client]bool),
		broadcast:   make(chan []byte),
		authService: authService,
	}
}

func (h *WebSocketHandler) HandleWebSocket(c *gin.Context) {
	// 驗證 token
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
		return
	}

	// 解析 token
	parsedToken, err := h.authService.ValidateToken(token)
	log.Printf("Token validation result: %v", parsedToken)
	if err != nil {
		log.Printf("Token validation error: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
		return
	}

	// 檢查 token 是否有效並提取 claims
	claims, ok := parsedToken.Claims.(jwt.MapClaims)
	log.Printf("Claims extracted: %v", claims)

	if !ok || !parsedToken.Valid {
		log.Printf("Invalid claims or token")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
		return
	}

	// 升級連接
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade connection: %v", err)
		return
	}

	// 從 claims 中提取用戶信息
	userID := fmt.Sprintf("%v", claims["sub"]) // 使用 fmt.Sprintf 來安全轉換
	userName := fmt.Sprintf("%v", claims["name"])
	log.Printf("User connected - ID: %s, Name: %s", userID, userName)

	// 創建新客戶端
	client := &Client{
		conn:     conn,
		handler:  h,
		send:     make(chan []byte, 256),
		userID:   userID,
		userName: userName,
	}

	h.clients[client] = true

	// 發送歡迎消息
	welcome := Message{
		Type: "welcome",
		Content: map[string]string{
			"message": "Welcome " + userName,
			"userId":  userID,
		},
	}
	welcomeBytes, err := json.Marshal(welcome)
	if err != nil {
		log.Printf("Error marshaling welcome message: %v", err)
	} else {
		log.Printf("Sending welcome message: %s", string(welcomeBytes))
		if err := conn.WriteMessage(websocket.TextMessage, welcomeBytes); err != nil {
			log.Printf("Error sending welcome message: %v", err)
		}
	}

	// 處理連線
	go func() {
		defer func() {
			log.Printf("Client disconnected - ID: %s, Name: %s", userID, userName)
			conn.Close()
			delete(h.clients, client)
		}()

		for {
			messageType, message, err := conn.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					log.Printf("Read error: %v", err)
				}
				break
			}
			log.Printf("Received message from %s: %s", userName, string(message))

			// 廣播消息給所有客戶端
			response := Message{
				Type: "message",
				Content: map[string]interface{}{
					"userId":   client.userID,
					"userName": client.userName,
					"message":  string(message),
				},
			}
			responseBytes, _ := json.Marshal(response)
			log.Printf("Broadcasting message: %s", string(responseBytes))

			for c := range h.clients {
				if err := c.conn.WriteMessage(messageType, responseBytes); err != nil {
					log.Printf("Error broadcasting to client: %v", err)
				}
			}
		}
	}()
}

// broadcast 將訊息發送給所有連線的客戶端
// func (h *WebSocketHandler) broadcast(messageType int, message []byte) {
// 	for client := range h.clients {
// 		err := client.WriteMessage(messageType, message)
// 		if err != nil {
// 			log.Printf("WebSocket write error: %v", err)
// 			client.Close()
// 			delete(h.clients, client)
// 		}
// 	}
// }
