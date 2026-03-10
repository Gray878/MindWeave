# 知识图谱模块

## 已完成的工作（阶段一）

### 1. 类型定义

- `src/types/graph.ts` - 完整的 TypeScript 类型定义
  - GraphNode, GraphEdge - 图谱节点和边
  - API 请求/响应类型
  - Sigma.js 节点/边属性类型

### 2. API 服务层

- `src/request/Graph.ts` - 图谱 API 调用封装
  - getNodeGraph - 获取节点关系图谱
  - findPaths - 查找节点间路径
  - getGraphStats - 获取图谱统计
  - searchEntities - 搜索实体

### 3. 常量配置

- `src/constant/graph.ts` - 节点和边的视觉配置
  - NODE_COLORS - 11种节点类型颜色
  - NODE_SIZES - 节点大小配置
  - EDGE_COLORS - 14种关系类型颜色
  - 辅助函数（getNodeColor, getNodeSize, getEdgeColor）

### 4. 基础页面结构

- `src/pages/graph/index.tsx` - 图谱概览页面框架
- `src/lib/graph-adapter.ts` - 数据适配器框架

## 下一步操作

### 步骤 1: 安装依赖

```bash
cd PandaWiki/web/admin
pnpm add sigma@3.0.2 graphology@0.26.0 @sigma/edge-curve@3.1.0
pnpm add graphology-layout-forceatlas2@0.10.1 graphology-layout-noverlap@0.4.2
pnpm add graphology-indices@0.17.0 graphology-utils@2.3.0
```

### 步骤 2: 从 GitNexus 复制组件

需要复制以下文件并修改：

1. GraphCanvas.tsx - 图谱画布组件
2. useSigma.ts - Sigma.js Hook
3. 完善 graph-adapter.ts 的实现

### 步骤 3: 创建图谱可视化组件

- GraphCanvas - 核心可视化组件
- GraphControls - 控制面板（缩放、布局切换）
- GraphLegend - 图例
- NodeDetailPanel - 节点详情侧边栏

### 步骤 4: 添加路由

在 router.tsx 中添加图谱页面路由

## 文件结构

```
src/
├── types/
│   └── graph.ts              # 类型定义
├── request/
│   └── Graph.ts              # API 调用
├── constant/
│   └── graph.ts              # 常量配置
├── lib/
│   └── graph-adapter.ts      # 数据适配器
├── pages/
│   └── graph/
│       ├── index.tsx         # 概览页面
│       └── README.md         # 本文档
└── components/
    └── KnowledgeGraph/       # (待创建) 图谱组件
        ├── GraphCanvas.tsx
        ├── GraphControls.tsx
        ├── GraphLegend.tsx
        └── NodeDetailPanel.tsx
```
