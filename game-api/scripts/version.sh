#!/bin/bash
set -e

# 版本生成腳本，用於 CI/CD 流程

# 檢查工作環境
if [ ! -f go.mod ]; then
    echo "錯誤: 請在項目根目錄下運行此腳本"
    exit 1
fi

# 獲取版本信息
if [ -f VERSION ]; then
    VERSION=$(cat VERSION)
else
    VERSION="0.1.0"
fi

# 獲取 Git 提交信息
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

# 設置時間戳
BUILD_TIME=$(date -u +'%Y-%m-%dT%H:%M:%SZ')

# 獲取環境變數或設置默認值
APP_ENV=${APP_ENV:-development}
BUILD_NUMBER=${BUILD_NUMBER:-local}

# 輸出版本信息
echo "版本號: ${VERSION}"
echo "Git 提交: ${GIT_COMMIT}"
echo "Git 分支: ${GIT_BRANCH}"
echo "構建時間: ${BUILD_TIME}"
echo "構建環境: ${APP_ENV}"
echo "構建編號: ${BUILD_NUMBER}"

# 創建 version.json 文件
cat > version.json << EOF
{
  "version": "${VERSION}",
  "gitCommit": "${GIT_COMMIT}",
  "gitBranch": "${GIT_BRANCH}",
  "buildTime": "${BUILD_TIME}",
  "environment": "${APP_ENV}",
  "buildNumber": "${BUILD_NUMBER}"
}
EOF

echo "已生成 version.json 文件"

# 返回版本字符串以供 Go 編譯時使用
VERSION_STRING="version=${VERSION},commit=${GIT_COMMIT},buildTime=${BUILD_TIME},env=${APP_ENV},buildNumber=${BUILD_NUMBER}"
echo ${VERSION_STRING} 