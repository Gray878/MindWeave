// Neo4j Provider for dependency injection
package neo4j

import (
	"context"

	"github.com/chaitin/panda-wiki/config"
	"github.com/chaitin/panda-wiki/log"
)

// ProvideNeo4jStore 提供 Neo4j Store 实例
func ProvideNeo4jStore(cfg *config.Config, logger *log.Logger) (*Store, func(), error) {
	neo4jCfg := Config{
		URI:      cfg.Neo4j.URI,
		Username: cfg.Neo4j.Username,
		Password: cfg.Neo4j.Password,
	}

	logger.Info("Initializing Neo4j connection", "uri", neo4jCfg.URI, "username", neo4jCfg.Username)

	store, err := NewStore(neo4jCfg)
	if err != nil {
		logger.Error("Failed to create Neo4j store", "error", err)
		return nil, nil, err
	}

	logger.Info("Neo4j connection established successfully")

	// 初始化 Schema
	ctx := context.Background()
	if err := store.InitSchema(ctx); err != nil {
		logger.Warn("Failed to initialize Neo4j schema", "error", err)
	} else {
		logger.Info("Neo4j schema initialized successfully")
	}

	// 清理函数
	cleanup := func() {
		if err := store.Close(context.Background()); err != nil {
			logger.Error("Failed to close Neo4j connection", "error", err)
		}
	}

	return store, cleanup, nil
}
