# 老虎機遊戲應用程式

一個基於 React Native 和 Expo 的老虎機遊戲應用程式。

## 功能特色

- 使用 Redux 和 Redux Saga 進行狀態管理
- 身份驗證系統（登入、註冊、登出）
- 遊戲列表和遊戲詳情頁面
- 用戶資料和設定
- 排行榜系統
- 內置 Redux 調試工具

## 開發環境設置

### 前置條件

- Node.js 16+
- npm 或 yarn
- Expo CLI
- React Native DevTools (`npm install -g react-devtools`)

### 安裝步驟

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm start
```

## React Native DevTools

從 React Native 0.77 版本開始，JavaScript 日誌已從 Metro 中移除。為了有效進行調試，本專案已經配置為使用 React Native DevTools。

### 安裝 React Native DevTools

```bash
# 全局安裝 React Native DevTools
npm install -g react-devtools
```

### 如何使用 DevTools

1. 在一個終端視窗運行您的 Expo 應用：`npm start`
2. 在另一個終端視窗啟動 React Native DevTools：`react-devtools`
3. 開啟模擬器或實機應用時，按下鍵盤上的 `d` 鍵打開開發者選單
4. 在開發者選單中啟用 "Debug Remote JS" 選項

### 快捷方式

- 在終端按 `j` 鍵：打開 JavaScript 調試器
- 在終端按 `d` 鍵：打開開發者選單

## Redux 開發工具

本專案包含一個內置的 Redux 調試工具，可幫助開發人員檢查和測試 Redux 狀態和 Saga 效果。

### 如何使用 Redux 調試工具

1. 在開發模式下運行應用程式
2. 可透過兩種方式進入 Redux 調試頁面：
   - 登入後，從導航中訪問 Redux 調試頁面
   - 啟用"啟動時顯示調試頁面"選項，這樣每次啟動應用時都會自動進入調試頁面

### 調試工具功能

- **實時狀態觀察**：查看 Auth、Game 和 Wallet 的當前 Redux 狀態
- **測試操作**：發送登入、註冊和登出操作，觀察 Saga 效果
- **自定義測試**：可以修改測試參數（電子郵件、密碼、用戶名）
- **Saga 監控開關**：可在調試頁面開啟/關閉 Saga 監控功能

### 控制台日誌

在開發模式下，我們添加了 `redux-logger` 中間件，它會在控制台輸出每個 Redux 操作及其對狀態的影響。這有助於追蹤 Redux 狀態的變化。配合 React Native DevTools 使用，可以同時觀察 Redux 狀態和組件渲染。

### Saga 監控

Saga 監控器是一個強大的調試工具，可以在控制台中顯示 Saga 效果的詳細信息：

- 效果的類型和參數
- 效果的觸發時間
- 效果的解析或拒絕狀態
- 每個 Saga 的完整執行路徑

通過 Redux 調試頁面中的開關，您可以輕鬆啟用或禁用 Saga 監控。

## React Native 新架構

本專案已啟用 React Native 的新架構（New Architecture）。在 `app.json` 中已經配置了 `"newArchEnabled": true`，以獲得更好的性能和更一致的跨平台行為。

### 新架構帶來的好處

- 改進的 JavaScript 和原生代碼間的通信
- 更高的渲染性能
- 更好的動畫流暢度
- 更一致的跨平台 API

## 生產環境注意事項

- Redux DevTools 和 Logger 中間件僅在開發模式下啟用
- 在生產環境中，調試功能被完全禁用
- 啟用"啟動時顯示調試頁面"選項在生產構建中不會有任何效果

## 貢獻指南

1. Fork 專案
2. 創建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟一個 Pull Request 