// 文件夹节点操作
package neo4j

import (
	"context"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

// CreateFolder 创建文件夹节点
func (s *Store) CreateFolder(ctx context.Context, folder *domain.GraphFolder) error {
	query := `
		CREATE (f:Folder {
			id: $id,
			name: $name,
			kb_id: $kb_id,
			parent_id: $parent_id,
			position: $position,
			created_at: datetime($created_at)
		})
	`

	params := map[string]interface{}{
		"id":         folder.ID,
		"name":       folder.Name,
		"kb_id":      folder.KbID,
		"parent_id":  folder.ParentID,
		"position":   folder.Position,
		"created_at": folder.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}

	_, err := s.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		return tx.Run(ctx, query, params)
	})

	return err
}

// UpdateFolder 更新文件夹节点
func (s *Store) UpdateFolder(ctx context.Context, folder *domain.GraphFolder) error {
	query := `
		MATCH (f:Folder {id: $id})
		SET f.name = $name,
		    f.position = $position
	`

	params := map[string]interface{}{
		"id":       folder.ID,
		"name":     folder.Name,
		"position": folder.Position,
	}

	_, err := s.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		return tx.Run(ctx, query, params)
	})

	return err
}

// DeleteFolder 删除文件夹节点及相关关系
func (s *Store) DeleteFolder(ctx context.Context, folderID string) error {
	query := `
		MATCH (f:Folder {id: $id})
		DETACH DELETE f
	`

	params := map[string]interface{}{
		"id": folderID,
	}

	_, err := s.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		return tx.Run(ctx, query, params)
	})

	return err
}

// CreateFolderRelations 创建文件夹相关关系
func (s *Store) CreateFolderRelations(ctx context.Context, folderID, kbID, parentID string) error {
	// 创建 BELONGS_TO 关系 (Folder -> KnowledgeBase)
	if kbID != "" {
		query := `
			MATCH (f:Folder {id: $folder_id})
			MATCH (kb:KnowledgeBase {id: $kb_id})
			MERGE (f)-[:BELONGS_TO {created_at: datetime()}]->(kb)
		`
		params := map[string]interface{}{
			"folder_id": folderID,
			"kb_id":     kbID,
		}
		if _, err := s.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
			return tx.Run(ctx, query, params)
		}); err != nil {
			return err
		}
	}

	// 创建 CONTAINS 关系 (父文件夹 -> 子文件夹)
	if parentID != "" {
		query := `
			MATCH (parent:Folder {id: $parent_id})
			MATCH (child:Folder {id: $folder_id})
			MERGE (parent)-[:CONTAINS {created_at: datetime()}]->(child)
		`
		params := map[string]interface{}{
			"parent_id": parentID,
			"folder_id": folderID,
		}
		if _, err := s.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
			return tx.Run(ctx, query, params)
		}); err != nil {
			return err
		}
	}

	return nil
}

// UpdateFolderParent updates CONTAINS relation when moving a folder.
func (s *Store) UpdateFolderParent(ctx context.Context, folderID, oldParentID, newParentID string) error {
	if oldParentID != "" {
		query := `
			MATCH (oldParent:Folder {id: $old_parent_id})-[r:CONTAINS]->(f:Folder {id: $folder_id})
			DELETE r
		`
		params := map[string]interface{}{
			"old_parent_id": oldParentID,
			"folder_id":     folderID,
		}
		if _, err := s.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
			return tx.Run(ctx, query, params)
		}); err != nil {
			return err
		}
	}

	if newParentID != "" {
		query := `
			MATCH (newParent:Folder {id: $new_parent_id})
			MATCH (f:Folder {id: $folder_id})
			MERGE (newParent)-[:CONTAINS {created_at: datetime()}]->(f)
		`
		params := map[string]interface{}{
			"new_parent_id": newParentID,
			"folder_id":     folderID,
		}
		if _, err := s.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
			return tx.Run(ctx, query, params)
		}); err != nil {
			return err
		}
	}

	updateQuery := `
		MATCH (f:Folder {id: $folder_id})
		SET f.parent_id = $new_parent_id
	`
	updateParams := map[string]interface{}{
		"folder_id":     folderID,
		"new_parent_id": newParentID,
	}
	if _, err := s.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		return tx.Run(ctx, updateQuery, updateParams)
	}); err != nil {
		return err
	}

	return nil
}
