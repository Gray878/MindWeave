package pg

import (
	"context"
	"time"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/store/pg"
)

type GraphSyncDeadLetterRepository struct {
	db     *pg.DB
	logger *log.Logger
}

func NewGraphSyncDeadLetterRepository(db *pg.DB, logger *log.Logger) *GraphSyncDeadLetterRepository {
	return &GraphSyncDeadLetterRepository{
		db:     db,
		logger: logger.WithModule("repo.pg.graph_sync_dead_letter"),
	}
}

func (r *GraphSyncDeadLetterRepository) Create(ctx context.Context, deadLetter *domain.GraphSyncDeadLetter) error {
	return r.db.WithContext(ctx).Create(deadLetter).Error
}

func (r *GraphSyncDeadLetterRepository) ListPending(ctx context.Context, kbID string, limit int) ([]*domain.GraphSyncDeadLetter, error) {
	query := r.db.WithContext(ctx).Model(&domain.GraphSyncDeadLetter{}).
		Where("status = ?", domain.GraphSyncDeadLetterStatusPending)
	if kbID != "" {
		query = query.Where("kb_id = ?", kbID)
	}

	var deadLetters []*domain.GraphSyncDeadLetter
	if err := query.Order("created_at ASC").Limit(limit).Find(&deadLetters).Error; err != nil {
		return nil, err
	}
	return deadLetters, nil
}

func (r *GraphSyncDeadLetterRepository) MarkResolved(ctx context.Context, id string) error {
	now := time.Now()
	return r.db.WithContext(ctx).Model(&domain.GraphSyncDeadLetter{}).
		Where("id = ?", id).
		Updates(map[string]any{
			"status":      domain.GraphSyncDeadLetterStatusResolved,
			"resolved_at": now,
			"updated_at":  now,
		}).Error
}

func (r *GraphSyncDeadLetterRepository) MarkRetryFailed(ctx context.Context, id, errorMessage string, retryCount int) error {
	now := time.Now()
	return r.db.WithContext(ctx).Model(&domain.GraphSyncDeadLetter{}).
		Where("id = ?", id).
		Updates(map[string]any{
			"error_message": errorMessage,
			"retry_count":   retryCount,
			"last_retry_at": now,
			"updated_at":    now,
		}).Error
}
