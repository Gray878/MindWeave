import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  CenterFocusStrong,
  Pause,
  PlayArrow,
  ZoomIn,
  ZoomOut,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Sigma from 'sigma';
import Graph from 'graphology';
import EdgeCurveProgram from '@sigma/edge-curve';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import noverlap from 'graphology-layout-noverlap';
import type {
  SigmaEdgeAttributes,
  SigmaNodeAttributes,
} from '../../types/graph';
import {
  EDGE_COLORS,
  NODE_COLORS,
  getEntityTypeLabel,
} from '../../constant/graph';
import DocumentPreviewDialog from './DocumentPreviewDialog';

interface GraphCanvasProps {
  graph: Graph<SigmaNodeAttributes, SigmaEdgeAttributes> | null;
  onNodeClick?: (nodeId: string) => void;
  onNodeHover?: (nodeId: string | null) => void;
  height?: string | number;
}

interface PreviewNodeData {
  id: string;
  name: string;
  type: string;
  properties?: Record<string, any>;
}

interface BeaconDisplayData {
  x: number;
  y: number;
  size: number;
  color?: string;
  hidden?: boolean;
  nodeType?: string;
  beaconColor?: string;
  beaconState?: SigmaNodeAttributes['beaconState'];
}

interface Star {
  x: number;
  y: number;
  driftX: number;
  driftY: number;
  radius: number;
  alpha: number;
  twinkleOffset: number;
  twinkleSpeed: number;
  glow: number;
  spike: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  life: number;
  maxLife: number;
  opacity: number;
}

const UI_FONT = '"Rajdhani", "IBM Plex Sans", "Noto Sans SC", sans-serif';
const LABEL_FONT =
  '"JetBrains Mono", "IBM Plex Sans", "Noto Sans SC", monospace';
const BACKGROUND_COLOR = '#010204';
const STAR_COLORS = ['#ffffff', '#f8fafc', '#dbeafe', '#bfdbfe', '#c4b5fd'];
const DOUBLE_CLICK_DELAY = 250;

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const normalized = hex.replace('#', '');

  if (normalized.length !== 6) {
    return { r: 100, g: 116, b: 139 };
  }

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
};

const withAlpha = (hex: string, alpha: number): string => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const mixColor = (hex: string, target: string, amount: number): string => {
  const sourceRgb = hexToRgb(hex);
  const targetRgb = hexToRgb(target);
  const ratio = Math.min(Math.max(amount, 0), 1);
  const r = Math.round(sourceRgb.r + (targetRgb.r - sourceRgb.r) * ratio);
  const g = Math.round(sourceRgb.g + (targetRgb.g - sourceRgb.g) * ratio);
  const b = Math.round(sourceRgb.b + (targetRgb.b - sourceRgb.b) * ratio);
  return `#${[r, g, b].map(value => value.toString(16).padStart(2, '0')).join('')}`;
};

const brightenColor = (hex: string, amount: number): string =>
  mixColor(hex, '#ffffff', amount);

const dimColor = (hex: string, amount: number): string =>
  mixColor(hex, BACKGROUND_COLOR, amount);

const truncateLabel = (label: string, maxLength = 22): string =>
  label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label;

const hashSeed = (value: string): number => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
};

const getNodeTag = (nodeType = ''): string => {
  switch (nodeType) {
    case 'Document':
      return 'DOC';
    case 'Folder':
      return 'DIR';
    case 'Person':
      return 'BIO';
    case 'Organization':
      return 'ORG';
    case 'Location':
      return 'MAP';
    case 'Event':
      return 'EVT';
    case 'Concept':
      return 'IDEA';
    case 'Technology':
      return 'TECH';
    default:
      return 'NODE';
  }
};

const drawRoundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void => {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height,
  );
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
};

const drawSignalNodeLabel = (
  context: CanvasRenderingContext2D,
  rawData: any,
): void => {
  const data = rawData as {
    x: number;
    y: number;
    size: number;
    color: string;
    beaconColor?: string;
    label: string;
    highlighted?: boolean;
    nodeType?: string;
  };

  if (!data.label) {
    return;
  }

  const accent = data.beaconColor || data.color || NODE_COLORS.Unknown;
  const label = truncateLabel(String(data.label));
  const tag = getNodeTag(data.nodeType);
  const isActive = Boolean(data.highlighted);
  const labelFontSize = isActive ? 12 : 10.5;
  const tagFontSize = 9;
  const labelX = data.x + data.size + 12;
  const labelHeight = isActive ? 28 : 24;
  const labelY = data.y - labelHeight / 2 - 1;

  context.save();
  context.font = `700 ${tagFontSize}px ${LABEL_FONT}`;
  const tagWidth = Math.max(30, context.measureText(tag).width + 14);
  context.font = `600 ${labelFontSize}px ${LABEL_FONT}`;
  const textWidth = context.measureText(label).width;
  const totalWidth = tagWidth + textWidth + 26;

  context.shadowColor = withAlpha(accent, isActive ? 0.38 : 0.18);
  context.shadowBlur = isActive ? 18 : 10;
  context.fillStyle = isActive
    ? 'rgba(8, 14, 26, 0.84)'
    : 'rgba(8, 14, 26, 0.62)';
  context.strokeStyle = withAlpha(accent, isActive ? 0.64 : 0.24);
  context.lineWidth = 1.15;
  drawRoundedRect(context, labelX, labelY, totalWidth, labelHeight, 8);
  context.fill();
  context.stroke();

  context.fillStyle = withAlpha(accent, isActive ? 0.28 : 0.16);
  drawRoundedRect(
    context,
    labelX + 7,
    labelY + 5,
    tagWidth,
    labelHeight - 10,
    6,
  );
  context.fill();

  context.fillStyle = withAlpha(accent, 0.92);
  context.fillRect(labelX, labelY + 4, 3, labelHeight - 8);

  context.fillStyle = '#f8fafc';
  context.font = `700 ${tagFontSize}px ${LABEL_FONT}`;
  context.fillText(tag, labelX + 13, labelY + labelHeight / 2 + 3);

  context.fillStyle = isActive ? '#f8fafc' : 'rgba(226, 232, 240, 0.86)';
  context.font = `600 ${labelFontSize}px ${LABEL_FONT}`;
  context.fillText(label, labelX + tagWidth + 16, labelY + labelHeight / 2 + 4);
  context.restore();
};

const drawSignalNodeHover = (
  context: CanvasRenderingContext2D,
  rawData: any,
): void => {
  const data = rawData as {
    x: number;
    y: number;
    size: number;
    color: string;
    beaconColor?: string;
  };
  const accent = data.beaconColor || data.color || NODE_COLORS.Unknown;

  context.save();
  context.beginPath();
  context.arc(data.x, data.y, data.size + 9, 0, Math.PI * 2);
  context.fillStyle = withAlpha(accent, 0.12);
  context.fill();
  context.beginPath();
  context.arc(data.x, data.y, data.size + 5.5, 0, Math.PI * 2);
  context.strokeStyle = withAlpha(accent, 0.44);
  context.lineWidth = 1.6;
  context.stroke();
  context.restore();
};

const drawPolygon = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  sides: number,
  rotation = 0,
) => {
  context.beginPath();

  for (let index = 0; index < sides; index += 1) {
    const angle = rotation + (Math.PI * 2 * index) / sides;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;

    if (index === 0) {
      context.moveTo(px, py);
    } else {
      context.lineTo(px, py);
    }
  }

  context.closePath();
};

const getBeaconShape = (nodeType: string) => {
  switch (nodeType) {
    case 'Folder':
    case 'KnowledgeBase':
      return 'hex';
    case 'Location':
    case 'Event':
      return 'triangle';
    case 'Person':
    case 'Organization':
    case 'User':
      return 'square';
    default:
      return 'diamond';
  }
};

const drawBeaconNode = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  accent: string,
  state: SigmaNodeAttributes['beaconState'],
  nodeType: string,
) => {
  const glowAlpha =
    state === 'selected'
      ? 0.34
      : state === 'hovered'
        ? 0.26
        : state === 'neighbor'
          ? 0.18
          : 0.12;
  const strokeAlpha =
    state === 'selected'
      ? 0.92
      : state === 'hovered'
        ? 0.82
        : state === 'neighbor'
          ? 0.62
          : 0.48;
  const fillAlpha =
    state === 'selected'
      ? 0.42
      : state === 'hovered'
        ? 0.3
        : state === 'neighbor'
          ? 0.22
          : 0.16;
  const outerRadius = size * (state === 'selected' ? 2.05 : 1.78);
  const innerRadius = size * 0.92;
  const coreRadius = Math.max(1.2, size * 0.22);
  const shape = getBeaconShape(nodeType);

  context.save();
  context.shadowColor = withAlpha(accent, glowAlpha);
  context.shadowBlur =
    state === 'selected' ? 20 : state === 'hovered' ? 16 : 10;

  context.beginPath();
  context.arc(x, y, outerRadius, 0, Math.PI * 2);
  context.fillStyle = withAlpha(accent, glowAlpha * 0.12);
  context.fill();

  context.shadowBlur = 0;

  if (shape === 'hex') {
    drawPolygon(context, x, y, outerRadius * 0.72, 6, Math.PI / 6);
  } else if (shape === 'triangle') {
    drawPolygon(context, x, y, outerRadius * 0.82, 3, -Math.PI / 2);
  } else if (shape === 'square') {
    drawPolygon(context, x, y, outerRadius * 0.74, 4, Math.PI / 4);
  } else {
    drawPolygon(context, x, y, outerRadius * 0.78, 4, 0);
  }

  context.fillStyle = withAlpha(accent, fillAlpha);
  context.strokeStyle = withAlpha(accent, strokeAlpha);
  context.lineWidth = state === 'selected' ? 1.6 : 1.2;
  context.fill();
  context.stroke();

  if (shape === 'diamond') {
    drawPolygon(context, x, y, innerRadius, 4, Math.PI / 4);
  } else if (shape === 'hex') {
    drawPolygon(context, x, y, innerRadius * 0.92, 6, Math.PI / 6);
  } else if (shape === 'triangle') {
    drawPolygon(context, x, y, innerRadius * 0.96, 3, -Math.PI / 2);
  } else {
    drawPolygon(context, x, y, innerRadius * 0.94, 4, 0);
  }

  context.strokeStyle = withAlpha('#f8fafc', strokeAlpha * 0.54);
  context.lineWidth = 1;
  context.stroke();

  context.beginPath();
  context.arc(x, y, coreRadius, 0, Math.PI * 2);
  context.fillStyle = withAlpha('#ffffff', state === 'selected' ? 0.98 : 0.92);
  context.fill();

  context.beginPath();
  context.moveTo(x - outerRadius * 0.72, y);
  context.lineTo(x - outerRadius * 0.24, y);
  context.moveTo(x + outerRadius * 0.24, y);
  context.lineTo(x + outerRadius * 0.72, y);
  context.strokeStyle = withAlpha(accent, 0.36);
  context.lineWidth = 0.8;
  context.stroke();
  context.restore();
};

export default function GraphCanvas({
  graph,
  onNodeClick,
  onNodeHover,
  height = '600px',
}: GraphCanvasProps) {
  const minCanvasHeight =
    typeof height === 'string' && height.includes('%') ? 0 : 520;
  const navigate = useNavigate();
  const shellRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const sigmaRef = useRef<Sigma<
    SigmaNodeAttributes,
    SigmaEdgeAttributes
  > | null>(null);
  const layoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastNodeClickRef = useRef<{ nodeId: string; timestamp: number } | null>(
    null,
  );
  const pulsePhaseRef = useRef(0);
  const pulseFrameRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isLayoutRunning, setIsLayoutRunning] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedNodeData, setSelectedNodeData] =
    useState<PreviewNodeData | null>(null);

  const selectedNeighbors = useMemo(() => {
    if (!graph || !selectedNode || !graph.hasNode(selectedNode)) {
      return new Set<string>();
    }

    return new Set(graph.neighbors(selectedNode));
  }, [graph, selectedNode]);

  const hoveredNeighbors = useMemo(() => {
    if (!graph || !hoveredNode || !graph.hasNode(hoveredNode)) {
      return new Set<string>();
    }

    return new Set(graph.neighbors(hoveredNode));
  }, [graph, hoveredNode]);

  const selectedMeta = useMemo(() => {
    if (!graph || !selectedNode || !graph.hasNode(selectedNode)) {
      return null;
    }

    const attributes = graph.getNodeAttributes(selectedNode);
    return {
      label: attributes.label,
      nodeType: attributes.nodeType,
      color: attributes.color || NODE_COLORS.Unknown,
    };
  }, [graph, selectedNode]);

  const buildPreviewNodeData = useCallback(
    (nodeId: string): PreviewNodeData | null => {
      if (!graph || !graph.hasNode(nodeId)) {
        return null;
      }

      const attributes = graph.getNodeAttributes(nodeId);
      return {
        id: nodeId,
        name: attributes.label,
        type: attributes.nodeType,
        properties: attributes.properties,
      };
    },
    [graph],
  );

  const focusNode = useCallback(
    (nodeId: string) => {
      if (!graph || !graph.hasNode(nodeId)) {
        return;
      }

      const sigma = sigmaRef.current;
      const camera = sigma?.getCamera();
      const displayNode = sigma?.getNodeDisplayData(nodeId);

      setSelectedNode(nodeId);
      onNodeClick?.(nodeId);

      if (!camera || !displayNode) {
        return;
      }

      camera.animate(
        {
          x: displayNode.x,
          y: displayNode.y,
          ratio: camera.getState().ratio,
        },
        { duration: 320 },
      );
    },
    [graph, onNodeClick],
  );

  const openNodePreview = useCallback(
    (nodeId: string) => {
      const nodeData = buildPreviewNodeData(nodeId);

      if (!nodeData) {
        return;
      }

      setSelectedNode(nodeId);
      setSelectedNodeData(nodeData);
      setDialogOpen(true);
    },
    [buildPreviewNodeData],
  );

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      const now = performance.now();
      const previousClick = lastNodeClickRef.current;

      if (
        previousClick &&
        previousClick.nodeId === nodeId &&
        now - previousClick.timestamp <= DOUBLE_CLICK_DELAY + 80
      ) {
        lastNodeClickRef.current = null;
        if (clickTimeoutRef.current) {
          clearTimeout(clickTimeoutRef.current);
          clickTimeoutRef.current = null;
        }
        openNodePreview(nodeId);
        return;
      }

      lastNodeClickRef.current = { nodeId, timestamp: now };
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }

      clickTimeoutRef.current = setTimeout(() => {
        focusNode(nodeId);
        clickTimeoutRef.current = null;
        if (lastNodeClickRef.current?.nodeId === nodeId) {
          lastNodeClickRef.current = null;
        }
      }, DOUBLE_CLICK_DELAY + 24);
    },
    [focusNode, openNodePreview],
  );

  const handleNodeDoubleClick = useCallback(
    (nodeId: string) => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }

      lastNodeClickRef.current = null;
      openNodePreview(nodeId);
    },
    [openNodePreview],
  );

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    setSelectedNodeData(null);
  }, []);

  const handleNavigateToDocument = useCallback(
    (nodeId: string) => {
      navigate(`/doc/editor/${nodeId}`);
    },
    [navigate],
  );

  const nodeReducer = useMemo(
    () => (node: string, data: SigmaNodeAttributes) => {
      const result = { ...data } as Partial<SigmaNodeAttributes> & {
        forceLabel?: boolean;
      };
      const baseSize = data.size || 8;
      const baseColor = data.color || NODE_COLORS.Unknown;
      const pulseOffset = (hashSeed(node) % 360) * 0.045;
      const pulsePhase = pulsePhaseRef.current + pulseOffset;
      const idlePulse = 1 + Math.sin(pulsePhase) * 0.04;
      const activePulse = 1 + Math.sin(pulsePhase * 1.35) * 0.09;
      const isSelected = selectedNode === node;
      const isHovered = hoveredNode === node;
      const isSelectedNeighbor = selectedNeighbors.has(node);
      const isHoveredNeighbor = hoveredNeighbors.has(node);

      if (data.hidden) {
        result.hidden = true;
        return result;
      }

      result.forceLabel = isSelected || isHovered || baseSize >= 12.5;
      result.beaconColor = baseColor;
      result.beaconState = 'idle';
      result.color = withAlpha(baseColor, 0);
      result.highlighted = false;

      if (isSelected) {
        result.beaconColor = brightenColor(baseColor, 0.14);
        result.beaconState = 'selected';
        result.size = baseSize * 1.85 * activePulse;
        result.zIndex = 4;
        result.forceLabel = true;
        return result;
      }

      if (isHovered) {
        result.beaconColor = brightenColor(baseColor, 0.08);
        result.beaconState = 'hovered';
        result.size = baseSize * 1.5 * (1 + Math.sin(pulsePhase * 1.5) * 0.06);
        result.zIndex = 3;
        result.forceLabel = true;
        return result;
      }

      if (selectedNode) {
        if (isSelectedNeighbor) {
          result.beaconColor = brightenColor(baseColor, 0.04);
          result.beaconState = 'neighbor';
          result.size = baseSize * 1.12 * (1 + Math.sin(pulsePhase) * 0.03);
          result.zIndex = 2;
          result.forceLabel = true;
        } else {
          result.beaconColor = brightenColor(baseColor, 0.02);
          result.size = Math.max(4.6, baseSize * idlePulse);
          result.zIndex = 2;
          result.forceLabel = baseSize >= 12.8;
        }
        return result;
      }

      if (hoveredNode) {
        if (isHoveredNeighbor) {
          result.beaconColor = baseColor;
          result.beaconState = 'neighbor';
          result.size = baseSize * 1.06 * (1 + Math.sin(pulsePhase) * 0.025);
          result.zIndex = 2;
          result.forceLabel = true;
        } else {
          result.beaconColor = dimColor(baseColor, 0.08);
          result.size = Math.max(4.2, baseSize * 0.84);
          result.zIndex = 1;
        }
        return result;
      }

      result.beaconColor = brightenColor(baseColor, 0.02);
      result.size = baseSize * idlePulse;
      result.zIndex = 2;
      return result;
    },
    [hoveredNeighbors, hoveredNode, selectedNeighbors, selectedNode],
  );

  const edgeReducer = useMemo(() => {
    if (!graph) {
      return null;
    }

    return (edge: string, data: SigmaEdgeAttributes) => {
      const result = { ...data } as Partial<SigmaEdgeAttributes>;
      const [source, target] = graph.extremities(edge);
      const baseColor = data.color || EDGE_COLORS.DEFAULT;
      const baseSize = data.size || 1;
      const touchesSelected =
        !!selectedNode && (source === selectedNode || target === selectedNode);
      const touchesHovered =
        !!hoveredNode && (source === hoveredNode || target === hoveredNode);

      if (selectedNode) {
        if (touchesSelected) {
          result.color = withAlpha(brightenColor(baseColor, 0.16), 0.92);
          result.size = Math.max(1.8, baseSize * 2.4);
          result.zIndex = 3;
        } else {
          result.color = withAlpha(dimColor(baseColor, 0.12), 0.26);
          result.size = Math.max(0.55, baseSize * 0.82);
          result.zIndex = 1;
        }
        return result;
      }

      if (hoveredNode) {
        if (touchesHovered) {
          result.color = withAlpha(baseColor, 0.78);
          result.size = Math.max(1.2, baseSize * 1.6);
          result.zIndex = 2;
        } else {
          result.color = withAlpha(dimColor(baseColor, 0.18), 0.24);
          result.size = Math.max(0.38, baseSize * 0.68);
          result.zIndex = 1;
        }
        return result;
      }

      result.color = withAlpha(baseColor, 0.34);
      result.size = Math.max(0.75, baseSize);
      result.zIndex = 1;
      return result;
    };
  }, [graph, hoveredNode, selectedNode]);

  useEffect(() => {
    const shell = shellRef.current;
    const canvas = particleCanvasRef.current;

    if (!shell || !canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    let frameId = 0;
    let width = 0;
    let heightPx = 0;
    let stars: Star[] = [];
    let shootingStars: ShootingStar[] = [];
    let lastTimestamp = 0;
    let lastMeteorAt = 0;

    const createStars = () => {
      const count = Math.max(
        160,
        Math.min(360, Math.floor((width * heightPx) / 5200)),
      );
      stars = Array.from({ length: count }, (_, index) => {
        const isBright = Math.random() > 0.76;
        return {
          x: Math.random() * width,
          y: Math.random() * heightPx,
          driftX: (Math.random() - 0.5) * (isBright ? 0.0015 : 0.0045),
          driftY: (Math.random() - 0.5) * (isBright ? 0.0015 : 0.004),
          radius: isBright
            ? 1 + Math.random() * 1.3
            : 0.35 + Math.random() * 0.9,
          alpha: isBright
            ? 0.54 + Math.random() * 0.34
            : 0.22 + Math.random() * 0.4,
          twinkleOffset: Math.random() * Math.PI * 2 + index * 0.12,
          twinkleSpeed: 0.0007 + Math.random() * 0.0024,
          glow: isBright ? 18 + Math.random() * 24 : 7 + Math.random() * 10,
          spike: isBright ? 0.75 + Math.random() * 0.9 : 0,
          color: STAR_COLORS[index % STAR_COLORS.length],
        };
      });
      shootingStars = [];
      lastTimestamp = 0;
      lastMeteorAt = 0;
    };

    const spawnShootingStar = () => {
      shootingStars.push({
        x: Math.random() * width * 0.72,
        y: Math.random() * heightPx * 0.32,
        vx: 10 + Math.random() * 8,
        vy: 3.2 + Math.random() * 2.4,
        length: 90 + Math.random() * 120,
        life: 0,
        maxLife: 560 + Math.random() * 420,
        opacity: 0.24 + Math.random() * 0.22,
      });
    };

    const resize = () => {
      const rect = shell.getBoundingClientRect();
      width = Math.max(rect.width, 1);
      heightPx = Math.max(rect.height, 1);

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(heightPx * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${heightPx}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      createStars();
    };

    const drawFrame = (timestamp: number) => {
      const delta =
        lastTimestamp === 0
          ? 16
          : Math.min(32, Math.max(12, timestamp - lastTimestamp));
      lastTimestamp = timestamp;
      context.clearRect(0, 0, width, heightPx);

      if (
        timestamp - lastMeteorAt > 3200 &&
        Math.random() > 0.987 &&
        shootingStars.length < 2
      ) {
        spawnShootingStar();
        lastMeteorAt = timestamp;
      }

      stars.forEach(star => {
        star.x += star.driftX * delta;
        star.y += star.driftY * delta;

        if (star.x < -18) star.x = width + 18;
        if (star.x > width + 18) star.x = -18;
        if (star.y < -18) star.y = heightPx + 18;
        if (star.y > heightPx + 18) star.y = -18;

        const twinkle =
          0.42 +
          ((Math.sin(timestamp * star.twinkleSpeed + star.twinkleOffset) + 1) /
            2) *
            0.92;
        const alpha = Math.min(1, star.alpha * twinkle);
        const glowRadius = star.radius * (1.2 + twinkle * 0.7);

        context.beginPath();
        context.arc(star.x, star.y, glowRadius, 0, Math.PI * 2);
        context.fillStyle = withAlpha(star.color, alpha * 0.08);
        context.shadowColor = withAlpha(star.color, alpha * 0.36);
        context.shadowBlur = star.glow;
        context.fill();

        context.beginPath();
        context.arc(
          star.x,
          star.y,
          Math.max(0.35, star.radius * (0.72 + twinkle * 0.22)),
          0,
          Math.PI * 2,
        );
        context.fillStyle = withAlpha(star.color, alpha);
        context.fill();

        if (star.spike > 0) {
          const flareLength = star.radius * (3.4 + twinkle * 1.8) * star.spike;
          context.beginPath();
          context.moveTo(star.x - flareLength, star.y);
          context.lineTo(star.x + flareLength, star.y);
          context.moveTo(star.x, star.y - flareLength * 0.85);
          context.lineTo(star.x, star.y + flareLength * 0.85);
          context.strokeStyle = withAlpha(star.color, alpha * 0.24);
          context.lineWidth = 0.8;
          context.stroke();
        }
      });

      context.shadowBlur = 0;

      shootingStars = shootingStars.filter(
        meteor => meteor.life < meteor.maxLife,
      );
      shootingStars.forEach(meteor => {
        meteor.life += delta;
        meteor.x += meteor.vx * (delta / 16);
        meteor.y += meteor.vy * (delta / 16);

        const progress = meteor.life / meteor.maxLife;
        const fade = Math.sin(progress * Math.PI);
        const tailX = meteor.x - meteor.length;
        const tailY = meteor.y - meteor.length * 0.34;
        const gradient = context.createLinearGradient(
          tailX,
          tailY,
          meteor.x,
          meteor.y,
        );

        gradient.addColorStop(0, withAlpha('#f8fafc', 0));
        gradient.addColorStop(
          0.55,
          withAlpha('#7dd3fc', meteor.opacity * 0.22 * fade),
        );
        gradient.addColorStop(1, withAlpha('#ffffff', meteor.opacity * fade));

        context.beginPath();
        context.moveTo(tailX, tailY);
        context.lineTo(meteor.x, meteor.y);
        context.strokeStyle = gradient;
        context.lineWidth = 1.2;
        context.stroke();

        context.beginPath();
        context.arc(meteor.x, meteor.y, 1.6 + fade * 0.8, 0, Math.PI * 2);
        context.fillStyle = withAlpha('#ffffff', meteor.opacity * fade);
        context.shadowColor = withAlpha('#7dd3fc', meteor.opacity * fade);
        context.shadowBlur = 14;
        context.fill();
      });

      for (let index = 0; index < stars.length; index += 1) {
        for (let next = index + 1; next < stars.length; next += 1) {
          const first = stars[index];
          const second = stars[next];
          const dx = first.x - second.x;
          const dy = first.y - second.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 96) {
            continue;
          }

          const alpha = (1 - distance / 96) * 0.028;
          context.beginPath();
          context.moveTo(first.x, first.y);
          context.lineTo(second.x, second.y);
          context.strokeStyle = withAlpha('#60a5fa', alpha);
          context.lineWidth = 0.45;
          context.stroke();
        }
      }

      frameId = requestAnimationFrame(drawFrame);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(shell);
    resize();
    frameId = requestAnimationFrame(drawFrame);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!graph) {
      return;
    }

    let disposed = false;
    let lastRefreshAt = 0;

    const animatePulse = (timestamp: number) => {
      if (disposed) {
        return;
      }

      pulsePhaseRef.current = timestamp * 0.0032;
      if (sigmaRef.current && timestamp - lastRefreshAt >= 48) {
        sigmaRef.current.refresh();
        lastRefreshAt = timestamp;
      }

      pulseFrameRef.current = requestAnimationFrame(animatePulse);
    };

    pulseFrameRef.current = requestAnimationFrame(animatePulse);

    return () => {
      disposed = true;
      if (pulseFrameRef.current) {
        cancelAnimationFrame(pulseFrameRef.current);
        pulseFrameRef.current = null;
      }
    };
  }, [graph]);

  useEffect(() => {
    if (!containerRef.current || !graph) {
      setLoading(false);
      return;
    }

    setLoading(true);

    if (sigmaRef.current) {
      sigmaRef.current.kill();
      sigmaRef.current = null;
    }

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    if (rect.height === 0 && minCanvasHeight > 0) {
      container.style.minHeight = `${minCanvasHeight}px`;
    }

    let fitTimer: ReturnType<typeof setTimeout> | null = null;
    let sigmaInstance: Sigma<SigmaNodeAttributes, SigmaEdgeAttributes> | null =
      null;
    let renderBeacons: (() => void) | null = null;
    let handleContainerDoubleClick: ((event: MouseEvent) => void) | null = null;

    try {
      const instance = new Sigma<SigmaNodeAttributes, SigmaEdgeAttributes>(
        graph,
        container,
        {
          allowInvalidContainer: true,
          renderLabels: true,
          renderEdgeLabels: false,
          labelFont: LABEL_FONT,
          labelSize: 11,
          labelWeight: '600',
          labelColor: { color: '#dbe7f5' },
          labelRenderedSizeThreshold: 11,
          labelDensity: 0.08,
          labelGridCellSize: 100,
          defaultDrawNodeLabel: drawSignalNodeLabel as any,
          defaultDrawNodeHover: drawSignalNodeHover as any,
          defaultNodeColor: NODE_COLORS.Document,
          defaultEdgeColor: EDGE_COLORS.DEFAULT,
          defaultEdgeType: 'curved',
          edgeProgramClasses: {
            curved: EdgeCurveProgram as any,
          },
          minCameraRatio: 0.03,
          maxCameraRatio: 12,
          hideEdgesOnMove: false,
          hideLabelsOnMove: false,
          stagePadding: 24,
          doubleClickTimeout: DOUBLE_CLICK_DELAY,
          doubleClickZoomingRatio: 1,
          doubleClickZoomingDuration: 0,
          minEdgeThickness: 1,
          zIndex: true,
          nodeReducer,
          edgeReducer,
        },
      );
      sigmaInstance = instance;

      const beaconCanvas = instance.createCanvas('beacons', {
        afterLayer: 'nodes',
        style: {
          pointerEvents: 'none',
        },
      });
      const beaconContext = beaconCanvas.getContext('2d');

      renderBeacons = () => {
        if (!beaconContext) {
          return;
        }

        const { width, height } = instance.getDimensions();
        const dpr = window.devicePixelRatio || 1;

        if (beaconCanvas.width !== Math.floor(width * dpr)) {
          beaconCanvas.width = Math.floor(width * dpr);
          beaconCanvas.height = Math.floor(height * dpr);
          beaconCanvas.style.width = `${width}px`;
          beaconCanvas.style.height = `${height}px`;
          beaconContext.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        beaconContext.clearRect(0, 0, width, height);

        graph.forEachNode(nodeId => {
          const data = instance.getNodeDisplayData(
            nodeId,
          ) as BeaconDisplayData | null;
          if (!data || data.hidden) {
            return;
          }

          const { x, y } = instance.framedGraphToViewport(data as any);
          const size = instance.scaleSize(data.size);

          if (x < -60 || x > width + 60 || y < -60 || y > height + 60) {
            return;
          }

          drawBeaconNode(
            beaconContext,
            x,
            y,
            size,
            data.beaconColor || data.color || NODE_COLORS.Unknown,
            data.beaconState || 'idle',
            data.nodeType || 'Unknown',
          );
        });
      };

      sigmaRef.current = instance;

      instance.on('clickNode', payload => {
        handleNodeClick(payload.node);
      });

      instance.on('doubleClickNode', payload => {
        payload.preventSigmaDefault();
        handleNodeDoubleClick(payload.node);
      });

      handleContainerDoubleClick = () => {
        const lastClick = lastNodeClickRef.current;
        if (!lastClick) {
          return;
        }

        if (
          performance.now() - lastClick.timestamp >
          DOUBLE_CLICK_DELAY + 160
        ) {
          return;
        }

        handleNodeDoubleClick(lastClick.nodeId);
      };
      container.addEventListener('dblclick', handleContainerDoubleClick);

      instance.on('clickStage', () => {
        if (clickTimeoutRef.current) {
          clearTimeout(clickTimeoutRef.current);
          clickTimeoutRef.current = null;
        }
        lastNodeClickRef.current = null;
        setSelectedNode(null);
      });

      instance.on('enterNode', ({ node }) => {
        setHoveredNode(node);
        onNodeHover?.(node);
        if (containerRef.current) {
          containerRef.current.style.cursor = 'pointer';
        }
      });

      instance.on('leaveNode', () => {
        setHoveredNode(null);
        onNodeHover?.(null);
        if (containerRef.current) {
          containerRef.current.style.cursor = 'grab';
        }
      });

      instance.on('afterRender', renderBeacons);
      instance.on('resize', renderBeacons);

      fitTimer = setTimeout(() => {
        instance.getCamera().animatedReset({ duration: 0 });
        renderBeacons?.();
      }, 120);

      setLoading(false);
    } catch (error) {
      console.error('Failed to initialize Sigma:', error);
      setLoading(false);
    }

    return () => {
      if (fitTimer) {
        clearTimeout(fitTimer);
      }
      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
        layoutTimeoutRef.current = null;
      }
      if (handleContainerDoubleClick) {
        container.removeEventListener('dblclick', handleContainerDoubleClick);
      }
      if (sigmaInstance && renderBeacons) {
        sigmaInstance.off('afterRender', renderBeacons);
        sigmaInstance.off('resize', renderBeacons);
      }
      if (sigmaRef.current) {
        sigmaRef.current.kill();
        sigmaRef.current = null;
      }
    };
  }, [
    graph,
    handleNodeClick,
    handleNodeDoubleClick,
    minCanvasHeight,
    onNodeHover,
  ]);

  useEffect(() => {
    if (!sigmaRef.current) {
      return;
    }

    sigmaRef.current.setSetting('nodeReducer', nodeReducer);
    sigmaRef.current.setSetting('edgeReducer', edgeReducer);
    sigmaRef.current.refresh();
  }, [edgeReducer, nodeReducer]);

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
    };
  }, []);

  const handleZoomIn = () =>
    sigmaRef.current?.getCamera().animatedZoom({ duration: 220 });
  const handleZoomOut = () =>
    sigmaRef.current?.getCamera().animatedUnzoom({ duration: 220 });
  const handleResetZoom = () => {
    sigmaRef.current?.getCamera().animatedReset({ duration: 320 });
    setSelectedNode(null);
  };

  const handleToggleLayout = () => {
    if (!graph || !sigmaRef.current) {
      return;
    }

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
      settings: {
        ratio: 1.1,
        margin: 10,
      },
    });

    sigmaRef.current.refresh();

    layoutTimeoutRef.current = setTimeout(() => {
      setIsLayoutRunning(false);
      layoutTimeoutRef.current = null;
    }, 1000);
  };

  return (
    <>
      <Box
        ref={shellRef}
        sx={{
          position: 'relative',
          width: '100%',
          height,
          minHeight: minCanvasHeight,
          overflow: 'hidden',
          borderRadius: 3,
          border: '1px solid rgba(125, 211, 252, 0.12)',
          background: `
          radial-gradient(circle at 20% 16%, rgba(56, 189, 248, 0.12), transparent 24%),
          radial-gradient(circle at 84% 12%, rgba(196, 181, 253, 0.1), transparent 20%),
          radial-gradient(circle at 72% 78%, rgba(255, 255, 255, 0.04), transparent 18%),
          linear-gradient(145deg, #000000 0%, #020409 46%, #06080d 100%)
        `,
          boxShadow: '0 28px 72px rgba(0, 0, 0, 0.56)',
        }}
      >
        <canvas
          ref={particleCanvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
            background: `
            radial-gradient(circle at 8% 16%, rgba(255, 255, 255, 0.18) 0 1px, transparent 2px),
            radial-gradient(circle at 12% 62%, rgba(219, 234, 254, 0.16) 0 1.1px, transparent 2.2px),
            radial-gradient(circle at 21% 34%, rgba(191, 219, 254, 0.16) 0 1px, transparent 2px),
            radial-gradient(circle at 28% 82%, rgba(255, 255, 255, 0.14) 0 1px, transparent 2px),
            radial-gradient(circle at 36% 14%, rgba(196, 181, 253, 0.16) 0 1.1px, transparent 2.3px),
            radial-gradient(circle at 44% 58%, rgba(248, 250, 252, 0.16) 0 1px, transparent 2px),
            radial-gradient(circle at 56% 22%, rgba(219, 234, 254, 0.14) 0 1px, transparent 2px),
            radial-gradient(circle at 63% 74%, rgba(255, 255, 255, 0.15) 0 1px, transparent 2px),
            radial-gradient(circle at 72% 28%, rgba(196, 181, 253, 0.15) 0 1.1px, transparent 2.2px),
            radial-gradient(circle at 79% 12%, rgba(248, 250, 252, 0.18) 0 1px, transparent 2px),
            radial-gradient(circle at 84% 64%, rgba(191, 219, 254, 0.14) 0 1px, transparent 2px),
            radial-gradient(circle at 92% 42%, rgba(255, 255, 255, 0.15) 0 1px, transparent 2px),
            radial-gradient(circle at 88% 84%, rgba(248, 250, 252, 0.14) 0 1px, transparent 2px)
          `,
            opacity: 0.98,
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
            background:
              'radial-gradient(circle at center, transparent 40%, rgba(0, 0, 0, 0.3) 72%, rgba(0, 0, 0, 0.72) 100%)',
          }}
        />

        {loading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(4, 10, 20, 0.42)',
              backdropFilter: 'blur(6px)',
            }}
          >
            <CircularProgress sx={{ color: '#7dd3fc' }} />
          </Box>
        )}

        <div
          ref={containerRef}
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            height: '100%',
            minHeight: minCanvasHeight ? `${minCanvasHeight}px` : '0',
            cursor: 'grab',
          }}
        />

        {!loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              zIndex: 4,
              px: 1.6,
              py: 1.1,
              borderRadius: 2.5,
              border: '1px solid rgba(125, 211, 252, 0.18)',
              background:
                'linear-gradient(180deg, rgba(6, 12, 24, 0.82), rgba(8, 14, 26, 0.64))',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 18px 36px rgba(2, 6, 23, 0.28)',
              maxWidth: { xs: 'calc(100% - 110px)', md: 340 },
            }}
          >
            <Typography
              sx={{
                color: '#7dd3fc',
                fontFamily: UI_FONT,
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
              }}
            >
              2D Starfield
            </Typography>
            <Typography
              sx={{
                mt: 0.35,
                color: 'rgba(226, 232, 240, 0.8)',
                fontFamily: UI_FONT,
                fontSize: 12,
                lineHeight: 1.45,
              }}
            >
              Hover to scan. Click to pin. Double-click to inspect.
            </Typography>
            {graph && (
              <Typography
                sx={{
                  mt: 0.45,
                  color: 'rgba(226, 232, 240, 0.56)',
                  fontFamily: LABEL_FONT,
                  fontSize: 11,
                }}
              >
                {graph.order} nodes · {graph.size} traces
              </Typography>
            )}
          </Box>
        )}

        {selectedMeta && (
          <Box
            sx={{
              position: 'absolute',
              top: 84,
              left: 16,
              zIndex: 4,
              px: 1.5,
              py: 0.95,
              borderRadius: 2.5,
              border: `1px solid ${withAlpha(selectedMeta.color, 0.24)}`,
              background:
                'linear-gradient(180deg, rgba(8, 14, 26, 0.84), rgba(8, 14, 26, 0.62))',
              backdropFilter: 'blur(16px)',
              boxShadow: `0 18px 36px ${withAlpha(selectedMeta.color, 0.14)}`,
              maxWidth: { xs: 'calc(100% - 110px)', md: 360 },
            }}
          >
            <Typography
              sx={{
                color: withAlpha(selectedMeta.color, 0.9),
                fontFamily: LABEL_FONT,
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
              }}
            >
              Focus Lock · {getEntityTypeLabel(selectedMeta.nodeType)}
            </Typography>
            <Typography
              sx={{
                mt: 0.35,
                color: '#f8fafc',
                fontFamily: UI_FONT,
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {selectedMeta.label}
            </Typography>
          </Box>
        )}

        {!loading && (
          <Stack
            spacing={1}
            sx={{ position: 'absolute', right: 16, bottom: 16, zIndex: 4 }}
          >
            <Tooltip title='放大' placement='left'>
              <IconButton
                onClick={handleZoomIn}
                sx={{
                  width: 40,
                  height: 40,
                  color: '#f8fafc',
                  border: '1px solid rgba(125, 211, 252, 0.2)',
                  background:
                    'linear-gradient(180deg, rgba(8, 14, 26, 0.92), rgba(8, 14, 26, 0.68))',
                  backdropFilter: 'blur(16px)',
                  '&:hover': {
                    background:
                      'linear-gradient(180deg, rgba(16, 24, 39, 0.98), rgba(8, 14, 26, 0.8))',
                  },
                }}
              >
                <ZoomIn fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='缩小' placement='left'>
              <IconButton
                onClick={handleZoomOut}
                sx={{
                  width: 40,
                  height: 40,
                  color: '#f8fafc',
                  border: '1px solid rgba(125, 211, 252, 0.2)',
                  background:
                    'linear-gradient(180deg, rgba(8, 14, 26, 0.92), rgba(8, 14, 26, 0.68))',
                  backdropFilter: 'blur(16px)',
                  '&:hover': {
                    background:
                      'linear-gradient(180deg, rgba(16, 24, 39, 0.98), rgba(8, 14, 26, 0.8))',
                  },
                }}
              >
                <ZoomOut fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='重置视图' placement='left'>
              <IconButton
                onClick={handleResetZoom}
                sx={{
                  width: 40,
                  height: 40,
                  color: '#f8fafc',
                  border: '1px solid rgba(125, 211, 252, 0.2)',
                  background:
                    'linear-gradient(180deg, rgba(8, 14, 26, 0.92), rgba(8, 14, 26, 0.68))',
                  backdropFilter: 'blur(16px)',
                  '&:hover': {
                    background:
                      'linear-gradient(180deg, rgba(16, 24, 39, 0.98), rgba(8, 14, 26, 0.8))',
                  },
                }}
              >
                <CenterFocusStrong fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip
              title={isLayoutRunning ? '停止布局' : '优化布局'}
              placement='left'
            >
              <IconButton
                onClick={handleToggleLayout}
                sx={{
                  width: 40,
                  height: 40,
                  color: isLayoutRunning ? '#34d399' : '#f8fafc',
                  border: `1px solid ${
                    isLayoutRunning
                      ? 'rgba(52, 211, 153, 0.28)'
                      : 'rgba(125, 211, 252, 0.2)'
                  }`,
                  background: isLayoutRunning
                    ? 'linear-gradient(180deg, rgba(8, 32, 24, 0.92), rgba(8, 22, 18, 0.7))'
                    : 'linear-gradient(180deg, rgba(8, 14, 26, 0.92), rgba(8, 14, 26, 0.68))',
                  backdropFilter: 'blur(16px)',
                }}
              >
                {isLayoutRunning ? (
                  <Pause fontSize='small' />
                ) : (
                  <PlayArrow fontSize='small' />
                )}
              </IconButton>
            </Tooltip>
          </Stack>
        )}

        {isLayoutRunning && (
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              bottom: 18,
              transform: 'translateX(-50%)',
              zIndex: 4,
              px: 1.4,
              py: 0.85,
              borderRadius: 999,
              border: '1px solid rgba(52, 211, 153, 0.24)',
              background:
                'linear-gradient(180deg, rgba(8, 24, 18, 0.86), rgba(8, 18, 15, 0.66))',
              backdropFilter: 'blur(16px)',
            }}
          >
            <Stack direction='row' spacing={1} alignItems='center'>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#34d399',
                  boxShadow: '0 0 14px rgba(52, 211, 153, 0.52)',
                  animation: 'scanPulse 1.2s ease-in-out infinite',
                  '@keyframes scanPulse': {
                    '0%, 100%': { opacity: 0.45, transform: 'scale(0.9)' },
                    '50%': { opacity: 1, transform: 'scale(1.2)' },
                  },
                }}
              />
              <Typography
                sx={{
                  color: '#d1fae5',
                  fontFamily: LABEL_FONT,
                  fontSize: 11.5,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                Relayout
              </Typography>
            </Stack>
          </Box>
        )}
      </Box>
      <DocumentPreviewDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        nodeData={selectedNodeData}
        onNavigate={handleNavigateToDocument}
      />
    </>
  );
}
