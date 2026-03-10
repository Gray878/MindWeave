# 知识图谱查询 API

## API 端点

### 1. 获取节点关系图谱
**GET** `/api/v1/graph/node`

获取指定节点及其周围关系的图谱数据。

**参数：**
- `node_id` (string, required): 节点ID
- `depth` (int, required): 查询深度，范围 1-3

**响应示例：**
```json
{
  "code": 0,
  "data": {
    "nodes": [
      {
        "id": "doc-123",
        "name": "技术文档",
        "type": "Document",
        "properties": {
          "status": 1,
          "created_at": "2024-01-01T00:00:00Z"
        }
      }
    ],
    "edges": [
      {
        "source": "doc-123",
        "target": "folder-456",
        "type": "BELONGS_TO",
        "properties": {}
      }
    ]
  }
}
```

### 2. 查找节点间路径
**GET** `/api/v1/graph/path`

查找两个节点之间的最短路径。

**参数：**
- `start_node_id` (string, required): 起始节点ID
- `end_node_id` (string, required): 目标节点ID
- `max_depth` (int, required): 最大深度，范围 1-5

**响应示例：**
```json
{
  "code": 0,
  "data": {
    "paths": [
      [
        {"id": "node-1", "name": "节点1", "type": "Document"},
        {"id": "node-2", "name": "节点2", "type": "Folder"},
        {"id": "node-3", "name": "节点3", "type": "Document"}
      ]
    ],
    "count": 1
  }
}
```

### 3. 获取图谱统计信息
**GET** `/api/v1/graph/stats`

获取知识库的图谱统计信息。

**参数：**
- `kb_id` (string, required): 知识库ID

**响应示例：**
```json
{
  "code": 0,
  "data": {
    "total_nodes": 150,
    "total_edges": 320,
    "nodes_by_type": {
      "Document": 100,
      "Folder": 30,
      "Entity": 20
    },
    "edges_by_type": {
      "CONTAINS": 130,
      "MENTIONS": 150,
      "RELATES_TO": 40
    },
    "document_count": 100,
    "folder_count": 30,
    "entity_count": 20,
    "avg_connections": 2.13
  }
}
```

### 4. 搜索实体
**GET** `/api/v1/graph/entities/search`

在知识库中搜索实体。

**参数：**
- `kb_id` (string, required): 知识库ID
- `keyword` (string, required): 搜索关键词
- `type` (string, optional): 实体类型过滤
- `limit` (int, optional): 返回数量限制，默认20，最大100

**响应示例：**
```json
{
  "code": 0,
  "data": [
    {
      "id": "entity-123",
      "name": "Docker",
      "type": "Technology",
      "aliases": ["容器技术"],
      "description": "容器化平台",
      "confidence": 0.95,
      "doc_count": 15
    }
  ]
}
```

## 权限要求

所有接口都需要：
- Bearer Token 认证
- 文档查看权限 (UserKBPermissionDocView)
