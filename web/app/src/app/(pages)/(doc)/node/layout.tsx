'use client';

import { LandingFooter } from '@/components/footer';
import Header from '@/components/header';
import { useStore } from '@/provider';
import Catalog from '@/views/node/Catalog';
import CatalogH5 from '@/views/node/CatalogH5';
import { Box, Stack } from '@mui/material';
import noDocImage from '@/assets/images/no-doc.png';
import Image from 'next/image';

const PCLayout = ({ children }: { children: React.ReactNode }) => {
  const { tree } = useStore();

  return (
    <Stack sx={{ height: '100vh', overflow: 'auto' }} id='scroll-container'>
      <Header isDocPage={true} />
      {tree?.length === 0 ? (
        <Stack
          sx={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Image src={noDocImage} alt='暂无文档' width={380} />
          <Box sx={{ fontSize: 14, color: 'text.tertiary' }}>
            暂无文档, 请前往管理后台创建新文档
          </Box>
        </Stack>
      ) : (
        <Stack
          direction='row'
          justifyContent='center'
          alignItems='flex-start'
          gap={'96px'}
          sx={{
            pt: '50px',
            pb: 10,
            px: 5,
            flex: 1,
          }}
        >
          <Catalog />
          {children}
        </Stack>
      )}

      <LandingFooter />
    </Stack>
  );
};

const MobileLayout = ({ children }: { children?: React.ReactNode }) => {
  const { tree } = useStore();
  return (
    <Stack
      sx={{
        position: 'relative',
        height: '100vh',
        overflow: 'auto',
        zIndex: 1,
      }}
    >
      <Box sx={{ flex: 1 }}>
        <Header />
        {tree?.length === 0 ? (
          <Stack
            justifyContent='center'
            alignItems='center'
            gap={2}
            sx={{
              pt: '50px',
              pb: 10,
              px: 5,
              flex: 1,
            }}
          >
            <Image src={noDocImage} alt='暂无文档' width={280} />
            <Box sx={{ fontSize: 14, color: 'text.tertiary' }}>
              暂无文档, 请前往管理后台创建新文档
            </Box>
          </Stack>
        ) : (
          <>
            <CatalogH5 />
            {children}
          </>
        )}
      </Box>

      <Box
        sx={{
          mt: 5,
        }}
      >
        <LandingFooter />
      </Box>
    </Stack>
  );
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { mobile } = useStore();

  return (
    <>
      {mobile ? (
        <MobileLayout>{children}</MobileLayout>
      ) : (
        <PCLayout>{children}</PCLayout>
      )}
    </>
  );
}
