package domain

import "time"

// GraphSyncDeadLetter stores graph sync tasks that still failed after retries.
type GraphSyncDeadLetter struct {
	ID           string     `json:"id" gorm:"primaryKey"`
	KbID         string     `json:"kb_id" gorm:"column:kb_id;not null;default:''"`
	TaskType     string     `json:"task_type" gorm:"column:task_type;not null"`
	Status       string     `json:"status" gorm:"column:status;not null;default:'pending'"`
	EntityID     string     `json:"entity_id" gorm:"column:entity_id;not null"`
	Payload      []byte     `json:"payload" gorm:"column:payload;type:jsonb;not null"`
	ErrorMessage string     `json:"error_message" gorm:"column:error_message;type:text;not null"`
	RetryCount   int        `json:"retry_count" gorm:"column:retry_count;not null"`
	LastRetryAt  *time.Time `json:"last_retry_at" gorm:"column:last_retry_at"`
	ResolvedAt   *time.Time `json:"resolved_at" gorm:"column:resolved_at"`
	CreatedAt    time.Time  `json:"created_at" gorm:"column:created_at;not null;default:now()"`
	UpdatedAt    time.Time  `json:"updated_at" gorm:"column:updated_at;not null;default:now()"`
}

const (
	GraphSyncDeadLetterStatusPending  = "pending"
	GraphSyncDeadLetterStatusResolved = "resolved"
)

func (GraphSyncDeadLetter) TableName() string {
	return "graph_sync_dead_letters"
}
