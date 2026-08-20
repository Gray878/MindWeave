import { getApiV1KnowledgeBaseDetail } from '@/request/KnowledgeBase';
import { useAppSelector, useAppDispatch } from '@/store';
import { setKbDetail } from '@/store/slices/config';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Button, IconButton, Stack, Tooltip, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { message, Modal } from '@ctzhian/ui';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Bread from './Bread';
import { IconDengchu } from '@panda-wiki/icons';
import { SIDEBAR_LAYOUT_OFFSET } from '../Sidebar';

const Header = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { kb_id } = useAppSelector(state => state.config);
  const dispatch = useAppDispatch();
  const [wikiUrl, setWikiUrl] = useState<string>('');
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  useEffect(() => {
    if (kb_id) {
      getApiV1KnowledgeBaseDetail({ id: kb_id }).then(res => {
        dispatch(setKbDetail(res));
        if (res.access_settings?.base_url) {
          setWikiUrl(res.access_settings.base_url);
        } else {
          let defaultUrl: string = '';
          const host = res.access_settings?.hosts?.[0] || '';
          if (!host) return;

          if (
            res.access_settings?.ssl_ports &&
            res.access_settings?.ssl_ports.length > 0
          ) {
            defaultUrl = res.access_settings.ssl_ports.includes(443)
              ? `https://${host}`
              : `https://${host}:${res.access_settings.ssl_ports[0]}`;
          } else if (
            res.access_settings?.ports &&
            res.access_settings?.ports.length > 0
          ) {
            defaultUrl = res.access_settings.ports.includes(80)
              ? `http://${host}`
              : `http://${host}:${res.access_settings.ports[0]}`;
          }
          setWikiUrl(defaultUrl);
        }
      });
    }
  }, [kb_id, dispatch]);

  return (
    <Stack
      direction='row'
      alignItems='center'
      justifyContent='space-between'
      sx={{
        minWidth: '900px',
        position: 'fixed',
        top: 16,
        left: SIDEBAR_LAYOUT_OFFSET,
        right: 16,
        px: 2.5,
        py: 1.5,
        minHeight: 68,
        zIndex: 998,
        borderRadius: '18px',
        border: `1px solid ${alpha(theme.palette.common.black, 0.08)}`,
        bgcolor: alpha(theme.palette.common.white, 0.88),
        boxShadow: '0px 18px 36px rgba(18, 24, 40, 0.05)',
        backdropFilter: 'blur(14px)',
      }}
    >
      <Bread />
      <Stack direction='row' alignItems='center' gap={1.25}>
        <Button
          size='small'
          variant='outlined'
          onClick={() => {
            if (wikiUrl) {
              window.open(wikiUrl, '_blank');
            }
          }}
          sx={{
            height: 38,
            px: 2,
            borderRadius: '12px',
            borderColor: alpha(theme.palette.common.black, 0.1),
            bgcolor: '#FFFFFF',
            color: 'text.primary',
            fontWeight: 600,
            transition:
              'border-color 180ms ease, background-color 180ms ease, transform 180ms ease',
            '&:hover': {
              borderColor: alpha(theme.palette.primary.main, 0.28),
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              transform: 'translateY(-1px)',
            },
          }}
        >
          {'\u8bbf\u95ee\u77e5\u8bc6\u5e93'}
        </Button>
        <Tooltip arrow title={'\u9000\u51fa\u767b\u5f55'}>
          <IconButton
            size='small'
            sx={{
              bgcolor: '#FFFFFF',
              width: 38,
              height: 38,
              border: `1px solid ${alpha(theme.palette.common.black, 0.1)}`,
              borderRadius: '12px',
              transition:
                'border-color 180ms ease, background-color 180ms ease, transform 180ms ease',
              '&:hover': {
                color: 'primary.main',
                borderColor: alpha(theme.palette.primary.main, 0.28),
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                transform: 'translateY(-1px)',
              },
            }}
            onClick={() => {
              setLogoutConfirmOpen(true);
            }}
          >
            <IconDengchu sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Stack>
      <Modal
        open={logoutConfirmOpen}
        onCancel={() => setLogoutConfirmOpen(false)}
        onOk={() => {
          message.success(
            '\u9000\u51fa\u767b\u5f55\u6210\u529f\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55',
          );
          setTimeout(() => {
            localStorage.removeItem('panda_wiki_token');
            navigate('/login');
          }, 1500);
        }}
        cancelButtonProps={{
          variant: 'outlined',
          sx: { '&:hover': { borderColor: 'grey.300' } },
        }}
        okButtonProps={{
          variant: 'contained',
          sx: {
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' },
          },
        }}
        title={
          <Stack direction='column' gap={3}>
            <Stack direction='row' alignItems='center' gap={1}>
              <ErrorOutlineIcon sx={{ color: 'error.main', fontSize: 24 }} />
              <span style={{ fontWeight: 'bold' }}>
                {'\u786e\u5b9a\u8981\u9000\u51fa\u5f53\u524d\u8d26\u53f7\uff1f'}
              </span>
            </Stack>
          </Stack>
        }
        transitionDuration={300}
      />
    </Stack>
  );
};

export default Header;
