#!/usr/bin/env node
/**
 * 環境變數文件生成腳本
 * 用於在本地開發或 CI/CD 環境中生成 .env 文件
 * 
 * 使用方式：
 * node ./scripts/generate-env.js [環境] [輸出文件]
 * 
 * 例如：
 * node ./scripts/generate-env.js production .env.production
 * node ./scripts/generate-env.js development .env.development
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 獲取命令行參數
const env = process.argv[2] || 'development';
const outputFile = process.argv[3] || `.env.${env}`;

// 獲取 Git 信息
let gitCommit = 'unknown';
let gitBranch = 'unknown';

try {
  gitCommit = execSync('git rev-parse --short HEAD').toString().trim();
  gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
} catch (error) {
  console.warn('無法獲取 Git 信息，使用預設值');
}

// 環境配置
const configs = {
  // 開發環境配置
  development: {
    VITE_API_BASE_URL: 'http://localhost:3000',
    VITE_APP_ENV: 'development',
    VITE_APP_VERSION: gitCommit,
    VITE_APP_BUILD_TIME: new Date().toISOString(),
    VITE_APP_GIT_BRANCH: gitBranch,
    VITE_DEBUG_MODE: 'true',
  },
  
  // 測試環境配置
  testing: {
    VITE_API_BASE_URL: 'https://api-test.example.com',
    VITE_APP_ENV: 'testing',
    VITE_APP_VERSION: gitCommit,
    VITE_APP_BUILD_TIME: new Date().toISOString(),
    VITE_APP_GIT_BRANCH: gitBranch,
    VITE_DEBUG_MODE: 'true',
  },
  
  // 生產環境配置
  production: {
    VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || 'https://api.example.com',
    VITE_APP_ENV: 'production',
    VITE_APP_VERSION: gitCommit,
    VITE_APP_BUILD_TIME: new Date().toISOString(),
    VITE_APP_GIT_BRANCH: gitBranch,
    VITE_DEBUG_MODE: 'false',
  },
};

// 檢查環境是否存在
if (!configs[env]) {
  console.error(`錯誤：不支援的環境 "${env}"`);
  console.error(`支援的環境：${Object.keys(configs).join(', ')}`);
  process.exit(1);
}

// 生成環境變數文件內容
const config = configs[env];
let content = `# 自動生成的環境配置文件 - ${env}\n`;
content += `# 生成時間：${new Date().toLocaleString()}\n\n`;

Object.entries(config).forEach(([key, value]) => {
  content += `${key}=${value}\n`;
});

// 寫入文件
const outputPath = path.resolve(process.cwd(), outputFile);
fs.writeFileSync(outputPath, content);

console.log(`✅ 環境配置已生成：${outputPath}`);
console.log(`📝 環境：${env}`);
console.log(`🔖 版本：${config.VITE_APP_VERSION}`);
console.log(`🕑 構建時間：${config.VITE_APP_BUILD_TIME}`);
console.log(`🌿 分支：${config.VITE_APP_GIT_BRANCH}`); 