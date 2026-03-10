import { useEffect, useRef, useState, useCallback } from 'react';
import { Box, IconButton, Stack, Tooltip } from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  CenterFocusStrong,
  ThreeDRotation,
} from '@mui/icons-material';
import ForceGraph3D from 'react-force-graph-3d';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import type { GraphDataResponse } from '../../types/graph';
import { getNodeColor } from '../../constant/graph';

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
  const fgRef = useRef<any>();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // 转换数据格式
  const graphData = {
    nodes: data.nodes.map(node => ({
      id: node.id,
      name: node.name,
      type: node.type,
      color: getNodeColor(node.type),
      val: node.type === 'Document' ? 12 : node.type === 'Entity' ? 6 : 4,
    })),
    links: data.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      type: edge.type,
    })),
  };

  // 初始化球形布局和粒子效果
  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      const fg = fgRef.current;

      // 将节点分布在球面上
      const radius = 300;
      graphData.nodes.forEach((node: any, i: number) => {
        const phi = Math.acos(-1 + (2 * i) / graphData.nodes.length);
        const theta = Math.sqrt(graphData.nodes.length * Math.PI) * phi;

        node.fx = radius * Math.cos(theta) * Math.sin(phi);
        node.fy = radius * Math.sin(theta) * Math.sin(phi);
        node.fz = radius * Math.cos(phi);
      });

      // 添加球形粒子背景
      const scene = fg.scene();

      // 创建粒子几何体
      const particleCount = 2000;
      const particleGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);

      // 在球面上均匀分布粒子
      for (let i = 0; i < particleCount; i++) {
        const phi = Math.acos(-1 + (2 * i) / particleCount);
        const theta = Math.sqrt(particleCount * Math.PI) * phi;

        const r = radius + (Math.random() - 0.5) * 20; // 稍微随机半径

        positions[i * 3] = r * Math.cos(theta) * Math.sin(phi);
        positions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
        positions[i * 3 + 2] = r * Math.cos(phi);

        // 渐变色 - 从蓝色到紫色
        const colorMix = Math.random();
        colors[i * 3] = 0.4 + colorMix * 0.4; // R
        colors[i * 3 + 1] = 0.5 + colorMix * 0.3; // G
        colors[i * 3 + 2] = 0.8 + colorMix * 0.2; // B

        // 随机大小
        sizes[i] = Math.random() * 2 + 0.5;
      }

      particleGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3),
      );
      particleGeometry.setAttribute(
        'color',
        new THREE.BufferAttribute(colors, 3),
      );
      particleGeometry.setAttribute(
        'size',
        new THREE.BufferAttribute(sizes, 1),
      );

      // 创建粒子材质
      const particleMaterial = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
      });

      const particleSystem = new THREE.Points(
        particleGeometry,
        particleMaterial,
      );
      scene.add(particleSystem);

      // 添加球形线框
      const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
      const sphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x4a5568,
        wireframe: true,
        transparent: true,
        opacity: 0.1,
      });
      const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
      scene.add(sphereMesh);

      // 启动自动旋转
      let angle = 0;
      const rotateSpeed = 0.3;
      const distance = 800;

      const animate = () => {
        angle += rotateSpeed * 0.01;

        // 旋转粒子系统
        particleSystem.rotation.y += 0.0005;
        particleSystem.rotation.x += 0.0002;

        // 旋转相机
        fg.cameraPosition({
          x: distance * Math.sin(angle),
          y: 0,
          z: distance * Math.cos(angle),
        });

        requestAnimationFrame(animate);
      };

      animate();
    }
  }, [graphData]);

  const handleNodeClick = useCallback(
    (node: any) => {
      setSelectedNode(node.id);
      onNodeClick?.(node.id);

      // 聚焦到节点
      if (fgRef.current) {
        const distance = 200;
        const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
        fgRef.current.cameraPosition(
          {
            x: node.x * distRatio,
            y: node.y * distRatio,
            z: node.z * distRatio,
          },
          node,
          1000,
        );
      }
    },
    [onNodeClick],
  );

  const handleNodeHover = useCallback((node: any) => {
    setHoveredNode(node ? node.id : null);
  }, []);

  const handleZoomIn = () => {
    if (fgRef.current) {
      const camera = fgRef.current.camera();
      const currentDistance = camera.position.length();
      const newDistance = currentDistance * 0.8;
      camera.position.normalize().multiplyScalar(newDistance);
    }
  };

  const handleZoomOut = () => {
    if (fgRef.current) {
      const camera = fgRef.current.camera();
      const currentDistance = camera.position.length();
      const newDistance = currentDistance * 1.2;
      camera.position.normalize().multiplyScalar(newDistance);
    }
  };

  const handleResetView = () => {
    if (fgRef.current) {
      fgRef.current.cameraPosition(
        { x: 0, y: 0, z: 800 },
        { x: 0, y: 0, z: 0 },
        1000,
      );
      setSelectedNode(null);
    }
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
          // 文档节点使用发光球体
          if (node.type === 'Document') {
            const group = new THREE.Group();

            // 主球体
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
            group.add(sphere);

            // 外层光晕
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
            group.add(glow);

            // 文字标签
            const sprite = new SpriteText(node.name);
            sprite.color = node.id === selectedNode ? '#00bcd4' : '#ffffff';
            sprite.textHeight = node.id === selectedNode ? 10 : 8;
            sprite.position.y = node.val + 15;
            group.add(sprite);

            return group;
          } else {
            // 其他节点使用简单的发光点
            const sprite = new SpriteText(node.name);
            sprite.color = node.id === selectedNode ? '#00bcd4' : '#ffffff';
            sprite.textHeight = node.id === selectedNode ? 8 : 6;
            return sprite;
          }
        }}
        linkColor={(link: any) => {
          // 根据关系类型使用不同颜色
          const colors: Record<string, string> = {
            RELATED_BY_KEYWORD: '#00bcd4', // 青色 - 关键词关系
            MENTIONS: '#f59e0b', // 橙色 - 提及关系
            REFERENCES: '#8b5cf6', // 紫色 - 引用关系
            CONTAINS: '#10b981', // 绿色 - 包含关系
          };
          return colors[link.type] || '#64b5f6'; // 默认蓝色
        }}
        linkWidth={2.5}
        linkOpacity={0.8}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.006}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        backgroundColor='rgba(0,0,0,0)'
        showNavInfo={false}
        enableNodeDrag={false}
      />

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
      </Stack>

      {selectedNode && (
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
          {graphData.nodes.find((n: any) => n.id === selectedNode)?.name}
        </Box>
      )}

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
    </Box>
  );
}
