# 本地启动后端服务脚本

Write-Host "=== 启动 MindWeave 后端服务 ===" -ForegroundColor Green
Write-Host ""

# 检查 .env.local 文件
if (-not (Test-Path ".env.local")) {
    Write-Host "错误: .env.local 文件不存在" -ForegroundColor Red
    Write-Host "请先复制 .env.local 文件并配置服务器连接信息" -ForegroundColor Yellow
    exit 1
}

# 加载环境变量
Write-Host "加载环境变量..." -ForegroundColor Cyan
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        # 展开变量引用
        $value = $ExecutionContext.InvokeCommand.ExpandString($value)
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
        Write-Host "  $name = $value" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "编译后端..." -ForegroundColor Cyan
go build -o api.exe ./cmd/api
if ($LASTEXITCODE -ne 0) {
    Write-Host "编译失败" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "启动后端服务..." -ForegroundColor Cyan
Write-H