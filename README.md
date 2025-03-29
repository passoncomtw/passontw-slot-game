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

你是一個資深的 Golang 後端工程師
參考這個參考App Wireframe
app 與 後台的API 要分開

實作 主頁的 API
個人資料頁面的 API
會員註冊的 API
取回會員投注歷史記錄的 API

sql 是資料庫的欄位資訊
以這些欄位為基礎實作 API 的 Request 與 Response
並且實作 Swagger ui
做邏輯合理的切分
遵循架構不要改動架構的前提

### STEP 3

基於基於 games.html 草稿
開發 後台遊戲功能 API
* 新增遊戲
* 遊戲列表(不需要分頁)
* 遊戲的上下架功能

### STEP 4

基於 transactions.html 草稿
開發 後台交易功能 API
* 交易列表(包含分頁系統，可以依據類型搜尋，交易 ID 用戶名做模糊搜尋，也可以依據交易時間做搜尋)
* 今日交易統計 API
* 會出報表下載 excel, 欄位同樣的所有資料包含交易統計資訊

### STEP 4

基於 logs.html 草稿
開發後台操作日誌功能
* 日誌列表 API(包含分頁，包含分頁，操作內容和操作者的模糊搜尋，依據操作類別搜尋，依據時間區間搜尋)
* 操作統計 API
* 會出日誌 excel API

### STEP 5

依據 dashboard.html 
* 建立後台取回儀表板的 API 資料足以顯示

### STEP 6

app. 增加下注的功能
修復 app_models.go type 重複的問題
刪除沒有用到的檔案