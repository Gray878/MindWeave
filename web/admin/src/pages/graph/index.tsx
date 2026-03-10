import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  AccountTree,
  Hub,
  Description,
  Category,
  ViewInAr,
  GridOn,
} from '@mui/icons-material';
import { useAppSelector } from '../../store';
import GraphCanvas from '../../components/KnowledgeGraph/GraphCanvas';
import Graph3DCanvas from '../../components/KnowledgeGraph/Graph3DCanvas';
import { getGraphStats, getAllGraph } from '../../request/Graph';
import { neo4jToGraphology } from '../../lib/graph-adapter';
import type Graph from 'graphology';
import type {
  SigmaNodeAttributes,
  SigmaEdgeAttributes,
  GraphDataResponse,
} from '../../types/graph';

const GRAPH_PAGE_HEIGHT = 'calc(100vh - 64px)';

function StatItem({ icon, label, value, color }: any) {
  return (
    <Stack direction='row' spacing={0.6} alignItems='center'>
      <Box sx={{ color, display: 'flex', fontSize: 14 }}>{icon}</Box>
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
        {label}:
      </Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>
        {value || 0}
      </Typography>
    </Stack>
  );
}

export default function GraphOverview() {
  const [graph, setGraph] = useState<Graph<
    SigmaNodeAttributes,
    SigmaEdgeAttributes
  > | null>(null);
  const [graphData, setGraphData] = useState<GraphDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');
  const { kbDetail } = useAppSelector(state => state.config);

  const loadGraphData = async () => {
    setLoading(true);
    setError(null);
    try {
      const statsData = await getGraphStats({ kb_id: kbDetail.id! });
      if (statsData) setStats(statsData);
      const data = await getAllGraph({ kb_id: kbDetail.id!, limit: 1000 });
      if (data?.nodes && data?.edges) {
        setGraphData(data);
        setGraph(neo4jToGraphology(data));
      }
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (kbDetail.id) loadGraphData();
  }, [kbDetail.id]);

  const handleViewModeChange = (_: any, newMode: '2d' | '3d' | null) => {
    if (newMode) setViewMode(newMode);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: GRAPH_PAGE_HEIGHT,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='error'>{error}</Alert>
      </Box>
    );
  }

  if (!stats || stats.total_nodes === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: GRAPH_PAGE_HEIGHT,
        }}
      >
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <AccountTree sx={{ fontSize: 64, color: '#9ca3af', mb: 2 }} />
          <Typography variant='h6'>暂无图谱数据</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: GRAPH_PAGE_HEIGHT,
        height: GRAPH_PAGE_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Paper
        sx={{
          mx: 2,
          mt: 0.5,
          mb: 1,
          px: 1.25,
          py: 0.75,
          borderRadius: 1.5,
        }}
        elevation={0}
      >
        <Stack
          direction='row'
          spacing={2}
          alignItems='center'
          justifyContent='space-between'
        >
          <Stack direction='row' spacing={2} alignItems='center'>
            <StatItem
              icon={<Hub />}
              label='节点'
              value={stats.total_nodes}
              color='#6366f1'
            />
            <StatItem
              icon={<Hub />}
              label='关系'
              value={stats.total_edges}
              color='#10b981'
            />
            <StatItem
              icon={<Description />}
              label='文档'
              value={stats.document_count}
              color='#f59e0b'
            />
            <StatItem
              icon={<Category />}
              label='实体'
              value={stats.entity_count}
              color='#ec4899'
            />
            <StatItem
              icon={<Hub />}
              label='平均连接'
              value={stats.avg_connections?.toFixed(1)}
              color='#8b5cf6'
            />
          </Stack>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size='small'
            sx={{ bgcolor: 'background.paper' }}
          >
            <ToggleButton value='2d' sx={{ px: 1.5, py: 0.25 }}>
              <GridOn sx={{ mr: 0.5, fontSize: 16 }} />
              2D
            </ToggleButton>
            <ToggleButton value='3d' sx={{ px: 1.5, py: 0.25 }}>
              <ViewInAr sx={{ mr: 0.5, fontSize: 16 }} />
              3D
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Paper>
      <Box sx={{ flex: 1, mx: 2, mt: 0, mb: 1.5, minHeight: 0 }}>
        {viewMode === '2d' && graph && (
          <GraphCanvas graph={graph} height='100%' />
        )}
        {viewMode === '3d' && graphData && (
          <Graph3DCanvas data={graphData} height='100%' />
        )}
      </Box>
    </Box>
  );
}
