package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"passontw-slot-game/internal/service"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
)

const (
	// 時間配置
	writeWait      = 10 * time.Second    // 寫入超時
	pongWait       = 60 * time.Second    // pong 等待時間
	pingPeriod     = (pongWait * 9) / 10 // ping 發送週期
	maxMessageSize = 512                 // 最大消息大小
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
	register    chan *Client
	unregister  chan *Client
	authService service.AuthService
}

func NewWebSocketHandler(authService service.AuthService) *WebSocketHandler {
	h := &WebSocketHandler{
		clients:     make(map[*Client]bool),
		broadcast:   make(chan []byte),
		register:    make(chan *Client),
		unregister:  make(chan *Client),
		authService: authService,
	}
	// 啟動廣播處理
	go h.run()
	return h
}

func (h *WebSocketHandler) HandleWebSocket(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
		return
	}

	parsedToken, err := h.authService.ValidateToken(token)
	log.Printf("Token validation result: %v", parsedToken)
	if err != nil {
		log.Printf("Token validation error: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
		return
	}

	claims, ok := parsedToken.Claims.(jwt.MapClaims)
	if !ok || !parsedToken.Valid {
		log.Printf("Invalid claims or token")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade connection: %v", err)
		return
	}

	userID := fmt.Sprintf("%v", claims["sub"])
	userName := fmt.Sprintf("%v", claims["name"])
	log.Printf("User connected - ID: %s, Name: %s", userID, userName)

	client := &Client{
		conn:     conn,
		handler:  h,
		send:     make(chan []byte, 256),
		userID:   userID,
		userName: userName,
	}

	// 使用 register channel 註冊客戶端
	h.register <- client

	h.clients[client] = true

	// 發送歡迎消息
	welcome := Message{
		Type: "welcome",
		Content: map[string]string{
			"message": "Welcome " + userName,
			"userId":  userID,
		},
	}
	welcomeBytes, _ := json.Marshal(welcome)
	client.send <- welcomeBytes

	// 啟動讀寫 goroutines
	go client.writePump()
	go client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		c.handler.unregisterClient(c)
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		log.Printf("Received pong from user %s", c.userName)
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Read error: %v", err)
			}
			break
		}
		log.Printf("Received message from %s: %s", c.userName, string(message))

		response := Message{
			Type: "message",
			Content: map[string]interface{}{
				"userId":   c.userID,
				"userName": c.userName,
				"message":  string(message),
			},
		}
		responseBytes, _ := json.Marshal(response)
		c.handler.broadcast <- responseBytes
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			err := c.conn.WriteMessage(websocket.TextMessage, message)
			if err != nil {
				log.Printf("Error sending message to %s: %v", c.userName, err)
				return
			}
			log.Printf("Sent message to %s: %s", c.userName, string(message))

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			log.Printf("Sending ping to user %s", c.userName)
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				log.Printf("Error sending ping to %s: %v", c.userName, err)
				return
			}
		}
	}
}

func (h *WebSocketHandler) unregisterClient(client *Client) {
	h.unregister <- client
}

func (h *WebSocketHandler) run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
			log.Printf("Client registered: %s", client.userName)

		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				log.Printf("Client unregistered: %s", client.userName)
			}

		case message := <-h.broadcast:
			log.Printf("Broadcasting message to %d clients", len(h.clients))
			for client := range h.clients {
				select {
				case client.send <- message:
					// 成功發送消息
				default:
					// 如果 client.send channel 已滿，關閉連接
					close(client.send)
					delete(h.clients, client)
				}
			}
		}
	}
}
