# 后端部署流程

## 适用场景

本文档适用于在本地修改 `PandaWiki/backend` 后，将新的后端二进制覆盖到 Docker 中运行的 `mindweave-api` 容器。

## 关键结论

`api` 容器在 `docker-compose.yml` 中挂载的是：

```yaml
./bin/api:/custom/api:ro
```

也就是说，容器真正执行的是项目根目录的 `bin/api`，不是 `PandaWiki/backend/bin/api`。

如果你只执行了下面这个命令：

```powershell
cd PandaWiki/backend
go build -o bin/api ./cmd/api
```

那么更新的只是 `PandaWiki/backend/bin/api`，容器不会自动加载这个文件。  
这是最容易导致“代码已修改，但接口行为完全没变”的原因。

## 推荐部署方式

最稳妥的方式是：直接把编译产物输出到项目根目录 `bin/api`，然后重启 `api` 容器。

### Windows PowerShell

在项目根目录执行：

```powershell
Set-Location PandaWiki/backend
$env:GOOS = "linux"
$env:GOARCH = "amd64"
go build -o ../../bin/api ./cmd/api
Set-Location ../..
docker compose restart api
docker compose logs --tail=50 api
```

### Linux / macOS

在项目根目录执行：

```bash
cd PandaWiki/backend
GOOS=linux GOARCH=amd64 go build -o ../../bin/api ./cmd/api
cd ../..
docker compose restart api
docker compose logs --tail=50 api
```

## 如果你已经编译到了 `PandaWiki/backend/bin/api`

如果你已经执行过：

```powershell
cd PandaWiki/backend
go build -o bin/api ./cmd/api
```

那么还必须再执行一次复制：

### Windows PowerShell

```powershell
Copy-Item -Path "PandaWiki/backend/bin/api" -Destination "bin/api" -Force
docker compose restart api
```

### Linux / macOS

```bash
cp PandaWiki/backend/bin/api bin/api
docker compose restart api
```

## 验证是否真的部署成功

建议至少验证下面 3 项。

### 1. 检查本地挂载文件时间

```powershell
Get-Item .\bin\api | Select-Object FullName, Length, LastWriteTime
```

如果这里的时间没有变化，说明你根本没有更新到容器实际使用的文件。

### 2. 检查容器内挂载文件

```powershell
docker exec mindweave-api ls -lh /custom/api
```

### 3. 检查容器日志

```powershell
docker compose logs --tail=50 api
```

正常情况下应该看到类似日志：

```text
mindweave-api  | time=... level=INFO msg="Neo4j connection established successfully"
mindweave-api  | time=... level=INFO msg="Starting server on port 8000"
```

## 推荐直接使用现有脚本

项目根目录已经有 `deploy-backend.ps1`，建议优先使用它：

```powershell
.\deploy-backend.ps1
```

这个脚本会自动完成：

1. 编译后端
2. 更新根目录 `bin/api`
3. 重启 `api` 容器
4. 输出容器日志

## 常见问题

### 问题 1：我明明重新编译了，接口还是旧行为

最常见原因有两个：

1. 你编译的是 `PandaWiki/backend/bin/api`，不是根目录 `bin/api`
2. 你更新了 `bin/api`，但没有重启 `api` 容器

### 问题 2：日志里还是旧错误

按下面顺序排查：

1. 先看根目录 `bin/api` 的 `LastWriteTime`
2. 再看容器内 `/custom/api` 文件时间
3. 最后执行 `docker compose restart api`

如果还不生效，再尝试：

```powershell
docker compose stop api
docker compose start api
docker compose logs --tail=50 api
```

### 问题 3：Docker 命令没有权限

如果 `docker compose restart api` 报权限错误，需要用管理员权限终端运行，或确认当前用户有 Docker 访问权限。

### 问题 4：编译失败

可以依次检查：

```powershell
go version
cd PandaWiki/backend
go test ./usecase
```

如果是依赖问题，再执行：

```powershell
cd PandaWiki/backend
go mod tidy
```

## 目录结构说明

```text
项目根目录/
├── bin/
│   └── api                    <- Docker 实际挂载的后端二进制
├── PandaWiki/
│   └── backend/
│       ├── bin/
│       │   └── api            <- 仅为 backend 本地输出目录，不会被容器直接使用
│       └── cmd/
│           └── api/
│               └── main.go
└── docker-compose.yml
```

## 一句话总结

后端改完后，必须确保最终更新的是项目根目录 `bin/api`，然后重启 `mindweave-api` 容器；否则代码不会生效。
