# 單元測試指南

## 安裝 Mock 工具

本專案使用 `mockgen` 來生成 mock 文件，用於單元測試。請確保已安裝此工具：

```bash
go get github.com/golang/mock/mockgen
go install github.com/golang/mock/mockgen
```

## 生成 Mock 文件

我們提供了一個腳本來自動生成所有需要的 mock 文件：

```bash
./mockgen.sh
```

此腳本會檢查並安裝 mockgen（如果尚未安裝），然後為所有接口生成對應的 mock 文件。這些 mock 文件將保存在 `internal/mocks` 目錄中。

## 運行測試

有兩種方式運行測試：

### 1. 使用腳本運行測試

我們提供了一個腳本來運行測試並生成覆蓋率報告：

```bash
# 運行所有測試
./run_tests.sh

# 運行特定處理程序的測試
./run_tests.sh game    # 運行 GameHandler 測試
./run_tests.sh auth    # 運行 AuthHandler 測試
./run_tests.sh admin   # 運行 AdminHandler 測試
```

此腳本會：
- 首先運行 mockgen.sh 生成所需的 mock 文件
- 運行指定的測試
- 生成覆蓋率報告，保存在 `tmp/coverage` 目錄中
- 輸出覆蓋率摘要

### 2. 直接使用 Go 工具運行測試

您也可以直接使用 Go 的標準測試命令：

```bash
# 運行所有 handler 測試
go test -v ./internal/handler

# 運行特定測試文件
go test -v ./internal/handler/game_handler_test.go ./internal/handler/game_handler.go

# 運行特定測試方法 (使用正則表達式)
go test -v ./internal/handler -run "TestGame.*"
```

## 編寫測試代碼

在編寫測試時，請注意以下事項：

1. **使用 mockgen 生成的 mock**：
   ```go
   ctrl := gomock.NewController(t)
   mockService := mocks.NewMockGameService(ctrl)
   ```

2. **設置期望行為**：
   ```go
   mockService.EXPECT().
       GetGameList(gomock.Any(), gomock.Any()).
       Return(expectedGames, nil)
   ```

3. **使用 gomock 提供的匹配器**：
   ```go
   // 匹配任何參數
   gomock.Any()
   
   // 使用函數進行更詳細的檢查
   mockService.EXPECT().
       CreateGame(gomock.Any(), gomock.Any()).
       DoAndReturn(func(_ interface{}, req *models.GameCreateRequest) (*models.Game, error) {
           assert.Equal(t, "測試遊戲", req.Name)
           return &createdGame, nil
       })
   ```

4. **模擬 Logger**：
   ```go
   // 創建一個模擬的 Logger 實現
   type mockLogger struct{}
   
   func (m *mockLogger) Debug(msg string, fields ...zap.Field) {}
   func (m *mockLogger) Info(msg string, fields ...zap.Field)  {}
   func (m *mockLogger) Warn(msg string, fields ...zap.Field)  {}
   func (m *mockLogger) Error(msg string, fields ...zap.Field) {}
   func (m *mockLogger) Fatal(msg string, fields ...zap.Field) {}
   func (m *mockLogger) With(fields ...zap.Field) logger.Logger {
       return m
   }
   func (m *mockLogger) GetZapLogger() *zap.Logger {
       return nil
   }
   ```

## 計算覆蓋率

生成的覆蓋率報告可在 `tmp/coverage` 目錄中找到。您可以使用瀏覽器打開 HTML 覆蓋率報告，以查看詳細的覆蓋情況。

對於命令行覆蓋率報告，可以使用以下命令：

```bash
go tool cover -func=tmp/coverage/handlers.out
```

## 最佳實踐

1. **獨立的測試環境**：每個測試方法都應該設置自己的測試環境，互不影響。

2. **測試邊界條件**：不僅要測試正常情況，還要測試錯誤處理和邊界條件。

3. **完整的斷言**：驗證所有相關的回應字段，而不僅僅是狀態碼。

4. **清晰的測試名稱**：測試名稱應該清晰描述測試的功能和預期結果。

5. **測試覆蓋率**：代碼的測試覆蓋率應該達到合理的水平，特別是核心業務邏輯。 