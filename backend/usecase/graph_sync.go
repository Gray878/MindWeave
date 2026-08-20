package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/chaitin/panda-wiki/consts"
	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	pgRepo "github.com/chaitin/panda-wiki/repo/pg"
	"github.com/chaitin/panda-wiki/store/neo4j"
)

const (
	graphSyncTaskDocumentCreate = "document_create"
	graphSyncTaskDocumentUpdate = "document_update"
	graphSyncTaskDocumentDelete = "document_delete"
	graphSyncTaskDocumentMove   = "document_move"
	graphSyncTaskFolderCreate   = "folder_create"
	graphSyncTaskFolderUpdate   = "folder_update"
	graphSyncTaskFolderDelete   = "folder_delete"
	graphSyncTaskFolderMove     = "folder_move"
	graphSyncTaskUserCreate     = "user_create"
	graphSyncTaskKBCreate       = "kb_create"
)

const (
	graphSyncMaxRetryAttempts = 3
	graphSyncRetryInitialWait = 500 * time.Millisecond
	graphSyncRetryMaxWait     = 4 * time.Second
	graphSyncDeadLetterWait   = 5 * time.Second
)

type GraphSyncUseCase struct {
	neo4jStore      *neo4j.Store
	nodeRepo        *pgRepo.NodeRepository
	deadLetterRepo  *pgRepo.GraphSyncDeadLetterRepository
	logger          *log.Logger
	maxRetryAttempt int
	initialRetryGap time.Duration
	maxRetryGap     time.Duration
}

func NewGraphSyncUseCase(neo4jStore *neo4j.Store, nodeRepo *pgRepo.NodeRepository, deadLetterRepo *pgRepo.GraphSyncDeadLetterRepository, logger *log.Logger) *GraphSyncUseCase {
	return &GraphSyncUseCase{
		neo4jStore:      neo4jStore,
		nodeRepo:        nodeRepo,
		deadLetterRepo:  deadLetterRepo,
		logger:          logger.WithModule("usecase.graph_sync"),
		maxRetryAttempt: graphSyncMaxRetryAttempts,
		initialRetryGap: graphSyncRetryInitialWait,
		maxRetryGap:     graphSyncRetryMaxWait,
	}
}

func (uc *GraphSyncUseCase) runWithRetry(ctx context.Context, taskType, entityID string, payload map[string]any, syncFn func(context.Context) error) error {
	if syncFn == nil {
		return nil
	}
	if ctx == nil {
		ctx = context.Background()
	}

	var lastErr error
	for attempt := 1; attempt <= uc.maxRetryAttempt; attempt++ {
		if err := syncFn(ctx); err == nil {
			return nil
		} else {
			lastErr = err
		}

		if attempt == uc.maxRetryAttempt {
			break
		}

		wait := uc.nextRetryGap(attempt)
		uc.logger.Warn("graph sync attempt failed, retrying",
			log.String("task_type", taskType),
			log.String("entity_id", entityID),
			log.Int("attempt", attempt),
			log.Int("max_attempt", uc.maxRetryAttempt),
			log.String("retry_after", wait.String()),
			log.Error(lastErr),
		)

		timer := time.NewTimer(wait)
		select {
		case <-ctx.Done():
			if !timer.Stop() {
				<-timer.C
			}
			lastErr = ctx.Err()
			return uc.failGraphSyncTask(ctx, taskType, entityID, payload, attempt, lastErr)
		case <-timer.C:
		}
	}

	return uc.failGraphSyncTask(ctx, taskType, entityID, payload, uc.maxRetryAttempt, lastErr)
}

func (uc *GraphSyncUseCase) failGraphSyncTask(ctx context.Context, taskType, entityID string, payload map[string]any, retryCount int, syncErr error) error {
	uc.logger.Error("graph sync exhausted retries, move task to dead letter",
		log.String("task_type", taskType),
		log.String("entity_id", entityID),
		log.Int("retry_count", retryCount),
		log.Error(syncErr),
	)

	if err := uc.persistDeadLetter(ctx, taskType, entityID, payload, retryCount, syncErr); err != nil {
		uc.logger.Error("persist graph sync dead letter failed",
			log.String("task_type", taskType),
			log.String("entity_id", entityID),
			log.Error(err),
		)
	}

	return syncErr
}

func (uc *GraphSyncUseCase) nextRetryGap(attempt int) time.Duration {
	factor := math.Pow(2, float64(attempt-1))
	wait := time.Duration(float64(uc.initialRetryGap) * factor)
	if wait > uc.maxRetryGap {
		return uc.maxRetryGap
	}
	return wait
}

func (uc *GraphSyncUseCase) persistDeadLetter(ctx context.Context, taskType, entityID string, payload map[string]any, retryCount int, syncErr error) error {
	if uc.deadLetterRepo == nil {
		return nil
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		uc.logger.Warn("marshal graph sync dead letter payload failed",
			log.String("task_type", taskType),
			log.String("entity_id", entityID),
			log.Error(err),
		)
		payloadBytes = []byte("{}")
	}

	now := time.Now()
	deadLetter := &domain.GraphSyncDeadLetter{
		ID:           uuid.NewString(),
		KbID:         getStringFromPayload(payload, "kb_id"),
		TaskType:     taskType,
		Status:       domain.GraphSyncDeadLetterStatusPending,
		EntityID:     entityID,
		Payload:      payloadBytes,
		ErrorMessage: fmt.Sprintf("%v", syncErr),
		RetryCount:   retryCount,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	writeCtx := ctx
	if writeCtx == nil || writeCtx.Err() != nil {
		var cancel context.CancelFunc
		writeCtx, cancel = context.WithTimeout(context.Background(), graphSyncDeadLetterWait)
		defer cancel()
	}

	return uc.deadLetterRepo.Create(writeCtx, deadLetter)
}

func (uc *GraphSyncUseCase) RetryDeadLetters(ctx context.Context, kbID string, limit int) (*domain.GraphSyncRetryResp, error) {
	if uc.deadLetterRepo == nil {
		return &domain.GraphSyncRetryResp{}, nil
	}
	if limit <= 0 {
		limit = 100
	}

	deadLetters, err := uc.deadLetterRepo.ListPending(ctx, kbID, limit)
	if err != nil {
		if isDeadLetterTableMissingErr(err) {
			uc.logger.Warn("graph sync dead letter table is missing, skip retry",
				log.String("kb_id", kbID),
				log.Error(err),
			)
			return &domain.GraphSyncRetryResp{}, nil
		}
		return nil, fmt.Errorf("list graph sync dead letters failed: %w", err)
	}

	result := &domain.GraphSyncRetryResp{}
	for _, deadLetter := range deadLetters {
		result.Processed++

		payload := map[string]any{}
		if len(deadLetter.Payload) > 0 {
			if err := json.Unmarshal(deadLetter.Payload, &payload); err != nil {
				uc.logger.Warn("unmarshal graph sync dead letter payload failed",
					log.String("dead_letter_id", deadLetter.ID),
					log.String("task_type", deadLetter.TaskType),
					log.Error(err),
				)
			}
		}
		if deadLetter.KbID != "" && getStringFromPayload(payload, "kb_id") == "" {
			payload["kb_id"] = deadLetter.KbID
		}

		err := uc.runWithRetryNoDeadLetter(ctx, deadLetter.TaskType, deadLetter.EntityID, func(retryCtx context.Context) error {
			return uc.executeSyncTask(retryCtx, deadLetter.TaskType, deadLetter.EntityID, payload)
		})
		if err != nil {
			result.Failed++
			totalRetryCount := deadLetter.RetryCount + uc.maxRetryAttempt
			if updateErr := uc.deadLetterRepo.MarkRetryFailed(ctx, deadLetter.ID, fmt.Sprintf("%v", err), totalRetryCount); updateErr != nil {
				uc.logger.Error("mark graph sync dead letter failed failed",
					log.String("dead_letter_id", deadLetter.ID),
					log.Error(updateErr),
				)
			}
			continue
		}

		if err := uc.deadLetterRepo.MarkResolved(ctx, deadLetter.ID); err != nil {
			result.Failed++
			uc.logger.Error("mark graph sync dead letter resolved failed",
				log.String("dead_letter_id", deadLetter.ID),
				log.Error(err),
			)
			continue
		}

		result.Resolved++
	}

	return result, nil
}

func (uc *GraphSyncUseCase) executeSyncTask(ctx context.Context, taskType, entityID string, payload map[string]any) error {
	switch taskType {
	case graphSyncTaskDocumentCreate:
		node, err := uc.loadNode(ctx, entityID)
		if err != nil {
			return err
		}
		kbID := getStringFromPayload(payload, "kb_id")
		if kbID == "" {
			kbID = node.KBID
		}
		creatorID := getStringFromPayload(payload, "user_id")
		if creatorID == "" {
			creatorID = node.CreatorId
		}
		return uc.SyncDocumentCreate(ctx, node, kbID, creatorID)
	case graphSyncTaskDocumentUpdate:
		node, err := uc.loadNode(ctx, entityID)
		if err != nil {
			return err
		}
		editorID := getStringFromPayload(payload, "user_id")
		if editorID == "" {
			editorID = node.EditorId
		}
		return uc.SyncDocumentUpdate(ctx, node, editorID)
	case graphSyncTaskDocumentDelete:
		return uc.SyncDocumentDelete(ctx, entityID)
	case graphSyncTaskDocumentMove:
		oldParentID := getStringFromPayload(payload, "old_parent_id")
		newParentID := getStringFromPayload(payload, "new_parent_id")
		if newParentID == "" {
			node, err := uc.loadNode(ctx, entityID)
			if err != nil {
				return err
			}
			newParentID = node.ParentID
		}
		return uc.SyncDocumentMove(ctx, entityID, oldParentID, newParentID)
	case graphSyncTaskFolderCreate:
		node, err := uc.loadNode(ctx, entityID)
		if err != nil {
			return err
		}
		kbID := getStringFromPayload(payload, "kb_id")
		if kbID == "" {
			kbID = node.KBID
		}
		return uc.SyncFolderCreate(ctx, node, kbID)
	case graphSyncTaskFolderUpdate:
		node, err := uc.loadNode(ctx, entityID)
		if err != nil {
			return err
		}
		return uc.SyncFolderUpdate(ctx, node)
	case graphSyncTaskFolderDelete:
		return uc.SyncFolderDelete(ctx, entityID)
	case graphSyncTaskFolderMove:
		oldParentID := getStringFromPayload(payload, "old_parent_id")
		newParentID := getStringFromPayload(payload, "new_parent_id")
		if newParentID == "" {
			node, err := uc.loadNode(ctx, entityID)
			if err != nil {
				return err
			}
			newParentID = node.ParentID
		}
		return uc.SyncFolderMove(ctx, entityID, oldParentID, newParentID)
	case graphSyncTaskUserCreate:
		createdAt := getTimeFromPayload(payload, "created_at")
		if createdAt.IsZero() {
			createdAt = time.Now()
		}
		account := getStringFromPayload(payload, "account")
		role := consts.UserRole(getStringFromPayload(payload, "role"))
		if role == "" {
			role = consts.UserRoleUser
		}
		return uc.SyncUserCreate(ctx, &domain.User{
			ID:        entityID,
			Account:   account,
			Role:      role,
			CreatedAt: createdAt,
		})
	case graphSyncTaskKBCreate:
		createdAt := getTimeFromPayload(payload, "created_at")
		if createdAt.IsZero() {
			createdAt = time.Now()
		}
		return uc.SyncKnowledgeBaseCreate(ctx, &domain.KnowledgeBase{
			ID:        entityID,
			Name:      getStringFromPayload(payload, "name"),
			CreatedAt: createdAt,
		})
	default:
		return fmt.Errorf("unsupported graph sync task type: %s", taskType)
	}
}

func (uc *GraphSyncUseCase) runWithRetryNoDeadLetter(ctx context.Context, taskType, entityID string, syncFn func(context.Context) error) error {
	if syncFn == nil {
		return nil
	}
	if ctx == nil {
		ctx = context.Background()
	}

	var lastErr error
	for attempt := 1; attempt <= uc.maxRetryAttempt; attempt++ {
		if err := syncFn(ctx); err == nil {
			return nil
		} else {
			lastErr = err
		}

		if attempt == uc.maxRetryAttempt {
			break
		}

		wait := uc.nextRetryGap(attempt)
		uc.logger.Warn("graph sync dead letter replay failed, retrying",
			log.String("task_type", taskType),
			log.String("entity_id", entityID),
			log.Int("attempt", attempt),
			log.Int("max_attempt", uc.maxRetryAttempt),
			log.String("retry_after", wait.String()),
			log.Error(lastErr),
		)

		timer := time.NewTimer(wait)
		select {
		case <-ctx.Done():
			if !timer.Stop() {
				<-timer.C
			}
			return ctx.Err()
		case <-timer.C:
		}
	}

	return lastErr
}

func (uc *GraphSyncUseCase) loadNode(ctx context.Context, nodeID string) (*domain.Node, error) {
	if uc.nodeRepo == nil {
		return nil, fmt.Errorf("node repository is not initialized")
	}
	node, err := uc.nodeRepo.GetNodeByID(ctx, nodeID)
	if err != nil {
		return nil, fmt.Errorf("get node %s failed: %w", nodeID, err)
	}
	return node, nil
}

func getStringFromPayload(payload map[string]any, key string) string {
	if payload == nil {
		return ""
	}
	value, exists := payload[key]
	if !exists || value == nil {
		return ""
	}
	if str, ok := value.(string); ok {
		return str
	}
	return fmt.Sprintf("%v", value)
}

func getTimeFromPayload(payload map[string]any, key string) time.Time {
	if payload == nil {
		return time.Time{}
	}
	value, exists := payload[key]
	if !exists || value == nil {
		return time.Time{}
	}
	switch v := value.(type) {
	case time.Time:
		return v
	case string:
		if v == "" {
			return time.Time{}
		}
		if parsed, err := time.Parse(time.RFC3339Nano, v); err == nil {
			return parsed
		}
		if parsed, err := time.Parse(time.RFC3339, v); err == nil {
			return parsed
		}
		return time.Time{}
	default:
		return time.Time{}
	}
}

func isDeadLetterTableMissingErr(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "graph_sync_dead_letters") && strings.Contains(msg, "does not exist")
}

// SyncDocumentCreate syncs document creation into Neo4j.
func (uc *GraphSyncUseCase) SyncDocumentCreate(ctx context.Context, node *domain.Node, kbID, creatorID string) error {
	tokens := extractGraphDocumentTokens(node.Name, node.Content)

	doc := &domain.GraphDocument{
		ID:         node.ID,
		Name:       node.Name,
		Tokens:     tokens,
		KbID:       kbID,
		Status:     int(node.Status),
		Visibility: 1,
		CreatorID:  creatorID,
		EditorID:   creatorID,
		CreatedAt:  node.CreatedAt,
		UpdatedAt:  node.UpdatedAt,
	}

	if err := uc.neo4jStore.CreateDocument(ctx, doc); err != nil {
		return fmt.Errorf("create document node failed: %w", err)
	}

	if err := uc.neo4jStore.CreateDocumentRelations(ctx, node.ID, kbID, creatorID, node.ParentID); err != nil {
		return fmt.Errorf("create document relations failed: %w", err)
	}

	// Auto-rebuild document-to-document relations after successful import.
	if _, err := uc.neo4jStore.BuildDocumentRelationsForDocument(ctx, kbID, node.ID); err != nil {
		return fmt.Errorf("build document similarity relations failed: %w", err)
	}

	return nil
}

// SyncDocumentUpdate syncs document update into Neo4j.
func (uc *GraphSyncUseCase) SyncDocumentUpdate(ctx context.Context, node *domain.Node, editorID string) error {
	tokens := extractGraphDocumentTokens(node.Name, node.Content)

	doc := &domain.GraphDocument{
		ID:         node.ID,
		Name:       node.Name,
		Tokens:     tokens,
		Status:     int(node.Status),
		Visibility: 1,
		EditorID:   editorID,
		UpdatedAt:  node.UpdatedAt,
	}

	if err := uc.neo4jStore.UpdateDocument(ctx, doc); err != nil {
		return fmt.Errorf("update document node failed: %w", err)
	}

	// Keep similarity relations in sync with latest title/content.
	if _, err := uc.neo4jStore.BuildDocumentRelationsForDocument(ctx, node.KBID, node.ID); err != nil {
		return fmt.Errorf("rebuild document similarity relations failed: %w", err)
	}

	return nil
}

// SyncDocumentDelete syncs document deletion from Neo4j.
func (uc *GraphSyncUseCase) SyncDocumentDelete(ctx context.Context, docID string) error {
	if err := uc.neo4jStore.DeleteDocument(ctx, docID); err != nil {
		return fmt.Errorf("delete document node failed: %w", err)
	}

	return nil
}

// SyncDocumentMove syncs document move.
func (uc *GraphSyncUseCase) SyncDocumentMove(ctx context.Context, docID, oldParentID, newParentID string) error {
	if err := uc.neo4jStore.UpdateDocumentParent(ctx, docID, oldParentID, newParentID); err != nil {
		return fmt.Errorf("move document failed: %w", err)
	}

	return nil
}

// SyncFolderCreate syncs folder creation into Neo4j.
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

	if err := uc.neo4jStore.CreateFolderRelations(ctx, node.ID, kbID, node.ParentID); err != nil {
		return fmt.Errorf("create folder relations failed: %w", err)
	}

	return nil
}

// SyncFolderUpdate syncs folder update into Neo4j.
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

// SyncFolderDelete syncs folder deletion from Neo4j.
func (uc *GraphSyncUseCase) SyncFolderDelete(ctx context.Context, folderID string) error {
	if err := uc.neo4jStore.DeleteFolder(ctx, folderID); err != nil {
		return fmt.Errorf("delete folder node failed: %w", err)
	}

	return nil
}

// SyncFolderMove syncs folder move.
func (uc *GraphSyncUseCase) SyncFolderMove(ctx context.Context, folderID, oldParentID, newParentID string) error {
	if err := uc.neo4jStore.UpdateFolderParent(ctx, folderID, oldParentID, newParentID); err != nil {
		return fmt.Errorf("move folder failed: %w", err)
	}

	return nil
}

// SyncUserCreate syncs user creation into Neo4j.
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

// SyncKnowledgeBaseCreate syncs knowledge base creation into Neo4j.
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
