export interface GraphNode {
  id: string;
  name: string;
  type: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  properties: Record<string, any>;
}

export interface GraphDataResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GetNodeGraphRequest {
  node_id: string;
  depth: number;
}

export interface FindPathRequest {
  start_node_id: string;
  end_node_id: string;
  max_depth: number;
}

export interface PathResponse {
  paths: GraphNode[][];
  count: number;
}

export interface GraphStatsRequest {
  kb_id: string;
}

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

export interface SearchEntitiesRequest {
  kb_id: string;
  keyword: string;
  type?: string;
  limit?: number;
}

export interface RetryGraphSyncDeadLettersRequest {
  kb_id: string;
  limit?: number;
}

export interface GraphSyncRetryResponse {
  processed: number;
  resolved: number;
  failed: number;
}

export interface EntityResponse {
  id: string;
  name: string;
  type: string;
  aliases: string[];
  description: string;
  confidence: number;
  doc_count: number;
}

export interface SigmaNodeAttributes {
  x: number;
  y: number;
  size: number;
  color: string;
  beaconColor?: string;
  beaconState?: 'idle' | 'neighbor' | 'hovered' | 'selected';
  label: string;
  nodeType: string;
  properties: Record<string, any>;
  hidden: boolean;
  mass?: number;
  zIndex?: number;
  highlighted?: boolean;
}

export interface SigmaEdgeAttributes {
  size: number;
  color: string;
  relationType: string;
  type?: 'line' | 'curved' | 'arrow';
  curvature?: number;
  zIndex?: number;
}
