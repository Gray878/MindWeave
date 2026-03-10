// 用户节点操作
package neo4j

import (
	"context"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

// CreateUser 创建用户节点
func (s *Store) CreateUser(ctx context.Context, user *domain.GraphUser) error {
	query := `
		MERGE (u:User {id: $id})
		ON CREATE SET
			u.account = $account,
			u.role = $role,
			u.created_at = datetime($created_at)
	`

	params := map[string]interface{}{
		"id":         user.ID,
		"account":    user.Account,
		"role":       user.Role,
		"created_at": user.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}

	_, err := s.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		return tx.Run(ctx, query, params)
	})

	return err
}

// CreateKnowledgeBase 创建知识库节点
func (s *Store) CreateKnowledgeBase(ctx context.Context, kb *domain.GraphKnowledgeBase) error {
	query := `
		MERGE (kb:KnowledgeBase {id: $id})
		ON CREATE SET
			kb.name = $name,
			kb.created_at = datetime($created_at)
	`

	params := map[string]interface{}{
		"id":         kb.ID,
		"name":       kb.Name,
		"created_at": kb.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}

	_, err := s.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		return tx.Run(ctx, query, params)
	})

	return err
}
