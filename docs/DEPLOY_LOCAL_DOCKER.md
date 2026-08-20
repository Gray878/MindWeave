# 本地 Docker 部署文档

## 1. 文档目标

本文档用于在本地电脑上通过 Docker Compose 启动当前这份 **修改过源码** 的 MindWeave / PandaWiki 项目。

它覆盖的场景包括：

- 你希望在本地完整启动 `api`、`app`、`nginx`、`postgres`、`redis`、`minio`、`nats`、`qdrant`、`raglite`、`neo4j`
- 你改了 `PandaWiki/web/app` 前台页面
- 你改了 `PandaWiki/web/admin` 管理后台
- 你改了 `PandaWiki/backend` 的 API 逻辑

本文档基于当前仓库结构编写，不是官方通用教程。

## 2. 目录约定

下面命令统一假设你的本地项目目录是：

```bash
/Users/veylor/Documents/code/AI_Agent/MindWeave
```

仓库结构大致如下：

```bash
/Users/veylor/Documents/code/AI_Agent/MindWeave/
  .env
  .env.local
  docker-compose.yml
  docker-compose.source.yml
  bin/
  data/
  PandaWiki/
    backend/
    docs/
    web/
```

其中：

- 根目录保存运行配置、Compose 文件、`bin/api`、数据目录
- `PandaWiki/` 保存源码
- Git 仓库位于 `PandaWiki/` 内层，不在根目录

## 3. 本地部署和 Ubuntu 部署的区别

本地 Docker 部署和 Ubuntu 文档有 4 个关键差异：

1. 本地前台建议从宿主机访问 `http://localhost:8080`
2. 管理后台从宿主机访问 `https://localhost:2443`
3. `api` 仍然读取根目录的 `bin/api`，所以改了后端要重新编译这个文件
4. 当前本地 Compose 已经改成使用 Docker named volume 共享 `caddy` 管理 socket，避免 Docker Desktop 挂载 Unix socket 的兼容性问题

另外要特别区分两种“端口”：

- 浏览器访问端口：你在宿主机浏览器里输入的端口，例如 `8080`
- 后台“访问控制”里保存的端口：`caddy` 容器内部监听的端口

当前这份本地 Compose 的设计是：

- 宿主机 `8080` 映射到 `caddy` 容器内部 `8000`
- 所以前台浏览器访问地址是 `http://localhost:8080`
- 后台知识库访问控制里建议保存的端口是 `8000`

不要把这两者混成一个值。

## 4. 一次性准备

### 4.1 启动 Docker Desktop

先确认 Docker Desktop 已经启动，并且命令可用：

```bash
docker info
docker compose version
```

### 4.2 安装前端依赖

```bash
cd /Users/veylor/Documents/code/AI_Agent/MindWeave/PandaWiki/web
corepack enable
pnpm install --frozen-lockfile
```

### 4.3 检查根目录 `.env`

本地 Docker 运行依赖根目录 `.env`，不是 `PandaWiki/web/app/.env`。

至少确认这些值存在：

```env
TIMEZONE=Asia/Shanghai
SUBNET_PREFIX=172.30.15
POSTGRES_PASSWORD=...
NATS_PASSWORD=...
JWT_SECRET=...
S3_SECRET_KEY=...
QDRANT_API_KEY=...
REDIS_PASSWORD=...
ADMIN_PASSWORD=admin123
ADMIN_PORT=2443
NEO4J_PASSWORD=...
```

如果你是直接沿用当前仓库，通常不需要改动。

## 5. 构建前端产物

前台 `app` 在 Docker 里运行时，需要把 API 地址指向容器内 `api:8000`，不要用 `localhost:8000`。

在本地重新构建前端产物：

```bash
cd /Users/veylor/Documents/code/AI_Agent/MindWeave/PandaWiki/web

NODE_OPTIONS="--max-old-space-size=4096" \
TARGET=http://api:8000 \
STATIC_FILE_TARGET=http://api:8000 \
pnpm --filter panda-wiki-admin build

NODE_OPTIONS="--max-old-space-size=4096" \
TARGET=http://api:8000 \
STATIC_FILE_TARGET=http://api:8000 \
pnpm --filter panda-wiki-app build
```

如果你只改了后台页面，可以只重建 `panda-wiki-admin`。  
如果你只改了前台页面，至少要重建 `panda-wiki-app`。

## 6. 编译本地 `bin/api`

`api` 服务不是直接运行镜像内程序，而是挂载根目录的 `bin/api`。

### 6.1 Apple Silicon / arm64

如果你本机是 Apple Silicon：

```bash
cd /Users/veylor/Documents/code/AI_Agent/MindWeave

docker run --rm \
  -e GOCACHE=/tmp/go-build \
  -e GOPATH=/tmp/go \
  -e GOPROXY=https://goproxy.cn,direct \
  -v "$PWD":/workspace \
  -w /workspace/PandaWiki/backend \
  golang:1.24.3-alpine \
  sh -c 'go mod download && CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -o /workspace/bin/api ./cmd/api'
```

### 6.2 Intel / amd64

如果你本机是 Intel：

```bash
cd /Users/veylor/Documents/code/AI_Agent/MindWeave

docker run --rm \
  -e GOCACHE=/tmp/go-build \
  -e GOPATH=/tmp/go \
  -e GOPROXY=https://goproxy.cn,direct \
  -v "$PWD":/workspace \
  -w /workspace/PandaWiki/backend \
  golang:1.24.3-alpine \
  sh -c 'go mod download && CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /workspace/bin/api ./cmd/api'
```

如果 `bin/api` 架构和 Docker 引擎架构不匹配，`api` 容器会直接启动失败。

## 7. 启动本地服务

### 7.1 启动基础服务

```bash
cd /Users/veylor/Documents/code/AI_Agent/MindWeave

docker compose \
  --env-file .env \
  -f docker-compose.yml \
  up -d
```

### 7.2 用本地源码覆盖前端镜像

```bash
docker compose \
  --env-file .env \
  -f docker-compose.yml \
  -f docker-compose.source.yml \
  up -d --build app nginx
```

### 7.3 重启 API，让它重新下发 Caddy 配置

```bash
docker compose restart api
```

这一步很重要。  
如果你重建了前端，或者改了后台里的知识库访问控制，建议都执行一次。

## 8. 访问地址

本地启动成功后，默认访问地址如下：

- 前台：`http://localhost:8080`
- 管理后台：`https://localhost:2443`
- API：`http://localhost:8000`
- Neo4j Browser：`http://localhost:17474`
- Neo4j Bolt：`bolt://localhost:17687`

说明：

- 后台 `2443` 是 HTTPS，自签名证书是正常现象
- 前台建议始终从 `http://localhost:8080` 进入
- 不建议直接在浏览器里访问容器内部端口，例如 `8000` 或 `3010`

## 9. 后台访问控制里的端口怎么填

这是本地部署最容易混乱的地方。

当前这份本地 Compose 约定：

- 宿主机浏览器访问：`http://localhost:8080`
- `caddy` 容器内部监听：`8000`

所以后台知识库访问控制里建议保存：

- `hosts`：`localhost`
- `ports`：`8000`

不要把这里填成浏览器访问端口 `8080`，除非你同步修改了 Compose 端口映射。

如果你已经把端口试乱了，建议恢复成：

- `hosts = localhost`
- `ports = 8000`

然后执行：

```bash
cd /Users/veylor/Documents/code/AI_Agent/MindWeave
docker compose restart api caddy
```

## 10. 以后更新代码的标准流程

### 10.1 改了前端

```bash
cd /Users/veylor/Documents/code/AI_Agent/MindWeave/PandaWiki/web

NODE_OPTIONS="--max-old-space-size=4096" \
TARGET=http://api:8000 \
STATIC_FILE_TARGET=http://api:8000 \
pnpm --filter panda-wiki-admin build

NODE_OPTIONS="--max-old-space-size=4096" \
TARGET=http://api:8000 \
STATIC_FILE_TARGET=http://api:8000 \
pnpm --filter panda-wiki-app build

cd /Users/veylor/Documents/code/AI_Agent/MindWeave

docker compose \
  --env-file .env \
  -f docker-compose.yml \
  -f docker-compose.source.yml \
  up -d --build app nginx

docker compose restart api
```

### 10.2 改了后端 API

重新编译 `bin/api`，然后重启 API：

```bash
cd /Users/veylor/Documents/code/AI_Agent/MindWeave

# Apple Silicon 改成 GOARCH=arm64
# Intel 改成 GOARCH=amd64
docker run --rm \
  -e GOCACHE=/tmp/go-build \
  -e GOPATH=/tmp/go \
  -e GOPROXY=https://goproxy.cn,direct \
  -v "$PWD":/workspace \
  -w /workspace/PandaWiki/backend \
  golang:1.24.3-alpine \
  sh -c 'go mod download && CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -o /workspace/bin/api ./cmd/api'

docker compose restart api
```

### 10.3 改了 `consumer` 或共享后端代码

```bash
cd /Users/veylor/Documents/code/AI_Agent/MindWeave

docker compose \
  --env-file .env \
  -f docker-compose.yml \
  -f docker-compose.source.yml \
  up -d --build consumer
```

## 11. 常用检查命令

查看容器状态：

```bash
docker compose ps
```

查看核心日志：

```bash
docker compose logs --tail=80 api
docker compose logs --tail=80 app
docker compose logs --tail=80 nginx
docker compose logs --tail=80 caddy
```

实时追日志：

```bash
docker compose logs -f api
docker compose logs -f app
docker compose logs -f caddy
```

## 12. 常见问题

### 12.1 后台能打开，前台打不开

先检查：

```bash
docker compose ps app caddy
```

再检查前台入口：

```bash
curl -I http://localhost:8080
curl -I http://localhost:8080/home
curl -I http://localhost:8080/welcome
```

如果 `app` 返回 `500`，通常是前台构建时错误使用了：

```env
TARGET=http://localhost:8000
```

本地 Docker 部署时必须改成：

```env
TARGET=http://api:8000
STATIC_FILE_TARGET=http://api:8000
```

然后重新 build `panda-wiki-app`。

### 12.2 Caddy 一直重启，日志里有 `operation not supported`

这是 Docker Desktop 下 Unix socket 宿主机挂载兼容性问题。  
当前仓库的 `docker-compose.yml` 已经改成用 named volume `caddy-run` 共享 socket。

如果你以后手动改回了：

```yaml
./data/caddy/run:/var/run/caddy
```

就可能再次触发这个问题。

### 12.3 根路径 `/` 打开是 404

当前前台会通过 Next middleware 把 `/` 重写到 `/home`。  
如果 `/` 没有正确跳到 `/home`，通常是 `api` 没把最新 Caddy 配置推送进去。

执行：

```bash
docker compose restart api
```

### 12.4 后台改了前台监听端口，结果越改越乱

本地这套部署里建议不要频繁试不同端口。  
推荐固定约定：

- 浏览器访问：`http://localhost:8080`
- 后台保存端口：`8000`

如果你已经改乱，恢复后执行：

```bash
docker compose restart api caddy
```

## 13. 推荐的本地稳定配置

如果你只是想稳定开发，不折腾端口，建议长期保持：

- 根目录 `.env` 中 `ADMIN_PORT=2443`
- 前台从 `http://localhost:8080` 访问
- 后台知识库访问控制中：
  - `hosts = localhost`
  - `ports = 8000`
- 前台构建始终使用：
  - `TARGET=http://api:8000`
  - `STATIC_FILE_TARGET=http://api:8000`

这样是当前这份本地 Compose 最不容易踩坑的组合。
