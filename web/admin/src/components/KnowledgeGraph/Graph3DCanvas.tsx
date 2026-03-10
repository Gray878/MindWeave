import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import {
  CenterFocusStrong,
  Pause,
  PlayArrow,
  ThreeDRotation,
  ZoomIn,
  ZoomOut,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ForceGraph3D from 'react-force-graph-3d';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import type { GraphDataResponse, GraphNode } from '../../types/graph';
import { getNodeColor } from '../../constant/graph';
import DocumentPreviewDialog from './DocumentPreviewDialog';

const AUTO_ROTATE_DISTANCE = 800;
const NODE_FOCUS_DISTANCE = 200;
const SPHERE_RADIUS = 300;
const DOUBLE_CLICK_DELAY = 250;
const GRAPH_CENTER = { x: 0, y: 0, z: 0 };
const VIEWPORT_LEFT_SHIFT = 120;

type Graph3DNode = GraphNode & {
  color: string;
  val: number;
  x?: number;
  y?: number;
  z?: number;
  fx?: number;
  fy?: number;
  fz?: number;
};

type Graph3DLink = {
  source: string;
  target: string;
  type: string;
};

interface Graph3DCanvasProps {
  data: GraphDataResponse;
  onNodeClick?: (nodeId: string) => void;
  height?: string | number;
}

export default function Graph3DCanvas({
  data,
  onNodeClick,
  height = '600px',
}: Graph3DCanvasProps) {
  const fgRef = useRef<any>(null);
  const navigate = useNavigate();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedNodeData, setSelectedNodeData] = useState<GraphNode | null>(
    null,
  );
  const animationFrameRef = useRef<number | null>(null);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastClickRef = useRef<{ nodeId: string; timestamp: number } | null>(
    null,
  );

  const graphData = useMemo<{ nodes: Graph3DNode[]; links: Graph3DLink[] }>(
    () => ({
      nodes: data.nodes.map(node => ({
        ...node,
        color: getNodeColor(node.type),
        val: node.type === 'Document' ? 12 : node.type === 'Entity' ? 6 : 4,
      })),
      links: data.edges.map(edge => ({
        source: edge.source,
        target: edge.target,
        type: edge.type,
      })),
    }),
    [data],
  );

  useEffect(() => {
    if (!fgRef.current || graphData.nodes.length === 0) return;

    const fg = fgRef.current;
    const scene = fg.scene();

    graphData.nodes.forEach((node, index) => {
      const phi = Math.acos(-1 + (2 * index) / graphData.nodes.length);
      const theta = Math.sqrt(graphData.nodes.length * Math.PI) * phi;

      node.fx =
        GRAPH_CENTER.x + SPHERE_RADIUS * Math.cos(theta) * Math.sin(phi);
      node.fy =
        GRAPH_CENTER.y + SPHERE_RADIUS * Math.sin(theta) * Math.sin(phi);
      node.fz = GRAPH_CENTER.z + SPHERE_RADIUS * Math.cos(phi);
    });

    const particleCount = 2000;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let index = 0; index < particleCount; index += 1) {
      const phi = Math.acos(-1 + (2 * index) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;
      const radius = SPHERE_RADIUS + (Math.random() - 0.5) * 20;
      const colorMix = Math.random();

      positions[index * 3] = radius * Math.cos(theta) * Math.sin(phi);
      positions[index * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
      positions[index * 3 + 2] = radius * Math.cos(phi);

      colors[index * 3] = 0.4 + colorMix * 0.4;
      colors[index * 3 + 1] = 0.5 + colorMix * 0.3;
      colors[index * 3 + 2] = 0.8 + colorMix * 0.2;
    }

    particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3),
    );
    particleGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(colors, 3),
    );

    const particleMaterial = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    particleSystem.position.set(GRAPH_CENTER.x, GRAPH_CENTER.y, GRAPH_CENTER.z);
    scene.add(particleSystem);

    const sphereGeometry = new THREE.SphereGeometry(SPHERE_RADIUS, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x4a5568,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
    });
    const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphereMesh.position.set(GRAPH_CENTER.x, GRAPH_CENTER.y, GRAPH_CENTER.z);
    scene.add(sphereMesh);

    let angle = 0;
    let disposed = false;

    const animate = () => {
      if (disposed || !isAutoRotating) {
        animationFrameRef.current = null;
        return;
      }

      angle += 0.003;
      particleSystem.rotation.y += 0.0005;
      particleSystem.rotation.x += 0.0002;

      fg.cameraPosition(
        {
          x: AUTO_ROTATE_DISTANCE * Math.sin(angle) + GRAPH_CENTER.x,
          y: GRAPH_CENTER.y,
          z: AUTO_ROTATE_DISTANCE * Math.cos(angle) + GRAPH_CENTER.z,
        },
        GRAPH_CENTER,
      );

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (isAutoRotating) {
      animate();
    }

    return () => {
      disposed = true;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      scene.remove(particleSystem);
      scene.remove(sphereMesh);
      particleGeometry.dispose();
      particleMaterial.dispose();
      sphereGeometry.dispose();
      sphereMaterial.dispose();
    };
  }, [graphData, isAutoRotating]);

  const focusNode = useCallback(
    (node: Graph3DNode) => {
      setSelectedNode(node.id);
      setIsAutoRotating(false);
      onNodeClick?.(node.id);

      if (!fgRef.current) return;

      const x = node.x ?? node.fx ?? 0;
      const y = node.y ?? node.fy ?? 0;
      const z = node.z ?? node.fz ?? 0;
      const distance = Math.hypot(x, y, z) || 1;
      const ratio = 1 + NODE_FOCUS_DISTANCE / distance;

      fgRef.current.cameraPosition(
        { x: x * ratio, y: y * ratio, z: z * ratio },
        { x, y, z },
        1000,
      );
    },
    [onNodeClick],
  );

  const openDocumentPreview = useCallback((node: Graph3DNode) => {
    setSelectedNode(node.id);
    setIsAutoRotating(false);
    setSelectedNodeData({
      id: node.id,
      name: node.name,
      type: node.type,
      properties: node.properties,
    });
    setDialogOpen(true);
  }, []);

  const handleNodeClick = useCallback(
    (node: Graph3DNode) => {
      const now = Date.now();
      const lastClick = lastClickRef.current;
      const isDoubleClick =
        lastClick &&
        lastClick.nodeId === node.id &&
        now - lastClick.timestamp <= DOUBLE_CLICK_DELAY;

      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }

      if (isDoubleClick) {
        lastClickRef.current = null;

        if (node.type === 'Document') {
          openDocumentPreview(node);
        } else {
          focusNode(node);
        }
        return;
      }

      lastClickRef.current = { nodeId: node.id, timestamp: now };
      clickTimeoutRef.current = setTimeout(() => {
        focusNode(node);
        clickTimeoutRef.current = null;
        lastClickRef.current = null;
      }, DOUBLE_CLICK_DELAY);
    },
    [focusNode, openDocumentPreview],
  );

  const handleNodeHover = useCallback((node: Graph3DNode | null) => {
    setHoveredNode(node ? node.id : null);
  }, []);

  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
    setHoveredNode(null);
  }, []);

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedNodeData(null);
  };

  const handleNavigateToDocument = (nodeId: string) => {
    navigate(`/doc/editor/${nodeId}`);
  };

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  const handleZoomIn = () => {
    if (!fgRef.current) return;

    const camera = fgRef.current.camera();
    const currentDistance = camera.position.length();
    camera.position.normalize().multiplyScalar(currentDistance * 0.8);
  };

  const handleZoomOut = () => {
    if (!fgRef.current) return;

    const camera = fgRef.current.camera();
    const currentDistance = camera.position.length();
    camera.position.normalize().multiplyScalar(currentDistance * 1.2);
  };

  const handleResetView = () => {
    if (!fgRef.current) return;

    fgRef.current.cameraPosition(
      { x: GRAPH_CENTER.x, y: GRAPH_CENTER.y, z: AUTO_ROTATE_DISTANCE },
      GRAPH_CENTER,
      1000,
    );
    setSelectedNode(null);
    setHoveredNode(null);
    setIsAutoRotating(true);
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
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          left: `-${VIEWPORT_LEFT_SHIFT}px`,
          width: `calc(100% + ${VIEWPORT_LEFT_SHIFT}px)`,
        }}
      >
        <ForceGraph3D
          ref={fgRef}
          graphData={graphData}
          nodeLabel='name'
          nodeColor={(node: any) => {
            if (node.id === selectedNode) return '#00bcd4';
            if (node.id === hoveredNode) return '#64b5f6';
            return node.color;
          }}
          nodeVal={(node: any) =>
            node.id === selectedNode ? node.val * 1.5 : node.val
          }
          nodeThreeObject={(node: any) => {
            if (node.type === 'Document') {
              const group = new THREE.Group();
              const geometry = new THREE.SphereGeometry(node.val, 16, 16);
              const material = new THREE.MeshBasicMaterial({
                color:
                  node.id === selectedNode
                    ? 0x00bcd4
                    : new THREE.Color(node.color),
                transparent: true,
                opacity: 0.9,
              });
              const sphere = new THREE.Mesh(geometry, material);

              const glowGeometry = new THREE.SphereGeometry(
                node.val * 1.3,
                16,
                16,
              );
              const glowMaterial = new THREE.MeshBasicMaterial({
                color:
                  node.id === selectedNode
                    ? 0x00bcd4
                    : new THREE.Color(node.color),
                transparent: true,
                opacity: 0.3,
                side: THREE.BackSide,
              });
              const glow = new THREE.Mesh(glowGeometry, glowMaterial);

              const sprite: any = new SpriteText(node.name);
              sprite.color = node.id === selectedNode ? '#00bcd4' : '#ffffff';
              sprite.textHeight = node.id === selectedNode ? 10 : 8;
              sprite.position.y = node.val + 15;

              group.add(sphere);
              group.add(glow);
              group.add(sprite);
              return group;
            }

            const sprite: any = new SpriteText(node.name);
            sprite.color = node.id === selectedNode ? '#00bcd4' : '#ffffff';
            sprite.textHeight = node.id === selectedNode ? 8 : 6;
            return sprite;
          }}
          linkColor={(link: any) => {
            const colors: Record<string, string> = {
              RELATED_BY_KEYWORD: '#00bcd4',
              MENTIONS: '#f59e0b',
              REFERENCES: '#8b5cf6',
              CONTAINS: '#10b981',
            };
            return colors[link.type] || '#64b5f6';
          }}
          linkWidth={2.5}
          linkOpacity={0.8}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleSpeed={0.006}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          onBackgroundClick={handleBackgroundClick}
          backgroundColor='rgba(0,0,0,0)'
          showNavInfo={false}
          enableNodeDrag={false}
          enableNavigationControls={true}
          controlType='orbit'
        />
      </Box>

      <Box
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          px: 2,
          py: 1.25,
          borderRadius: 2,
          bgcolor: 'rgba(7, 12, 24, 0.72)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(100,181,246,0.18)',
          zIndex: 10,
        }}
      >
        <Typography sx={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600 }}>
          单击聚焦节点
        </Typography>
        <Typography sx={{ color: '#8fd3ff', fontSize: 12 }}>
          双击文档球体预览内容
        </Typography>
      </Box>

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
            onClick={handleResetView}
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
          title={isAutoRotating ? '停止旋转' : '开始旋转'}
          placement='left'
        >
          <IconButton
            onClick={() => setIsAutoRotating(prev => !prev)}
            sx={{
              bgcolor: isAutoRotating
                ? 'rgba(16, 185, 129, 0.2)'
                : 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                bgcolor: isAutoRotating
                  ? 'rgba(16, 185, 129, 0.3)'
                  : 'rgba(255,255,255,0.2)',
              },
              color: isAutoRotating ? '#10b981' : 'white',
              border: isAutoRotating
                ? '1px solid rgba(16, 185, 129, 0.3)'
                : 'none',
            }}
            size='small'
          >
            {isAutoRotating ? <Pause /> : <PlayArrow />}
          </IconButton>
        </Tooltip>
      </Stack>

      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          px: 2,
          py: 1,
          bgcolor: 'rgba(124, 58, 237, 0.2)',
          backdropFilter: 'blur(10px)',
          borderRadius: 1,
          border: '1px solid rgba(124, 58, 237, 0.3)',
          color: '#a78bfa',
          fontSize: 12,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          zIndex: 10,
        }}
      >
        <ThreeDRotation sx={{ fontSize: 16 }} />
        3D 球形视图
      </Box>

      <DocumentPreviewDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        nodeData={selectedNodeData}
        onNavigate={handleNavigateToDocument}
      />
    </Box>
  );
}
