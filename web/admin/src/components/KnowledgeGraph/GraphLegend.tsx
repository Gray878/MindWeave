// 图谱图例组件
import { Box, Typography, Stack, Chip } from '@mui/material';
import { NODE_COLORS, ENTITY_TYPE_LABELS } from '../../constant/graph';

interface GraphLegendProps {
  nodeTypes?: string[];
}

export default function GraphLegend({ nodeTypes }: GraphLegendProps) {
  // 如果没有指定节点类型，显示所有类型
  const displayTypes = nodeTypes || Object.keys(NODE_COLORS);

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        zIndex: 10,
        bgcolor: 'background.paper',
        borderRadius: 1,
        boxShadow: 2,
        p: 2,
        maxWidth: 300,
      }}
    >
      <Typography variant='subtitle2' gutterBottom>
        节点类型
      </Typography>
      <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
        {displayTypes.map(type => (
          <Chip
            key={type}
            label={ENTITY_TYPE_LABELS[type] || type}
            size='small'
            sx={{
              bgcolor: NODE_COLORS[type] || NODE_COLORS.Unknown,
              color: 'white',
              fontWeight: 500,
              mb: 0.5,
            }}
          />
        ))}
      </Stack>
    </Box>
  );
}
