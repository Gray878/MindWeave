'use client';

import Logo from '@/assets/images/logo.png';
import { BrandName } from '@/constant';
import { useBasePath } from '@/hooks';
import { useStore } from '@/provider';
import { getImagePath } from '@/utils/getImagePath';
import { Box, Button, Stack, Typography, styled } from '@mui/material';
import Image from 'next/image';

type LandingFooterProps = {
  onIntroClick?: () => void;
  onFaqClick?: () => void;
};

const FooterRoot = styled('footer')(({ theme }) => ({
  padding: theme.spacing(4, 3),
  borderTop: '1px solid rgba(16, 25, 24, 0.08)',
  background: '#101918',
  color: 'rgba(255, 255, 255, 0.88)',
}));

const FooterActionButton = styled(Button)(({ theme }) => ({
  minWidth: 0,
  height: 38,
  padding: theme.spacing(0, 1.75),
  borderRadius: 10,
  color: '#fff',
  textTransform: 'none',
  whiteSpace: 'nowrap',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    color: '#fff',
  },
}));

const LandingFooter = ({ onIntroClick, onFaqClick }: LandingFooterProps) => {
  const basePath = useBasePath();
  const { kbDetail } = useStore();
  const title = BrandName;
  const logo = getImagePath(kbDetail?.settings?.icon || Logo.src, basePath);
  const docPath = `${basePath}/node`;
  const introHref = `${basePath}/home#project-intro`;
  const faqHref = `${basePath}/home#project-faq`;

  return (
    <FooterRoot>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent='space-between'
        gap={3}
        sx={{ maxWidth: 1200, mx: 'auto' }}
      >
        <Stack direction='row' alignItems='center' gap={1.5}>
          <Image
            src={logo}
            alt={title}
            width={34}
            height={34}
            unoptimized
            style={{ objectFit: 'contain' }}
          />
          <Box>
            <Typography sx={{ color: '#fff', fontWeight: 800 }}>
              {title}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.56)', fontSize: 12 }}>
              Copyright {new Date().getFullYear()} {BrandName}
            </Typography>
          </Box>
        </Stack>

        <Stack direction='row' gap={1} flexWrap='wrap'>
          <FooterActionButton href={docPath}>知识库</FooterActionButton>
          <FooterActionButton
            href={onIntroClick ? undefined : introHref}
            onClick={onIntroClick}
          >
            介绍
          </FooterActionButton>
          <FooterActionButton
            href={onFaqClick ? undefined : faqHref}
            onClick={onFaqClick}
          >
            FAQ
          </FooterActionButton>
        </Stack>
      </Stack>
    </FooterRoot>
  );
};

export default LandingFooter;
