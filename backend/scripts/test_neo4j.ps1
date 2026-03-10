# Neo4j 连接测试脚本 (PowerShell)

$ErrorActionPreference = "Stop"

Write-Host "=== Neo4j 连接测试 ===" -ForegroundColor Green
Write-Host ""

# 配置（需要根据实际情况修改）
$NEO4J_URI = "bolt://服务器IP:17687"
$NEO4J_USER = "neo4j"
$NEO4J_PASSWORD = "your_password"  # 从 .env.local 中获取

Write-Host "连接信息:"
Write-Host "  URI: $NEO4J_URI"
Write-Host "  用户: $NEO4J_USER"
Write-Host ""

# 使用 Neo4j Go Driver 测试连接
Write-Host "提示: 请使用以下 Go 代码测试连接" -ForegroundColor Yellow
Write-Host ""

$testCode = @"
package main

import (
    "context"
    "fmt"
    "github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

func main() {
    driver, err := neo4j.NewDriverWithContext(
        "$NEO4J_URI",
        neo4j.Bas