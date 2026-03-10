// 知识图谱常量配置

// 节点类型颜色配置
export const NODE_COLORS: Record<string, string> = {
  // 实体类型
  Person: '#3b82f6', // 蓝色 - 人物
  Organization: '#8b5cf6', // 紫色 - 组织
  Location: '#10b981', // 绿色 - 地点
  Event: '#f59e0b', // 橙色 - 事件
  Concept: '#ec4899', // 粉色 - 概念
  Technology: '#06b6d4', // 青色 - 技术
  Product: '#f97316', // 橙红 - 产品

  // 文档类型
  Document: '#6366f1', // 靛蓝 - 文档
  Folder: '#10b981', // 绿色 - 文件夹

  // 其他
  User: '#8b5cf6', // 紫色 - 用户
  KnowledgeBase: '#f59e0b', // 橙色 - 知识库
  Unknown: '#9ca3af', // 灰色 - 未知
};

// 节点大小配置
export const NODE_SIZES: Record<string, number> = {
  Person: 12,
  Organization: 14,
  Location: 10,
  Event: 11,
  Concept: 10,
  Technology: 11,
  Product: 10,
  Document: 9,
  Folder: 11,
  User: 10,
  KnowledgeBase: 15,
  Unknown: 8,
};

// 边颜色配置
export const EDGE_COLORS: Record<string, string> = {
  // 关系类型
  CONTAINS: '#10b981', // 包含
  MENTIONS: '#9ca3af', // 提及
  RELATES_TO: '#6366f1', // 关联
  CREATED_BY: '#3b82f6', // 创建
  EDITED_BY: '#06b6d4', // 编辑
  BELONGS_TO: '#8b5cf6', // 归属
  REFERENCES: '#f59e0b', // 引用

  // 实体关系子类型
  DEPENDS_ON: '#3b82f6',
  SIMILAR_TO: '#ec4899',
  PART_OF: '#10b981',
  USES: '#06b6d4',
  IMPLEMENTS: '#8b5cf6',
  EXTENDS: '#f59e0b',
  RELATED_TO: '#6366f1',

  // 默认
  DEFAULT: '#4a4a5a',
};

// 实体类型中文名称
export const ENTITY_TYPE_LABELS: Record<string, string> = {
  Person: '人物',
  Organization: '组织',
  Location: '地点',
  Event: '事件',
  Concept: '概念',
  Technology: '技术',
  Product: '产品',
  Document: '文档',
  Folder: '文件夹',
  User: '用户',
  KnowledgeBase: '知识库',
  Unknown: '未知',
};

// 关系类型中文名称
export const RELATION_TYPE_LABELS: Record<string, string> = {
  CONTAINS: '包含',
  MENTIONS: '提及',
  RELATES_TO: '关联',
  CREATED_BY: '创建',
  EDITED_BY: '编辑',
  BELONGS_TO: '归属',
  REFERENCES: '引用',
  DEPENDS_ON: '依赖',
  SIMILAR_TO: '相似',
  PART_OF: '属于',
  USES: '使用',
  IMPLEMENTS: '实现',
  EXTENDS: '扩展',
  RELATED_TO: '相关',
};

// 获取节点颜色
export const getNodeColor = (nodeType: string): string => {
  return NODE_COLORS[nodeType] || NODE_COLORS.Unknown;
};

// 获取节点大小
export const getNodeSize = (nodeType: string): number => {
  return NODE_SIZES[nodeType] || NODE_SIZES.Unknown;
};

// 获取边颜色
export const getEdgeColor = (relationType: string): string => {
  return EDGE_COLORS[relationType] || EDGE_COLORS.DEFAULT;
};

// 获取实体类型标签
export const getEntityTypeLabel = (type: string): string => {
  return ENTITY_TYPE_LABELS[type] || type;
};

// 获取关系类型标签
export const getRelationTypeLabel = (type: string): string => {
  return RELATION_TYPE_LABELS[type] || type;
};
