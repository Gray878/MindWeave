// 知识图谱查询操作
package neo4j

import (
	"context"
	"fmt"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

// GetNodeGraph 获取节点及其关系图谱
func (s *Store) GetNodeGraph(ctx context.Context, nodeID string, depth int) (*domain.GraphDataResp, error) {
	query := `
		MATCH path = (n)-[r*0..` + fmt.Sprintf("%d", depth) + `]-(m)
		WHERE n.id = $nodeID
		WITH n, r, m
		RETURN 
			collect(DISTINCT n) + collect(DISTINCT m) as nodes,
			collect(DISTINCT r) as relationships
	`

	params := map[string]interface{}{
		"nodeID": nodeID,
	}

	result, err := s.ExecuteRead(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		res, err := tx.Run(ctx, query, params)
		if err != nil {
			return nil, err
		}

		record, err := res.Single(ctx)
		if err != nil {
			return nil, err
		}

		nodesRaw, _ := record.Get("nodes")
		relsRaw, _ := record.Get("relationships")

		graphData := &domain.GraphDataResp{
			Nodes: []domain.GraphNodeResp{},
			Edges: []domain.GraphEdgeResp{},
		}

		// 处理节点
		if nodes, ok := nodesRaw.([]interface{}); ok {
			for _, n := range nodes {
				if node, ok := n.(neo4j.Node); ok {
					graphNode := domain.GraphNodeResp{
						ID:         getStringProp(node.Props, "id"),
						Name:       getStringProp(node.Props, "name"),
						Type:       getNodeType(node.Labels),
						Properties: node.Props,
					}
					graphData.Nodes = append(graphData.Nodes, graphNode)
				}
			}
		}

		// 处理关系
		if rels, ok := relsRaw.([]interface{}); ok {
			for _, r := range rels {
				if relList, ok := r.([]interface{}); ok {
					for _, rel := range relList {
						if relationship, ok := rel.(neo4j.Relationship); ok {
							graphEdge := domain.GraphEdgeResp{
								Source:     fmt.Sprintf("%d", relationship.StartId),
								Target:     fmt.Sprintf("%d", relationship.EndId),
								Type:       relationship.Type,
								Properties: relationship.Props,
							}
							graphData.Edges = append(graphData.Edges, graphEdge)
						}
					}
				}
			}
		}

		return graphData, nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to get node graph: %w", err)
	}

	return result.(*domain.GraphDataResp), nil
}

// FindPaths 查找两个节点之间的路径
func (s *Store) FindPaths(ctx context.Context, startNodeID, endNodeID string, maxDepth int) ([][]domain.GraphNodeResp, error) {
	query := `
		MATCH path = shortestPath((start)-[*..` + fmt.Sprintf("%d", maxDepth) + `]-(end))
		WHERE start.id = $startNodeID AND end.id = $endNodeID
		RETURN nodes(path) as pathNodes
		LIMIT 10
	`

	params := map[string]interface{}{
		"startNodeID": startNodeID,
		"endNodeID":   endNodeID,
	}

	result, err := s.ExecuteRead(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		res, err := tx.Run(ctx, query, params)
		if err != nil {
			return nil, err
		}

		var paths [][]domain.GraphNodeResp

		for res.Next(ctx) {
			record := res.Record()
			pathNodesRaw, _ := record.Get("pathNodes")

			if pathNodes, ok := pathNodesRaw.([]interface{}); ok {
				var path []domain.GraphNodeResp
				for _, n := range pathNodes {
					if node, ok := n.(neo4j.Node); ok {
						graphNode := domain.GraphNodeResp{
							ID:         getStringProp(node.Props, "id"),
							Name:       getStringProp(node.Props, "name"),
							Type:       getNodeType(node.Labels),
							Properties: node.Props,
						}
						path = append(path, graphNode)
					}
				}
				if len(path) > 0 {
					paths = append(paths, path)
				}
			}
		}

		return paths, nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to find paths: %w", err)
	}

	return result.([][]domain.GraphNodeResp), nil
}

// GetGraphStats 获取图谱统计信息
func (s *Store) GetGraphStats(ctx context.Context, kbID string) (*domain.GraphStatsResp, error) {
	// 查询节点统计
	nodeQuery := `
		MATCH (n)
		WITH labels(n)[0] as nodeType, count(n) as count
		RETURN nodeType, count
	`

	// 查询边统计
	edgeQuery := `
		MATCH ()-[r]->()
		WITH type(r) as edgeType, count(r) as count
		RETURN edgeType, count
	`

	// 查询总数
	totalQuery := `
		MATCH (n)
		WITH count(DISTINCT n) as totalNodes
		OPTIONAL MATCH ()-[r]->()
		WITH totalNodes, count(DISTINCT r) as totalEdges
		RETURN totalNodes, totalEdges
	`

	result, err := s.ExecuteRead(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		stats := &domain.GraphStatsResp{
			NodesByType: make(map[string]int),
			EdgesByType: make(map[string]int),
		}

		// 获取节点统计（暂时不过滤 kb_id）
		nodeRes, err := tx.Run(ctx, nodeQuery, nil)
		if err != nil {
			return nil, err
		}

		for nodeRes.Next(ctx) {
			record := nodeRes.Record()
			nodeType, _ := record.Get("nodeType")
			count, _ := record.Get("count")

			if typeStr, ok := nodeType.(string); ok {
				if countVal, ok := count.(int64); ok {
					stats.NodesByType[typeStr] = int(countVal)

					// 统计各类型节点数
					switch typeStr {
					case "Document":
						stats.DocumentCount = int(countVal)
					case "Folder":
						stats.FolderCount = int(countVal)
					case "Entity":
						stats.EntityCount = int(countVal)
					}
				}
			}
		}

		// 获取边统计（暂时不过滤 kb_id）
		edgeRes, err := tx.Run(ctx, edgeQuery, nil)
		if err != nil {
			return nil, err
		}

		for edgeRes.Next(ctx) {
			record := edgeRes.Record()
			edgeType, _ := record.Get("edgeType")
			count, _ := record.Get("count")

			if typeStr, ok := edgeType.(string); ok {
				if countVal, ok := count.(int64); ok {
					stats.EdgesByType[typeStr] = int(countVal)
				}
			}
		}

		// 获取总数（暂时不过滤 kb_id）
		totalRes, err := tx.Run(ctx, totalQuery, nil)
		if err != nil {
			return nil, err
		}

		if totalRes.Next(ctx) {
			record := totalRes.Record()
			if totalNodes, ok := record.Get("totalNodes"); ok {
				if val, ok := totalNodes.(int64); ok {
					stats.TotalNodes = int(val)
				}
			}
			if totalEdges, ok := record.Get("totalEdges"); ok {
				if val, ok := totalEdges.(int64); ok {
					stats.TotalEdges = int(val)
				}
			}
		}

		// 计算平均连接数
		if stats.TotalNodes > 0 {
			stats.AvgConnections = float64(stats.TotalEdges) / float64(stats.TotalNodes)
		}

		return stats, nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to get graph stats: %w", err)
	}

	return result.(*domain.GraphStatsResp), nil
}

// SearchEntities 搜索实体
func (s *Store) SearchEntities(ctx context.Context, kbID, keyword, entityType string, limit int) ([]domain.EntityResp, error) {
	query := `
		MATCH (e:Entity)
		WHERE e.kb_id = $kbID 
		AND (e.name CONTAINS $keyword OR any(alias IN e.aliases WHERE alias CONTAINS $keyword))
	`

	if entityType != "" {
		query += ` AND e.type = $entityType`
	}

	query += `
		OPTIONAL MATCH (e)<-[:MENTIONS]-(d:Document)
		RETURN e, count(DISTINCT d) as docCount
		ORDER BY docCount DESC, e.confidence DESC
		LIMIT $limit
	`

	params := map[string]interface{}{
		"kbID":    kbID,
		"keyword": keyword,
		"limit":   limit,
	}

	if entityType != "" {
		params["entityType"] = entityType
	}

	result, err := s.ExecuteRead(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		res, err := tx.Run(ctx, query, params)
		if err != nil {
			return nil, err
		}

		var entities []domain.EntityResp

		for res.Next(ctx) {
			record := res.Record()
			entityRaw, _ := record.Get("e")
			docCountRaw, _ := record.Get("docCount")

			if node, ok := entityRaw.(neo4j.Node); ok {
				entity := domain.EntityResp{
					ID:          getStringProp(node.Props, "id"),
					Name:        getStringProp(node.Props, "name"),
					Type:        getStringProp(node.Props, "type"),
					Description: getStringProp(node.Props, "description"),
					Confidence:  getFloatProp(node.Props, "confidence"),
				}

				if aliases, ok := node.Props["aliases"].([]interface{}); ok {
					for _, a := range aliases {
						if alias, ok := a.(string); ok {
							entity.Aliases = append(entity.Aliases, alias)
						}
					}
				}

				if docCount, ok := docCountRaw.(int64); ok {
					entity.DocCount = int(docCount)
				}

				entities = append(entities, entity)
			}
		}

		return entities, nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to search entities: %w", err)
	}

	return result.([]domain.EntityResp), nil
}

// 辅助函数：获取字符串属性
func getStringProp(props map[string]interface{}, key string) string {
	if val, ok := props[key]; ok {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return ""
}

// 辅助函数：获取浮点数属性
func getFloatProp(props map[string]interface{}, key string) float64 {
	if val, ok := props[key]; ok {
		if f, ok := val.(float64); ok {
			return f
		}
	}
	return 0.0
}

// 辅助函数：从标签获取节点类型
func getNodeType(labels []string) string {
	if len(labels) > 0 {
		return labels[0]
	}
	return "Unknown"
}

// BuildDocumentRelationsByKeyword 基于关键词构建文档关系
func (s *Store) BuildDocumentRelationsByKeyword(ctx context.Context, kbID string) (int, error) {
	// 使用简单的策略：如果两个文档名称有共同的2个字以上的词，就建立关系
	query := `
		MATCH (d1:Document), (d2:Document)
		WHERE d1.kb_id = $kbID AND d2.kb_id = $kbID
		  AND d1.id < d2.id
		WITH d1, d2, 
		     [word IN split(d1.name, ' ') WHERE size(word) >= 2 | word] as words1,
		     [word IN split(d2.name, ' ') WHERE size(word) >= 2 | word] as words2
		WITH d1, d2, 
		     [word IN words1 WHERE word IN words2] as commonWords
		WHERE size(commonWords) > 0
		MERGE (d1)-[r:RELATED_BY_KEYWORD]->(d2)
		SET r.keywords = commonWords,
		    r.created_at = datetime()
		RETURN count(r) as relationCount
	`

	params := map[string]interface{}{
		"kbID": kbID,
	}

	result, err := s.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		res, err := tx.Run(ctx, query, params)
		if err != nil {
			return 0, err
		}

		if res.Next(ctx) {
			record := res.Record()
			if count, ok := record.Get("relationCount"); ok {
				if countVal, ok := count.(int64); ok {
					return int(countVal), nil
				}
			}
		}

		return 0, nil
	})

	if err != nil {
		return 0, fmt.Errorf("failed to build document relations: %w", err)
	}

	return result.(int), nil
}

// GetAllGraph 获取所有图谱数据
func (s *Store) GetAllGraph(ctx context.Context, kbID string, limit int) (*domain.GraphDataResp, error) {
	// 查询所有节点
	nodeQuery := `
		MATCH (n)
		RETURN n
		LIMIT $limit
	`

	// 查询所有关系
	edgeQuery := `
		MATCH (n)-[r]->(m)
		RETURN n, r, m
		LIMIT $limit
	`

	params := map[string]interface{}{
		"limit": limit,
	}

	result, err := s.ExecuteRead(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		graphData := &domain.GraphDataResp{
			Nodes: []domain.GraphNodeResp{},
			Edges: []domain.GraphEdgeResp{},
		}

		nodeMap := make(map[string]bool) // 去重

		// 获取所有节点
		nodeRes, err := tx.Run(ctx, nodeQuery, params)
		if err != nil {
			return nil, err
		}

		for nodeRes.Next(ctx) {
			record := nodeRes.Record()
			nodeRaw, _ := record.Get("n")

			if node, ok := nodeRaw.(neo4j.Node); ok {
				nodeID := getStringProp(node.Props, "id")
				if nodeID == "" {
					nodeID = fmt.Sprintf("%d", node.Id)
				}

				if !nodeMap[nodeID] {
					graphNode := domain.GraphNodeResp{
						ID:         nodeID,
						Name:       getStringProp(node.Props, "name"),
						Type:       getNodeType(node.Labels),
						Properties: node.Props,
					}
					graphData.Nodes = append(graphData.Nodes, graphNode)
					nodeMap[nodeID] = true
				}
			}
		}

		// 获取所有关系
		edgeRes, err := tx.Run(ctx, edgeQuery, params)
		if err != nil {
			return nil, err
		}

		for edgeRes.Next(ctx) {
			record := edgeRes.Record()
			startNodeRaw, _ := record.Get("n")
			relRaw, _ := record.Get("r")
			endNodeRaw, _ := record.Get("m")

			// 确保起始和结束节点都在节点列表中
			if startNode, ok := startNodeRaw.(neo4j.Node); ok {
				startID := getStringProp(startNode.Props, "id")
				if startID == "" {
					startID = fmt.Sprintf("%d", startNode.Id)
				}

				if !nodeMap[startID] {
					graphNode := domain.GraphNodeResp{
						ID:         startID,
						Name:       getStringProp(startNode.Props, "name"),
						Type:       getNodeType(startNode.Labels),
						Properties: startNode.Props,
					}
					graphData.Nodes = append(graphData.Nodes, graphNode)
					nodeMap[startID] = true
				}
			}

			if endNode, ok := endNodeRaw.(neo4j.Node); ok {
				endID := getStringProp(endNode.Props, "id")
				if endID == "" {
					endID = fmt.Sprintf("%d", endNode.Id)
				}

				if !nodeMap[endID] {
					graphNode := domain.GraphNodeResp{
						ID:         endID,
						Name:       getStringProp(endNode.Props, "name"),
						Type:       getNodeType(endNode.Labels),
						Properties: endNode.Props,
					}
					graphData.Nodes = append(graphData.Nodes, graphNode)
					nodeMap[endID] = true
				}
			}

			// 添加关系
			if rel, ok := relRaw.(neo4j.Relationship); ok {
				startID := ""
				endID := ""

				if startNode, ok := startNodeRaw.(neo4j.Node); ok {
					startID = getStringProp(startNode.Props, "id")
					if startID == "" {
						startID = fmt.Sprintf("%d", startNode.Id)
					}
				}

				if endNode, ok := endNodeRaw.(neo4j.Node); ok {
					endID = getStringProp(endNode.Props, "id")
					if endID == "" {
						endID = fmt.Sprintf("%d", endNode.Id)
					}
				}

				if startID != "" && endID != "" {
					graphEdge := domain.GraphEdgeResp{
						Source:     startID,
						Target:     endID,
						Type:       rel.Type,
						Properties: rel.Props,
					}
					graphData.Edges = append(graphData.Edges, graphEdge)
				}
			}
		}

		return graphData, nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to get all graph: %w", err)
	}

	return result.(*domain.GraphDataResp), nil
}
