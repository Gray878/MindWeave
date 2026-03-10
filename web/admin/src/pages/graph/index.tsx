import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Stack,
} from '@mui/material';
import { AccountTree, Hub, Description, Category } from '@mui/icons-material';
import { useAppSelector } from '../../store';
import GraphCanvas from '../../components/KnowledgeGraph/GraphCanvas';
import { getGraphStats, getAllGraph } from '../../request/Graph';
import { neo4jToGraphology } from '../../lib/graph-adapter';
import type Graph from 'graphology';
import type {
  SigmaNodeAttributes,
  SigmaEdgeAttributes,
} from '../../types/graph';

function StatItem({ icon, label, value, color }: any) {
  return (
    <Stack direction='row' spacing={1.5} alignItems='center'>
      <Box sx={{ color, display: 'flex' }}>{icon}</Box>
      <Box>
        <Typography variant='caption' color='text.secondary'>
          {label}
        </Typography>
        <Typography variant='h6' fontWeight='600'>
          {value || 0}
        </Typography>
      </Box>
    </Stack>
  );
}

export default function GraphOverview() {
  const [graph, setGraph] = useState<Graph<
    SigmaNodeAttributes,
    SigmaEdgeAttributes
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const { kbDetail } = useAppSelector(state => state.config);

  const loadGraphData = async () => {
    setLoading(true);
    setError(null);
    try {
      const statsData = await getGraphStats({ kb_id: kbDetail.id! });
      if (statsData) setStats(statsData);
      const graphData = await getAllGraph({ kb_id: kbDetail.id!, limit: 1000 });
      if (graphData?.nodes && graphData?.edges) {
        setGraph(neo4jToGraphology(graphData));
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

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error)
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='error'>{error}</Alert>
      </Box>
    );

  if (!stats || stats.total_nodes === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ m: 2, p: 2 }} elevation={0}>
        <Stack direction='row' spacing={4} flexWrap='wrap'>
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
      </Paper>
      <Box sx={{ flex: 1, m: 2, mt: 0 }}>
        {graph && <GraphCanvas graph={graph} height='100%' />}
      </Box>
    </Box>
  );
}
