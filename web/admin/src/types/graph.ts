// 知识图谱相关类型定义

// 图谱节点
export interface GraphNode {
  id: string;
  name: string;
  type: string; // Document, Folder, Entity, User, KnowledgeBase
  properties: Record<string, any>;
}

// 图谱边
export interface GraphEdge {
  source: string;
  target: string;
  type: string; // CONTAINS, MENTIONS, RELATES_TO, CREATED_BY, EDITED_BY, BELONGS_TO, REFERENCES
  properties: Record<string, any>;
}

// 图谱数据响应
export interface GraphDataResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// 获取节点图谱请求
export interface GetNodeGraphRequest {
  node_id: string;
  depth: number; // 1-3
}

// 查找路径请求
export interface FindPathRequest {
  start_node_id: string;
  end_node_id: string;
  max_depth: number; // 1-5
}

// 路径响应
export interface PathResponse {
  paths: GraphNode[][];
  count: number;
}

// 图谱统计请求
export interface GraphStatsRequest {
  kb_id: string;
}

// 图谱统计响应
export interface GraphStatsResponse {
  total_nodes: number;
  total_edges: number;
  nodes_by_type: Record<string, number>;
  edges_by_type: Record<string, number>;
  document_count: number;
  folder_count: number;
  entity_count: number;
  avg_connections: number;
}

// 搜索实体请求
export interface SearchEntitiesRequest {
  kb_id: string;
  keyword: string;
  type?: string;
  limit?: number;
}

// 实体响应
export interface EntityResponse {
  id: string;
  name: string;
  type: string;
  aliases: string[];
  description: string;
  confidence: number;
  doc_count: number;
}

// Sigma.js 节点属性
export interface SigmaNodeAttributes {
  x: number;
  y: number;
  size: number;
  color: string;
  label: string;
  nodeType: string;
  properties: Record<string, any>;
  hidden: boolean;
  mass?: number; // ForceAtlas2 质量参数
  zIndex?: number;
  highlighted?: boolean;
}

// Sigma.js 边属性
export interface SigmaEdgeAttributes {
  size: number;
  color: string;
  relationType: string;
  type?: 'line' | 'curved' | 'arrow';
  curvature?: number;
  zIndex?: number;
}
