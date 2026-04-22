# PostgreSQL 与 Neo4j 数据同步方案

## 一、核心原则

### 1.1 数据源定位
- PostgreSQL: 主数据源 (Source of Truth)
- Neo4j: 衍生数据源 (Derived Data)

原因:
- PostgreSQL 存储业务核心数据 (文档、用户、知识库)
- Neo4j 存储从 PostgreSQL 衍生的图谱数据
- 所有写操作先写 PostgreSQL，再同步到 Neo4j

### 1.2 同步策略
- 实时同步: 关键数据 (文档增删改)
- 异步同步: 非关键数据 (实体抽取、关系生成)
- 定期全量同步: 数据一致性校验 (每天凌晨)

## 二、同步方案对比

### 方案 A: 应用层同步 (推荐)
在 Go 后端代码中，每次操作 PostgreSQL 后，同步操作 Neo4j

优点:
- 实现简单，逻辑清晰
- 易于调试和维护
- 可以灵活控制同步时机
- 适合中小规模数据

缺点:
- 代码侵入性强
- 需要处理事务一致性
- 性能开销较大

适用场景: 毕设项目 (推荐)

### 方案 B: CDC (Change Data Capture)
使用 PostgreSQL 的 WAL (Write-Ahead Log) 捕获变更，通过 Debezium 等工具同步

优点:
- 低侵入性
- 高性能
- 支持实时同步
- 适合大规模数据

缺点:
- 架构复杂
- 需要额外组件 (Kafka、Debezium)
- 学习成本高
- 运维成本高

适用场景: 生产环境、大规模系统

### 方案 C: 定时任务同步
使用定时任务 (Cron) 定期从 PostgreSQL 读取数据，更新 Neo4j

优点:
- 实现简单
- 对主业务无影响
- 易于回滚

缺点:
- 数据延迟高
- 不适合实时场景
- 全量同步性能差

适用场景: 数据分析、离线处理

## 三、推荐方案: 应用层同步 + 异步队列

### 3.1 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    前端请求                              │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  Go 后端 API                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │  1. 写入 PostgreSQL (事务)                        │  │
│  │     - 创建/更新/删除文档                          │  │
│  │     - 提交事务                                    │  │
│  └──────────────────────────────────────────────────┘  │
│                            │                             │
│                            ▼                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │  2. 同步写入 Neo4j (实时)                         │  │
│  │     - 创建/更新/删除 Document 节点                │  │
│  │     - 更新 CONTAINS、CREATED_BY 关系             │  │
│  └──────────────────────────────────────────────────┘  │
│                            │                             │
│                            ▼                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │  3. 发送消息到队列 (异步)                         │  │
│  │     - 文档内容变更事件                            │  │
│  │     - 触发实体抽取任务                            │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              消息队列 (Redis/RabbitMQ)                   │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  后台任务处理器                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  4. 实体抽取 (Python NLP 服务)                    │  │
│  │     - 调用 NLP 服务提取实体                       │  │
│  │     - 创建 Entity 节点                            │  │
│  │     - 创建 MENTIONS 关系                          │  │
│  └──────────────────────────────────────────────────┘  │
│                            │                             │
│                            ▼                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │  5. 关系抽取 (可选)                               │  │
│  │     - 分析实体共现                                │  │
│  │     - 创建 RELATES_TO 关系                        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 3.2 同步分类

#### 实时同步 (Sync)
操作: 文档增删改、文件夹操作、用户操作
时机: PostgreSQL 事务提交后立即同步
数据: Document、Folder、User、KnowledgeBase 节点

#### 异步同步 (Async)
操作: 实体抽取、关系抽取
时机: 通过消息队列异步处理
数据: Entity 节点、MENTIONS 关系、RELATES_TO 关系

## 四、具体实现方案

### 4.1 数据同步服务接口设计

```go
// internal/graph/sync_service.go

package graph

import (
    "context"
    "github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

// SyncService 图谱同步服务
type SyncService struct {
    neo4jDriver neo4j.DriverWithContext
    queue       MessageQueue // Redis/RabbitMQ
}

// 实时同步接口

// SyncDocumentCreate 同步创建文档
func (s *SyncService) SyncDocumentCreate(ctx context.Context, doc *Document) error {
    // 1. 创建 Document 节点
    // 2. 创建 BELONGS_TO 关系 (Document -> KnowledgeBase)
    // 3. 创建 CREATED_BY 关系 (Document -> User)
    // 4. 如果有父文件夹，创建 CONTAINS 关系
    // 5. 发送实体抽取任务到队列
}

// SyncDocumentUpdate 同步更新文档
func (s *SyncService) SyncDocumentUpdate(ctx context.Context, doc *Document) error {
    // 1. 更新 Document 节点属性
    // 2. 更新 EDITED_BY 关系
    // 3. 如果内容变更，发送实体抽取任务到队列
}

// SyncDocumentDelete 同步删除文档
func (s *SyncService) SyncDocumentDelete(ctx context.Context, docID string) error {
    // 1. 删除 Document 节点
    // 2. 级联删除相关关系 (MENTIONS、REFERENCES)
    // 3. 清理孤立的 Entity 节点 (可选)
}

// SyncFolderCreate 同步创建文件夹
func (s *SyncService) SyncFolderCreate(ctx context.Context, folder *Folder) error {
    // 1. 创建 Folder 节点
    // 2. 创建 CONTAINS 关系 (父文件夹 -> 子文件夹)
}

// SyncFolderMove 同步移动文件夹/文档
func (s *SyncService) SyncFolderMove(ctx context.Context, nodeID, newParentID string) error {
    // 1. 删除旧的 CONTAINS 关系
    // 2. 创建新的 CONTAINS 关系
}

// 异步同步接口

// EnqueueEntityExtraction 将实体抽取任务加入队列
func (s *SyncService) EnqueueEntityExtraction(ctx context.Context, docID string) error {
    // 发送消息到队列: {"type": "entity_extraction", "doc_id": "xxx"}
}

// ProcessEntityExtraction 处理实体抽取任务 (后台任务)
func (s *SyncService) ProcessEntityExtraction(ctx context.Context, docID string) error {
    // 1. 从 PostgreSQL 读取文档内容
    // 2. 调用 Python NLP 服务提取实体
    // 3. 创建 Entity 节点
    // 4. 创建 MENTIONS 关系
}
```

### 4.2 事务处理策略

#### 策略 1: 两阶段提交 (不推荐)
```go
// 伪代码
func CreateDocument(doc *Document) error {
    // 开启 PostgreSQL 事务
    pgTx := pg.Begin()
    
    // 写入 PostgreSQL
    if err := pgTx.Insert(doc); err != nil {
        pgTx.Rollback()
        return err
    }
    
    // 写入 Neo4j
    if err := neo4j.CreateNode(doc); err != nil {
        pgTx.Rollback()
        // 问题: Neo4j 可能已经写入部分数据
        return err
    }
    
    // 提交 PostgreSQL 事务
    return pgTx.Commit()
}
```

问题: 无法保证两个数据库的原子性

#### 策略 2: 最终一致性 (推荐)
```go
// 伪代码
func CreateDocument(doc *Document) error {
    // 1. 先写 PostgreSQL (主数据源)
    if err := pg.Insert(doc); err != nil {
        return err
    }
    
    // 2. 异步同步到 Neo4j (允许短暂不一致)
    go func() {
        if err := neo4j.CreateNode(doc); err != nil {
            // 记录失败日志，后续重试
            log.Error("Neo4j sync failed", "doc_id", doc.ID, "error", err)
            // 加入重试队列
            retryQueue.Add(doc.ID)
        }
    }()
    
    return nil
}
```

优点: 
- 主业务不受 Neo4j 影响
- 允许短暂数据不一致
- 通过重试机制保证最终一致性

#### 策略 3: 补偿事务 (推荐)
```go
// 伪代码
func CreateDocument(doc *Document) error {
    // 1. 写入 PostgreSQL
    if err := pg.Insert(doc); err != nil {
        return err
    }
    
    // 2. 同步写入 Neo4j
    if err := neo4j.CreateNode(doc); err != nil {
        // 补偿: 删除 PostgreSQL 中的数据
        pg.Delete(doc.ID)
        return err
    }
    
    return nil
}
```

问题: 补偿操作可能失败，导致数据不一致

### 4.3 失败重试机制

```go
// internal/graph/retry_service.go

package graph

import (
    "context"
    "time"
)

// RetryService 重试服务
type RetryService struct {
    syncService *SyncService
    maxRetries  int
    retryDelay  time.Duration
}

// AddRetryTask 添加重试任务
func (r *RetryService) AddRetryTask(task *SyncTask) error {
    // 存储到 Redis 或数据库
    // task: {type: "create_document", doc_id: "xxx", retry_count: 0}
}

// ProcessRetryTasks 处理重试任务 (定时任务)
func (r *RetryService) ProcessRetryTasks(ctx context.Context) error {
    // 1. 从 Redis 读取待重试任务
    // 2. 执行同步操作
    // 3. 如果成功，删除任务
    // 4. 如果失败，增加重试次数
    // 5. 如果超过最大重试次数，记录到失败日志
}
```

### 4.4 数据一致性校验

```go
// internal/graph/consistency_checker.go

package graph

// ConsistencyChecker 一致性检查器
type ConsistencyChecker struct {
    pg    *PostgreSQL
    neo4j *Neo4j
}

// CheckDocumentConsistency 检查文档一致性
func (c *ConsistencyChecker) CheckDocumentConsistency(ctx context.Context) error {
    // 1. 从 PostgreSQL 读取所有文档 ID
    pgDocIDs := c.pg.GetAllDocumentIDs()
    
    // 2. 从 Neo4j 读取所有 Document 节点 ID
    neo4jDocIDs := c.neo4j.GetAllDocumentIDs()
    
    // 3. 对比差异
    missing := difference(pgDocIDs, neo4jDocIDs) // PostgreSQL 有但 Neo4j 没有
    extra := difference(neo4jDocIDs, pgDocIDs)   // Neo4j 有但 PostgreSQL 没有
    
    // 4. 修复差异
    for _, docID := range missing {
        // 从 PostgreSQL 同步到 Neo4j
        c.syncService.SyncDocumentCreate(ctx, docID)
    }
    
    for _, docID := range extra {
        // 从 Neo4j 删除多余节点
        c.neo4j.DeleteDocument(docID)
    }
    
    return nil
}

// ScheduleConsistencyCheck 定时一致性检查 (每天凌晨 3 点)
func (c *ConsistencyChecker) ScheduleConsistencyCheck() {
    ticker := time.NewTicker(24 * time.Hour)
    for range ticker.C {
        c.CheckDocumentConsistency(context.Background())
    }
}
```

## 五、消息队列选型

### 方案 A: Redis (推荐 - 毕设)
优点:
- 轻量级，易部署
- PandaWiki 已集成 Redis
- 支持 List/Stream 作为队列

缺点:
- 持久化较弱
- 不支持复杂路由

实现:
```go
// 使用 Redis List
redis.LPush("entity_extraction_queue", docID)
redis.BRPop("entity_extraction_queue", 0) // 阻塞读取
```

### 方案 B: RabbitMQ
优点:
- 功能强大
- 支持复杂路由
- 持久化可靠

缺点:
- 需要额外部署
- 学习成本高

### 方案 C: Kafka
优点:
- 高吞吐量
- 适合大规模数据

缺点:
- 架构复杂
- 资源消耗大
- 过度设计 (毕设不需要)

## 六、同步时机总结

| 操作 | PostgreSQL | Neo4j 实时同步 | Neo4j 异步同步 |
|------|-----------|---------------|---------------|
| 创建文档 | ✓ | Document 节点 + 基础关系 | 实体抽取 |
| 更新文档内容 | ✓ | Document 节点属性 | 重新抽取实体 |
| 更新文档元数据 | ✓ | Document 节点属性 | - |
| 删除文档 | ✓ | 删除 Document 节点 | - |
| 移动文档 | ✓ | 更新 CONTAINS 关系 | - |
| 创建文件夹 | ✓ | Folder 节点 + CONTAINS 关系 | - |
| 创建用户 | ✓ | User 节点 | - |
| 创建知识库 | ✓ | KnowledgeBase 节点 | - |

## 七、实施步骤

### 步骤 1: 基础同步服务 (1 周)
- 实现 SyncService 接口
- 实现 Document、Folder、User 的实时同步
- 单元测试

### 步骤 2: 消息队列集成 (3 天)
- 集成 Redis 作为消息队列
- 实现任务入队/出队
- 实现后台任务处理器

### 步骤 3: 实体抽取异步同步 (1 周)
- 实现实体抽取任务处理
- 创建 Entity 节点和 MENTIONS 关系
- 测试异步流程

### 步骤 4: 失败重试机制 (3 天)
- 实现 RetryService
- 实现定时重试任务
- 测试失败场景

### 步骤 5: 一致性校验 (3 天)
- 实现 ConsistencyChecker
- 实现定时校验任务
- 测试修复逻辑

## 八、监控与告警

### 8.1 监控指标
- 同步成功率: 成功次数 / 总次数
- 同步延迟: Neo4j 写入时间 - PostgreSQL 写入时间
- 队列积压: 待处理任务数量
- 失败重试次数: 重试任务数量

### 8.2 告警规则
- 同步成功率 < 95% → 发送告警
- 队列积压 > 1000 → 发送告警
- 失败重试次数 > 100 → 发送告警

## 九、总结

推荐方案: 应用层同步 + 异步队列 + 最终一致性

核心要点:
1. PostgreSQL 是主数据源，Neo4j 是衍生数据
2. 实时同步基础数据 (Document、Folder、User)
3. 异步同步计算密集型数据 (Entity、Relation)
4. 通过重试机制保证最终一致性
5. 定期全量校验修复数据差异

优势:
- 实现简单，适合毕设
- 性能开销可控
- 易于调试和维护
- 数据一致性有保障

工作量: 2-3 周
