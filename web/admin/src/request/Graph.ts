// 知识图谱 API 请求
import httpRequest, { RequestParams } from './httpClient';
import type {
  GetNodeGraphRequest,
  GraphDataResponse,
  FindPathRequest,
  PathResponse,
  GraphStatsRequest,
  GraphStatsResponse,
  SearchEntitiesRequest,
  EntityResponse,
} from '../types/graph';

// 获取所有图谱数据
export const getAllGraph = (params: { kb_id: string; limit?: number }, options?: RequestParams) => {
  return httpRequest<{ data?: GraphDataResponse }>({
    path: '/api/v1/graph/all',
    method: 'GET',
    query: params,
    secure: true,
    format: 'json',
    ...options,
  });
};

// 获取节点关系图谱
export const getNodeGraph = (params: GetNodeGraphRequest, options?: RequestParams) => {
  return httpRequest<{ data?: GraphDataResponse }>({
    path: '/api/v1/graph/node',
    method: 'GET',
    query: params,
    secure: true,
    format: 'json',
    ...options,
  });
};

// 查找节点间路径
export const findPaths = (params: FindPathRequest, options?: RequestParams) => {
  return httpRequest<{ data?: PathResponse }>({
    path: '/api/v1/graph/path',
    method: 'GET',
    query: params,
    secure: true,
    format: 'json',
    ...options,
  });
};

// 获取图谱统计信息
export const getGraphStats = (params: GraphStatsRequest, options?: RequestParams) => {
  return httpRequest<{ data?: GraphStatsResponse }>({
    path: '/api/v1/graph/stats',
    method: 'GET',
    query: params,
    secure: true,
    format: 'json',
    ...options,
  });
};

// 搜索实体
export const searchEntities = (params: SearchEntitiesRequest, options?: RequestParams) => {
  return httpRequest<{ data?: EntityResponse[] }>({
    path: '/api/v1/graph/entities/search',
    method: 'GET',
    query: params,
    secure: true,
    format: 'json',
    ...options,
  });
};
