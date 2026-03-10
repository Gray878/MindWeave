#!/bin/bash
# 添加 Neo4j Go Driver 依赖

cd "$(dirname "$0")"

echo "添加 Neo4j Go Driver 依赖..."
go get github.com/neo4j/neo4j-go-driver/v5@latest

echo "整理依赖..."
go mod tidy

echo "完成！"
