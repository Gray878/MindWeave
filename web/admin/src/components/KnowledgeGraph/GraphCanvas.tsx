import { useEffect, useRef, useState } from 'react';
import {
  Box,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  CenterFocusStrong,
  PlayArrow,
  Pause,
} from '@mui/icons-material';
import Sigma from 'sigma';
import Graph from 'graphology';
import EdgeCurveProgram from '@sigma/edge-curve';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import noverlap from 'graphology-layout-noverlap';
import type {
  SigmaNodeAttributes,
  SigmaEdgeAttributes,
} from '../../types/graph';

interface GraphCanvasProps {
  graph: Graph<SigmaNodeAttributes, SigmaEdgeAttributes> | null;
  onNodeClick?: (nodeId: string) => void;
  onNodeHover?: (nodeId: string | null) => void;
  height?: string | number;
}

// 颜色工具函数
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 100, g: 100, b: 100 };
};

const dimColor = (hex: string, amount: number): string => {
  const rgb = hexToRgb(hex);
  const darkBg = { r: 26, g: 26, b: 46 };
  const r = Math.round(darkBg.r + (rgb.r - darkBg.r) * amount);
  const g = Math.round(darkBg.g + (rgb.g - darkBg.g) * amount);
  const b = Math.round(darkBg.b + (rgb.b - darkBg.b) * amount);
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
};

const brightenColor = (hex: string, factor: number): string => {
  const rgb = hexToRgb(hex);
  const r = Math.round(rgb.r + ((255 - rgb.r) * (factor - 1)) / factor);
  const g = Math.round(rgb.g + ((255 - rgb.g) * (factor - 1)) / factor);
  const b = Math.round(rgb.b + ((255 - rgb.b) * (factor - 1)) / factor);
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
};

export default function GraphCanvas({
  graph,
  onNodeClick,
  onNodeHover,
  height = '600px',
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isLayoutRunning, setIsLayoutRunning] = useState(false);
  const layoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!containerRef.current || !graph) {
      setLoading(false);
      return;
    }

    if (sigmaRef.current) {
      sigmaRef.current.kill();
    }

    // 确保容器有高度
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    console.log('Container dimensions:', {
      width: rect.width,
      height: rect.height,
    });

    if (rect.height === 0) {
      console.warn('Container has no height, setting minimum height');
      container.style.minHeight = '500px';
    }

    try {
      const sigma = new Sigma(graph, containerRef.current, {
        allowInvalidContainer: true,
        renderLabels: true,
        labelFont: 'Arial, sans-serif',
        labelSize: 12,
        labelWeight: '600',
        labelColor: { color: '#e4e4ed' },
        labelRenderedSizeThreshold: 6,
        labelDensity: 0.15,
        labelGridCellSize: 60,
        defaultNodeColor: '#6b7280',
        defaultEdgeColor: '#2a2a3a',
        defaultEdgeType: 'curved',
        edgeProgramClasses: {
          curved: EdgeCurveProgram,
        },
        minCameraRatio: 0.01,
        maxCameraRatio: 10,
        hideEdgesOnMove: true,
        zIndex: true,

        nodeReducer: (node, data) => {
          const res = { ...data };

          if (data.hidden) {
            res.hidden = true;
            return res;
          }

          if (selectedNode === node) {
            res.highlighted = true;
            res.size = (data.size || 8) * 1.8;
            res.zIndex = 2;
          } else if (hoveredNode === node) {
            res.highlighted = true;
            res.size = (data.size || 8) * 1.4;
            res.zIndex = 1;
          } else if (selectedNode && graph.hasEdge(node, selectedNode)) {
            res.color = data.color;
            res.size = (data.size || 8) * 1.3;
            res.zIndex = 1;
          } else if (selectedNode) {
            res.color = dimColor(data.color, 0.25);
            res.size = (data.size || 8) * 0.6;
            res.zIndex = 0;
          }
          return res;
        },

        edgeReducer: (edge, data) => {
          const res = { ...data };

          if (selectedNode) {
            const [source, target] = graph.extremities(edge);
            const isConnected =
              source === selectedNode || target === selectedNode;

            if (isConnected) {
              res.color = brightenColor(data.color, 1.5);
              res.size = Math.max(3, (data.size || 1) * 4);
              res.zIndex = 2;
            } else {
              res.color = dimColor(data.color, 0.1);
              res.size = 0.3;
              res.zIndex = 0;
            }
          }
          return res;
        },
      });

      sigmaRef.current = sigma;

      sigma.on('clickNode', ({ node }) => {
        setSelectedNode(node);
        onNodeClick?.(node);
      });

      sigma.on('clickStage', () => {
        setSelectedNode(null);
      });

      sigma.on('enterNode', ({ node }) => {
        setHoveredNode(node);
        onNodeHover?.(node);
        if (containerRef.current) containerRef.current.style.cursor = 'pointer';
      });

      sigma.on('leaveNode', () => {
        setHoveredNode(null);
        onNodeHover?.(null);
        if (containerRef.current) containerRef.current.style.cursor = 'grab';
      });

      // 初始化后自动适配视图
      setTimeout(() => {
        sigma.getCamera().animatedReset({ duration: 0 });
      }, 100);

      setLoading(false);
    } catch (error) {
      console.error('Failed to initialize Sigma:', error);
      setLoading(false);
    }

    return () => {
      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
      }
      if (sigmaRef.current) {
        sigmaRef.current.kill();
        sigmaRef.current = null;
      }
    };
  }, [graph]);

  useEffect(() => {
    if (sigmaRef.current) sigmaRef.current.refresh();
  }, [selectedNode, hoveredNode]);

  const handleZoomIn = () =>
    sigmaRef.current?.getCamera().animatedZoom({ duration: 200 });
  const handleZoomOut = () =>
    sigmaRef.current?.getCamera().animatedUnzoom({ duration: 200 });
  const handleResetZoom = () => {
    sigmaRef.current?.getCamera().animatedReset({ duration: 300 });
    setSelectedNode(null);
  };

  // 重新运行布局
  const handleToggleLayout = () => {
    if (!graph || !sigmaRef.current) return;

    if (isLayoutRunning) {
      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
        layoutTimeoutRef.current = null;
      }
      setIsLayoutRunning(false);
      return;
    }

    setIsLayoutRunning(true);

    const nodeCount = graph.order;
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

    const iterations = nodeCount < 50 ? 500 : nodeCount < 200 ? 800 : 1000;
    forceAtlas2.assign(graph, { settings, iterations });

    noverlap.assign(graph, {
      maxIterations: 20,
      ratio: 1.1,
      margin: 10,
    });

    sigmaRef.current.refresh();

    layoutTimeoutRef.current = setTimeout(() => {
      setIsLayoutRunning(false);
    }, 1000);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height,
        minHeight: '500px',
        borderRadius: 2,
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
          }}
        >
          <CircularProgress />
        </Box>
      )}

      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '500px',
          cursor: 'grab',
        }}
      />

      {!loading && (
        <Stack
          spacing={1}
          sx={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10 }}
        >
          <Tooltip title='放大' placement='left'>
            <IconButton
              onClick={handleZoomIn}
              sx={{
                bgcolor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                color: 'white',
              }}
              size='small'
            >
              <ZoomIn />
            </IconButton>
          </Tooltip>
          <Tooltip title='缩小' placement='left'>
            <IconButton
              onClick={handleZoomOut}
              sx={{
                bgcolor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                color: 'white',
              }}
              size='small'
            >
              <ZoomOut />
            </IconButton>
          </Tooltip>
          <Tooltip title='重置视图' placement='left'>
            <IconButton
              onClick={handleResetZoom}
              sx={{
                bgcolor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                color: 'white',
              }}
              size='small'
            >
              <CenterFocusStrong />
            </IconButton>
          </Tooltip>
          <Box
            sx={{ height: '1px', bgcolor: 'rgba(255,255,255,0.2)', my: 0.5 }}
          />
          <Tooltip
            title={isLayoutRunning ? '停止布局' : '优化布局'}
            placement='left'
          >
            <IconButton
              onClick={handleToggleLayout}
              sx={{
                bgcolor: isLayoutRunning
                  ? 'rgba(16, 185, 129, 0.2)'
                  : 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  bgcolor: isLayoutRunning
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(255,255,255,0.2)',
                },
                color: isLayoutRunning ? '#10b981' : 'white',
                animation: isLayoutRunning ? 'pulse 2s infinite' : 'none',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.7 },
                },
              }}
              size='small'
            >
              {isLayoutRunning ? <Pause /> : <PlayArrow />}
            </IconButton>
          </Tooltip>
        </Stack>
      )}

      {isLayoutRunning && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            bgcolor: 'rgba(16, 185, 129, 0.2)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            border: '1px solid rgba(16, 185, 129, 0.3)',
            zIndex: 10,
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              bgcolor: '#10b981',
              borderRadius: '50%',
              animation: 'ping 1s infinite',
              '@keyframes ping': {
                '0%': { opacity: 1, transform: 'scale(1)' },
                '100%': { opacity: 0, transform: 'scale(2)' },
              },
            }}
          />
          <Box sx={{ fontSize: 12, color: '#10b981', fontWeight: 500 }}>
            布局优化中...
          </Box>
        </Box>
      )}

      {selectedNode && graph && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            px: 3,
            py: 1.5,
            bgcolor: 'rgba(0, 188, 212, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            color: 'white',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0,188,212,0.3)',
            zIndex: 10,
          }}
        >
          {graph.getNodeAttribute(selectedNode, 'label')}
        </Box>
      )}
    </Box>
  );
}
