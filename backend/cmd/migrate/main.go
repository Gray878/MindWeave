// PostgreSQL 到 Neo4j 数据迁移工具
package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"time"

	"github.com/chaitin/panda-wiki/config"
	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/store/neo4j"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	var (
		dryRun = flag.Bool("dry-run", false, "仅预览不执行")
		kbID   = flag.String("kb", "", "指定知识库ID（为空则迁移所有）")
	)
	flag.Parse()

	// 加载配置
	cfg, err := config.NewConfig()
	if err != nil {
		fmt.Printf("加载配置失败: %v\n", err)
		os.Exit(1)
	}

	// 初始化日志
	logger := log.NewLogger(cfg)

	// 连接 PostgreSQL
	db, err := gorm.Open(postgres.Open(cfg.PG.DSN), &gorm.Config{})
	if err != nil {
		logger.Error("连接 PostgreSQL 失败", log.Error(err))
		os.Exit(1)
	}

	// 连接 Neo4j
	neo4jCfg := neo4j.Config{
		URI:      cfg.Neo4j.URI,
		Username: cfg.Neo4j.Username,
		Password: cfg.Neo4j.Password,
	}
	neo4jStore, err := neo4j.NewStore(neo4jCfg)
	if err != nil {
		logger.Error("连接 Neo4j 失败", log.Error(err))
		os.Exit(1)
	}
	defer neo4jStore.Close(context.Background())

	// 初始化 Schema
	ctx := context.Background()
	if !*dryRun {
		if err := neo4jStore.InitSchema(ctx); err != nil {
			logger.Error("初始化 Neo4j Schema 失败", log.Error(err))
			os.Exit(1)
		}
		logger.Info("Neo4j Schema 初始化成功")
	}

	// 执行迁移
	migrator := &Migrator{
		db:         db,
		neo4jStore: neo4jStore,
		logger:     logger,
		dryRun:     *dryRun,
	}

	if err := migrator.Migrate(ctx, *kbID); err != nil {
		logger.Error("迁移失败", log.Error(err))
		os.Exit(1)
	}

	logger.Info("迁移完成")
}

type Migrator struct {
	db         *gorm.DB
	neo4jStore *neo4j.Store
	logger     *log.Logger
	dryRun     bool
}

func (m *Migrator) Migrate(ctx context.Context, kbID string) error {
	// 1. 迁移知识库
	if err := m.migrateKnowledgeBases(ctx, kbID); err != nil {
		return fmt.Errorf("迁移知识库失败: %w", err)
	}

	// 2. 迁移用户
	if err := m.migrateUsers(ctx); err != nil {
		return fmt.Errorf("迁移用户失败: %w", err)
	}

	// 3. 迁移文件夹和文档
	if err := m.migrateNodes(ctx, kbID); err != nil {
		return fmt.Errorf("迁移节点失败: %w", err)
	}

	return nil
}

func (m *Migrator) migrateKnowledgeBases(ctx context.Context, kbID string) error {
	var kbs []domain.KnowledgeBase
	query := m.db.WithContext(ctx)
	if kbID != "" {
		query = query.Where("id = ?", kbID)
	}
	if err := query.Find(&kbs).Error; err != nil {
		return err
	}

	m.logger.Info(fmt.Sprintf("开始迁移 %d 个知识库", len(kbs)))

	for i, kb := range kbs {
		if m.dryRun {
			m.logger.Info(fmt.Sprintf("[DRY-RUN] 将创建知识库: %s (%s)", kb.Name, kb.ID))
			continue
		}

		graphKB := &domain.GraphKnowledgeBase{
			ID:        kb.ID,
			Name:      kb.Name,
			CreatedAt: kb.CreatedAt,
		}

		if err := m.neo4jStore.CreateKnowledgeBase(ctx, graphKB); err != nil {
			m.logger.Error("创建知识库失败",
				log.String("kb_id", kb.ID),
				log.Error(err))
			continue
		}

		m.logger.Info(fmt.Sprintf("已迁移知识库 %d/%d: %s", i+1, len(kbs), kb.Name))
	}

	return nil
}

func (m *Migrator) migrateUsers(ctx context.Context) error {
	var users []domain.User
	if err := m.db.WithContext(ctx).Find(&users).Error; err != nil {
		return err
	}

	m.logger.Info(fmt.Sprintf("开始迁移 %d 个用户", len(users)))

	for i, user := range users {
		if m.dryRun {
			m.logger.Info(fmt.Sprintf("[DRY-RUN] 将创建用户: %s (%s)", user.Account, user.ID))
			continue
		}

		graphUser := &domain.GraphUser{
			ID:        user.ID,
			Account:   user.Account,
			Role:      string(user.Role),
			CreatedAt: user.CreatedAt,
		}

		if err := m.neo4jStore.CreateUser(ctx, graphUser); err != nil {
			m.logger.Error("创建用户失败",
				log.String("user_id", user.ID),
				log.Error(err))
			continue
		}

		if i > 0 && i%100 == 0 {
			m.logger.Info(fmt.Sprintf("已迁移用户 %d/%d", i, len(users)))
		}
	}

	m.logger.Info(fmt.Sprintf("用户迁移完成: %d/%d", len(users), len(users)))
	return nil
}

func (m *Migrator) migrateNodes(ctx context.Context, kbID string) error {
	var nodes []domain.Node
	query := m.db.WithContext(ctx).Order("created_at ASC")
	if kbID != "" {
		query = query.Where("kb_id = ?", kbID)
	}
	if err := query.Find(&nodes).Error; err != nil {
		return err
	}

	m.logger.Info(fmt.Sprintf("开始迁移 %d 个节点（文档和文件夹）", len(nodes)))

	var (
		folderCount int
		docCount    int
	)

	for i, node := range nodes {
		if m.dryRun {
			nodeType := "文档"
			if node.Type == domain.NodeTypeFolder {
				nodeType = "文件夹"
			}
			m.logger.Info(fmt.Sprintf("[DRY-RUN] 将创建%s: %s (%s)", nodeType, node.Name, node.ID))
			continue
		}

		if node.Type == domain.NodeTypeFolder {
			// 迁移文件夹
			folder := &domain.GraphFolder{
				ID:        node.ID,
				Name:      node.Name,
				KbID:      node.KBID,
				ParentID:  node.ParentID,
				Position:  node.Position,
				CreatedAt: node.CreatedAt,
			}

			if err := m.neo4jStore.CreateFolder(ctx, folder); err != nil {
				m.logger.Error("创建文件夹失败",
					log.String("folder_id", node.ID),
					log.Error(err))
				continue
			}

			// 创建关系
			if err := m.neo4jStore.CreateFolderRelations(ctx, node.ID, node.KBID, node.ParentID); err != nil {
				m.logger.Error("创建文件夹关系失败",
					log.String("folder_id", node.ID),
					log.Error(err))
			}

			folderCount++
		} else {
			// 迁移文档
			doc := &domain.GraphDocument{
				ID:         node.ID,
				Name:       node.Name,
				KbID:       node.KBID,
				Status:     int(node.Status),
				Visibility: 1, // 默认可见
				CreatorID:  node.CreatorId,
				EditorID:   node.EditorId,
				CreatedAt:  node.CreatedAt,
				UpdatedAt:  node.UpdatedAt,
			}

			if err := m.neo4jStore.CreateDocument(ctx, doc); err != nil {
				m.logger.Error("创建文档失败",
					log.String("doc_id", node.ID),
					log.Error(err))
				continue
			}

			// 创建关系
			if err := m.neo4jStore.CreateDocumentRelations(ctx, node.ID, node.KBID, node.CreatorId, node.ParentID); err != nil {
				m.logger.Error("创建文档关系失败",
					log.String("doc_id", node.ID),
					log.Error(err))
			}

			docCount++
		}

		if i > 0 && i%100 == 0 {
			m.logger.Info(fmt.Sprintf("已迁移节点 %d/%d (文件夹: %d, 文档: %d)",
				i, len(nodes), folderCount, docCount))
		}

		// 避免过快请求
		time.Sleep(10 * time.Millisecond)
	}

	m.logger.Info(fmt.Sprintf("节点迁移完成: 文件夹 %d, 文档 %d, 总计 %d",
		folderCount, docCount, len(nodes)))
	return nil
}
