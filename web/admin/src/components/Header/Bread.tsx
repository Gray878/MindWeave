import { useAppSelector } from '@/store';
import { Box, Stack, useTheme } from '@mui/material';
import { IconXiala } from '@panda-wiki/icons';
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
      direction={'row'}
      alignItems={'center'}
      gap={1}
      sx={{
        flexGrow: 1,
        color: 'text.tertiary',
        fontSize: '14px',
        a: { color: 'text.tertiary' },
        lineHeight: '22px',
      }}
    >
      <KBSelect />
      {breads.map((it, idx) => {
        return (
          <Stack
            direction={'row'}
            alignItems={'center'}
            gap={1}
            key={it.title}
            sx={{
              color:
                idx === breads.length - 1
                  ? `${theme.palette.text.primary} !important`
                  : 'text.disabled',
              a: {
                color:
                  idx === breads.length - 1
                    ? `${theme.palette.text.primary} !important`
                    : 'text.disabled',
              },
              ...(idx === breads.length - 1 && { fontWeight: 'bold' }),
            }}
          >
            <IconXiala sx={{ fontSize: 20, transform: 'rotate(-90deg)' }} />
            {it.to === 'custom' ? (
              <Box
                sx={{ cursor: 'pointer', ':hover': { color: 'primary.main' } }}
              >
                {it.title}
              </Box>
            ) : (
              <NavLink to={it.to}>
                <Box
                  sx={{
                    cursor: 'pointer',
                    ':hover': { color: 'primary.main' },
                  }}
                >
                  {it.title}
                </Box>
              </NavLink>
            )}
          </Stack>
        );
      })}
    </Stack>
  );
};

export default Bread;
