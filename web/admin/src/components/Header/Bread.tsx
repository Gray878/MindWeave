import { useAppSelector } from '@/store';
import { Box, Stack, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import KBSelect from '../KB/KBSelect';

const HomeBread = { title: '\u7edf\u8ba1', to: '/stat' };
const OtherBread = {
  document: { title: '\u6587\u6863', to: '/document' },
  stat: { title: '\u7edf\u8ba1', to: '/stat' },
  conversation: { title: '\u95ee\u7b54', to: '/conversation' },
  feedback: { title: '\u53cd\u9988', to: '/feedback' },
  setting: { title: '\u8bbe\u7f6e', to: '/setting' },
  system: { title: '\u914d\u7f6e', to: '/system' },
  release: { title: '\u53d1\u5e03', to: '/release' },
  contribution: { title: '\u8d21\u732e', to: '/contribution' },
};

const Bread = () => {
  const theme = useTheme();
  const { pathname } = useLocation();
  const [breads, setBreads] = useState<{ title: string; to: string }[]>([]);
  const { pageName } = useAppSelector(state => state.breadcrumb);

  useEffect(() => {
    const curBreads: { title: string; to: string }[] = [];
    if (pathname === '/') {
      curBreads.push(HomeBread);
    } else {
      const pieces = pathname.split('/').filter(it => it !== '');
      pieces.forEach(it => {
        const bread = OtherBread[it as keyof typeof OtherBread];
        if (bread) {
          curBreads.push(bread);
        }
      });
    }
    if (pageName) {
      curBreads.push({ title: pageName, to: 'custom' });
    }
    setBreads(curBreads);
  }, [pathname, pageName]);

  return (
    <Stack
      direction='row'
      alignItems='center'
      gap={1.25}
      sx={{
        flexGrow: 1,
        minWidth: 0,
        color: 'text.tertiary',
        fontSize: '14px',
        a: { color: 'inherit', textDecoration: 'none' },
        lineHeight: '22px',
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          maxWidth: 320,
          minWidth: 0,
          '& .MuiInputBase-root': {
            minHeight: 40,
            bgcolor: '#FFFFFF',
            borderRadius: '14px !important',
            border: `1px solid ${alpha(theme.palette.common.black, 0.08)}`,
            boxShadow: '0px 1px 2px rgba(18, 24, 40, 0.03)',
            transition: 'border-color 180ms ease, transform 180ms ease',
          },
          '& .MuiInputBase-root:hover': {
            borderColor: alpha(theme.palette.primary.main, 0.2),
            transform: 'translateY(-1px)',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            border: 'none !important',
          },
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            pr: '34px !important',
          },
          '& .icon-xiala': {
            color: theme.palette.text.secondary,
          },
        }}
      >
        <KBSelect />
      </Box>
      <Stack
        direction='row'
        alignItems='center'
        gap={1}
        sx={{ minWidth: 0, flexWrap: 'wrap' }}
      >
        {breads.map((it, idx) => {
          const isCurrent = idx === breads.length - 1;
          const content = (
            <Box
              sx={{
                px: 1.25,
                py: 0.75,
                borderRadius: '10px',
                color: isCurrent ? 'text.primary' : 'text.secondary',
                fontWeight: isCurrent ? 600 : 500,
                bgcolor: isCurrent ? '#FFFFFF' : 'transparent',
                border: isCurrent
                  ? `1px solid ${alpha(theme.palette.common.black, 0.08)}`
                  : '1px solid transparent',
                boxShadow: isCurrent
                  ? '0px 1px 2px rgba(18, 24, 40, 0.03)'
                  : 'none',
                transition:
                  'background-color 180ms ease, border-color 180ms ease, color 180ms ease, transform 180ms ease',
                cursor: 'pointer',
                ':hover': {
                  color: 'text.primary',
                  bgcolor: isCurrent
                    ? '#FFFFFF'
                    : alpha(theme.palette.common.black, 0.03),
                  transform: 'translateY(-1px)',
                },
              }}
            >
              {it.title}
            </Box>
          );

          return (
            <Stack direction='row' alignItems='center' gap={1} key={it.title}>
              <Box
                sx={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  bgcolor: alpha(theme.palette.common.black, 0.12),
                  flexShrink: 0,
                }}
              />
              {it.to === 'custom' ? (
                content
              ) : (
                <NavLink to={it.to}>{content}</NavLink>
              )}
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
};

export default Bread;
