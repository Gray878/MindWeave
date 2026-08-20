CREATE TABLE IF NOT EXISTS graph_sync_dead_letters (
    id TEXT PRIMARY KEY,
    kb_id TEXT NOT NULL DEFAULT '',
    task_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    entity_id TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_message TEXT NOT NULL,
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_retry_at TIMESTAMP NULL,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_graph_sync_dead_letters_kb_id ON graph_sync_dead_letters(kb_id);
CREATE INDEX IF NOT EXISTS idx_graph_sync_dead_letters_task_type ON graph_sync_dead_letters(task_type);
CREATE INDEX IF NOT EXISTS idx_graph_sync_dead_letters_status ON graph_sync_dead_letters(status);
CREATE INDEX IF NOT EXISTS idx_graph_sync_dead_letters_entity_id ON graph_sync_dead_letters(entity_id);
CREATE INDEX IF NOT EXISTS idx_graph_sync_dead_letters_created_at ON graph_sync_dead_letters(created_at DESC);
