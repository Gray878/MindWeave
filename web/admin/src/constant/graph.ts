const hashSeed = (value: string): number => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
};

const NODE_SWATCHES: Record<string, string[]> = {
  Person: ['#7dd3fc', '#38bdf8', '#93c5fd'],
  Organization: ['#c084fc', '#8b5cf6', '#a78bfa'],
  Location: ['#34d399', '#2dd4bf', '#22c55e'],
  Event: ['#fb7185', '#f97316', '#f59e0b'],
  Concept: ['#f472b6', '#fb7185', '#f59e0b'],
  Technology: ['#22d3ee', '#06b6d4', '#38bdf8'],
  Product: ['#f97316', '#fb7185', '#f59e0b'],
  Document: ['#38bdf8', '#60a5fa', '#818cf8', '#22d3ee'],
  Folder: ['#34d399', '#22c55e', '#14b8a6'],
  User: ['#a78bfa', '#c084fc', '#8b5cf6'],
  KnowledgeBase: ['#facc15', '#f59e0b', '#fb923c'],
  Unknown: ['#94a3b8', '#64748b', '#60a5fa'],
};

export const NODE_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(NODE_SWATCHES).map(([type, swatches]) => [type, swatches[0]]),
);

export const NODE_SIZES: Record<string, number> = {
  Person: 12,
  Organization: 14,
  Location: 10,
  Event: 11,
  Concept: 10,
  Technology: 11,
  Product: 10,
  Document: 9.5,
  Folder: 11,
  User: 10,
  KnowledgeBase: 15,
  Unknown: 8,
};

export const EDGE_COLORS: Record<string, string> = {
  CONTAINS: '#34d399',
  MENTIONS: '#7dd3fc',
  RELATES_TO: '#818cf8',
  CREATED_BY: '#38bdf8',
  EDITED_BY: '#22d3ee',
  BELONGS_TO: '#c084fc',
  REFERENCES: '#f59e0b',
  RELATED_BY_KEYWORD: '#facc15',
  DEPENDS_ON: '#38bdf8',
  SIMILAR_TO: '#f472b6',
  PART_OF: '#34d399',
  USES: '#22d3ee',
  IMPLEMENTS: '#a78bfa',
  EXTENDS: '#fb923c',
  RELATED_TO: '#60a5fa',
  DEFAULT: '#475569',
};

const EDGE_SIZES: Record<string, number> = {
  CONTAINS: 1.75,
  MENTIONS: 1.1,
  RELATES_TO: 1.35,
  CREATED_BY: 1.2,
  EDITED_BY: 1.2,
  BELONGS_TO: 1.28,
  REFERENCES: 1.45,
  RELATED_BY_KEYWORD: 1.26,
  DEPENDS_ON: 1.22,
  SIMILAR_TO: 1.32,
  PART_OF: 1.52,
  USES: 1.18,
  IMPLEMENTS: 1.24,
  EXTENDS: 1.28,
  RELATED_TO: 1.22,
  DEFAULT: 1.1,
};

const EDGE_CURVATURES: Record<string, number> = {
  CONTAINS: 0.06,
  MENTIONS: 0.18,
  RELATES_TO: 0.14,
  CREATED_BY: 0.12,
  EDITED_BY: 0.12,
  BELONGS_TO: 0.16,
  REFERENCES: 0.22,
  RELATED_BY_KEYWORD: 0.2,
  DEPENDS_ON: 0.14,
  SIMILAR_TO: 0.24,
  PART_OF: 0.08,
  USES: 0.16,
  IMPLEMENTS: 0.14,
  EXTENDS: 0.16,
  RELATED_TO: 0.14,
  DEFAULT: 0.12,
};

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

export const RELATION_TYPE_LABELS: Record<string, string> = {
  CONTAINS: '包含',
  MENTIONS: '提及',
  RELATES_TO: '关联',
  CREATED_BY: '创建',
  EDITED_BY: '编辑',
  BELONGS_TO: '归属',
  REFERENCES: '引用',
  RELATED_BY_KEYWORD: '关键词相关',
  DEPENDS_ON: '依赖',
  SIMILAR_TO: '相似',
  PART_OF: '属于',
  USES: '使用',
  IMPLEMENTS: '实现',
  EXTENDS: '扩展',
  RELATED_TO: '相关',
};

export const getNodeColor = (nodeType: string, seed = ''): string => {
  const swatches = NODE_SWATCHES[nodeType] || NODE_SWATCHES.Unknown;
  if (!seed) {
    return swatches[0];
  }

  return swatches[hashSeed(`${nodeType}:${seed}`) % swatches.length];
};

export const getNodeSize = (nodeType: string): number =>
  NODE_SIZES[nodeType] || NODE_SIZES.Unknown;

export const getEdgeColor = (relationType: string): string =>
  EDGE_COLORS[relationType] || EDGE_COLORS.DEFAULT;

export const getEdgeSize = (
  relationType: string,
  nodeCount: number,
): number => {
  const base = EDGE_SIZES[relationType] || EDGE_SIZES.DEFAULT;
  const densityScale = nodeCount > 240 ? 0.76 : nodeCount > 120 ? 0.88 : 1;
  return Number((base * densityScale).toFixed(2));
};

export const getEdgeCurvature = (
  relationType: string,
  edgeIndex = 0,
): number => {
  const base = EDGE_CURVATURES[relationType] || EDGE_CURVATURES.DEFAULT;
  const direction = edgeIndex % 2 === 0 ? 1 : -1;
  const variation = (edgeIndex % 4) * 0.02;
  return Number(((base + variation) * direction).toFixed(3));
};

export const getEntityTypeLabel = (type: string): string =>
  ENTITY_TYPE_LABELS[type] || type;

export const getRelationTypeLabel = (type: string): string =>
  RELATION_TYPE_LABELS[type] || type;
