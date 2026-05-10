# MindWeave 常见问题与快速开始

## 一、如何安装 MindWeave

### 1.1 环境要求

- **操作系统**：Linux（推荐 Ubuntu 22.04 或 24.04）
- **Docker 版本**：Docker 20.x 及以上
- **Docker Compose**：v2 及以上
- **硬件配置**（推荐）：
  - CPU：4 核及以上
  - 内存：8 GB 及以上
  - 磁盘：40 GB 可用空间及以上

### 1.2 安装步骤

#### 方式一：使用 Docker Compose 部署（推荐）

**步骤 1：安装 Docker 和 Docker Compose**

```bash
# 更新系统包
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release git

# 添加 Docker 官方 GPG 密钥
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 添加 Docker 仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 启动 Docker 服务
sudo systemctl enable docker
sudo systemctl start docker

# 将当前用户添加到 docker 组
sudo usermod -aG docker $USER
```

执行完成后，**退出 SSH 并重新登录**，使 Docker 权限生效。

验证安装：

```bash
docker version
docker compose version
```

**步骤 2：创建部署目录**

```bash
sudo mkdir -p /opt/mindweave
sudo chown -R $USER:$USER /opt/mindweave
cd /opt/mindweave
```

**步骤 3：获取项目文件**

```bash
# 克隆项目（如果使用 Git）
git clone <你的仓库地址> PandaWiki

# 或者直接上传项目文件到服务器
# 确保目录结构如下：
# /opt/mindweave/
#   ├── docker-compose.yml
#   ├── docker-compose.source.yml
#   ├── .env.example
#   ├── PandaWiki/
#   └── data/
```

**步骤 4：配置环境变量**

```bash
cd /opt/mindweave
cp .env.example .env
nano .env  # 或使用 vim 编辑
```

**必须修改**以下配置项（使用强密码）：

```env
# 管理后台端口
ADMIN_PORT=2443

# Docker 子网前缀
SUBNET_PREFIX=169.254.15

# 数据库密码（请改成强密码）
POSTGRES_PASSWORD=your_strong_password_here
REDIS_PASSWORD=your_strong_password_here
S3_SECRET_KEY=your_strong_password_here
NATS_PASSWORD=your_strong_password_here
QDRANT_API_KEY=your_strong_password_here
JWT_SECRET=your_strong_password_here
ADMIN_PASSWORD=your_strong_password_here
NEO4J_PASSWORD=your_strong_password_here

# Neo4j 内存配置（根据服务器配置调整）
NEO4J_HEAP_INITIAL_SIZE=256m
NEO4J_HEAP_MAX_SIZE=512m
NEO4J_PAGECACHE_SIZE=256m
```

**步骤 5：创建数据目录**

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

**步骤 6：启动服务**

```bash
cd /opt/mindweave
docker compose up -d
```

**步骤 7：查看服务状态**

```bash
docker compose ps
docker compose logs --tail=50 api
```

等待所有服务启动完成（特别是 Neo4j 需要较长时间初始化）。

### 1.3 访问地址

服务启动成功后，可通过以下地址访问：

- **管理后台**：`https://<服务器IP>:2443`
  - 默认用户名：`admin`
  - 默认密码：见 `.env` 文件中的 `ADMIN_PASSWORD`
- **知识库门户**：`http://<服务器IP>:8080`
- **Neo4j Browser**：`http://<服务器IP>:17474`
  - 用户名：`neo4j`
  - 密码：见 `.env` 文件中的 `NEO4J_PASSWORD`

> **注意**：首次访问管理后台时，浏览器可能提示"不安全"，这是因为使用了自签名证书，点击"继续访问"即可。

### 1.4 配置 AI 模型

首次登录管理后台时，系统会提示配置 AI 模型。MindWeave 的 RAG 问答功能依赖大模型，支持以下配置方式：

- **一键自动配置**：系统自动配置推荐的模型服务
- **手动自定义配置**：支持接入 OpenAI、Claude、通义千问、百智云等主流大模型提供商

配置完成后，即可开始创建知识库并使用 AI 问答功能。

### 1.5 防火墙配置

如果服务器启用了防火墙（如 `ufw`），需要开放以下端口：

```bash
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 2443/tcp    # 管理后台
sudo ufw allow 8080/tcp    # 知识库门户
sudo ufw allow 17474/tcp   # Neo4j Browser（可选）
sudo ufw allow 17687/tcp   # Neo4j Bolt（可选）
sudo ufw enable
sudo ufw status
```

---

## 二、忘记 admin 密码如何重置？

MindWeave 的 `admin` 账户密码存储在环境变量中，重置方法如下：

### 2.1 重置 admin 密码

**步骤 1：编辑环境变量文件**

```bash
cd /opt/mindweave
nano .env  # 或使用 vim 编辑
```

**步骤 2：修改 ADMIN_PASSWORD**

找到以下行并修改为新密码：

```env
ADMIN_PASSWORD=your_new_password_here
```

**步骤 3：重启 API 服务**

```bash
docker compose restart api
```

**步骤 4：使用新密码登录**

等待 API 服务重启完成（约 10-30 秒），使用新密码登录管理后台：

- 用户名：`admin`
- 密码：新设置的 `ADMIN_PASSWORD`

### 2.2 重要说明

- **admin 账户特殊性**：`admin` 是系统内置的超级管理员账户，其密码由环境变量 `ADMIN_PASSWORD` 控制，**无法通过管理后台界面修改**。
- **其他用户密码重置**：如果需要重置其他普通用户的密码，可以使用 `admin` 账户登录管理后台，在"用户管理"页面进行重置。
- **安全建议**：
  - 首次部署后立即修改默认密码
  - 使用强密码（至少 8 位，包含大小写字母、数字和特殊字符）
  - 定期更换密码
  - 不要在生产环境中使用简单密码如 `admin123`

### 2.3 通过数据库重置其他用户密码（高级）

如果需要重置普通用户密码但无法登录 admin 账户，可以直接操作数据库：

```bash
# 进入 PostgreSQL 容器
docker exec -it mindweave-postgres psql -U panda-wiki -d panda-wiki

# 查看用户列表
SELECT id, username, email FROM users;

# 重置指定用户密码（需要先生成密码哈希）
# 注意：MindWeave 使用 bcrypt 加密，建议通过管理后台重置
```

> **警告**：直接操作数据库有风险，建议优先使用 admin 账户通过管理后台重置。

---

## 三、MindWeave 能做什么？

MindWeave 是一款基于多模态的**知识图谱问答系统**，提供从知识接入、治理、检索到可视化的完整解决方案。

### 3.1 核心功能

#### 1. 多源知识接入

支持多种方式导入知识内容：

- **本地文件上传**：
  - 文档：PDF、Word（.docx）、Markdown、TXT
  - 图片：PNG、JPG（支持 OCR 文字识别）
  - 表格：Excel、CSV
- **网页导入**：
  - 单个网页 URL 导入
  - 网站 Sitemap 批量导入
  - RSS 订阅自动同步
- **第三方平台对接**：
  - Notion 文档导入
  - 语雀知识库导入
  - 飞书文档导入
- **离线文件批量导入**

#### 2. RAG 检索增强问答

基于 RAG（Retrieval-Augmented Generation）技术的智能问答系统：

- **文档处理流程**：
  - 文档发布 → 自动切片 → 向量化 → 写入 Qdrant 向量数据库
- **问答流程**：
  - 用户提问 → 问题改写 → 向量检索召回相关片段 → 重排序 → 组装 Prompt → 大模型生成回答 → SSE 流式返回
- **特点**：
  - 回答基于知识库内容，减少幻觉
  - 提供证据片段溯源
  - 支持多轮对话上下文
  - 流式输出，响应迅速

#### 3. 知识图谱构建与可视化

自动构建知识库的关系图谱：

- **图谱节点**：
  - 知识库（KnowledgeBase）
  - 目录（Folder）
  - 文档（Document）
  - 用户（User）
- **关系类型**：
  - CONTAINS（包含关系）
  - BELONGS_TO（归属关系）
  - CREATED_BY（创建关系）
  - RELATED_BY_KEYWORD（关键词关联）
- **文档关联算法**：
  - 标题加权匹配
  - 正文 token 提取
  - Jaccard 相似度计算
- **可视化方式**：
  - **2D 图谱**：基于 Graphology + Sigma.js
  - **3D 图谱**：基于 react-force-graph-3d + Three.js
  - 支持节点搜索、关系筛选、布局调整

#### 4. 图谱同步补偿机制

保证数据一致性的可靠同步机制：

- **异步同步**：主业务提交后异步触发图谱更新
- **失败重试**：指数退避重试策略
- **死信处理**：超限失败写入死信表
- **手动重放**：管理端支持按知识库维度手动重放失败任务

#### 5. 发布版本管理

编辑态与服务态隔离：

- **编辑态**：管理员在后台编辑、整理文档
- **发布态**：执行发布操作生成快照
- **服务态**：问答基于发布快照，保证回答来源可追溯
- **版本回滚**：支持查看历史发布版本

#### 6. 多渠道接入

灵活的对外服务方式：

- **网页挂件（Widget）**：嵌入到其他网站
- **OpenAI 兼容接口**：标准 API 调用
- **聊天机器人**：
  - 钉钉机器人
  - 飞书机器人
  - 企业微信机器人
- **MCP 协议**：支持 Model Context Protocol 接入

#### 7. 权限与访问控制

细粒度的权限管理：

- **用户角色**：管理员、普通用户
- **知识库权限**：公开、私有、指定用户可见
- **访问策略**：IP 白名单、域名限制

### 3.2 技术架构

MindWeave 采用现代化的微服务架构：

| 层级 | 技术栈 |
|------|--------|
| **后端服务** | Go + Echo + GORM + JWT |
| **管理前端** | React 18 + TypeScript + Vite + MUI + Redux Toolkit |
| **门户前端** | Next.js + React + TypeScript |
| **主数据库** | PostgreSQL（关系型数据） |
| **缓存** | Redis（会话、缓存） |
| **对象存储** | MinIO（文件存储） |
| **向量检索** | Qdrant + RAGLite（语义检索） |
| **图数据库** | Neo4j（知识图谱） |
| **消息队列** | NATS（异步任务） |
| **图谱可视化** | Graphology、Sigma.js、react-force-graph-3d、Three.js |
| **部署** | Docker Compose、Caddy、Nginx |

### 3.3 典型应用场景

- **企业知识库**：构建企业内部知识管理系统，支持文档管理、智能问答
- **技术文档中心**：产品文档、API 文档、技术博客的统一管理与检索
- **客服知识库**：客服团队的知识沉淀与智能问答支持
- **教育培训**：课程资料管理、学习资源检索
- **研究资料管理**：科研文献、实验记录的结构化管理与关联分析

### 3.4 系统优势

- **开箱即用**：Docker Compose 一键部署，无需复杂配置
- **完整链路**：覆盖知识生产、发布、消费、反馈的全流程
- **可扩展性**：模块化设计，支持自定义扩展
- **开源透明**：基于 AGPL-3.0 许可证，代码完全开源
- **多模态支持**：文本、图片、表格等多种格式统一处理
- **智能化**：基于大模型的 RAG 问答，提供准确、可溯源的答案

---

## 四、常见问题

### 4.1 服务启动失败怎么办？

**检查步骤**：

1. 查看容器状态：`docker compose ps`
2. 查看日志：`docker compose logs --tail=100 <服务名>`
3. 确认端口未被占用：`netstat -tuln | grep <端口号>`
4. 确认 `.env` 配置正确
5. 确认 Docker 和 Docker Compose 版本符合要求

### 4.2 Neo4j 连接失败

Neo4j 启动较慢，首次启动可能需要 1-2 分钟。如果 API 日志显示 Neo4j 连接失败：

```bash
# 等待 Neo4j 健康检查通过
until [ "$(docker inspect -f '{{.State.Health.Status}}' mindweave-neo4j 2>/dev/null)" = "healthy" ]; do
  docker compose ps neo4j
  sleep 5
done

# 重启 API 服务
docker compose restart api
```

### 4.3 前端页面无法访问

1. 确认 `app` 和 `caddy` 容器正常运行
2. 检查防火墙是否开放 8080 端口
3. 查看 Caddy 日志：`docker compose logs --tail=50 caddy`

### 4.4 如何备份数据？

重要数据存储在 `data/` 目录下，定期备份以下目录：

```bash
cd /opt/mindweave
tar czf mindweave-backup-$(date +%Y%m%d).tar.gz data/
```

数据库备份：

```bash
# PostgreSQL 备份
docker exec mindweave-postgres pg_dump -U panda-wiki panda-wiki > backup.sql

# Neo4j 备份（需要停止服务）
docker compose stop neo4j
tar czf neo4j-backup-$(date +%Y%m%d).tar.gz data/neo4j/
docker compose start neo4j
```

### 4.5 如何升级 MindWeave？

```bash
cd /opt/mindweave

# 备份数据
tar czf mindweave-backup-$(date +%Y%m%d).tar.gz data/

# 拉取最新代码
cd PandaWiki
git pull

# 重新构建并启动
cd /opt/mindweave
docker compose down
docker compose up -d --build
```

---

## 五、获取帮助

如果遇到问题，可以通过以下方式获取帮助：

- **查看日志**：`docker compose logs -f <服务名>`
- **查看文档**：参考 `docs/` 目录下的详细文档
- **提交 Issue**：在项目仓库提交问题反馈
- **社区交流**：加入技术交流群

---

**MindWeave** — 让知识更智能，让问答更精准。
