# GitNexus 项目分析与集成方案

## 一、项目概述

GitNexus 是一个代码知识图谱系统,核心功能:
- 代码索引: 将代码库解析为知识图谱
- 图谱存储: KuzuDB 图数据库
- 可视化: Sigma.js WebGL 渲染
- AI 问答: LangChain Agent

## 二、技术栈

前端:
- React 18 + TypeScript + Vite
- Sigma.js 3.0 (图谱渲染)
- Graphology (图数据结构)
- Tailwind CSS v4
- KuzuDB WASM (浏览器图数据库)

核心依赖:
`json
"sigma": "^3.0.2",
"graphology": "^0.26.0",
"graphology-layout-forceatlas2": "^0.10.1",
"graphology-layout-noverlap": "^0.4.2"
`

## 三、核心组件分析

### 3.1 GraphCanvas.tsx
- 图谱画布主组件
- 集成 Sigma.js 渲染引擎
- 支持缩放、平移、节点选择
- 布局算法: ForceAtlas2
- 性能: WebGL 渲染,支持 1000-10000 节点

### 3.2 useSigma.ts
- Sigma.js 封装 Hook
- 管理图谱实例生命周期
- 提供交互 API: zoomIn, zoomOut, focusNode
- 处理节点点击、悬停事件

### 3.3 graph-adapter.ts
- 数据格式转换
- KnowledgeGraph → Graphology
- 节点着色、大小计算
- 边类型过滤

## 四、可集成功能评估

### 功能 1: 图谱可视化 (强烈推荐)

可复用组件:
- GraphCanvas.tsx
- useSigma.ts  
- graph-adapter.ts

优点:
- 成熟稳定,开箱即用
- WebGL 性能优秀
- 交互体验好

工作量: 1-2 周
难度: 低

### 功能 2: KuzuDB 图数据库 (不推荐)

原因:
- WASM 版本内存受限
- PandaWiki 后端是 Go,不是 TypeScript
- 建议后端用 Neo4j,前端仅做可视化

### 功能 3: LangChain Agent (不推荐)

原因:
- PandaWiki 已有自研 AI 架构
- 重构成本高
- 仅参考交互设计即可

## 五、集成方案 (推荐)

### 方案: 仅集成 Sigma.js 可视化

步骤 1: 安装依赖
`ash
cd PandaWiki/web/admin
pnpm add sigma graphology graphology-layout-forceatlas2 graphology-layout-noverlap
`

步骤 2: 复制组件
`
GitNexus → PandaWiki
components/GraphCanvas.tsx → components/KnowledgeGraph/GraphCanvas.tsx
hooks/useSigma.ts → hooks/useSigma.ts
lib/graph-adapter.ts → lib/graph-adapter.ts
`

步骤 3: 创建适配器
`	ypescript
// lib/neo4j-adapter.ts
export function neo4jToGraphology(nodes, relationships) {
  const graph = new Graph();
  
  nodes.forEach(node => {
    graph.addNode(node.id, {
      label: node.properties.name,
      size: 10,
      color: getColorByType(node.label),
      x: Math.random(),
      y: Math.random()
    });
  });
  
  relationships.forEach(rel => {
    graph.addEdge(rel.sourceId, rel.targetId, {
      type: rel.type,
      size: 2
    });
  });
  
  return graph;
}
`

步骤 4: 创建页面
`	ypescript
// pages/knowledge-graph/index.tsx
import { GraphCanvas } from '@/components/KnowledgeGraph/GraphCanvas';

export default function KnowledgeGraphPage() {
  const [graphData, setGraphData] = useState(null);
  
  useEffect(() => {
    // 从后端 API 获取图谱数据
    fetch('/api/v1/knowledge_graph')
      .then(res => res.json())
      .then(data => {
        const graph = neo4jToGraphology(data.nodes, data.relationships);
        setGraphData(graph);
      });
  }, []);
  
  return (
    <div className="h-screen">
      {graphData && <GraphCanvas graph={graphData} />}
    </div>
  );
}
`

步骤 5: 添加路由
`	ypescript
// router.tsx
{
  path: '/knowledge-graph',
  element: <KnowledgeGraphPage />
}
`

## 六、样式适配

GitNexus 使用 Tailwind,PandaWiki 使用 MUI,需要调整:

`	ypescript
// 替换 Tailwind 类名为 MUI sx
<button className="bg-elevated border border-border-subtle">
  ↓
<Button sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
`

或者在 admin 项目中也引入 Tailwind (推荐):
`ash
pnpm add -D tailwindcss postcss autoprefixer
`

## 七、后端 API 设计

需要新增接口:

`go
// GET /api/v1/knowledge_graph
type GraphResponse struct {
    Nodes []Node json:"nodes"
    Relationships []Relationship json:"relationships"
}

type Node struct {
    ID string json:"id"
    Label string json:"label" // Entity, Document, Concept
    Properties map[string]interface{} json:"properties"
}

type Relationship struct {
    SourceID string json:"sourceId"
    TargetID string json:"targetId"
    Type string json:"type" // RELATES_TO, MENTIONS, PART_OF
}
`

## 八、性能优化建议

1. 节点数量控制
   - < 1000 节点: 全量渲染
   - 1000-5000: 按深度过滤
   - > 5000: 分页或聚合

2. 布局计算
   - 使用 Web Workers
   - 缓存布局结果
   - 增量更新

3. 渲染优化
   - WebGL 渲染
   - 视口裁剪
   - LOD (细节层次)

## 九、预期效果

集成后可实现:
- 知识图谱 2D/3D 可视化
- 节点点击查看详情
- 关系路径高亮
- 社区聚类着色
- 搜索定位节点
- 缩放、平移、旋转

## 十、时间估算

| 任务 | 时间 |
|------|------|
| 安装依赖 | 0.5天 |
| 复制组件 | 1天 |
| 样式适配 | 1-2天 |
| 数据适配器 | 1-2天 |
| 页面集成 | 1天 |
| 测试调试 | 2-3天 |
| 总计 | 6-10天 |

## 十一、风险评估

风险 1: 样式冲突
- 概率: 中
- 应对: 使用 CSS Modules 或 Tailwind 隔离

风险 2: 性能问题
- 概率: 低
- 应对: 节点数量控制,分页加载

风险 3: 数据格式不匹配
- 概率: 中
- 应对: 编写完善的适配器,充分测试

## 十二、总结

GitNexus 的 Sigma.js 图谱可视化组件质量高,可以直接集成。

推荐方案:
- 仅集成可视化组件
- 后端使用 Neo4j
- 工作量: 1-2 周
- 风险: 低

核心价值:
- 快速获得专业图谱可视化能力
- 为毕设增加技术亮点
- 提升用户体验

下一步:
1. 确认是否采用此方案
2. 开始安装依赖和复制组件
3. 编写 Neo4j 适配器
4. 创建图谱展示页面
