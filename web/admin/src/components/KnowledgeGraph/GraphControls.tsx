// 图谱控制面板组件
import { Box, IconButton, Tooltip, Stack } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import RefreshIcon from '@mui/icons-material/Refresh';

interface GraphControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetView?: () => void;
  onRefresh?: () => void;
}

export default function GraphControls({
  onZoomIn,
  onZoomOut,
  onResetView,
  onRefresh,
}: GraphControlsProps) {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        bgcolor: 'background.paper',
        borderRadius: 1,
        boxShadow: 2,
      }}
    >
      <Stack direction='column' spacing={0.5} sx={{ p: 0.5 }}>
        <Tooltip title='放大' placement='left'>
          <IconButton size='small' onClick={onZoomIn}>
            <ZoomInIcon fontSize='small' />
          </IconButton>
        </Tooltip>

        <Tooltip title='缩小' placement='left'>
          <IconButton size='small' onClick={onZoomOut}>
            <ZoomOutIcon fontSize='small' />
          </IconButton>
        </Tooltip>

        <Tooltip title='重置视图' placement='left'>
          <IconButton size='small' onClick={onResetView}>
            <CenterFocusStrongIcon fontSize='small' />
          </IconButton>
        </Tooltip>

        <Tooltip title='刷新' placement='left'>
          <IconButton size='small' onClick={onRefresh}>
            <RefreshIcon fontSize='small' />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
}
