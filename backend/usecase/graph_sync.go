// 知识图谱同步服务
package usecase

import (
	"context"
	"fmt"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/store/neo4j"
)

type GraphSyncUseCase struct {
	neo4jStore *neo4j.Store
}

func NewGraphSyncUseCase(neo4jStore *neo4j.Store) *GraphSyncUseCase {
	return &GraphSyncUseCase{
		neo4jStore: neo4jStore,
	}
}

// SyncDocumentCreate 同步创建文档到图谱
func (uc *GraphSyncUseCase) SyncDocumentCreate(ctx context.Context, node *domain.Node, kbID, creatorID string) error {
	// 转换为图谱文档模型
	doc := &domain.GraphDocument{
		ID:         node.ID,
		Name:       node.Name,
		KbID:       kbID,
		Status:     int(node.Status),
		Visibility: 1, // 默认可见
		CreatorID:  creatorID,
		EditorID:   creatorID,
		CreatedAt:  node.CreatedAt,
		UpdatedAt:  node.UpdatedAt,
	}

	// 创建文档节点
	if err := uc.neo4jStore.CreateDocument(ctx, doc); err != nil {
		return fmt.Errorf("create document node failed: %w", err)
	}

	// 创建相关关系
	parentID := node.ParentID
	if err := uc.neo4jStore.CreateDocumentRelations(ctx, node.ID, kbID, creatorID, parentID); err != nil {
		return fmt.Errorf("create document relations failed: %w", err)
	}

	return nil
}

// SyncDocumentUpdate 同步更新文档到图谱
func (uc *GraphSyncUseCase) SyncDocumentUpdate(ctx context.Context, node *domain.Node, editorID string) error {
	doc := &domain.GraphDocument{
		ID:         node.ID,
		Name:       node.Name,
		Status:     int(node.Status),
		Visibility: 1, // 默认可见
		EditorID:   editorID,
		UpdatedAt:  node.UpdatedAt,
	}

	if err := uc.neo4jStore.UpdateDocument(ctx, doc); err != nil {
		return fmt.Errorf("update document node failed: %w", err)
	}

	return nil
}

// SyncDocumentDelete 同步删除文档从图谱
func (uc *GraphSyncUseCase) SyncDocumentDelete(ctx context.Context, docID string) error {
	if err := uc.neo4jStore.DeleteDocument(ctx, docID); err != nil {
		return fmt.Errorf("delete document node failed: %w", err)
	}

	return nil
}

// SyncDocumentMove 同步移动文档
func (uc *GraphSyncUseCase) SyncDocumentMove(ctx context.Context, docID, oldParentID, newParentID string) error {
	if err := uc.neo4jStore.UpdateDocumentParent(ctx, docID, oldParentID, newParentID); err != nil {
		return fmt.Errorf("move document failed: %w", err)
	}

	return nil
}

// SyncFolderCreate 同步创建文件夹到图谱
func (uc *GraphSyncUseCase) SyncFolderCreate(ctx context.Context, node *domain.Node, kbID string) error {
	folder := &domain.GraphFolder{
		ID:        node.ID,
		Name:      node.Name,
		KbID:      kbID,
		ParentID:  node.ParentID,
		Position:  node.Position,
		CreatedAt: node.CreatedAt,
	}

	if err := uc.neo4jStore.CreateFolder(ctx, folder); err != nil {
		return fmt.Errorf("create folder node failed: %w", err)
	}

	parentID := node.ParentID
	if err := uc.neo4jStore.CreateFolderRelations(ctx, node.ID, kbID, parentID); err != nil {
		return fmt.Errorf("create folder relations failed: %w", err)
	}

	return nil
}

// SyncFolderUpdate 同步更新文件夹到图谱
func (uc *GraphSyncUseCase) SyncFolderUpdate(ctx context.Context, node *domain.Node) error {
	folder := &domain.GraphFolder{
		ID:       node.ID,
		Name:     node.Name,
		Position: node.Position,
	}

	if err := uc.neo4jStore.UpdateFolder(ctx, folder); err != nil {
		return fmt.Errorf("update folder node failed: %w", err)
	}

	return nil
}

// SyncFolderDelete 同步删除文件夹从图谱
func (uc *GraphSyncUseCase) SyncFolderDelete(ctx context.Context, folderID string) error {
	if err := uc.neo4jStore.DeleteFolder(ctx, folderID); err != nil {
		return fmt.Errorf("delete folder node failed: %w", err)
	}

	return nil
}

// SyncUserCreate 同步创建用户到图谱
func (uc *GraphSyncUseCase) SyncUserCreate(ctx context.Context, user *domain.User) error {
	graphUser := &domain.GraphUser{
		ID:        user.ID,
		Account:   user.Account,
		Role:      string(user.Role),
		CreatedAt: user.CreatedAt,
	}

	if err := uc.neo4jStore.CreateUser(ctx, graphUser); err != nil {
		return fmt.Errorf("create user node failed: %w", err)
	}

	return nil
}

// SyncKnowledgeBaseCreate 同步创建知识库到图谱
func (uc *GraphSyncUseCase) SyncKnowledgeBaseCreate(ctx context.Context, kb *domain.KnowledgeBase) error {
	graphKB := &domain.GraphKnowledgeBase{
		ID:        kb.ID,
		Name:      kb.Name,
		CreatedAt: kb.CreatedAt,
	}

	if err := uc.neo4jStore.CreateKnowledgeBase(ctx, graphKB); err != nil {
		return fmt.Errorf("create knowledge base node failed: %w", err)
	}

	return nil
}
