// Neo4j 图数据库连接和基础操作
package neo4j

import (
	"context"
	"fmt"

	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

type Store struct {
	driver neo4j.DriverWithContext
}

type Config struct {
	URI      string
	Username string
	Password string
}

// NewStore 创建 Neo4j 存储实例
func NewStore(cfg Config) (*Store, error) {
	driver, err := neo4j.NewDriverWithContext(
		cfg.URI,
		neo4j.BasicAuth(cfg.Username, cfg.Password, ""),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create neo4j driver: %w", err)
	}

	// 验证连接
	ctx := context.Background()
	if err := driver.VerifyConnectivity(ctx); err != nil {
		return nil, fmt.Errorf("failed to verify neo4j connectivity: %w", err)
	}

	return &Store{driver: driver}, nil
}

// Close 关闭 Neo4j 连接
func (s *Store) Close(ctx context.Context) error {
	return s.driver.Close(ctx)
}

// ExecuteQuery 执行自定义查询（用于测试和调试）
func (s *Store) ExecuteQuery(ctx context.Context, query string, params map[string]interface{}) (*neo4j.EagerResult, error) {
	return neo4j.ExecuteQuery(ctx, s.driver, query, params, neo4j.EagerResultTransformer)
}

// ExecuteWrite 执行写操作
func (s *Store) ExecuteWrite(ctx context.Context, work func(tx neo4j.ManagedTransaction) (interface{}, error)) (interface{}, error) {
	session := s.driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(ctx)

	return session.ExecuteWrite(ctx, work)
}

// ExecuteRead 执行读操作
func (s *Store) ExecuteRead(ctx context.Context, work func(tx neo4j.ManagedTransaction) (interface{}, error)) (interface{}, error) {
	session := s.driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
	defer session.Close(ctx)

	return session.ExecuteRead(ctx, work)
}
