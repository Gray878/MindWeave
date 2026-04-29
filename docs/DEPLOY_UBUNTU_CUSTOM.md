# Ubuntu 云服务器部署文档

## 1. 文档目标

本文档用于把你当前这份 **修改过源码** 的 MindWeave / PandaWiki 项目部署到一台 Ubuntu 云服务器上。

它覆盖的场景包括：

- 你修改了 `PandaWiki/web/app` 的前台页面
- 你修改了 `PandaWiki/web/admin` 的管理后台
- 你修改了 `PandaWiki/backend` 的 API 或业务逻辑
- 你希望最终还是通过根目录 `docker-compose.yml` 启动整套服务

本文档基于当前项目目录结构编写，不是通用教程。  
这里提到的“根目录”统一指部署根目录（例如 `/opt/mindweave`），不是 `PandaWiki` 这个源码仓库目录。

## 2. 先说结论

这个项目的线上部署有 4 个关键点：

1. 部署根目录 `/opt/mindweave` 下的 `docker-compose.yml` 负责启动整套服务，包括 `api`、`consumer`、`app`、`nginx`、`postgres`、`redis`、`minio`、`nats`、`qdrant`、`raglite`、`neo4j` 等。
2. `api` 服务不是直接跑镜像内程序，而是运行宿主机挂载进去的 `./bin/api`。
3. `app` 和 `nginx` 默认使用远端官方镜像，所以你改了前端源码后，不能只执行 `docker compose up -d`。
4. `consumer` 默认也是远端镜像；如果你改了消费端逻辑或后端共享代码，最好一起重建 `consumer` 镜像。

所以，**修改版项目** 的推荐部署方式是：

- 基础设施仍然用根目录 compose
- 前端和 `consumer` 用源码重新构建镜像
- `api` 用当前源码重新编译 Linux 二进制到根目录 `bin/api`

注意：`PandaWiki/` 保存源码；`.env`、`docker-compose*.yml`、`bin/api`、`data/` 都位于它外层的部署根目录。

## 3. 本文使用的部署目录

下面命令统一假设服务器部署目录是：

```bash
/opt/mindweave
```

如果你打算放到别的目录，比如 `/srv/mindweave`，把命令里的路径一起替换掉即可。

服务器最终目录大致如下：

```bash
/opt/mindweave/
  .env
  .env.example
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

- 外层部署根目录保存运行和部署文件
- `PandaWiki/` 目录保存源码，并且它才是 Git 仓库

## 4. 服务器准备

### 4.1 建议配置

- Ubuntu 22.04 或 24.04
- 4 核 CPU 以上
- 8 GB 内存以上
- 40 GB 可用磁盘以上

如果你准备导入较多文档，或者 Neo4j / Qdrant 数据较大，建议直接用 8 核 16 GB 起步。

### 4.2 云服务器安全组 / 防火墙

至少放行下面端口：

- `22`：SSH
- `2443`：管理后台
- `17474`：Neo4j Browser
- `17687`：Neo4j Bolt
- `8080`：Caddy 入口

建议只对公网开放 `22`、`2443`、`8080`。  
下面这些端口尽量只保留内网访问，不要直接暴露到公网：

- `5432`：PostgreSQL
- `6379`：Redis
- `9000` / `9001`：MinIO
- `4222`：NATS
- `6333`：Qdrant
- `5050`：Raglite
- `8000`：API

如果你启用了 `ufw`，可以执行：

```bash
sudo ufw allow 22/tcp
sudo ufw allow 2443/tcp
sudo ufw allow 8080/tcp
sudo ufw allow 17474/tcp
sudo ufw allow 17687/tcp
sudo ufw enable
sudo ufw status
```

## 5. 安装运行环境

### 5.1 安装 Docker、Compose、Git

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release git

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
```

执行完以后，退出 SSH 再重新登录一次，让当前用户拿到 Docker 权限。

检查：

```bash
docker version
docker compose version
git --version
```

### 5.2 不额外安装 Go / Node 的思路

本文档默认 **只要求服务器安装 Docker 和 Git**。

- 前端构建使用 `node:22` 容器完成
- API 二进制编译使用 `golang:1.24.3` 容器完成

这样你不需要在 Ubuntu 主机里再手动安装 Node、pnpm、Go。

## 6. 上传项目代码和部署文件到服务器

这一节最容易混淆。

当前项目实际上是两层结构：

- 外层部署根目录保存 `docker-compose.yml`、`docker-compose.source.yml`、`.env.example`、`bin/`、`data/`
- 内层 `PandaWiki/` 保存源码，并且它才是 Git 仓库

所以服务器最终需要的不是单独一个 `PandaWiki/`，而是整个 `/opt/mindweave` 这层目录结构。

### 6.1 方式一：源码用 Git，部署根文件单独上传

如果你的远程仓库目前只有 `PandaWiki` 这一层源码，那么不能直接把仓库克隆到 `/opt/mindweave`，否则外层部署文件会缺失。

更稳妥的做法是：

1. 在服务器创建部署根目录
2. 把源码仓库克隆到 `/opt/mindweave/PandaWiki`
3. 再把外层部署文件单独上传到 `/opt/mindweave`

服务器执行：

```bash
sudo mkdir -p /opt/mindweave
sudo chown -R $USER:$USER /opt/mindweave
cd /opt/mindweave
git clone <你的仓库地址> PandaWiki
```

然后在本地外层目录执行，把部署文件上传到服务器：

```bash
scp docker-compose.yml docker-compose.source.yml .env.example \
  user@<服务器IP>:/opt/mindweave/
```

如果你已经提前在本地写好了 `.env`，也可以一并上传。

后续更新源码时：

```bash
cd /opt/mindweave/PandaWiki
git pull
```

如果你修改了外层的 `docker-compose.yml`、`docker-compose.source.yml` 或 `.env.example`，还要重新把这些文件传到 `/opt/mindweave/`。

### 6.2 方式二：直接上传本地部署目录

如果你本地已经有完整的两层目录，最省事的方式是直接把外层部署目录中的必要文件上传到服务器。

至少要上传这些内容：

- `docker-compose.yml`
- `docker-compose.source.yml`
- `.env.example`
- `PandaWiki/`

如果你想保留已有数据，也可以一起上传 `data/`；如果是全新服务器，后面在服务器创建即可。  
不建议上传 `.codex`、`.gocache`、`.pnpm-home`、`.vscode` 这类本地缓存目录。

例如在本地外层目录执行：

```bash
ssh user@<服务器IP> "mkdir -p /opt/mindweave"

scp docker-compose.yml docker-compose.source.yml .env.example \
  user@<服务器IP>:/opt/mindweave/

scp -r PandaWiki user@<服务器IP>:/opt/mindweave/
```

上传完成后，在服务器进入目录：

```bash
cd /opt/mindweave
```

## 7. 准备环境变量

部署根目录 `/opt/mindweave` 里需要有 `.env.example`，先复制一份：

```bash
cd /opt/mindweave
cp .env.example .env
```

编辑：

```bash
nano .env
```

至少要修改这些字段：

```env
ADMIN_PORT=2443
SUBNET_PREFIX=169.254.15

POSTGRES_PASSWORD=请改成强密码
REDIS_PASSWORD=请改成强密码
S3_SECRET_KEY=请改成强密码
NATS_PASSWORD=请改成强密码
QDRANT_API_KEY=请改成强密码
JWT_SECRET=请改成强密码
ADMIN_PASSWORD=请改成强密码
NEO4J_PASSWORD=请改成强密码

NEO4J_HEAP_INITIAL_SIZE=256m
NEO4J_HEAP_MAX_SIZE=512m
NEO4J_PAGECACHE_SIZE=256m
```

如果机器内存更大，可以把 Neo4j 内存参数调高。

## 8. 创建数据目录

```bash
cd /opt/mindweave
mkdir -p \
  data/caddy/caddy_config \
  data/caddy/caddy_data \
  data/caddy/run \
  data/nginx/ssl \
  data/conf/api \
  data/postgres \
  data/redis \
  data/minio \
  data/nats \
  data/qdrant \
  data/raglite \
  data/neo4j/data \
  data/neo4j/logs \
  data/neo4j/import \
  data/neo4j/plugins \
  bin
```

## 9. 生成前端构建产物

这一节很重要。

当前仓库里的两个前端 Dockerfile 都不是“源码直接构建镜像”的多阶段 Dockerfile，而是：

- `PandaWiki/web/app/Dockerfile` 读取 `dist/standalone` 和 `dist/static`
- `PandaWiki/web/admin/Dockerfile` 读取 `dist`

所以你必须先在服务器把前端产物构建出来，再构建镜像。

在服务器执行：

注意：这里要挂载整个 `/opt/mindweave`，并把工作目录切到 `/workspace/PandaWiki/web`。  
不要只挂载 `PandaWiki/web`，因为 `web/package.json` 里的 `prepare` 脚本依赖上层目录结构。

```bash
cd /opt/mindweave

docker run --rm \
  -u "$(id -u):$(id -g)" \
  -e HOME=/tmp \
  -v /opt/mindweave:/workspace \
  -w /workspace/PandaWiki/web \
  node:22-bullseye \
  bash -lc "corepack pnpm@10.12.1 install --frozen-lockfile && corepack pnpm@10.12.1 --filter panda-wiki-admin build && corepack pnpm@10.12.1 --filter panda-wiki-app build"
```

构建完成后，检查产物：

```bash
ls -lah /opt/mindweave/PandaWiki/web/app/dist
ls -lah /opt/mindweave/PandaWiki/web/admin/dist
```

如果这里没有输出目录，不要继续往下走，先解决前端构建问题。

### 9.1 如果服务器内存不够：改成本地构建再上传

如果云服务器在 `vite build` 或 `next build` 时出现 OOM，那么可以改成：

1. 在本地先构建前端产物
2. 把构建结果上传到服务器
3. 服务器只负责 `docker compose ... --build`

注意：

- 推荐在本地 `Linux`、`WSL2` 或本地 Docker 容器里构建
- 不建议直接在 Windows 原生环境构建 `PandaWiki/web/app`
- 因为 `next build` 的 `standalone` 产物可能涉及符号链接，Windows 下容易失败

本地构建：

```bash
cd PandaWiki/web

corepack pnpm@10.12.1 install --frozen-lockfile
corepack pnpm@10.12.1 --filter panda-wiki-admin build
corepack pnpm@10.12.1 --filter panda-wiki-app build
```

本地打包产物：

```bash
cd PandaWiki/web

tar czf admin-dist.tar.gz admin/dist
tar czf app-dist.tar.gz app/dist
```

上传到服务器：

```bash
scp admin-dist.tar.gz user@<服务器IP>:/opt/mindweave/
scp app-dist.tar.gz user@<服务器IP>:/opt/mindweave/
```

在服务器解压覆盖：

```bash
cd /opt/mindweave/PandaWiki/web

rm -rf admin/dist app/dist
tar xzf /opt/mindweave/admin-dist.tar.gz
tar xzf /opt/mindweave/app-dist.tar.gz
```

如果你本地还改了这些文件，也要一并同步到服务器：

- `PandaWiki/web/app/public`
- `PandaWiki/web/admin/server.conf`
- `PandaWiki/web/admin/nginx.conf`
- 你实际修改过的前端源码

解压完成后检查：

```bash
ls -lah /opt/mindweave/PandaWiki/web/app/dist
ls -lah /opt/mindweave/PandaWiki/web/admin/dist
```

## 10. 编译后端 API 到根目录 `bin/api`

当前 compose 中，`api` 实际执行的是：

```yaml
entrypoint: ["/custom/api"]
volumes:  
  - ./bin/api:/custom/api:ro
```

也就是说，服务器上真正会被执行的是：

```bash
/opt/mindweave/bin/api
```

所以你必须先把当前源码编译成 Linux 二进制放到这里。

执行：

```bash
cd /opt/mindweave

docker run --rm \
  -u "$(id -u):$(id -g)" \
  -e GOCACHE=/tmp/go-build \
  -e GOPATH=/tmp/go \
  -v /opt/mindweave:/workspace \
  -w /workspace/PandaWiki/backend \
  golang:1.24.3 \
  bash -lc "go mod download && CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /workspace/bin/api ./cmd/api"
```

检查：

```bash
ls -lah /opt/mindweave/bin/api
file /opt/mindweave/bin/api
chmod +x /opt/mindweave/bin/api
```

如果你这次完全没有改后端，理论上也可以沿用旧的 `bin/api`。  
但为了避免“前端是新代码、API 还是旧代码”的错配，建议首次部署源码版时也重新编译一次。

## 11. 使用源码镜像覆盖前端和 consumer

部署根目录 `/opt/mindweave` 中的 `docker-compose.source.yml` 用来覆盖默认镜像配置，它的作用是：

- `app` 使用本地构建镜像 `mindweave-app-custom:latest`
- `nginx` 使用本地构建镜像 `mindweave-nginx-custom:latest`
- `consumer` 使用本地构建镜像 `mindweave-consumer-custom:latest`

你不需要手工改原始的 `docker-compose.yml`，但启动时一定要额外带上 `-f docker-compose.source.yml`。

## 12. 首次启动整套服务

在服务器执行：

```bash
cd /opt/mindweave

docker compose \
  --env-file .env \
  -f docker-compose.yml \
  -f docker-compose.source.yml \
  up -d --build
```

说明：

- 基础设施服务仍然使用根目录 compose 中的镜像
- `app`、`nginx`、`consumer` 会按源码重新构建
- `api` 仍然使用官方镜像，但实际执行你刚刚编译好的 `bin/api`

## 13. 查看启动状态

```bash
cd /opt/mindweave
docker compose ps
```

重点看下面这些服务是否正常：

- `mindweave-api`
- `mindweave-consumer`
- `mindweave-nginx`
- `mindweave-app`
- `mindweave-postgres`
- `mindweave-redis`
- `mindweave-minio`
- `mindweave-qdrant`
- `mindweave-raglite`
- `mindweave-neo4j`

查看日志：

```bash
docker compose logs --tail=100 api
docker compose logs --tail=100 consumer
docker compose logs --tail=100 nginx
docker compose logs --tail=100 app
```

实时追日志：

```bash
docker compose logs -f api
```

## 14. 首次启动时关于证书的说明

`nginx` 容器挂载了：

```yaml
./data/nginx/ssl:/etc/nginx/ssl
```

而后端代码里带有自动初始化证书的逻辑，会在 API 容器启动时尝试生成：

- `data/nginx/ssl/panda-wiki.crt`
- `data/nginx/ssl/panda-wiki.key`

所以首次部署时，`data/nginx/ssl` 可以先为空。  
如果部署顺利，API 启动后会自动生成一套自签名证书。

检查：

```bash
ls -lah /opt/mindweave/data/nginx/ssl
```

如果后续你有正式域名，建议把这里替换成你自己的证书。

## 15. 访问地址

默认情况下：

- 管理后台：`https://<服务器IP>:2443`
- Caddy 入口：`http://<服务器IP>:8080`
- Neo4j Browser：`http://<服务器IP>:17474`
- Neo4j Bolt：`bolt://<服务器IP>:17687`

注意：

- `2443` 走的是 HTTPS
- 因为首次可能是自签证书，浏览器会提示“不安全”，手动继续访问即可

## 16. 以后更新代码的标准流程

以后每次你本地改完代码，线上更新建议按下面顺序走。

### 16.1 拉取最新代码

```bash
cd /opt/mindweave/PandaWiki
git pull
```

如果你不是通过 Git 更新源码，而是直接上传目录，那么这里改成重新上传最新的 `PandaWiki/` 源码目录。  
如果你同时修改了外层的 `docker-compose.yml`、`docker-compose.source.yml` 或 `.env.example`，也别忘了把这些文件重新传到 `/opt/mindweave/`。

### 16.2 如果改了前端

重新构建前端产物：

```bash
docker run --rm \
  -u "$(id -u):$(id -g)" \
  -e HOME=/tmp \
  -v /opt/mindweave:/workspace \
  -w /workspace/PandaWiki/web \
  node:22-bullseye \
  bash -lc "corepack pnpm@10.12.1 install --frozen-lockfile && corepack pnpm@10.12.1 --filter panda-wiki-admin build && corepack pnpm@10.12.1 --filter panda-wiki-app build"
```

如果服务器配置较低，这一步也可以改成本地构建后上传 `PandaWiki/web/admin/dist` 和 `PandaWiki/web/app/dist`，具体参考第 9.1 节。

### 16.3 如果改了后端 API

重新编译 `bin/api`：

```bash
docker run --rm \
  -u "$(id -u):$(id -g)" \
  -e GOCACHE=/tmp/go-build \
  -e GOPATH=/tmp/go \
  -v /opt/mindweave:/workspace \
  -w /workspace/PandaWiki/backend \
  golang:1.24.3 \
  bash -lc "go mod download && CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /workspace/bin/api ./cmd/api"
```

### 16.4 重新部署

```bash
cd /opt/mindweave

docker compose \
  --env-file .env \
  -f docker-compose.yml \
  -f docker-compose.source.yml \
  up -d --build
```

### 16.5 查看结果

```bash
docker compose ps
docker compose logs --tail=50 api
docker compose logs --tail=50 app
docker compose logs --tail=50 nginx
docker compose logs --tail=50 consumer
```

## 17. 按改动类型选择最小操作

### 17.1 只改了 `PandaWiki/web/app`

执行：

1. 前端 `pnpm build`
2. `docker compose ... up -d --build app`

示例：

```bash
cd /opt/mindweave

docker run --rm \
  -u "$(id -u):$(id -g)" \
  -e HOME=/tmp \
  -v /opt/mindweave:/workspace \
  -w /workspace/PandaWiki/web \
  node:22-bullseye \
  bash -lc "corepack pnpm@10.12.1 install --frozen-lockfile && corepack pnpm@10.12.1 --filter panda-wiki-app build"

docker compose \
  --env-file .env \
  -f docker-compose.yml \
  -f docker-compose.source.yml \
  up -d --build app
```

### 17.2 只改了 `PandaWiki/web/admin`

执行：

1. 前端 `pnpm build`
2. `docker compose ... up -d --build nginx`

### 17.3 改了 `PandaWiki/backend` 的 API

执行：

1. 重新编译根目录 `bin/api`
2. 重启 `api`

示例：

```bash
cd /opt/mindweave

docker run --rm \
  -u "$(id -u):$(id -g)" \
  -e GOCACHE=/tmp/go-build \
  -e GOPATH=/tmp/go \
  -v /opt/mindweave:/workspace \
  -w /workspace/PandaWiki/backend \
  golang:1.24.3 \
  bash -lc "go mod download && CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /workspace/bin/api ./cmd/api"

docker compose restart api
docker compose logs --tail=50 api
```

### 17.4 改了 `consumer` 相关逻辑

执行：

```bash
cd /opt/mindweave

docker compose \
  --env-file .env \
  -f docker-compose.yml \
  -f docker-compose.source.yml \
  up -d --build consumer
```

## 18. 常见问题排查

### 18.1 前端明明改了，线上页面没变化

通常是以下原因：

1. 你只执行了 `docker compose up -d`，没有重新构建前端产物
2. 你没有带 `-f docker-compose.source.yml`
3. 你没有执行 `--build`
4. 浏览器缓存了旧静态资源

先检查：

```bash
docker images | grep mindweave
docker compose ps
```

### 18.2 API 还是旧逻辑

先检查根目录二进制：

```bash
ls -lah /opt/mindweave/bin/api
docker exec mindweave-api ls -lh /custom/api
docker compose logs --tail=50 api
```

最常见原因是你重新编译错了目录，没有更新到根目录 `bin/api`。

### 18.3 `nginx` 起不来

先看日志：

```bash
docker compose logs --tail=100 nginx
```

再看证书目录：

```bash
ls -lah /opt/mindweave/data/nginx/ssl
```

如果证书没生成，可以先重启 `api` 再重启 `nginx`：

```bash
docker compose restart api
sleep 5
docker compose restart nginx
```

### 18.4 `app` 镜像构建失败

大概率是 `PandaWiki/web/app/dist` 不完整。  
重新执行第 9 节的前端产物构建，再重新 `docker compose ... up -d --build app`。

### 18.5 `consumer` 没有使用你的新代码

如果你修改的是后端共享代码，但只重启了 `api`，那么 `consumer` 仍然可能是旧镜像。  
这时要重新构建：

```bash
docker compose \
  --env-file .env \
  -f docker-compose.yml \
  -f docker-compose.source.yml \
  up -d --build consumer
```

## 19. 不推荐的做法

下面几种方式不适合“修改版项目”部署：

### 19.1 直接运行根目录 `deploy.sh`

原因：

- 它会 `docker-compose pull`
- 它不会帮你构建前端产物
- 它不会帮你重新编译根目录 `bin/api`

所以它适合“跑官方镜像”，不适合“部署你自己的修改代码”。

### 19.2 只执行 `docker compose up -d --build`

根目录基础 compose 里没有给 `app` / `nginx` / `consumer` 配置 `build`。  
如果你不带部署根目录里的 `docker-compose.source.yml`，这个 `--build` 基本不会把你的前端源码打进去。

### 19.3 只在 `PandaWiki/backend/bin/api` 里编译

线上 `api` 容器真正读取的是根目录 `bin/api`，不是 `PandaWiki/backend/bin/api`。

## 20. 一套可直接照抄的首次部署命令

如果你本地目录和本文一致，也就是外层有 `docker-compose.yml`，内层是 `PandaWiki/`，可以参考下面顺序。

先在本地执行：

```bash
ssh user@<服务器IP> "mkdir -p /opt/mindweave"

scp docker-compose.yml docker-compose.source.yml .env.example \
  user@<服务器IP>:/opt/mindweave/

scp -r PandaWiki user@<服务器IP>:/opt/mindweave/
```

再在服务器执行：

```bash
cd /opt/mindweave

cp .env.example .env
nano .env

mkdir -p \
  data/caddy/caddy_config \
  data/caddy/caddy_data \
  data/caddy/run \
  data/nginx/ssl \
  data/conf/api \
  data/postgres \
  data/redis \
  data/minio \
  data/nats \
  data/qdrant \
  data/raglite \
  data/neo4j/data \
  data/neo4j/logs \
  data/neo4j/import \
  data/neo4j/plugins \
  bin

docker run --rm \
  -u "$(id -u):$(id -g)" \
  -e HOME=/tmp \
  -v /opt/mindweave:/workspace \
  -w /workspace/PandaWiki/web \
  node:22-bullseye \
  bash -lc "corepack pnpm@10.12.1 install --frozen-lockfile && corepack pnpm@10.12.1 --filter panda-wiki-admin build && corepack pnpm@10.12.1 --filter panda-wiki-app build"

docker run --rm \
  -u "$(id -u):$(id -g)" \
  -e GOCACHE=/tmp/go-build \
  -e GOPATH=/tmp/go \
  -v /opt/mindweave:/workspace \
  -w /workspace/PandaWiki/backend \
  golang:1.24.3 \
  bash -lc "go mod download && CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /workspace/bin/api ./cmd/api"

chmod +x /opt/mindweave/bin/api

docker compose \
  --env-file .env \
  -f docker-compose.yml \
  -f docker-compose.source.yml \
  up -d --build

docker compose ps
docker compose logs --tail=50 api
docker compose logs --tail=50 nginx
docker compose logs --tail=50 app
```

## 21. 最后的建议

第一次把项目部署到 Ubuntu 云服务器时，建议你先按下面顺序验证：

1. `docker compose ps` 看容器是否都起来
2. 打开 `https://<服务器IP>:2443` 看后台是否能访问
3. 登录后台后检查知识库、模型配置、上传文件是否正常
4. 检查 `http://<服务器IP>:17474` 的 Neo4j Browser 是否能打开
5. 最后再去验证你本次实际修改的页面或接口

如果你后面准备做长期线上维护，建议再补 3 件事：

1. 给项目配一个正式域名
2. 把 `data/nginx/ssl` 换成正式证书
3. 配一套定时备份 `data/` 目录和 PostgreSQL 的脚本
