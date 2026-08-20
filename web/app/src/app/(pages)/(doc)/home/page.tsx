'use client';
import { useMemo } from 'react';
import Home from '@/views/home';
import { ThemeProvider } from '@ctzhian/ui';
import { Stack, createTheme } from '@mui/material';
import { createComponentStyleOverrides } from '@/theme';
import { useStore } from '@/provider';
import { THEME_TO_PALETTE } from '@panda-wiki/themes/constants';

const HomePage = () => {
  const { kbDetail } = useStore();

  const theme = useMemo(() => {
    // @ts-ignore
    const themeMode = kbDetail?.settings?.web_app_landing_theme?.name || 'blue';
    return createTheme({
      cssVariables: {
        cssVarPrefix: 'welcome',
      },
      palette:
        THEME_TO_PALETTE[themeMode]?.palette ||
        THEME_TO_PALETTE['blue'].palette,
      typography: {
        fontFamily: 'var(--font-gilory), PingFang SC, sans-serif',
      },
      components: createComponentStyleOverrides(true),
    });
    // @ts-ignore
  }, [kbDetail?.settings?.web_app_landing_theme?.name]);

  return (
    <ThemeProvider theme={theme}>
      <Stack
        justifyContent='space-between'
        sx={{ minHeight: '100vh', bgcolor: 'background.default' }}
      >
        <Stack sx={{ flex: 1 }}>
          <Home />
        </Stack>
      </Stack>
    </ThemeProvider>
  );
};

export default HomePage;
