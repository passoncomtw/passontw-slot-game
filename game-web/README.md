# Game Web 管理後台

這是一個使用 React、Vite 和 TypeScript 建立的遊戲管理後台。專案使用 GitHub Actions 自動化部署到 Linode 服務器。

## 功能特點

- 基於 React 19 和 TypeScript 的現代前端技術
- 使用 Vite 構建系統提供快速的開發體驗
- 整合 Tailwind CSS 進行響應式設計
- 使用 GitHub Actions 自動化測試和部署到 Linode 服務器

## 開發指南

### 前置需求

- Node.js 18+ 和 npm 9+

### 安裝相依套件

```bash
cd game-web
npm install
```

### 本地開發

啟動開發伺服器，支援熱重載：

```bash
npm run dev
```

應用將在 `http://localhost:3010` 運行。

### 打包構建

```bash
npm run build
```

構建產物將存放在 `dist` 目錄中。

### 預覽構建版本

```bash
npm run preview
```

## 部署流程

### GitHub Actions 自動部署

本專案已配置 GitHub Actions 工作流程實現自動化部署：

1. 當代碼推送到 `develop` 分支時，自動觸發部署流程
2. 工作流程將先執行 lint 檢查，確保代碼質量
3. 自動生成環境配置文件 (.env.production)
4. 構建專案，生成靜態網站文件
5. 將構建產物通過 SSH 部署到 Linode 服務器

所有配置文件位於 `.github/workflows/deploy-game-web.yml`。

### 手動觸發部署

您也可以在 GitHub 網站上手動觸發部署：

1. 進入專案的 GitHub 頁面
2. 點擊 "Actions" 選項卡
3. 從左側列表選擇 "部署 Game Web 後台管理系統" 工作流程
4. 點擊 "Run workflow" 按鈕並確認

### Linode 服務器部署

部署過程包含以下步驟：
1. 創建並上傳部署配置文件 (deploy-config.env)
2. 將構建產物壓縮並通過 SCP 傳輸到 Linode 服務器
3. 備份現有部署（如有）
4. 將新版本解壓到部署目錄
5. 創建版本信息文件 (version.json)
6. 設定適當的文件權限

## 環境變數配置

### 開發環境

在根目錄創建 `.env.development` 文件以設定開發環境變數：

```
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_ENV=development
```

### 生產環境

GitHub Actions 會在構建時自動生成生產環境變數文件 `.env.production`：

```
VITE_API_BASE_URL=https://api.example.com
VITE_APP_ENV=production
VITE_APP_VERSION={commit-hash}
VITE_APP_BUILD_TIME={timestamp}
```

### 環境變數使用方式

在代碼中使用環境變數的方式：

```typescript
// 使用 import.meta.env 訪問環境變數
const apiUrl = import.meta.env.VITE_API_BASE_URL;
const appVersion = import.meta.env.VITE_APP_VERSION;
```

### 部署配置變數

GitHub Actions 生成的部署配置文件 (deploy-config.env) 包含：

```
DEPLOY_PATH=/var/www/html/game-web
DEPLOY_BACKUP_PATH=/var/www/html/game-web-backups
WEB_USER=www-data
WEB_GROUP=www-data
APP_ENV=production
DEPLOY_TIMESTAMP={timestamp}
DEPLOY_VERSION={commit-hash}
```

## 版本追踪

每次部署時，會在部署目錄中創建一個 `version.json` 文件，包含部署版本和時間信息。可以通過 `/version.json` 路徑訪問此文件，以確認當前部署的版本。

## 技術堆疊

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Query
- React Router v7
- Redux Toolkit (狀態管理)
- GitHub Actions (CI/CD)

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
