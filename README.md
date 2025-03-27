# Prompt

## app 前端 app

我想開發一個ai slot game app，現在需要輸出原型圖，請通過以下方式幫我完成app所有原型圖片的設計。
1、思考用户需要ai slot game 實現哪些功能
2、作為產品經理規劃這些界面
3、作為設計師思考這些原型界面的設計
4、使用html在一個界面上生成所有的原型界面，可以使用FontAwesome等開源圖標庫，讓原型顯得更精美和接近真實
5、針對字型與排版做美化
我希望這些界面是需要能直接拿去進行開發的
檔案存在wireframes/ai-slot-game.html

## Backend 後台管理系統

### Step 1

參考 ai-slot-game.html 的app 原型
建構網頁的後台管理系統
1、思考用户需要ai slot game 後台 實現哪些功能
2、作為產品經理規劃這些界面
3、作為設計師思考這些原型界面的設計
4、使用html在一個界面上生成所有的原型界面，可以使用FontAwesome等開源圖標庫， css 使用 Tailwind CSS 讓原型顯得更精美和接近真實
5、針對字型與排版做美化
我希望這些界面是需要能直接拿去進行開發的
檔案存在wireframes/ai-slot-game-backend.html

### Step 2

建構網頁的後台管理系統 詳細的原型
拆分成多個檔案，檔案之間互相連結方便開發者和老闆清晰的了解工作流
1. 你是資深產品經理
2. 實作並規劃功能
  * 後台管理者登入與登出
  * 儀表板
    * 保留ai-slot-game-backend.html 中儀表板頁面
  * 遊戲列表
    * 新增遊戲
    * 上下架遊戲
  * 用戶列表
    * 新增用戶
    * 凍結用戶
    * 編輯用戶
    * 用戶儲值
  * 交易列表
    * 交易列表，顯示包含儲值與下注的交易列表資訊
  * 操作日誌
    * 操作列表: 包含遊戲，用戶，交易的所有動作列表
3、作為設計師參考 ai-slot-game.html 的app 原型 和 ai-slot-backend.html  後台的基本原型 在改動作小的前提下產出
4、使用html在一個界面上生成所有的原型界面，可以使用FontAwesome等開源圖標庫，讓原型顯得更精美和接近真實
5、針對字型與排版做美化
我希望這些界面是需要能直接拿去進行開發的
檔案存在wireframes/backend/

##  實作 app ui

依據 ./wireframes/ai-slot-game.html
使用 react-native 實作 route 與所有功能
檔案放在 game-app

## 實作 App Database 

1. 你是一個資深的 DBA 工程師
2. 使用 PostrgreSQL 資料庫，依據 ./wireframes/ai-slot-game.html 建立初始化的 SQL 檔案，
3. 依據 DBA 工程師來做資料庫的設定與資料表的正規化，盡量提升效率
4. 我希望這些 SQL 可以直接使用來開發 API 服務，
檔案存在 migrations/froentend/initial.sql

## 實作 App 與 Admin 登入和後台會員的 CRUD

### STEP 1

1. 你是資深的Golang 後端工程師, 參照 sql 的格式和 Wireframe 設計API並且實作
2. game-api 是 Golang 的 api 服務，新增 API 規則與架構都以這個架構為主
3. 依照 froentend/initial.sql 和 backend/initial.sql做資料庫
建立 API
* App 登入的 API
* 後端登入的 api
* 登入後使用 JWT 
* 使用者列表的api 包含分頁系統(header 需要帶authorization: Bearer token)
* 新增用戶 API(header 需要帶authorization: Bearer token)
* 用戶儲值 API(header 需要帶authorization: Bearer token)
* 用戶凍結和解凍 API(header 需要帶authorization: Bearer token)

### STEP 2

package websocketManager

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	// 心跳間隔設置為15秒，避開30秒超時
	heartbeatInterval = 15 * time.Second
	// 連接超時設置
	readTimeout  = 30 * time.Second
	writeTimeout = 10 * time.Second
	// 最大重連次數
	maxReconnectAttempts = 5
	// 重連基礎間隔
	baseReconnectDelay = 2 * time.Second
	// 非活躍連接超時（5分鐘）
	inactivityTimeout = 5 * time.Minute
)

// 客戶端結構體，代表一個 WebSocket 連接
type Client struct {
	ID              string          // 客戶端唯一標識
	UserID          uint            // 用戶 ID
	Conn            *websocket.Conn // WebSocket 連接
	Send            chan []byte     // 發送訊息的通道
	manager         *Manager        // 所屬的管理器
	LastActivity    time.Time       // 最後活動時間
	IsAuthed        bool            // 是否已認證
	reconnectCount  int             // 重連次數
	closeChan       chan struct{}   // 關閉通道
	heartbeatTicker *time.Ticker    // 心跳定時器
	connMutex       sync.Mutex      // 連接鎖，防止並發讀寫
}

// 客戶端狀態
type ClientState int

const (
	StateDisconnected ClientState = iota
	StateConnecting
	StateConnected
	StateFailed
)

// 訊息結構體
type Message struct {
	Type    string      `json:"type"`              // 訊息類型
	Content interface{} `json:"content,omitempty"` // 訊息內容
	From    string      `json:"from,omitempty"`    // 發送方
	To      string      `json:"to,omitempty"`      // 接收方
}

// 心跳訊息
type HeartbeatMessage struct {
	Type      string `json:"type"`
	Timestamp int64  `json:"timestamp"`
}

// WebSocket 管理器結構體
type Manager struct {
	clients     map[string]*Client               // 所有已連接的客戶端
	userClients map[uint]map[string]bool         // 用戶ID對應的客戶端map
	broadcast   chan []byte                      // 廣播訊息的通道
	register    chan *Client                     // 註冊客戶端的通道
	unregister  chan *Client                     // 註銷客戶端的通道
	shutdown    chan struct{}                    // 關閉的通道
	auth        func(token string) (uint, error) // 認證函數
	mutex       sync.RWMutex                     // 讀寫鎖
}

// 創建新的 WebSocket 管理器
func NewManager(authFunc func(token string) (uint, error)) *Manager {
	return &Manager{
		clients:     make(map[string]*Client),
		userClients: make(map[uint]map[string]bool),
		broadcast:   make(chan []byte, 100), // 增大緩衝區
		register:    make(chan *Client, 10),
		unregister:  make(chan *Client, 10),
		shutdown:    make(chan struct{}),
		auth:        authFunc,
		mutex:       sync.RWMutex{},
	}
}

// 啟動 WebSocket 管理器
func (manager *Manager) Start(ctx context.Context) {
	log.Println("WebSocket Manager: Starting...")

	// 創建獨立的上下文確保完整的生命週期
	if ctx == nil {
		var cancel context.CancelFunc
		ctx, cancel = context.WithCancel(context.Background())
		defer cancel()
		log.Println("WebSocket Manager: Using fallback background context")
	}

	// 恢復panic以防止整個服務崩潰
	defer func() {
		if r := recover(); r != nil {
			log.Printf("WebSocket Manager: Recovered from panic: %v", r)
		}
	}()

	// 非活躍連接檢查定時器
	inactivityTicker := time.NewTicker(1 * time.Minute)
	defer inactivityTicker.Stop()

	log.Println("WebSocket Manager: Running main event loop")
	running := true

	for running {
		select {
		case <-ctx.Done():
			log.Println("WebSocket Manager: Context cancelled, shutting down...")
			manager.cleanupAllConnections()
			running = false

		case client, ok := <-manager.register:
			if !ok {
				log.Println("WebSocket Manager: Register channel closed")
				continue
			}

			manager.mutex.Lock()
			manager.clients[client.ID] = client
			manager.mutex.Unlock()
			log.Printf("WebSocket Manager: Client %s registered\n", client.ID)

		case client, ok := <-manager.unregister:
			if !ok {
				log.Println("WebSocket Manager: Unregister channel closed")
				continue
			}

			manager.removeClient(client)

		case message, ok := <-manager.broadcast:
			if !ok {
				log.Println("WebSocket Manager: Broadcast channel closed")
				continue
			}

			manager.broadcastMessage(message)

		case <-inactivityTicker.C:
			manager.cleanupInactiveConnections()
		}
	}

	log.Println("WebSocket Manager: Event loop terminated")
}

// 清理所有連接
func (manager *Manager) cleanupAllConnections() {
	manager.mutex.Lock()
	defer manager.mutex.Unlock()

	log.Printf("WebSocket Manager: Cleaning up all %d connections", len(manager.clients))

	for _, client := range manager.clients {
		if client.heartbeatTicker != nil {
			client.heartbeatTicker.Stop()
		}

		if client.closeChan != nil {
			close(client.closeChan)
		}

		client.Conn.Close()
		close(client.Send)
	}

	// 清空映射
	manager.clients = make(map[string]*Client)
	manager.userClients = make(map[uint]map[string]bool)
}

// 移除指定客戶端
func (manager *Manager) removeClient(client *Client) {
	if _, ok := manager.clients[client.ID]; !ok {
		return
	}

	manager.mutex.Lock()
	defer manager.mutex.Unlock()

	// 從用戶-客戶端映射中移除
	if client.IsAuthed {
		delete(manager.userClients[client.UserID], client.ID)
		// 如果用戶沒有其他客戶端連接，則刪除用戶映射
		if len(manager.userClients[client.UserID]) == 0 {
			delete(manager.userClients, client.UserID)
		}
	}

	// 停止心跳
	if client.heartbeatTicker != nil {
		client.heartbeatTicker.Stop()
	}

	// 關閉信號通道
	if client.closeChan != nil {
		close(client.closeChan)
	}

	// 關閉連接
	client.Conn.Close()

	// 關閉發送通道
	close(client.Send)

	// 從客戶端列表中刪除
	delete(manager.clients, client.ID)

	log.Printf("WebSocket Manager: Client %s unregistered\n", client.ID)
}

// 廣播消息到所有客戶端
func (manager *Manager) broadcastMessage(message []byte) {
	manager.mutex.RLock()
	defer manager.mutex.RUnlock()

	failedClients := make([]string, 0)

	for id, client := range manager.clients {
		select {
		case client.Send <- message:
			// 消息已送入通道
		default:
			// 發送通道已滿或已關閉，記錄待移除的客戶端
			failedClients = append(failedClients, id)
		}
	}

	// 如果有發送失敗的客戶端，解鎖後移除它們
	if len(failedClients) > 0 {
		manager.mutex.RUnlock()
		manager.mutex.Lock()

		for _, id := range failedClients {
			if client, exists := manager.clients[id]; exists {
				log.Printf("WebSocket Manager: Removing client %s due to full send buffer", id)

				// 停止心跳
				if client.heartbeatTicker != nil {
					client.heartbeatTicker.Stop()
				}

				// 關閉信號通道
				if client.closeChan != nil {
					close(client.closeChan)
				}

				// 關閉連接
				client.Conn.Close()

				// 從用戶映射中移除
				if client.IsAuthed {
					delete(manager.userClients[client.UserID], id)
					if len(manager.userClients[client.UserID]) == 0 {
						delete(manager.userClients, client.UserID)
					}
				}

				// 關閉發送通道
				close(client.Send)

				// 從客戶端列表中刪除
				delete(manager.clients, id)
			}
		}

		manager.mutex.Unlock()
		manager.mutex.RLock()
	}
}

// 清理非活躍連接
func (manager *Manager) cleanupInactiveConnections() {
	threshold := time.Now().Add(-inactivityTimeout)

	manager.mutex.Lock()
	defer manager.mutex.Unlock()

	inactiveCount := 0

	for id, client := range manager.clients {
		if client.LastActivity.Before(threshold) {
			inactiveCount++
			log.Printf("WebSocket Manager: Client %s inactive for too long, closing connection", id)

			// 停止心跳
			if client.heartbeatTicker != nil {
				client.heartbeatTicker.Stop()
			}

			// 關閉信號通道
			if client.closeChan != nil {
				close(client.closeChan)
			}

			// 關閉連接
			client.Conn.Close()

			// 從用戶映射中移除
			if client.IsAuthed {
				delete(manager.userClients[client.UserID], id)
				if len(manager.userClients[client.UserID]) == 0 {
					delete(manager.userClients, client.UserID)
				}
			}

			// 關閉發送通道
			close(client.Send)

			// 從客戶端列表中刪除
			delete(manager.clients, id)
		}
	}

	if inactiveCount > 0 {
		log.Printf("WebSocket Manager: Removed %d inactive connections", inactiveCount)
	}
}

// 驗證客戶端
func (manager *Manager) AuthenticateClient(client *Client, token string) error {
	userID, err := manager.auth(token)
	if err != nil {
		return err
	}

	manager.mutex.Lock()
	defer manager.mutex.Unlock()

	client.UserID = userID
	client.IsAuthed = true

	// 將客戶端添加到用戶-客戶端映射
	if _, exists := manager.userClients[userID]; !exists {
		manager.userClients[userID] = make(map[string]bool)
	}
	manager.userClients[userID][client.ID] = true

	log.Printf("WebSocket Manager: Client %s authenticated for user %d\n", client.ID, userID)
	return nil
}

// 廣播訊息給所有已認證的客戶端
func (manager *Manager) BroadcastToAll(message interface{}) error {
	msgBytes, err := json.Marshal(message)
	if err != nil {
		return err
	}

	manager.broadcast <- msgBytes
	return nil
}

// 向指定用戶發送訊息
func (manager *Manager) SendToUser(userID uint, message interface{}) error {
	msgBytes, err := json.Marshal(message)
	if err != nil {
		return err
	}

	manager.mutex.RLock()
	defer manager.mutex.RUnlock()

	// 檢查用戶是否有連接的客戶端
	clientMap, exists := manager.userClients[userID]
	if !exists || len(clientMap) == 0 {
		return fmt.Errorf("no connected clients for user %d", userID)
	}

	// 發送訊息給用戶的所有客戶端
	for clientID := range clientMap {
		if client, ok := manager.clients[clientID]; ok && client.IsAuthed {
			select {
			case client.Send <- msgBytes:
				// 訊息已送入通道
			default:
				// 發送通道已滿或已關閉，移除客戶端
				client.connMutex.Lock()
				if client.heartbeatTicker != nil {
					client.heartbeatTicker.Stop()
				}
				if client.closeChan != nil {
					close(client.closeChan)
				}
				client.Conn.Close()
				client.connMutex.Unlock()

				// 移除用戶客戶端映射
				delete(manager.userClients[userID], clientID)
				if len(manager.userClients[userID]) == 0 {
					delete(manager.userClients, userID)
				}

				// 移除客戶端
				close(client.Send)
				delete(manager.clients, clientID)
				log.Printf("WebSocket Manager: Client %s removed (failed to send to user)\n", clientID)
			}
		}
	}

	return nil
}

// 客戶端讀取訊息
func (client *Client) ReadPump() {
	// 初始化關閉通道
	client.closeChan = make(chan struct{})

	defer func() {
		client.manager.unregister <- client
		client.Conn.Close()
	}()

	// 設置讀取參數
	client.Conn.SetReadLimit(4096) // 4KB
	client.Conn.SetReadDeadline(time.Now().Add(readTimeout))

	// 設置Pong處理器，更新最後活動時間
	client.Conn.SetPongHandler(func(string) error {
		client.connMutex.Lock()
		client.Conn.SetReadDeadline(time.Now().Add(readTimeout))
		client.LastActivity = time.Now()
		client.connMutex.Unlock()
		return nil
	})

	// 啟動心跳
	client.StartHeartbeat()

	for {
		select {
		case <-client.closeChan:
			return
		default:
			_, message, err := client.Conn.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					log.Printf("WebSocket Manager: Client %s unexpected close: %v\n", client.ID, err)
				}
				return
			}

			client.connMutex.Lock()
			client.LastActivity = time.Now()
			client.Conn.SetReadDeadline(time.Now().Add(readTimeout))
			client.connMutex.Unlock()

			// 處理接收到的訊息
			var msg Message
			if err := json.Unmarshal(message, &msg); err != nil {
				log.Printf("WebSocket Manager: Error unmarshaling message from client %s: %v\n", client.ID, err)
				continue
			}

			// 處理心跳訊息
			if msg.Type == "heartbeat" {
				// 客戶端發送的心跳，直接回應
				heartbeatResponse := HeartbeatMessage{
					Type:      "heartbeat",
					Timestamp: time.Now().UnixNano() / int64(time.Millisecond),
				}
				responseBytes, _ := json.Marshal(heartbeatResponse)
				client.Send <- responseBytes
				continue
			}

			// 處理其他訊息...
			log.Printf("WebSocket Manager: Received message from client %s: %s\n", client.ID, message)
		}
	}
}

// 客戶端寫入訊息
func (client *Client) WritePump() {
	defer func() {
		client.Conn.Close()
	}()

	for {
		select {
		case <-client.closeChan:
			return
		case message, ok := <-client.Send:
			client.connMutex.Lock()
			client.Conn.SetWriteDeadline(time.Now().Add(writeTimeout))
			client.connMutex.Unlock()

			if !ok {
				// 通道已關閉
				client.connMutex.Lock()
				client.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				client.connMutex.Unlock()
				return
			}

			client.connMutex.Lock()
			w, err := client.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				client.connMutex.Unlock()
				return
			}

			w.Write(message)

			// 將佇列中的其他訊息也一起發送
			n := len(client.Send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-client.Send)
			}

			if err := w.Close(); err != nil {
				client.connMutex.Unlock()
				return
			}
			client.connMutex.Unlock()
		}
	}
}

// 開始心跳
func (client *Client) StartHeartbeat() {
	// 停止舊的心跳計時器（如果存在）
	if client.heartbeatTicker != nil {
		client.heartbeatTicker.Stop()
	}

	// 創建新的心跳計時器
	client.heartbeatTicker = time.NewTicker(heartbeatInterval)

	// 啟動心跳協程
	go func() {
		for {
			select {
			case <-client.closeChan:
				return
			case <-client.heartbeatTicker.C:
				// 發送Ping訊息
				client.connMutex.Lock()
				if err := client.Conn.WriteControl(websocket.PingMessage, []byte{}, time.Now().Add(writeTimeout)); err != nil {
					log.Printf("WebSocket Manager: Client %s ping error: %v\n", client.ID, err)
					client.connMutex.Unlock()
					// 嘗試重連
					client.attemptReconnect()
					return
				}
				client.connMutex.Unlock()

				// 發送應用層心跳訊息
				heartbeat := HeartbeatMessage{
					Type:      "heartbeat",
					Timestamp: time.Now().UnixNano() / int64(time.Millisecond),
				}
				heartbeatBytes, _ := json.Marshal(heartbeat)

				select {
				case client.Send <- heartbeatBytes:
					// 心跳已送入通道
				default:
					// 發送通道已滿，可能需要處理
					log.Printf("WebSocket Manager: Client %s send channel full, cannot send heartbeat\n", client.ID)
				}
			}
		}
	}()
}

// 嘗試重連
func (client *Client) attemptReconnect() {
	if client.reconnectCount >= maxReconnectAttempts {
		log.Printf("WebSocket Manager: Client %s exceeded maximum reconnection attempts\n", client.ID)
		return
	}

	client.reconnectCount++
	backoff := time.Duration(1<<uint(client.reconnectCount-1)) * baseReconnectDelay
	if backoff > 30*time.Second {
		backoff = 30 * time.Second
	}

	log.Printf("WebSocket Manager: Client %s attempting reconnect in %v (attempt %d/%d)\n",
		client.ID, backoff, client.reconnectCount, maxReconnectAttempts)

	time.Sleep(backoff)

	// 實際的重連邏輯需要客戶端實現，這裡是服務端
}

// 關閉連接
func (manager *Manager) Shutdown() {
	log.Println("WebSocket Manager: Shutdown initiated, closing all connections...")

	// 通知所有客戶端關閉
	manager.mutex.Lock()
	clientCount := len(manager.clients)

	for id, client := range manager.clients {
		log.Printf("WebSocket Manager: Closing connection for client %s", id)

		if client.heartbeatTicker != nil {
			client.heartbeatTicker.Stop()
		}

		if client.closeChan != nil {
			close(client.closeChan)
		}

		// 向客戶端發送關閉消息
		closeMsg := websocket.FormatCloseMessage(websocket.CloseNormalClosure, "Server shutting down")
		_ = client.Conn.WriteControl(websocket.CloseMessage, closeMsg, time.Now().Add(time.Second))

		client.Conn.Close()
		close(client.Send)
	}

	// 清空客戶端映射
	manager.clients = make(map[string]*Client)
	manager.userClients = make(map[uint]map[string]bool)
	manager.mutex.Unlock()

	// 關閉管理器的shutdown通道
	close(manager.shutdown)

	log.Printf("WebSocket Manager: Successfully closed %d connections", clientCount)
}
