#!/bin/bash

# 檢查命令行參數
if [ $# -ne 1 ]; then
    echo "用法: ./run.sh [auth-service|slot-game1]"
    exit 1
fi

SERVICE=$1

case $SERVICE in
    auth-service)
        echo "啟動 auth-service..."
        air -c .air.toml -section auth-service
        ;;
    slot-game1)
        echo "啟動 slot-game1..."
        air -c .air.toml -section slot-game1
        ;;
    *)
        echo "未知的服務: $SERVICE"
        echo "用法: ./run.sh [auth-service|slot-game1]"
        exit 1
        ;;
esac 