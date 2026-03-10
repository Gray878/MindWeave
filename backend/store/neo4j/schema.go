// Neo4j Schema 初始化
package neo4j

import (
	"context"

	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

// InitSchema 初始化 Neo4j Schema (约束和索引)
func (s *Store) InitSchema(ctx context.Context) error {
	queries := []string{
		// 创建唯一约束
		"CREATE CONSTRAINT document_id IF NOT EXISTS FOR (d:Document) REQUIRE d.id IS UNIQUE",
		"CREATE CONSTRAINT folder_id IF NOT EXISTS FOR (f:Folder) REQUIRE f.id IS UNIQUE",
		"CREATE CONSTRAINT entity_id IF NOT EXISTS FOR (e:Entity) REQUIRE e.id IS UNIQUE",
		"CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE",
		"CREATE CONSTRAINT kb_id IF NOT EXISTS FOR (k:KnowledgeBase) REQUIRE k.id IS UNIQUE",

		// 创建索引
		"CREATE INDEX document_name IF NOT EXISTS FOR (d:Document) ON (d.name)",
		"CREATE INDEX document_kb IF NOT EXISTS FOR (d:Document) ON (d.kb_id)",
		"CREATE INDEX entity_name IF NOT EXISTS FOR (e:Entity) ON (e.name)",
		"CREATE INDEX entity_type IF NOT EXISTS FOR (e:Entity) ON (e.type)",
		"CREATE INDEX entity_kb IF NOT EXISTS FOR (e:Entity) ON (e.kb_id)",
	}

	for _, query := range queries {
		_, err := s.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
			return tx.Run(ctx, query, nil)
		})
		if err != nil {
			return err
		}
	}

	return nil
}
