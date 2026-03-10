// 图谱数据适配器 - 将 Neo4j 数据转换为 Graphology 格式
import Graph from 'graphology';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import noverlap from 'graphology-layout-noverlap';
import type {
  GraphDataResponse,
  SigmaNodeAttributes,
  SigmaEdgeAttributes,
} from '../types/graph';
import { getNodeColor, getNodeSize, getEdgeColor } from '../constant/graph';

/**
 * 获取节点质量 - 用于 ForceAtlas2 布局
 * 质量越大，节点间排斥力越强
 */
function getNodeMass(nodeType: string, nodeCount: number): number {
  const baseMassMultiplier = nodeCount > 1000 ? 1.5 : 1;

  switch (nodeType) {
    case 'Document':
      return 20 * baseMassMultiplier;
    case 'Entity':
      return 5 * baseMassMultiplier;
    case 'Keyword':
      return 3 * baseMassMultiplier;
    default:
      return 2;
  }
}

/**
 * 应用 ForceAtlas2 布局算法 (同步版本)
 */
function applyForceAtlas2Layout(
  graph: Graph<SigmaNodeAttributes, SigmaEdgeAttributes>,
): void {
  const nodeCount = graph.order;
  if (nodeCount === 0) return;

  // 根据节点数量调整参数
  const isSmall = nodeCount < 50;
  const isMedium = nodeCount >= 50 && nodeCount < 200;

  const settings = {
    gravity: isSmall ? 1 : isMedium ? 0.8 : 0.5,
    scalingRatio: isSmall ? 20 : isMedium ? 40 : 80,
    slowDown: isSmall ? 1 : isMedium ? 2 : 3,
    barnesHutOptimize: nodeCount > 100,
    barnesHutTheta: 0.6,
    strongGravityMode: false,
    outboundAttractionDistribution: true,
    linLogMode: false,
    adjustSizes: true,
    edgeWeightInfluence: 1,
  };

  // 同步运行布局算法
  const iterations = nodeCount < 50 ? 500 : nodeCount < 200 ? 800 : 1000;
  forceAtlas2.assign(graph, { settings, iterations });

  // 应用 noverlap 防止节点重叠
  noverlap.assign(graph, {
    maxIterations: 20,
    ratio: 1.1,
    margin: 10,
    expansion: 1.05,
  });
}

/**
 * 将 Neo4j 图谱数据转换为 Graphology 图结构
 */
export const neo4jToGraphology = (
  data: GraphDataResponse,
): Graph<SigmaNodeAttributes, SigmaEdgeAttributes> => {
  console.log('Starting graph conversion with data:', data);
  const graph = new Graph<SigmaNodeAttributes, SigmaEdgeAttributes>();
  const nodeCount = data.nodes.length;

  // 使用黄金角度进行初始节点分布
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const spread = Math.sqrt(nodeCount) * 50;

  // 添加节点 - 使用黄金角度螺旋分布
  data.nodes.forEach((node, index) => {
    const nodeType = node.type || 'Unknown';
    const color = getNodeColor(nodeType);
    const size = getNodeSize(nodeType);

    // 黄金角度螺旋分布
    const angle = index * goldenAngle;
    const radius = spread * Math.sqrt((index + 1) / Math.max(nodeCount, 1));
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);

    try {
      graph.addNode(node.id, {
        x,
        y,
        size,
        color,
        label: node.name || node.id,
        nodeType,
        properties: node.properties,
        hidden: false,
        mass: getNodeMass(nodeType, nodeCount),
      });
    } catch (err) {
      console.error(`Failed to add node ${node.id}:`, err);
    }
  });

  // 添加边 - 使用曲线样式
  const edgeBaseSize = nodeCount > 200 ? 0.6 : 1.0;
  data.edges.forEach(edge => {
    if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
      const edgeId = `${edge.source}-${edge.target}`;
      if (!graph.hasEdge(edgeId)) {
        try {
          graph.addEdge(edge.source, edge.target, {
            size: edgeBaseSize,
            color: getEdgeColor(edge.type),
            relationType: edge.type,
            type: 'curved',
            curvature: 0.15 + Math.random() * 0.1,
          });
        } catch (err) {
          console.error(`Failed to add edge ${edgeId}:`, err);
        }
      }
    }
  });

  console.log(
    `Graph conversion complete: ${graph.order} nodes, ${graph.size} edges`,
  );

  // 应用 ForceAtlas2 布局
  if (graph.order > 0) {
    console.log('Applying ForceAtlas2 layout...');
    applyForceAtlas2Layout(graph);
    console.log('Layout applied');
  }

  return graph;
};
