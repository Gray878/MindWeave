// 知识图谱查询操作
package neo4j

import (
	"context"
	"fmt"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

const (
	documentRelationMinCommonTokens = 3
	documentRelationMinScore        = 0.18
	documentRelationPreviewKeywords = 20
)

func kbNodeFilterClause(alias string) string {
	return fmt.Sprintf(`(
		%[1]s.kb_id = $kbID
		OR (%[1]s:KnowledgeBase AND %[1]s.id = $kbID)
		OR (%[1]s:User AND EXISTS { MATCH (d:Document {kb_id: $kbID})-[:CREATED_BY]->(%[1]s) })
	)`, alias)
}

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
	nodeFilter := kbNodeFilterClause("n")
	edgeStartFilter := kbNodeFilterClause("a")
	edgeEndFilter := kbNodeFilterClause("b")

	nodeQuery := `
		MATCH (n)
		WHERE ` + nodeFilter + `
		WITH labels(n)[0] as nodeType, count(n) as count
		RETURN nodeType, count
	`

	// 查询边统计
	edgeQuery := `
		MATCH (a)-[r]->(b)
		WHERE ` + edgeStartFilter + ` AND ` + edgeEndFilter + `
		WITH type(r) as edgeType, count(r) as count
		RETURN edgeType, count
	`

	// 查询总数
	totalQuery := `
		MATCH (n)
		WHERE ` + nodeFilter + `
		WITH count(DISTINCT n) as totalNodes
		OPTIONAL MATCH (a)-[r]->(b)
		WHERE ` + edgeStartFilter + ` AND ` + edgeEndFilter + `
		WITH totalNodes, count(DISTINCT r) as totalEdges
		RETURN totalNodes, totalEdges
	`

	params := map[string]interface{}{
		"kbID": kbID,
	}

	result, err := s.ExecuteRead(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		stats := &domain.GraphStatsResp{
			NodesByType: make(map[string]int),
			EdgesByType: make(map[string]int),
		}

		// 获取节点统计（暂时不过滤 kb_id）
		nodeRes, err := tx.Run(ctx, nodeQuery, params)
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
		edgeRes, err := tx.Run(ctx, edgeQuery, params)
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
		totalRes, err := tx.Run(ctx, totalQuery, params)
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
	deleteQuery := `
		MATCH (d1:Document {kb_id: $kbID})-[r:RELATED_BY_KEYWORD]-(d2:Document {kb_id: $kbID})
		DELETE r
	`
	if _, err := s.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		return tx.Run(ctx, deleteQuery, map[string]interface{}{"kbID": kbID})
	}); err != nil {
		return 0, fmt.Errorf("failed to clear existing document relations: %w", err)
	}

	query := fmt.Sprintf(`
		MATCH (d1:Document {kb_id: $kbID}), (d2:Document {kb_id: $kbID})
		WHERE d1.id < d2.id
		WITH d1, d2,
		     CASE
		       WHEN size(coalesce(d1.tokens, [])) = 0 THEN [word IN split(toLower(d1.name), ' ') WHERE size(word) >= 2 | word]
		       ELSE coalesce(d1.tokens, [])
		     END AS tokens1,
		     CASE
		       WHEN size(coalesce(d2.tokens, [])) = 0 THEN [word IN split(toLower(d2.name), ' ') WHERE size(word) >= 2 | word]
		       ELSE coalesce(d2.tokens, [])
		     END AS tokens2
		WHERE size(tokens1) > 0 AND size(tokens2) > 0
		WITH d1, d2, tokens1, tokens2, [token IN tokens1 WHERE token IN tokens2] AS commonTokens
		WITH d1, d2, tokens1, tokens2, commonTokens, size(commonTokens) AS commonCount
		WITH d1, d2, commonTokens, commonCount,
		     CASE
		       WHEN (size(tokens1) + size(tokens2) - commonCount) = 0 THEN 0.0
		       ELSE toFloat(commonCount) / toFloat(size(tokens1) + size(tokens2) - commonCount)
		     END AS score
		WHERE commonCount >= $minCommonToken AND score >= $minScore
		MERGE (d1)-[r:RELATED_BY_KEYWORD]->(d2)
		SET r.keywords = commonTokens[0..%d],
		    r.common_count = commonCount,
		    r.score = score,
		    r.match_mode = 'content_tokens',
		    r.updated_at = datetime(),
		    r.created_at = coalesce(r.created_at, datetime())
		RETURN count(r) AS relationCount
	`, documentRelationPreviewKeywords)

	return s.executeRelationBuildQuery(ctx, query, map[string]interface{}{
		"kbID":           kbID,
		"minCommonToken": documentRelationMinCommonTokens,
		"minScore":       documentRelationMinScore,
	})
}

func (s *Store) BuildDocumentRelationsForDocument(ctx context.Context, kbID, docID string) (int, error) {
	deleteQuery := `
		MATCH (d:Document {id: $docID, kb_id: $kbID})-[r:RELATED_BY_KEYWORD]-(:Document {kb_id: $kbID})
		DELETE r
	`
	if _, err := s.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		return tx.Run(ctx, deleteQuery, map[string]interface{}{
			"kbID":  kbID,
			"docID": docID,
		})
	}); err != nil {
		return 0, fmt.Errorf("failed to clear old document relations: %w", err)
	}

	query := fmt.Sprintf(`
		MATCH (d:Document {id: $docID, kb_id: $kbID})
		WITH d,
		     CASE
		       WHEN size(coalesce(d.tokens, [])) = 0 THEN [word IN split(toLower(d.name), ' ') WHERE size(word) >= 2 | word]
		       ELSE coalesce(d.tokens, [])
		     END AS docTokens
		WHERE size(docTokens) > 0
		MATCH (other:Document {kb_id: $kbID})
		WHERE other.id <> d.id
		WITH d, other, docTokens,
		     CASE
		       WHEN size(coalesce(other.tokens, [])) = 0 THEN [word IN split(toLower(other.name), ' ') WHERE size(word) >= 2 | word]
		       ELSE coalesce(other.tokens, [])
		     END AS otherTokens
		WHERE size(otherTokens) > 0
		WITH d, other, docTokens, otherTokens, [token IN docTokens WHERE token IN otherTokens] AS commonTokens
		WITH d, other, docTokens, otherTokens, commonTokens, size(commonTokens) AS commonCount
		WITH d, other, commonTokens, commonCount,
		     CASE
		       WHEN (size(docTokens) + size(otherTokens) - commonCount) = 0 THEN 0.0
		       ELSE toFloat(commonCount) / toFloat(size(docTokens) + size(otherTokens) - commonCount)
		     END AS score
		WHERE commonCount >= $minCommonToken AND score >= $minScore
		WITH
		    CASE WHEN d.id < other.id THEN d ELSE other END AS leftDoc,
		    CASE WHEN d.id < other.id THEN other ELSE d END AS rightDoc,
		    commonTokens, commonCount, score
		MERGE (leftDoc)-[r:RELATED_BY_KEYWORD]->(rightDoc)
		SET r.keywords = commonTokens[0..%d],
		    r.common_count = commonCount,
		    r.score = score,
		    r.match_mode = 'content_tokens',
		    r.updated_at = datetime(),
		    r.created_at = coalesce(r.created_at, datetime())
		RETURN count(r) AS relationCount
	`, documentRelationPreviewKeywords)

	return s.executeRelationBuildQuery(ctx, query, map[string]interface{}{
		"kbID":           kbID,
		"docID":          docID,
		"minCommonToken": documentRelationMinCommonTokens,
		"minScore":       documentRelationMinScore,
	})
}

func (s *Store) executeRelationBuildQuery(ctx context.Context, query string, params map[string]interface{}) (int, error) {
	result, err := s.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		res, err := tx.Run(ctx, query, params)
		if err != nil {
			return 0, err
		}

		if res.Next(ctx) {
			record := res.Record()
			countRaw, ok := record.Get("relationCount")
			if !ok {
				return 0, nil
			}
			count, ok := countRaw.(int64)
			if !ok {
				return 0, nil
			}
			return int(count), nil
		}

		if err := res.Err(); err != nil {
			return 0, err
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
	nodeFilter := kbNodeFilterClause("n")
	edgeStartFilter := kbNodeFilterClause("n")
	edgeEndFilter := kbNodeFilterClause("m")

	nodeQuery := `
		MATCH (n)
		WHERE ` + nodeFilter + `
		RETURN n
		LIMIT $limit
	`

	// 查询所有关系
	edgeQuery := `
		MATCH (n)-[r]->(m)
		WHERE ` + edgeStartFilter + ` AND ` + edgeEndFilter + `
		RETURN n, r, m
		LIMIT $limit
	`

	params := map[string]interface{}{
		"kbID":  kbID,
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
