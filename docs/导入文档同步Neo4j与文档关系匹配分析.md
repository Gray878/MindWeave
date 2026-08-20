# PandaWiki 导入文档同步 Neo4j 与文档关系匹配分析

## 1. 结论摘要

基于当前代码实现，结论如下：

1. 导入文档最终都会落到 `POST /api/v1/node`（创建节点），Neo4j 同步是由 `NodeUsecase` 在 PostgreSQL 写入成功后异步触发。
2. 导入流程本身不会自动建立“文档-文档直接关系”；当前直接关系需要手动调用 `POST /api/v1/graph/relations/build`。
3. “文档-文档直接关系”的匹配算法目前仅基于文档标题分词（按空格）求交集，生成 `RELATED_BY_KEYWORD` 边。

---

## 2. 导入文档到 Neo4j 的链路

## 2.1 前端导入流程

入口在：
- `PandaWiki/web/admin/src/pages/document/component/AddDocByType/ListRender/Action.tsx`

关键步骤（批量导入）：

1. 解析阶段：调用 `postApiV1CrawlerParse`（第 98 行附近）。
2. 文件导入阶段：
   - `postApiV1CrawlerExport`（第 230 行附近）发起导出任务；
   - `pollCrawlerResults`（第 246 行附近）轮询拿到 markdown 内容；
   - 调用 `postApiV1Node`（第 260 行附近）创建文档节点（`type: 2`，带 `content`）。
3. 文件夹导入阶段：
   - 直接调用 `postApiV1Node`（第 205 行附近）创建文件夹节点（`type: 1`）。
4. 上传文件场景：
   - `postApiV1FileUpload`（第 349 行附近）上传后再进入 parse/import。

所以“导入”本质上是：`crawler` 负责抓取/转换内容，最终以 `node` 创建接口落库。

## 2.2 后端 crawler 链路（内容抓取/导出）

路由注册：
- `PandaWiki/backend/handler/v1/crawler.go`
  - `/parse`（第 39 行）
  - `/export`（第 40 行）
  - `/result`（第 41 行）
  - `/results`（第 42 行）

业务逻辑：
- `PandaWiki/backend/usecase/crawler.go`
  - `ParseUrl`（第 47 行）
  - `ExportDoc`（第 145 行）
  - `ScrapeGetResult`（第 166 行）
  - `ScrapeGetResults`（第 197 行）

crawler 负责把外部源（URL/文件/飞书等）转成可导入内容，不直接写 Neo4j。

## 2.3 Node 创建后触发 Neo4j 同步

后端创建入口：
- `PandaWiki/backend/handler/v1/node.go`
  - `CreateNode`（第 70 行）调用 `NodeUsecase.Create`

核心同步逻辑：
- `PandaWiki/backend/usecase/node.go`
  - `Create`（第 78 行）先写 PG，再异步同步图谱：
    - 文档：`SyncDocumentCreate`（第 98 行调用）
    - 文件夹：`SyncFolderCreate`（第 104 行调用）

PG 落库：
- `PandaWiki/backend/repo/pg/node.go`
  - `Create`（第 35 行，事务内 `tx.Create(node)` 在第 119 行）

Neo4j 写入：
- `PandaWiki/backend/usecase/graph_sync.go`
  - `SyncDocumentCreate`（第 23 行）
  - `SyncFolderCreate`（第 88 行）
- `PandaWiki/backend/store/neo4j/document.go`
  - `CreateDocument`（第 13 行）
  - `CreateDocumentRelations`（第 93 行）
- `PandaWiki/backend/store/neo4j/folder.go`
  - `CreateFolder`
  - `CreateFolderRelations`

## 2.4 导入时写入的图谱关系类型

`CreateDocumentRelations`（`document.go` 第 93 行）会尝试建立：

1. `(:Document)-[:BELONGS_TO]->(:KnowledgeBase)`
2. `(:Document)-[:CREATED_BY]->(:User)`
3. `(:Folder)-[:CONTAINS]->(:Document)`（有父节点时）

文件夹关系由 `CreateFolderRelations` 建立：

1. `(:Folder)-[:BELONGS_TO]->(:KnowledgeBase)`
2. `(:Folder)-[:CONTAINS]->(:Folder)`（父文件夹存在时）

注意：这些关系用 `MATCH` 依赖目标节点存在（如 `KnowledgeBase`、`User`、父 `Folder`）。如果目标节点不存在，不会报错，但关系不会创建。

## 2.5 历史全量迁移工具

项目提供了 PostgreSQL -> Neo4j 的迁移工具：
- `PandaWiki/backend/cmd/migrate/main.go`
  - `migrateNodes`（第 182 行）
  - `CreateDocument`（第 249 行）
  - `CreateDocumentRelations`（第 257 行）

该工具用于补全历史数据，不是导入实时链路的一部分。

---

## 3. 文档“直接关系”是如何匹配的

## 3.1 触发入口

关系构建 API：
- `PandaWiki/backend/handler/v1/graph.go`
  - `POST /api/v1/graph/relations/build`（第 41 行注册，`BuildRelations` 在第 187 行）

调用链：
- `GraphHandler.BuildRelations` -> `GraphQueryUseCase.BuildDocumentRelations`（`usecase/graph_query.go` 第 53 行）-> `Store.BuildDocumentRelationsByKeyword`。

## 3.2 匹配算法（当前实现）

实现位置：
- `PandaWiki/backend/store/neo4j/query.go`
  - `BuildDocumentRelationsByKeyword`（第 363 行）

算法规则：

1. 仅在同一知识库内匹配：`d1.kb_id = $kbID AND d2.kb_id = $kbID`
2. 仅处理一对一次：`d1.id < d2.id`
3. 取文档名按空格拆词，保留长度 >= 2 的词
4. 两文档存在公共词时，建立：
   - `(d1)-[:RELATED_BY_KEYWORD {keywords, created_at}]->(d2)`

这就是当前“文档-文档直接关系”的唯一实现。

## 3.3 是否会在导入时自动执行

不会自动执行。

依据：

1. 图谱前端请求封装 `PandaWiki/web/admin/src/request/Graph.ts`（第 15/27/39/51/63 行）没有 `relations/build` 调用。
2. 图谱页面 `PandaWiki/web/admin/src/pages/graph/index.tsx` 仅调用 `getGraphStats` 与 `getAllGraph`（第 64、66 行）。
3. 导入链路 `AddDocByType` 只调用 crawler + node 接口，不调用 build-relations 接口。

---

## 4. 当前实现中的注意点（与本问题直接相关）

1. **同步是异步且无重试**
   - `NodeUsecase.Create/Update/Delete/Move` 都是 `go func()` 异步调用图谱同步。
   - 同步失败仅记录日志，没有重试队列或补偿事务。

2. **删除文件夹时，Neo4j 可能残留子节点**
   - PG 删除是递归的：`NodeRepository.Delete` 会通过 `collectAllChildNodeIDs` 删除子树（`repo/pg/node.go` 第 299、339 行）。
   - 但图谱删除仅遍历请求入参 `req.IDs`（`usecase/node.go` `NodeAction`，第 171 行附近），未按递归后的全量 ID 删除，可能导致 Neo4j 子节点残留。

3. **移动节点时统一走 `SyncDocumentMove`**
   - `MoveNode` 中不区分类型，直接调用 `SyncDocumentMove`（`usecase/node.go` 第 339 行附近）。
   - `SyncDocumentMove` 底层 `UpdateDocumentParent` 匹配的是 `(:Document)`（`store/neo4j/document.go` 第 152 行），文件夹移动可能不同步。

4. **`SyncUserCreate` / `SyncKnowledgeBaseCreate` 有定义但未接入常规创建流程**
   - 定义在 `usecase/graph_sync.go` 第 135、151 行。
   - `KnowledgeBaseUsecase` 与 `UserUsecase` 构造函数未注入 `GraphSyncUseCase`，对应创建流程中也未调用。
   - 结果是 `BELONGS_TO` / `CREATED_BY` 关系创建依赖的节点可能缺失（除非先用迁移工具补齐）。

5. **图谱读取接口中的 KB 过滤不完整**
   - `GetGraphStats` / `GetAllGraph` 虽然接收 `kb_id`，但 Cypher 查询本身是全图匹配（`query.go` 第 149、156、163、414、421 行等）。

---

## 5. 建议（后续可改进）

1. 在文档导入成功后自动触发 `relations/build`，或按文档增量重建关系。
2. 将“关键词匹配”升级为基于内容/向量相似度，至少增加中文分词支持。
3. 为图谱同步增加重试与死信机制，降低异步丢失风险。
4. 修复删除/移动的类型与子树同步一致性问题。
5. 在 KB/User 创建流程中接入 `SyncKnowledgeBaseCreate` / `SyncUserCreate`。
6. 修复 `GetAllGraph` / `GetGraphStats` 的 `kb_id` 查询过滤。

---

## 6. 最新开发进展（2026-03-12）

以下是基于当前代码的已落地改造（相对上文“原始实现”）：

1. **已完成：导入/更新后自动增量重建文档关系**
   - 位置：`backend/usecase/graph_sync.go`
   - 在 `SyncDocumentCreate`、`SyncDocumentUpdate` 成功后自动调用
     `BuildDocumentRelationsForDocument(kbID, docID)`，不再依赖手工触发全量 `relations/build`。

2. **已完成：关系匹配从“标题空格分词”升级为“标题+内容 token 相似度”**
   - 位置：`backend/usecase/graph_tokenizer.go`、`backend/store/neo4j/query.go`、`backend/store/neo4j/document.go`
   - 新增中英文 token 抽取（中文 bi-gram + 英文词项），在 Neo4j 文档节点持久化 `tokens` 与 `token_count`。
   - 关系构建基于 token 重叠/Jaccard 阈值，替换了旧的“仅标题按空格拆词”策略。

3. **已完成：图谱同步重试 + 死信机制**
   - 位置：`backend/usecase/graph_sync.go`、`backend/usecase/node.go`
   - `Create/Update/Delete/Move` 的异步图谱同步统一走重试执行器（指数退避）。
   - 重试耗尽后写入死信表：`graph_sync_dead_letters`。
   - 新增迁移：`backend/store/pg/migration/000037_create_graph_sync_dead_letters.up.sql`

4. **已完成：死信重放接口（按知识库重放）**
   - 路由：`POST /api/v1/graph/sync/retry?kb_id=<id>&limit=100`
   - 位置：`backend/handler/v1/graph.go`、`backend/usecase/graph_sync.go`
   - 行为：读取 `pending` 死信任务，逐条重试；成功标记 `resolved`，失败回写错误与重试计数。

5. **死信表结构（当前）**
   - 核心字段：`kb_id`、`task_type`、`status`（`pending/resolved`）、`payload`、`error_message`、`retry_count`、`last_retry_at`、`resolved_at`。

6. **已完成：KB/User 创建流程接入图谱同步（建议第 5 条）**
   - 位置：`backend/usecase/knowledge_base.go`、`backend/usecase/user.go`
   - 在 `CreateKnowledgeBase` / `CreateUser` 成功后，异步调用图谱同步并纳入统一重试机制。
   - 对应任务类型 `kb_create` / `user_create` 已接入死信与重放链路。

7. **已完成：`GetAllGraph` / `GetGraphStats` 的 `kb_id` 过滤（建议第 6 条）**
   - 位置：`backend/store/neo4j/query.go`
   - 节点与关系查询统一按 KB 子图过滤：文档/文件夹/实体按 `kb_id`，知识库节点按 `id`，用户节点按 `CREATED_BY` 与文档反查归属。

8. **已补充：删除子树与移动类型同步一致性（建议第 4 条中的核心问题）**
   - 位置：`backend/usecase/node.go`、`backend/repo/pg/node.go`、`backend/store/neo4j/folder.go`、`backend/usecase/graph_sync.go`
   - 删除时先收集完整子树节点 ID，再逐一执行图谱删除同步，避免仅删请求入参导致 Neo4j 残留子节点。
   - 移动时按节点类型分流：
     - 文档走 `SyncDocumentMove`
     - 文件夹走新增的 `SyncFolderMove` / `UpdateFolderParent`

9. **仍待继续（下一阶段）**
   - 可选：为死信任务增加后台定时自动重放（当前是手动 API 触发）。
   - 可选：为 `graph_sync_dead_letters` 增加管理接口（分页查询、按任务类型筛选、手动标记/删除）。

---

## 7. 手动重放死信接口（人工操作）

- 方法：`POST`
- 路径：`/api/v1/graph/sync/retry`
- 权限：需要登录态 `Bearer Token`，且对目标知识库有访问权限
- 参数：
  - `kb_id`（必填）：知识库 ID
  - `limit`（可选）：本次最多重放多少条，默认 `100`，最大 `500`

返回数据中重点关注：
- `processed`：本次尝试重放的任务数
- `resolved`：重放成功并已标记解决的任务数
- `failed`：重放后仍失败的任务数

### curl 示例

```bash
curl -X POST "http://127.0.0.1:8000/api/v1/graph/sync/retry?kb_id=<KB_ID>&limit=100" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Accept: application/json"
```

如果你们通过域名访问，把 `127.0.0.1:8000` 替换成实际地址即可。
