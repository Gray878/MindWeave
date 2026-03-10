// 文档节点操作
package neo4j

import (
	"context"
	"fmt"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

// CreateDocument 创建文档节点
func (s *Store) CreateDocument(ctx context.Context, doc *domain.GraphDocument) error {
	query := `
		CREATE (d:Document {
			id: $id,
			name: $name,
			kb_id: $kb_id,
			status: $status,
			visibility: $visibility,
			creator_id: $creator_id,
			editor_id: $editor_id,
			created_at: datetime($created_at),
			updated_at: datetime($updated_at)
		})
	`

	params := map[string]interface{}{
		"id":         doc.ID,
		"name":       doc.Name,
		"kb_id":      doc.KbID,
		"status":     doc.Status,
		"visibility": doc.Visibility,
		"creator_id": doc.CreatorID,
		"editor_id":  doc.EditorID,
		"created_at": doc.CreatedAt.Format("2006-01-02T15:04:05Z"),
		"updated_at": doc.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}

	_, err := s.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		return tx.Run(ctx, query, params)
	})

	return err
}

// UpdateDocument 更新文档节点
func (s *Store) UpdateDocument(ctx context.Context, doc *domain.GraphDocument) error {
	query := `
		MATCH (d:Document {id: $id})
		SET d.name = $name,
		    d.status = $status,
		    d.visibility = $visibility,
		    d.editor_id = $editor_id,
		    d.updated_at = datetime($updated_at)
	`

	params := map[string]interface{}{
		"id":         doc.ID,
		"name":       doc.Name,
		"status":     doc.Status,
		"visibility": doc.Visibility,
		"editor_id":  doc.EditorID,
		"updated_at": doc.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}

	_, err := s.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		return tx.Run(ctx, query, params)
	})

	return err
}

// DeleteDocument 删除文档节点及相关关系
func (s *Store) DeleteDocument(ctx context.Context, docID string) error {
	query := `
		MATCH (d:Document {id: $id})
		DETACH DELETE d
	`

	params := map[string]interface{}{
		"id": docID,
	}

	_, err := s.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		return tx.Run(ctx, query, params)
	})

	return err
}

// CreateDocumentRelations 创建文档相关关系
func (s *Store) CreateDocumentRelations(ctx context.Context, docID, kbID, creatorID, parentID string) error {
	// 创建 BELONGS_TO 关系 (Document -> KnowledgeBase)
	if kbID != "" {
		query := `
			MATCH (d:Document {id: $doc_id})
			MATCH (kb:KnowledgeBase {id: $kb_id})
			MERGE (d)-[:BELONGS_TO {created_at: datetime()}]->(kb)
		`
		params := map[string]interface{}{
			"doc_id": docID,
			"kb_id":  kbID,
		}
		if _, err := s.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
			return tx.Run(ctx, query, params)
		}); err != nil {
			return fmt.Errorf("create BELONGS_TO relation failed: %w", err)
		}
	}

	// 创建 CREATED_BY 关系 (Document -> User)
	if creatorID != "" {
		query := `
			MATCH (d:Document {id: $doc_id})
			MATCH (u:User {id: $user_id})
			MERGE (d)-[:CREATED_BY {created_at: datetime()}]->(u)
		`
		params := map[string]interface{}{
			"doc_id":  docID,
			"user_id": creatorID,
		}
		if _, err := s.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
			return tx.Run(ctx, query, params)
		}); err != nil {
			return fmt.Errorf("create CREATED_BY relation failed: %w", err)
		}
	}

	// 创建 CONTAINS 关系 (Folder -> Document)
	if parentID != "" {
		query := `
			MATCH (f:Folder {id: $parent_id})
			MATCH (d:Document {id: $doc_id})
			MERGE (f)-[:CONTAINS {created_at: datetime()}]->(d)
		`
		params := map[string]interface{}{
			"parent_id": parentID,
			"doc_id":    docID,
		}
		if _, err := s.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
			return tx.Run(ctx, query, params)
		}); err != nil {
			return fmt.Errorf("create CONTAINS relation failed: %w", err)
		}
	}

	return nil
}

// UpdateDocumentParent 更新文档的父文件夹关系
func (s *Store) UpdateDocumentParent(ctx context.Context, docID, oldParentID, newParentID string) error {
	// 删除旧的 CONTAINS 关系
	if oldParentID != "" {
		query := `
			MATCH (f:Folder {id: $old_parent_id})-[r:CONTAINS]->(d:Document {id: $doc_id})
			DELETE r
		`
		params := map[string]interface{}{
			"old_parent_id": oldParentID,
			"doc_id":        docID,
		}
		if _, err := s.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
			return tx.Run(ctx, query, params)
		}); err != nil {
			return fmt.Errorf("delete old CONTAINS relation failed: %w", err)
		}
	}

	// 创建新的 CONTAINS 关系
	if newParentID != "" {
		query := `
			MATCH (f:Folder {id: $new_parent_id})
			MATCH (d:Document {id: $doc_id})
			MERGE (f)-[:CONTAINS {created_at: datetime()}]->(d)
		`
		params := map[string]interface{}{
			"new_parent_id": newParentID,
			"doc_id":        docID,
		}
		if _, err := s.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
			return tx.Run(ctx, query, params)
		}); err != nil {
			return fmt.Errorf("create new CONTAINS relation failed: %w", err)
		}
	}

	return nil
}
