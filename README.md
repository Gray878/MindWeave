<p align="center">
  <img src="/images/banner.png" width="400" />
</p>

<p align="center">
  <b>MindWeave — 基于多模态的知识图谱问答系统</b>
</p>

## 👋 项目介绍

MindWeave 是一款基于多模态的**知识图谱问答系统**，以知识库为核心边界，集成多源知识接入、内容治理、检索增强问答（RAG）、知识图谱构建与可视化、公开门户服务和多渠道接入等能力，形成覆盖知识生产、发布、消费与反馈的完整链路。

系统后端采用 **Go + Echo** 构建服务框架，前端采用 **React/Vite 管理端** 与 **Next.js 门户端** 的双前端方案，底层由 **PostgreSQL、Redis、MinIO、Qdrant、RAGLite、Neo4j、NATS** 共同支撑。

<p align="center">
  <img src="/images/setup.png" width="800" />
</p>

## ⚡️ 界面展示

| MindWeave 管理后台                               | 知识库门户前台                                   |
| ------------------------------------------------ | ------------------------------------------------ |
| <img src="/images/screenshot-1.png" width=370 /> | <img src="/images/screenshot-2.png" width=370 /> |
| <img src="/images/screenshot-3.png" width=370 /> | <img src="/images/screenshot-4.png" width=370 /> |

## 🔥 功能与特色

- **多源知识接入**：支持本地文件（PDF、Word、Markdown、图片 OCR 等）、网页 URL、RSS、Sitemap 及 Notion、语雀、飞书文档等第三方平台导入。
- **RAG 检索增强问答**：文档发布后自动切片、向量化并写入 Qdrant，问答时结合问题改写、语义召回与重排序，通过 SSE 流式返回证据片段与生成答案。
- **知识图谱构建与可视化**：将知识库、目录、文档、用户等业务对象同步至 Neo4j，基于标题加权与正文 token Jaccard 相似度自动构建文档关联关系，支持 2D（Sigma.js）和 3D（Three.js）可视化。
- **图谱同步补偿机制**：主业务提交后异步触发图谱同步，失败时指数退避重试，超限写入死信表，管理端支持按知识库维度手动重放。
- **多渠道接入**：支持网页挂件（Widget）、OpenAI 兼容接口、钉钉 / 飞书 / 企业微信机器人及 MCP 协议接入。
- **发布版本管理**：编辑态与服务态隔离，以发布快照为问答索引对象，保证回答来源可追溯。

## 🏗️ 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Go、Echo、GORM、JWT |
| 管理前端 | React 18、TypeScript、Vite、MUI、Redux Toolkit |
| 门户前端 | Next.js、React、TypeScript |
| 主数据库 | PostgreSQL |
| 缓存 | Redis |
| 对象存储 | MinIO |
| 向量检索 | Qdrant + RAGLite |
| 图数据库 | Neo4j |
| 消息队列 | NATS |
| 图谱可视化 | Graphology、Sigma.js、react-force-graph-3d、Three.js |
| 部署 | Docker Compose、Caddy、Nginx |

## 🚀 快速部署

### 环境要求

- Docker 20.x 及以上
- Docker Compose v2
- Linux 系统（推荐 Ubuntu 22.04）

### 启动服务

```bash
git clone https://github.com/your-username/MindWeave.git
cd MindWeave
cp .env.example .env
# 按需修改 .env 中的配置项
docker compose up -d
```

服务启动后，访问以下地址：

```
管理后台：http://<服务器IP>:2443
默认用户名：admin
默认密码：见启动日志输出
```

### 配置 AI 模型

首次登录时系统会提示配置 AI 模型，支持一键自动配置或手动自定义配置。

<div align="center">
  <img src="/images/model-config-1.png" width="800" />
  <p><em>一键自动配置 AI 模型</em></p>

  <img src="/images/model-config-2.png" width="800" />
  <p><em>手动自定义配置 AI 模型</em></p>
</div>

支持接入 OpenAI、Claude、通义千问等主流大模型提供商。

### 创建知识库

知识库是系统的核心业务边界，创建后可导入文档、配置访问策略并对外提供门户服务。

<img src="/images/createkb.png" width="800" />

### 开始使用

完成以上步骤后，你可以：

- 访问**管理后台**导入文档、整理目录、发布知识库
- 访问**门户网站**浏览文档并测试 AI 问答效果
- 在**图谱页面**查看知识库的 2D/3D 关系可视化

<img src="/images/AI-QA.png" width="700" />

## � 系统架构

```
前端展示层：React/Vite 管理端 + Next.js 门户端
     ↓
应用服务层：Go + Echo API（知识库、文档、问答、图谱、开放接口）
     ↓
异步处理层：NATS + Consumer（向量更新、图谱同步）
     ↓
基础设施层：PostgreSQL / Redis / MinIO / Qdrant / Neo4j
```

## 📝 许可证

本项目基于开源项目二次开发，采用 GNU Affero General Public License v3.0 (AGPL-3.0) 许可证。

- 你可以自由使用、修改和分发本软件
- 你必须以相同的许可证开源你的修改
- 如果你通过网络提供服务，也必须开源你的代码
