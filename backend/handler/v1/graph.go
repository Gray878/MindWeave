package v1

import (
	"strconv"

	"github.com/labstack/echo/v4"

	"github.com/chaitin/panda-wiki/consts"
	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/handler"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/middleware"
	"github.com/chaitin/panda-wiki/usecase"
)

type GraphHandler struct {
	*handler.BaseHandler
	logger           *log.Logger
	usecase          *usecase.GraphQueryUseCase
	graphSyncUsecase *usecase.GraphSyncUseCase
	auth             middleware.AuthMiddleware
}

func NewGraphHandler(
	baseHandler *handler.BaseHandler,
	echo *echo.Echo,
	usecase *usecase.GraphQueryUseCase,
	graphSyncUsecase *usecase.GraphSyncUseCase,
	auth middleware.AuthMiddleware,
	logger *log.Logger,
) *GraphHandler {
	h := &GraphHandler{
		BaseHandler:      baseHandler,
		logger:           logger.WithModule("handler.v1.graph"),
		usecase:          usecase,
		graphSyncUsecase: graphSyncUsecase,
		auth:             auth,
	}

	group := echo.Group("/api/v1/graph", h.auth.Authorize)
	group.GET("/all", h.GetAllGraph, h.auth.ValidateKBUserPerm(consts.UserKBPermissionNotNull))
	group.GET("/node", h.GetNodeGraph, h.auth.ValidateKBUserPerm(consts.UserKBPermissionNotNull))
	group.GET("/path", h.FindPaths, h.auth.ValidateKBUserPerm(consts.UserKBPermissionNotNull))
	group.GET("/stats", h.GetGraphStats, h.auth.ValidateKBUserPerm(consts.UserKBPermissionNotNull))
	group.GET("/entities/search", h.SearchEntities, h.auth.ValidateKBUserPerm(consts.UserKBPermissionNotNull))
	group.POST("/relations/build", h.BuildRelations, h.auth.ValidateKBUserPerm(consts.UserKBPermissionNotNull))
	group.POST("/sync/retry", h.RetrySyncDeadLetters, h.auth.ValidateKBUserPerm(consts.UserKBPermissionNotNull))

	return h
}

// GetNodeGraph 获取节点关系图谱
//
//	@Summary		Get Node Graph
//	@Description	获取指定节点及其关系的图谱数据
//	@Tags			graph
//	@Accept			json
//	@Produce		json
//	@Security		bearerAuth
//	@Param			node_id	query		string	true	"节点ID"
//	@Param			depth	query		int		true	"查询深度(1-3)"
//	@Success		200		{object}	domain.PWResponse{data=domain.GraphDataResp}
//	@Router			/api/v1/graph/node [get]
func (h *GraphHandler) GetNodeGraph(c echo.Context) error {
	var req domain.GetNodeGraphReq
	if err := c.Bind(&req); err != nil {
		return h.NewResponseWithError(c, "request body is invalid", err)
	}

	if err := c.Validate(&req); err != nil {
		return h.NewResponseWithError(c, "validate request body failed", err)
	}

	ctx := c.Request().Context()
	graphData, err := h.usecase.GetNodeGraph(ctx, &req)
	if err != nil {
		h.logger.Error("failed to get node graph", "error", err)
		return h.NewResponseWithError(c, "get node graph failed", err)
	}

	return h.NewResponseWithData(c, graphData)
}

// FindPaths 查找节点间路径
//
//	@Summary		Find Paths
//	@Description	查找两个节点之间的最短路径
//	@Tags			graph
//	@Accept			json
//	@Produce		json
//	@Security		bearerAuth
//	@Param			start_node_id	query		string	true	"起始节点ID"
//	@Param			end_node_id		query		string	true	"目标节点ID"
//	@Param			max_depth		query		int		true	"最大深度(1-5)"
//	@Success		200				{object}	domain.PWResponse{data=domain.PathResp}
//	@Router			/api/v1/graph/path [get]
func (h *GraphHandler) FindPaths(c echo.Context) error {
	var req domain.FindPathReq
	if err := c.Bind(&req); err != nil {
		return h.NewResponseWithError(c, "request body is invalid", err)
	}

	if err := c.Validate(&req); err != nil {
		return h.NewResponseWithError(c, "validate request body failed", err)
	}

	ctx := c.Request().Context()
	pathResp, err := h.usecase.FindPaths(ctx, &req)
	if err != nil {
		h.logger.Error("failed to find paths", "error", err)
		return h.NewResponseWithError(c, "find paths failed", err)
	}

	return h.NewResponseWithData(c, pathResp)
}

// GetGraphStats 获取图谱统计信息
//
//	@Summary		Get Graph Stats
//	@Description	获取知识库的图谱统计信息
//	@Tags			graph
//	@Accept			json
//	@Produce		json
//	@Security		bearerAuth
//	@Param			kb_id	query		string	true	"知识库ID"
//	@Success		200		{object}	domain.PWResponse{data=domain.GraphStatsResp}
//	@Router			/api/v1/graph/stats [get]
func (h *GraphHandler) GetGraphStats(c echo.Context) error {
	var req domain.GraphStatsReq
	if err := c.Bind(&req); err != nil {
		return h.NewResponseWithError(c, "request body is invalid", err)
	}

	if err := c.Validate(&req); err != nil {
		return h.NewResponseWithError(c, "validate request body failed", err)
	}

	ctx := c.Request().Context()
	stats, err := h.usecase.GetGraphStats(ctx, &req)
	if err != nil {
		h.logger.Error("failed to get graph stats", "error", err)
		return h.NewResponseWithError(c, "get graph stats failed", err)
	}

	return h.NewResponseWithData(c, stats)
}

// SearchEntities 搜索实体
//
//	@Summary		Search Entities
//	@Description	在知识库中搜索实体
//	@Tags			graph
//	@Accept			json
//	@Produce		json
//	@Security		bearerAuth
//	@Param			kb_id		query		string	true	"知识库ID"
//	@Param			keyword		query		string	true	"搜索关键词"
//	@Param			type		query		string	false	"实体类型"
//	@Param			limit		query		int		false	"返回数量限制"
//	@Success		200			{object}	domain.PWResponse{data=[]domain.EntityResp}
//	@Router			/api/v1/graph/entities/search [get]
func (h *GraphHandler) SearchEntities(c echo.Context) error {
	var req domain.SearchEntitiesReq
	if err := c.Bind(&req); err != nil {
		return h.NewResponseWithError(c, "request body is invalid", err)
	}

	if err := c.Validate(&req); err != nil {
		return h.NewResponseWithError(c, "validate request body failed", err)
	}

	ctx := c.Request().Context()
	entities, err := h.usecase.SearchEntities(ctx, &req)
	if err != nil {
		h.logger.Error("failed to search entities", "error", err)
		return h.NewResponseWithError(c, "search entities failed", err)
	}

	return h.NewResponseWithData(c, entities)
}

// BuildRelations 构建文档关系
//
//	@Summary		Build Document Relations
//	@Description	基于关键词构建文档之间的关系
//	@Tags			graph
//	@Accept			json
//	@Produce		json
//	@Security		bearerAuth
//	@Param			kb_id	query		string	true	"知识库ID"
//	@Success		200		{object}	domain.PWResponse{data=map[string]int}
//	@Router			/api/v1/graph/relations/build [post]
func (h *GraphHandler) BuildRelations(c echo.Context) error {
	kbID := c.QueryParam("kb_id")
	if kbID == "" {
		return h.NewResponseWithError(c, "kb_id is required", nil)
	}

	ctx := c.Request().Context()
	count, err := h.usecase.BuildDocumentRelations(ctx, kbID)
	if err != nil {
		h.logger.Error("failed to build document relations", "error", err)
		return h.NewResponseWithError(c, "build relations failed", err)
	}

	return h.NewResponseWithData(c, map[string]int{
		"relation_count": count,
	})
}

// GetAllGraph 获取所有图谱数据
//
//	@Summary		Get All Graph
//	@Description	获取知识库的所有节点和关系
//	@Tags			graph
//	@Accept			json
//	@Produce		json
//	@Security		bearerAuth
//	@Param			kb_id	query		string	true	"知识库ID"
//	@Param			limit	query		int		false	"节点数量限制(默认1000)"
//	@Success		200		{object}	domain.PWResponse{data=domain.GraphDataResp}
//	@Router			/api/v1/graph/all [get]
func (h *GraphHandler) GetAllGraph(c echo.Context) error {
	var req domain.GetAllGraphReq
	if err := c.Bind(&req); err != nil {
		return h.NewResponseWithError(c, "request body is invalid", err)
	}

	if err := c.Validate(&req); err != nil {
		return h.NewResponseWithError(c, "validate request body failed", err)
	}

	// 默认限制 1000 个节点
	if req.Limit == 0 {
		req.Limit = 1000
	}

	ctx := c.Request().Context()
	graphData, err := h.usecase.GetAllGraph(ctx, &req)
	if err != nil {
		h.logger.Error("failed to get all graph", "error", err)
		return h.NewResponseWithError(c, "get all graph failed", err)
	}

	return h.NewResponseWithData(c, graphData)
}

func (h *GraphHandler) RetrySyncDeadLetters(c echo.Context) error {
	if h.graphSyncUsecase == nil {
		return h.NewResponseWithError(c, "graph sync usecase is not available", nil)
	}

	req := domain.RetryGraphSyncDeadLettersReq{
		KbID: c.QueryParam("kb_id"),
	}
	if limitRaw := c.QueryParam("limit"); limitRaw != "" {
		limit, err := strconv.Atoi(limitRaw)
		if err != nil {
			return h.NewResponseWithError(c, "limit is invalid", err)
		}
		req.Limit = limit
	}

	if req.Limit == 0 {
		req.Limit = 100
	}

	if err := c.Validate(&req); err != nil {
		return h.NewResponseWithError(c, "validate request body failed", err)
	}

	ctx := c.Request().Context()
	result, err := h.graphSyncUsecase.RetryDeadLetters(ctx, req.KbID, req.Limit)
	if err != nil {
		h.logger.Error("failed to retry graph sync dead letters", "error", err)
		return h.NewResponseWithError(c, "retry graph sync dead letters failed", err)
	}

	return h.NewResponseWithData(c, result)
}
