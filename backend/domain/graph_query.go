package domain

type GetNodeGraphReq struct {
	NodeID string `query:"node_id" validate:"required"`
	Depth  int    `query:"depth" validate:"min=1,max=3"`
}

type GetAllGraphReq struct {
	KbID  string `query:"kb_id" validate:"required"`
	Limit int    `query:"limit" validate:"min=1,max=10000"`
}

type GraphNodeResp struct {
	ID         string                 `json:"id"`
	Name       string                 `json:"name"`
	Type       string                 `json:"type"`
	Properties map[string]interface{} `json:"properties"`
}

type GraphEdgeResp struct {
	Source     string                 `json:"source"`
	Target     string                 `json:"target"`
	Type       string                 `json:"type"`
	Properties map[string]interface{} `json:"properties"`
}

type GraphDataResp struct {
	Nodes []GraphNodeResp `json:"nodes"`
	Edges []GraphEdgeResp `json:"edges"`
}

type FindPathReq struct {
	StartNodeID string `query:"start_node_id" validate:"required"`
	EndNodeID   string `query:"end_node_id" validate:"required"`
	MaxDepth    int    `query:"max_depth" validate:"min=1,max=5"`
}

type PathResp struct {
	Paths [][]GraphNodeResp `json:"paths"`
	Count int               `json:"count"`
}

type GraphStatsReq struct {
	KbID string `query:"kb_id" validate:"required"`
}

type GraphStatsResp struct {
	TotalNodes     int            `json:"total_nodes"`
	TotalEdges     int            `json:"total_edges"`
	NodesByType    map[string]int `json:"nodes_by_type"`
	EdgesByType    map[string]int `json:"edges_by_type"`
	DocumentCount  int            `json:"document_count"`
	FolderCount    int            `json:"folder_count"`
	EntityCount    int            `json:"entity_count"`
	AvgConnections float64        `json:"avg_connections"`
}

type SearchEntitiesReq struct {
	KbID    string `query:"kb_id" validate:"required"`
	Keyword string `query:"keyword" validate:"required"`
	Type    string `query:"type"`
	Limit   int    `query:"limit" validate:"min=1,max=100"`
}

type RetryGraphSyncDeadLettersReq struct {
	KbID  string `query:"kb_id" validate:"required"`
	Limit int    `query:"limit" validate:"min=1,max=500"`
}

type GraphSyncRetryResp struct {
	Processed int `json:"processed"`
	Resolved  int `json:"resolved"`
	Failed    int `json:"failed"`
}

type EntityResp struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Type        string   `json:"type"`
	Aliases     []string `json:"aliases"`
	Description string   `json:"description"`
	Confidence  float64  `json:"confidence"`
	DocCount    int      `json:"doc_count"`
}
