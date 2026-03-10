// 知识图谱查询相关的请求和响应模型
package domain

// GetNodeGraphReq 获取节点图谱请求
type GetNodeGraphReq struct {
	NodeID string `query:"node_id" validate:"required"`
	Depth  int    `query:"depth" validate:"min=1,max=3"` // 查询深度，最大3层
}

// GetAllGraphReq 获取所有图谱数据请求
type GetAllGraphReq struct {
	KbID  string `query:"kb_id" validate:"required"`
	Limit int    `query:"limit" validate:"min=1,max=10000"` // 限制节点数量
}

// GraphNodeResp 图谱节点响应
type GraphNodeResp struct {
	ID         string                 `json:"id"`
	Name       string                 `json:"name"`
	Type       string                 `json:"type"` // Document, Folder, Entity, User, KnowledgeBase
	Properties map[string]interface{} `json:"properties"`
}

// GraphEdgeResp 图谱边响应
type GraphEdgeResp struct {
	Source     string                 `json:"source"`
	Target     string                 `json:"target"`
	Type       string                 `json:"type"`
	Properties map[string]interface{} `json:"properties"`
}

// GraphDataResp 图谱数据响应
type GraphDataResp struct {
	Nodes []GraphNodeResp `json:"nodes"`
	Edges []GraphEdgeResp `json:"edges"`
}

// FindPathReq 查找路径请求
type FindPathReq struct {
	StartNodeID string `query:"start_node_id" validate:"required"`
	EndNodeID   string `query:"end_node_id" validate:"required"`
	MaxDepth    int    `query:"max_depth" validate:"min=1,max=5"` // 最大深度
}

// PathResp 路径响应
type PathResp struct {
	Paths [][]GraphNodeResp `json:"paths"`
	Count int               `json:"count"`
}

// GraphStatsReq 图谱统计请求
type GraphStatsReq struct {
	KbID string `query:"kb_id" validate:"required"`
}

// GraphStatsResp 图谱统计响应
type GraphStatsResp struct {
	TotalNodes      int            `json:"total_nodes"`
	TotalEdges      int            `json:"total_edges"`
	NodesByType     map[string]int `json:"nodes_by_type"`
	EdgesByType     map[string]int `json:"edges_by_type"`
	DocumentCount   int            `json:"document_count"`
	FolderCount     int            `json:"folder_count"`
	EntityCount     int            `json:"entity_count"`
	AvgConnections  float64        `json:"avg_connections"`
}

// SearchEntitiesReq 搜索实体请求
type SearchEntitiesReq struct {
	KbID    string `query:"kb_id" validate:"required"`
	Keyword string `query:"keyword" validate:"required"`
	Type    string `query:"type"` // 可选：实体类型过滤
	Limit   int    `query:"limit" validate:"min=1,max=100"`
}

// EntityResp 实体响应
type EntityResp struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Type        string   `json:"type"`
	Aliases     []string `json:"aliases"`
	Description string   `json:"description"`
	Confidence  float64  `json:"confidence"`
	DocCount    int      `json:"doc_count"` // 关联文档数
}
