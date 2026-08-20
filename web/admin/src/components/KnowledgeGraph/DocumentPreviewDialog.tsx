import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Editor, useTiptap } from '@ctzhian/tiptap';
import {
  ArrowOutward,
  CalendarTodayOutlined,
  Close,
  DescriptionOutlined,
  EditOutlined,
  Fingerprint,
  NotesOutlined,
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import dayjs from 'dayjs';
import MarkDown from '@/components/MarkDown';
import { getApiV1NodeDetail } from '@/request/Node';
import type { V1NodeDetailResp } from '@/request/types';
import { useAppSelector } from '@/store';

interface PreviewNodeData {
  id: string;
  name: string;
  type: string;
  properties?: Record<string, any>;
}

interface DocumentPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  nodeData: PreviewNodeData | null;
  onNavigate?: (nodeId: string) => void;
}

function MetaCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <Box
      sx={theme => ({
        minWidth: 0,
        flex: '1 1 180px',
        borderRadius: 2,
        p: 1.5,
        bgcolor: alpha(theme.palette.common.white, 0.72),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
      })}
    >
      <Stack direction='row' spacing={1.25} alignItems='flex-start'>
        <Box sx={{ color: 'primary.main', display: 'flex', mt: 0.2 }}>
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant='caption'
            sx={{ color: 'text.tertiary', display: 'block' }}
          >
            {label}
          </Typography>
          <Typography
            variant='body2'
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              wordBreak: 'break-all',
            }}
          >
            {value}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

export default function DocumentPreviewDialog({
  open,
  onClose,
  nodeData,
  onNavigate,
}: DocumentPreviewDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { kb_id, kbDetail } = useAppSelector(state => state.config);
  const [detail, setDetail] = useState<V1NodeDetailResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewEditor = useTiptap({
    content: '',
    editable: false,
    immediatelyRender: true,
    baseUrl: window.__BASENAME__ || '',
  });

  const isDocument = nodeData?.type === 'Document';
  const resolvedKbId =
    kb_id ||
    kbDetail.id ||
    nodeData?.properties?.kb_id ||
    localStorage.getItem('kb_id') ||
    '';

  const propertyEntries = useMemo(
    () =>
      Object.entries(nodeData?.properties || {}).filter(
        ([, value]) => value !== undefined && value !== null && value !== '',
      ),
    [nodeData?.properties],
  );

  useEffect(() => {
    if (!open || !nodeData || !isDocument) {
      setDetail(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (!resolvedKbId) {
      setDetail(null);
      setError('未获取到当前知识库 ID，暂时无法加载文档内容。');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetail(null);

    getApiV1NodeDetail({
      id: nodeData.id,
      kb_id: resolvedKbId,
    })
      .then(res => {
        if (!cancelled) {
          setDetail(res);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err?.message || '加载文档详情失败。');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isDocument, nodeData, open, resolvedKbId]);

  useEffect(() => {
    if (!detail || detail.meta?.content_type === 'md') {
      previewEditor.setContent('');
      return;
    }

    previewEditor.setContent(detail.content || '');
  }, [detail?.content, detail?.id, detail?.meta?.content_type]);

  if (!nodeData) return null;

  const handleNavigate = () => {
    if (isDocument) {
      onNavigate?.(nodeData.id);
    }
    onClose();
  };

  const contentTypeLabel =
    detail?.meta?.content_type === 'md' ? 'Markdown' : '富文本';
  const summary =
    detail?.meta?.summary || nodeData.properties?.summary || '暂无摘要';
  const updatedAt = detail?.updated_at
    ? dayjs(detail.updated_at).format('YYYY-MM-DD HH:mm:ss')
    : '未知';
  const editorName =
    detail?.editor_account || detail?.creator_account || '未知';

  const renderPreview = () => {
    if (!isDocument) {
      return (
        <Alert severity='info'>
          当前节点不是文档节点，暂不支持文档内容预览。
        </Alert>
      );
    }

    if (loading) {
      return (
        <Stack
          alignItems='center'
          justifyContent='center'
          spacing={2}
          sx={{ minHeight: 320 }}
        >
          <CircularProgress size={28} />
          <Typography variant='body2' color='text.secondary'>
            正在加载文档内容...
          </Typography>
        </Stack>
      );
    }

    if (error) {
      return <Alert severity='error'>{error}</Alert>;
    }

    if (!detail) {
      return <Alert severity='info'>未获取到文档详情。</Alert>;
    }

    if (!detail.content) {
      return (
        <Box
          sx={{
            minHeight: 240,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary',
          }}
        >
          暂无文档内容
        </Box>
      );
    }

    if (detail.meta?.content_type === 'md') {
      return (
        <Box
          sx={{
            '.markdown-body': {
              fontSize: 14,
              lineHeight: 1.8,
            },
            img: {
              maxWidth: '100%',
            },
          }}
        >
          <MarkDown content={detail.content} />
        </Box>
      );
    }

    return (
      <Box
        sx={{
          '.tiptap.ProseMirror': {
            minHeight: 0,
          },
          '.tableWrapper': {
            maxWidth: '100%',
            overflowX: 'auto',
          },
        }}
      >
        <Editor editor={previewEditor.editor} />
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth='lg'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 3,
          background:
            'linear-gradient(180deg, rgba(248,250,252,0.98) 0%, rgba(255,255,255,0.98) 100%)',
          minHeight: fullScreen ? '100vh' : '78vh',
        },
      }}
    >
      <DialogTitle sx={{ px: 3, py: 2.5 }}>
        <Stack direction='row' spacing={2} alignItems='flex-start'>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              flexShrink: 0,
            }}
          >
            <DescriptionOutlined />
          </Box>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack
              direction='row'
              alignItems='center'
              spacing={1}
              sx={{ mb: 0.75, flexWrap: 'wrap' }}
            >
              <Typography
                variant='h6'
                sx={{
                  fontWeight: 700,
                  color: 'text.primary',
                  wordBreak: 'break-word',
                }}
              >
                {detail?.name || nodeData.name}
              </Typography>
              <Chip
                label={nodeData.type}
                size='small'
                color='primary'
                variant='outlined'
              />
              {isDocument && (
                <Chip
                  label={contentTypeLabel}
                  size='small'
                  color={
                    detail?.meta?.content_type === 'md' ? 'warning' : 'info'
                  }
                />
              )}
            </Stack>
          </Box>

          <Stack direction='row' spacing={1} alignItems='center'>
            {isDocument && (
              <Button
                variant='contained'
                onClick={handleNavigate}
                endIcon={<ArrowOutward />}
              >
                打开文档页
              </Button>
            )}
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Stack>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ px: 3, py: 3 }}>
        <Stack spacing={2.5}>
          <Stack direction='row' spacing={1.5} useFlexGap flexWrap='wrap'>
            <MetaCard
              icon={<Fingerprint fontSize='small' />}
              label='节点 ID'
              value={detail?.id || nodeData.id}
            />
            <MetaCard
              icon={<EditOutlined fontSize='small' />}
              label='最近编辑'
              value={editorName}
            />
            <MetaCard
              icon={<CalendarTodayOutlined fontSize='small' />}
              label='更新时间'
              value={updatedAt}
            />
            <MetaCard
              icon={<NotesOutlined fontSize='small' />}
              label='内容格式'
              value={contentTypeLabel}
            />
          </Stack>

          {propertyEntries.length > 0 && (
            <Box
              sx={{
                borderRadius: 2.5,
                p: 2,
                bgcolor: alpha(theme.palette.common.black, 0.02),
                border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
              }}
            >
              <Typography
                variant='subtitle2'
                sx={{ fontWeight: 700, color: 'text.primary', mb: 1.5 }}
              >
                图谱节点属性
              </Typography>
              <Stack direction='row' spacing={1} useFlexGap flexWrap='wrap'>
                {propertyEntries.map(([key, value]) => (
                  <Chip
                    key={key}
                    label={`${key}: ${String(value)}`}
                    size='small'
                    variant='outlined'
                    sx={{ maxWidth: '100%' }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          <Box
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
              bgcolor: 'background.paper',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                bgcolor: alpha(theme.palette.common.black, 0.02),
              }}
            >
              <Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
                文档内容预览
              </Typography>
            </Box>
            <Box
              sx={{
                px: { xs: 2, md: 3 },
                py: 2.5,
                maxHeight: fullScreen ? 'none' : '48vh',
                overflow: 'auto',
                wordBreak: 'break-word',
              }}
            >
              {renderPreview()}
            </Box>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2.5 }}>
        <Button onClick={onClose} variant='outlined' color='inherit'>
          关闭
        </Button>
        {isDocument && (
          <Button onClick={handleNavigate} variant='contained'>
            进入完整文档
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
