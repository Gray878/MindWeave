import httpRequest, { RequestParams } from './httpClient';
import type {
  EntityResponse,
  FindPathRequest,
  GraphDataResponse,
  GraphStatsRequest,
  GraphStatsResponse,
  GraphSyncRetryResponse,
  GetNodeGraphRequest,
  PathResponse,
  RetryGraphSyncDeadLettersRequest,
  SearchEntitiesRequest,
} from '../types/graph';

export const getAllGraph = (
  params: { kb_id: string; limit?: number },
  options?: RequestParams,
) => {
  return httpRequest<{ data?: GraphDataResponse }>({
    path: '/api/v1/graph/all',
    method: 'GET',
    query: params,
    secure: true,
    format: 'json',
    ...options,
  });
};

export const getNodeGraph = (
  params: GetNodeGraphRequest,
  options?: RequestParams,
) => {
  return httpRequest<{ data?: GraphDataResponse }>({
    path: '/api/v1/graph/node',
    method: 'GET',
    query: params,
    secure: true,
    format: 'json',
    ...options,
  });
};

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

export const getGraphStats = (
  params: GraphStatsRequest,
  options?: RequestParams,
) => {
  return httpRequest<{ data?: GraphStatsResponse }>({
    path: '/api/v1/graph/stats',
    method: 'GET',
    query: params,
    secure: true,
    format: 'json',
    ...options,
  });
};

export const searchEntities = (
  params: SearchEntitiesRequest,
  options?: RequestParams,
) => {
  return httpRequest<{ data?: EntityResponse[] }>({
    path: '/api/v1/graph/entities/search',
    method: 'GET',
    query: params,
    secure: true,
    format: 'json',
    ...options,
  });
};

export const retryGraphSyncDeadLetters = (
  params: RetryGraphSyncDeadLettersRequest,
  options?: RequestParams,
) => {
  return httpRequest<{ data?: GraphSyncRetryResponse }>({
    path: '/api/v1/graph/sync/retry',
    method: 'POST',
    query: params,
    secure: true,
    format: 'json',
    ...options,
  });
};
