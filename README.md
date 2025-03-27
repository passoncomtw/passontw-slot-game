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
