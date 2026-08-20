// 知识图谱查询业务逻辑
package usecase

import (
	"context"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/store/neo4j"
)

type GraphQueryUseCase struct {
	neo4jStore *neo4j.Store
}

func NewGraphQueryUseCase(neo4jStore *neo4j.Store) *GraphQueryUseCase {
	return &GraphQueryUseCase{
		neo4jStore: neo4jStore,
	}
}

// GetNodeGraph 获取节点关系图谱
func (uc *GraphQueryUseCase) GetNodeGraph(ctx context.Context, req *domain.GetNodeGraphReq) (*domain.GraphDataResp, error) {
	return uc.neo4jStore.GetNodeGraph(ctx, req.NodeID, req.Depth)
}

// FindPaths 查找节点间路径
func (uc *GraphQueryUseCase) FindPaths(ctx context.Context, req *domain.FindPathReq) (*domain.PathResp, error) {
	paths, err := uc.neo4jStore.FindPaths(ctx, req.StartNodeID, req.EndNodeID, req.MaxDepth)
	if err != nil {
		return nil, err
	}

	return &domain.PathResp{
		Paths: paths,
		Count: len(paths),
	}, nil
}

// GetGraphStats 获取图谱统计信息
func (uc *GraphQueryUseCase) GetGraphStats(ctx context.Context, req *domain.GraphStatsReq) (*domain.GraphStatsResp, error) {
	return uc.neo4jStore.GetGraphStats(ctx, req.KbID)
}

// SearchEntities 搜索实体
func (uc *GraphQueryUseCase) SearchEntities(ctx context.Context, req *domain.SearchEntitiesReq) ([]domain.EntityResp, error) {
	if req.Limit == 0 {
		req.Limit = 20 // 默认返回20条
	}
	return uc.neo4jStore.SearchEntities(ctx, req.KbID, req.Keyword, req.Type, req.Limit)
}

// BuildDocumentRelations 构建文档关系
func (uc *GraphQueryUseCase) BuildDocumentRelations(ctx context.Context, kbID string) (int, error) {
	return uc.neo4jStore.BuildDocumentRelationsByKeyword(ctx, kbID)
}

// GetAllGraph 获取所有图谱数据
func (uc *GraphQueryUseCase) GetAllGraph(ctx context.Context, req *domain.GetAllGraphReq) (*domain.GraphDataResp, error) {
	return uc.neo4jStore.GetAllGraph(ctx, req.KbID, req.Limit)
}
