'use client';

import Logo from '@/assets/images/logo.png';
import { BrandName } from '@/constant';
import { LandingFooter as SharedLandingFooter } from '@/components/footer';
import QaModal from '@/components/QaModal';
import AiQaContent from '@/components/QaModal/AiQaContent';
import SearchDocContent from '@/components/QaModal/SearchDocContent';
import {
  StyledHotSearchColumn,
  StyledHotSearchColumnItem,
  StyledHotSearchContainer,
  StyledInputWrapper,
  StyledTextField,
} from '@/components/QaModal/StyledComponents';
import { useBasePath } from '@/hooks';
import { useStore } from '@/provider';
import { getImagePath } from '@/utils/getImagePath';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  alpha,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  styled,
} from '@mui/material';
import {
  IconFasong,
  IconJinsousuo,
  IconTushu,
  IconWenjian,
  IconZhinengwenda,
} from '@panda-wiki/icons';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

const defaultHotSearch = [
  '如何安装 MindWeave',
  'MindWeave 能做什么',
  '忘了管理员密码怎么办',
  '知识库支持哪些文档格式',
];

const defaultFaqs = [
  {
    question: '知识库入口在哪里？',
    answer:
      '点击导航栏里的“知识库”即可直接进入文档页，也可以先在首页通过搜索和问答快速定位内容。',
  },
  {
    question: '仅搜索文档和智能问答有什么区别？',
    answer:
      '仅搜索文档更适合快速定位原文位置，智能问答会基于知识库内容组织答案，适合解释、总结和继续追问。',
  },
  {
    question: '如果没有搜到结果怎么办？',
    answer:
      '可以尝试换更具体的关键词，或者直接进入知识库目录按主题浏览相关文档。',
  },
];

const inputTypewriterHint = '输入问题或关键词，直接从知识库里定位答案和文档。';
const heroContourPattern = `url("data:image/svg+xml,%3Csvg width='1600' height='900' viewBox='0 0 1600 900' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg stroke='%233f7555' stroke-opacity='0.14' stroke-width='1.5'%3E%3Cpath d='M-80 164C82 90 227 110 368 177C504 242 670 265 821 213C972 161 1114 104 1282 130C1418 151 1544 226 1700 209'/%3E%3Cpath d='M-120 248C26 202 178 207 334 268C490 329 652 333 816 283C980 233 1132 186 1276 202C1430 220 1566 301 1710 293'/%3E%3Cpath d='M-90 356C53 314 205 321 354 382C503 443 666 456 829 409C992 362 1148 304 1305 320C1462 336 1593 405 1712 396'/%3E%3Cpath d='M-70 482C78 434 226 444 375 510C524 576 689 591 852 544C1015 497 1178 437 1332 451C1486 465 1606 538 1718 525'/%3E%3Cpath d='M-110 612C43 557 203 571 361 641C519 711 683 728 845 679C1007 630 1161 569 1317 583C1473 597 1603 667 1710 654'/%3E%3Cpath d='M-130 736C18 686 183 694 336 757C489 820 651 827 809 782C967 737 1139 681 1299 697C1459 713 1585 776 1692 768'/%3E%3C/g%3E%3C/svg%3E")`;
const heroContourPatternDense = `url("data:image/svg+xml,%3Csvg width='1600' height='900' viewBox='0 0 1600 900' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg stroke='%23376f52' stroke-opacity='0.22' stroke-width='1.7'%3E%3Cpath d='M-80 164C82 90 227 110 368 177C504 242 670 265 821 213C972 161 1114 104 1282 130C1418 151 1544 226 1700 209'/%3E%3Cpath d='M-120 248C26 202 178 207 334 268C490 329 652 333 816 283C980 233 1132 186 1276 202C1430 220 1566 301 1710 293'/%3E%3Cpath d='M-90 356C53 314 205 321 354 382C503 443 666 456 829 409C992 362 1148 304 1305 320C1462 336 1593 405 1712 396'/%3E%3Cpath d='M-70 482C78 434 226 444 375 510C524 576 689 591 852 544C1015 497 1178 437 1332 451C1486 465 1606 538 1718 525'/%3E%3Cpath d='M-110 612C43 557 203 571 361 641C519 711 683 728 845 679C1007 630 1161 569 1317 583C1473 597 1603 667 1710 654'/%3E%3Cpath d='M-130 736C18 686 183 694 336 757C489 820 651 827 809 782C967 737 1139 681 1299 697C1459 713 1585 776 1692 768'/%3E%3C/g%3E%3Cg stroke='%23468668' stroke-opacity='0.14' stroke-width='1.05'%3E%3Cpath d='M-104 208C50 153 197 161 349 221C501 281 662 292 823 246C984 200 1135 150 1291 170C1447 190 1571 262 1695 249'/%3E%3Cpath d='M-96 302C58 252 211 260 362 322C513 384 674 396 835 350C996 304 1148 255 1302 272C1456 289 1578 353 1696 344'/%3E%3Cpath d='M-84 430C64 382 220 392 372 454C524 516 685 529 846 482C1007 435 1164 383 1315 398C1466 413 1589 479 1701 468'/%3E%3Cpath d='M-118 548C32 500 191 511 347 575C503 639 666 652 828 606C990 560 1148 509 1306 525C1464 541 1589 607 1707 597'/%3E%3Cpath d='M-114 682C40 632 197 640 351 704C505 768 666 780 826 735C986 690 1148 638 1305 654C1462 670 1587 734 1698 723'/%3E%3C/g%3E%3C/svg%3E")`;

const LandingRoot = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  color: '#101918',
  background: 'linear-gradient(180deg, #f5faf6 0%, #edf6ef 42%, #f8fbf8 100%)',
  overflowX: 'hidden',
}));

const LandingNav = styled('nav')(({ theme }) => ({
  position: 'sticky',
  top: 0,
  zIndex: 20,
  display: 'flex',
  justifyContent: 'center',
  minHeight: 72,
  padding: theme.spacing(1.5, 3),
  borderBottom: '1px solid rgba(16, 25, 24, 0.08)',
  background: 'rgba(251, 252, 251, 0.84)',
  backdropFilter: 'blur(18px)',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1, 1.5),
  },
}));

const NavInner = styled(Stack)(({ theme }) => ({
  width: '100%',
  maxWidth: 1200,
  minWidth: 0,
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(1),
  },
}));

const NavButton = styled(Button)(({ theme }) => ({
  minWidth: 0,
  height: 38,
  padding: theme.spacing(0, 1.75),
  borderRadius: 10,
  color: '#101918',
  textTransform: 'none',
  whiteSpace: 'nowrap',
  '&:hover': {
    backgroundColor: 'rgba(61, 110, 244, 0.08)',
    color: theme.palette.primary.main,
  },
}));

const HeroSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  minHeight: 'calc(100vh - 72px)',
  padding: theme.spacing(6, 3, 8),
  overflow: 'hidden',
  [theme.breakpoints.down('md')]: {
    minHeight: 'auto',
    padding: theme.spacing(4, 2, 6),
  },
}));

const HeroInner = styled(Stack)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  width: '100%',
  maxWidth: 1200,
  margin: '0 auto',
  alignItems: 'center',
  gap: theme.spacing(3),
}));

const KnowledgeScene = styled(Box)(({ theme }) => ({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  overflow: 'hidden',
  background:
    'linear-gradient(135deg, rgba(228, 241, 232, 0.96) 0%, rgba(243, 249, 244, 0.9) 34%, rgba(223, 239, 229, 0.92) 68%, rgba(248, 251, 248, 0.96) 100%)',
  '@keyframes heroSheenDrift': {
    '0%': {
      transform: 'translate3d(-2%, 0, 0) rotate(-7deg) scale(1.04)',
    },
    '50%': {
      transform: 'translate3d(1%, -2%, 0) rotate(-4deg) scale(1.08)',
    },
    '100%': {
      transform: 'translate3d(3%, 1%, 0) rotate(-6deg) scale(1.05)',
    },
  },
  '@keyframes contourDrift': {
    '0%': {
      transform: 'translate3d(0, 0, 0) scale(1.01)',
      opacity: 0.34,
    },
    '50%': {
      transform: 'translate3d(-1.5%, 1%, 0) scale(1.03)',
      opacity: 0.42,
    },
    '100%': {
      transform: 'translate3d(1%, -1%, 0) scale(1.02)',
      opacity: 0.36,
    },
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: '-16% -8%',
    background:
      'linear-gradient(118deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.2) 26%, rgba(200, 226, 210, 0.28) 49%, rgba(255,255,255,0.84) 71%, rgba(255,255,255,0.28) 100%)',
    opacity: 0.95,
    filter: 'blur(18px)',
    animation: 'heroSheenDrift 20s ease-in-out infinite alternate',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: '1% -5% -4%',
    backgroundImage: [heroContourPatternDense, heroContourPattern].join(', '),
    backgroundSize: '108% auto, 102% auto',
    backgroundPosition: 'center, center',
    backgroundRepeat: 'no-repeat, no-repeat',
    opacity: 0.84,
    filter: 'drop-shadow(0 10px 26px rgba(55, 111, 82, 0.08))',
    animation: 'contourDrift 26s ease-in-out infinite alternate',
  },
  [theme.breakpoints.down('md')]: {
    '&::before': {
      inset: '-12% -20%',
      opacity: 0.88,
    },
    '&::after': {
      inset: '6% -16% 0',
      opacity: 0.62,
      backgroundSize: '154% auto, 144% auto',
    },
  },
}));

const InlineShellTabs = styled(Tabs)(({ theme }) => ({
  minHeight: 'auto',
  position: 'relative',
  borderRadius: 14,
  padding: theme.spacing(0.5),
  border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
  backgroundColor: 'rgba(255, 255, 255, 0.92)',
  '& .MuiTabs-indicator': {
    height: '100%',
    borderRadius: 12,
    backgroundColor: theme.palette.primary.main,
    zIndex: 0,
  },
  '& .MuiTabs-flexContainer': {
    gap: theme.spacing(0.5),
    position: 'relative',
    zIndex: 1,
  },
}));

const InlineShellTab = styled(Tab)(({ theme }) => ({
  minHeight: 'auto',
  padding: theme.spacing(1, 2.25),
  borderRadius: 10,
  fontSize: 12,
  fontWeight: 500,
  textTransform: 'none',
  lineHeight: 1,
  zIndex: 1,
  color: theme.palette.text.secondary,
  '&.Mui-selected': {
    color: theme.palette.primary.contrastText,
  },
}));

const EntryShell = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: 860,
  minHeight: 388,
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(2),
  borderRadius: 28,
  border: '1px solid rgba(16, 25, 24, 0.08)',
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.90), rgba(248,250,249,0.92))',
  boxShadow: '0 24px 90px rgba(16, 25, 24, 0.10)',
  backdropFilter: 'blur(18px)',
  [theme.breakpoints.down('sm')]: {
    minHeight: 320,
    padding: theme.spacing(1.5),
    borderRadius: 20,
  },
}));

const PromptBrand = styled(Stack)(({ theme }) => ({
  flex: 1,
  minHeight: 0,
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  gap: theme.spacing(2.5),
  padding: theme.spacing(1, 0),
}));

const PromptSearchField = styled(TextField)(({ theme }) => ({
  boxShadow: `0px 20px 40px 0px ${alpha(theme.palette.text.primary, 0.06)}`,
  borderRadius: 16,
  '& .MuiInputBase-root': {
    fontSize: 16,
    borderRadius: 16,
    minHeight: 52,
    backgroundColor: theme.palette.background.default,
    '& fieldset': {
      borderColor: alpha(theme.palette.text.primary, 0.1),
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-focused fieldset': {
      borderColor: `${theme.palette.primary.main} !important`,
      borderWidth: 1,
    },
  },
  '& .MuiInputBase-input': {
    paddingTop: 0,
    paddingBottom: 0,
    height: 52,
    boxSizing: 'border-box',
  },
}));

const Section = styled(Box)(({ theme }) => ({
  scrollMarginTop: 90,
  padding: theme.spacing(8, 3),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(6, 2),
  },
}));

const SectionInner = styled(Stack)(() => ({
  width: '100%',
  maxWidth: 1200,
  margin: '0 auto',
}));

const FeatureCard = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  minHeight: 140,
  padding: theme.spacing(2.5),
  borderRadius: 16,
  border: '1px solid rgba(16, 25, 24, 0.08)',
  background: 'rgba(255, 255, 255, 0.72)',
  boxShadow: '0 16px 40px rgba(16, 25, 24, 0.06)',
}));

const StoryMedia = styled(Box)(({ theme }) => ({
  position: 'relative',
  minHeight: 360,
  borderRadius: 30,
  overflow: 'hidden',
  border: '1px solid rgba(16, 25, 24, 0.08)',
  background:
    'linear-gradient(180deg, rgba(223, 239, 229, 0.82), rgba(248, 250, 249, 0.92))',
  boxShadow: '0 26px 70px rgba(16, 25, 24, 0.10)',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 'auto -8% -20% 36%',
    height: '56%',
    background:
      'radial-gradient(circle, rgba(79, 138, 106, 0.28) 0%, rgba(79, 138, 106, 0) 72%)',
    zIndex: 1,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 18,
    borderRadius: 22,
    border: '1px solid rgba(255, 255, 255, 0.34)',
    zIndex: 1,
  },
  [theme.breakpoints.down('md')]: {
    minHeight: 300,
  },
}));

const StoryImageLabel = styled(Box)(({ theme }) => ({
  position: 'absolute',
  left: 24,
  bottom: 24,
  zIndex: 2,
  maxWidth: 'min(78%, 320px)',
  padding: theme.spacing(1.5, 2),
  borderRadius: 18,
  border: '1px solid rgba(255, 255, 255, 0.22)',
  background: 'rgba(15, 25, 20, 0.42)',
  backdropFilter: 'blur(12px)',
  color: '#fff',
  boxShadow: '0 12px 32px rgba(16, 25, 24, 0.22)',
}));

const StoryTag = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 34,
  padding: theme.spacing(0.75, 1.4),
  borderRadius: 999,
  border: '1px solid rgba(16, 25, 24, 0.08)',
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(241,247,243,0.92))',
  color: '#244534',
  fontSize: 13,
  fontWeight: 600,
  boxShadow: '0 8px 22px rgba(16, 25, 24, 0.05)',
}));

const FaqCard = styled(Accordion)(({ theme }) => ({
  borderRadius: '18px !important',
  border: '1px solid rgba(16, 25, 24, 0.08)',
  background:
    'linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(245, 249, 246, 0.92))',
  boxShadow: '0 14px 34px rgba(16, 25, 24, 0.05)',
  '&::before': {
    display: 'none',
  },
  '& + &': {
    marginTop: theme.spacing(1.5),
  },
  '&.Mui-expanded': {
    margin: 0,
    marginTop: theme.spacing(1.5),
  },
}));

const StandardLanding = () => {
  const basePath = useBasePath();
  const { kbDetail, mobile } = useStore();
  const settings = kbDetail?.settings;
  const title = BrandName;
  const description =
    settings?.desc ||
    settings?.welcome_str ||
    '把项目文档、知识沉淀和 AI 问答放在同一个入口，让团队更快找到答案。';
  const logo = getImagePath(settings?.icon || Logo.src, basePath);
  const docPath = `${basePath}/node`;
  const [searchMode, setSearchMode] = useState<'chat' | 'search'>('chat');
  const [chatQuery, setChatQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typedPlaceholder, setTypedPlaceholder] = useState('');
  const [inlineFlow, setInlineFlow] = useState<{
    mode: 'chat' | 'search';
    query: string;
    key: number;
  } | null>(null);
  const inlineChatInputRef = useRef<HTMLInputElement | null>(null);
  const inlineSearchInputRef = useRef<HTMLInputElement | null>(null);

  const bannerConfig = useMemo(
    () =>
      settings?.web_app_landing_configs?.find(item => item.type === 'banner'),
    [settings?.web_app_landing_configs],
  );

  const cardTitle = bannerConfig?.banner_config?.title || '知识库问答';
  const animatedPlaceholder = `${typedPlaceholder}|`;
  const inlinePlaceholder =
    settings?.search_placeholder ||
    settings?.web_app_custom_style?.header_search_placeholder ||
    '请输入问题或关键词';
  const isInlineModeActive = inlineFlow?.mode === searchMode;

  useEffect(() => {
    let currentCharIndex = 0;
    let pauseTick = 0;
    let isDeleting = false;

    const timer = window.setInterval(() => {
      if (!isDeleting && currentCharIndex < inputTypewriterHint.length) {
        currentCharIndex += 1;
        setTypedPlaceholder(inputTypewriterHint.slice(0, currentCharIndex));
        return;
      }

      if (!isDeleting && pauseTick < 18) {
        pauseTick += 1;
        return;
      }

      if (!isDeleting) {
        isDeleting = true;
        return;
      }

      if (currentCharIndex > 0) {
        currentCharIndex -= 1;
        setTypedPlaceholder(inputTypewriterHint.slice(0, currentCharIndex));
        return;
      }

      isDeleting = false;
      pauseTick = 0;
    }, 80);

    return () => window.clearInterval(timer);
  }, []);

  const hotSearch = useMemo(() => {
    const list =
      bannerConfig?.banner_config?.hot_search ||
      settings?.recommend_questions ||
      defaultHotSearch;
    return list.filter(Boolean).slice(0, 4);
  }, [bannerConfig?.banner_config?.hot_search, settings?.recommend_questions]);

  const features = [
    {
      icon: <IconWenjian sx={{ fontSize: 22 }} />,
      title: '结构化沉淀',
      desc: '按目录组织文档内容，项目背景、部署说明和排障经验都能留在同一个知识空间里。',
    },
    {
      icon: <IconJinsousuo sx={{ fontSize: 22 }} />,
      title: '快速检索',
      desc: '首页直接提供文档检索入口，不需要反复切换目录，就能更快定位原文。',
    },
    {
      icon: <IconZhinengwenda sx={{ fontSize: 22 }} />,
      title: '连续问答',
      desc: '围绕知识库生成答案，适合解释、总结和继续追问，减少信息找到了却读不懂的情况。',
    },
  ];
  const storySections = [
    {
      eyebrow: '知识沉淀',
      title: '把零散经验收成团队真正能复用的知识资产',
      description:
        '无论是新同事上手、老系统交接，还是线上问题回溯，MindWeave 都能把文档、背景和处理经验留在一个会被反复使用的位置。',
      detail:
        '目录、关键步骤和上下文可以一并保留下来，后面的人不仅找得到，还能顺着原始信息继续推进。',
      image: getImagePath('/images/init/1.png', basePath),
      imageLabel: '结构化整理文档、说明和排障经验，让知识沉淀真正可持续。',
      tags: ['部署手册', '排障案例', '交接说明'],
      reverse: false,
    },
    {
      eyebrow: '搜索与问答',
      title: '先定位原文，再把复杂内容讲清楚',
      description:
        '当文档多到很难靠目录记忆时，搜索负责把原文快速找出来，智能问答则继续提炼重点、解释背景并承接追问。',
      detail:
        '这让首页不只是一个展示入口，而是团队日常查资料、确认细节和协作推进时最自然的工作界面。',
      image: getImagePath('/images/init/2.png', basePath),
      imageLabel: '原文定位、重点总结和连续追问可以在同一条工作流里完成。',
      tags: ['原文定位', '要点总结', '继续追问'],
      reverse: true,
    },
  ];

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const startInlineFlow = (mode: 'chat' | 'search', value?: string) => {
    const rawQuery = mode === 'chat' ? chatQuery : searchQuery;
    const nextQuery = (value ?? rawQuery).trim();
    if (!nextQuery) {
      return;
    }
    setInlineFlow({
      mode,
      query: nextQuery,
      key: Date.now(),
    });
    if (mode === 'chat') {
      setChatQuery('');
      return;
    }
    setSearchQuery('');
  };

  const resetInlineFlow = () => {
    setInlineFlow(null);
    setChatQuery('');
    setSearchQuery('');
  };

  const handleModeChange = (value: 'chat' | 'search') => {
    setSearchMode(value);
    if (inlineFlow?.mode !== value) {
      resetInlineFlow();
    }
  };

  const handleQuickAction = (value: string) => {
    if (searchMode === 'chat') {
      startInlineFlow('chat', value);
      return;
    }
    startInlineFlow('search', value);
  };

  return (
    <LandingRoot>
      <LandingNav aria-label='落地页导航'>
        <NavInner
          direction='row'
          alignItems='center'
          justifyContent='space-between'
        >
          <Link
            href={basePath || '/'}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              minWidth: 0,
              color: '#101918',
              textDecoration: 'none',
            }}
          >
            <Image
              src={logo}
              alt={title}
              width={36}
              height={36}
              unoptimized
              style={{ objectFit: 'contain' }}
            />
            <Typography
              sx={{
                maxWidth: { xs: 140, sm: 280 },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              {title}
            </Typography>
          </Link>

          <Stack
            direction='row'
            alignItems='center'
            justifyContent='flex-end'
            gap={{ xs: 0.25, sm: 1 }}
            sx={{ minWidth: 0, overflowX: { xs: 'auto', sm: 'visible' } }}
          >
            <NavButton href={docPath} startIcon={<IconTushu />}>
              知识库
            </NavButton>
            <NavButton onClick={() => scrollToSection('project-intro')}>
              介绍
            </NavButton>
            <NavButton onClick={() => scrollToSection('project-faq')}>
              FAQ
            </NavButton>
          </Stack>
        </NavInner>
      </LandingNav>

      <HeroSection>
        <KnowledgeScene aria-hidden='true' />

        <HeroInner>
          <EntryShell
            sx={{
              minHeight: isInlineModeActive
                ? { xs: 500, md: 640 }
                : { xs: 388, md: 388 },
              maxHeight: isInlineModeActive ? 'min(80vh, 860px)' : 'none',
              overflow: isInlineModeActive ? 'hidden' : 'visible',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.5,
                pb: { xs: 1.5, md: 2 },
              }}
            >
              <InlineShellTabs
                value={searchMode}
                onChange={(_, value) =>
                  handleModeChange(value as 'chat' | 'search')
                }
                variant='scrollable'
                scrollButtons={false}
              >
                <InlineShellTab
                  value='chat'
                  label={
                    <Stack direction='row' gap={0.5} alignItems='center'>
                      <IconZhinengwenda sx={{ fontSize: 16 }} />
                      {!mobile && <span>智能问答</span>}
                    </Stack>
                  }
                />
                <InlineShellTab
                  value='search'
                  label={
                    <Stack direction='row' gap={0.5} alignItems='center'>
                      <IconJinsousuo sx={{ fontSize: 16 }} />
                      {!mobile && <span>仅搜索文档</span>}
                    </Stack>
                  }
                />
              </InlineShellTabs>

              <Button
                href={docPath}
                variant='outlined'
                size='small'
                sx={theme => ({
                  minWidth: 'auto',
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 500,
                  textTransform: 'none',
                  color: 'text.secondary',
                  borderColor: alpha(theme.palette.text.primary, 0.1),
                  backgroundColor: 'rgba(255,255,255,0.92)',
                })}
              >
                文档页
              </Button>
            </Box>

            {isInlineModeActive && inlineFlow ? (
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  pt: { xs: 0.5, md: 1 },
                }}
              >
                {searchMode === 'chat' ? (
                  <AiQaContent
                    key={`landing-chat-${inlineFlow.key}`}
                    hotSearch={hotSearch}
                    placeholder={inlinePlaceholder}
                    inputRef={inlineChatInputRef}
                    isInline
                    presetQuery={inlineFlow.query}
                    presetQueryKey={inlineFlow.key}
                    hideWelcomeState
                    onResetToPrompt={resetInlineFlow}
                  />
                ) : (
                  <SearchDocContent
                    key={`landing-search-${inlineFlow.key}`}
                    inputRef={inlineSearchInputRef}
                    placeholder={inlinePlaceholder}
                    isInline
                    hideBranding
                    presetQuery={inlineFlow.query}
                    presetQueryKey={inlineFlow.key}
                  />
                )}
              </Box>
            ) : (
              <>
                <PromptBrand>
                  <Typography
                    component='h1'
                    sx={{
                      maxWidth: 680,
                      color: 'text.primary',
                      fontSize: { xs: 28, md: 40 },
                      lineHeight: { xs: '36px', md: '48px' },
                      fontWeight: 800,
                      wordBreak: 'break-word',
                    }}
                  >
                    {cardTitle}
                  </Typography>

                  {hotSearch.length > 0 && (
                    <Box sx={{ width: '100%', maxWidth: 700 }}>
                      <Typography
                        sx={{
                          mb: 1.5,
                          color: 'primary.main',
                          fontSize: 12,
                          fontWeight: 700,
                          textAlign: 'left',
                        }}
                      >
                        大家都在搜什么？
                      </Typography>
                      <StyledHotSearchContainer
                        sx={{ gap: { xs: 1.25, md: 2 } }}
                      >
                        <StyledHotSearchColumn sx={{ pl: { xs: 1.5, md: 2 } }}>
                          {hotSearch
                            .filter((_, index) => index % 2 === 0)
                            .map(item => (
                              <StyledHotSearchColumnItem
                                key={item}
                                onClick={() => handleQuickAction(item)}
                                sx={{
                                  minHeight: 24,
                                  pr: 1,
                                  fontSize: 13,
                                  lineHeight: 1.7,
                                }}
                              >
                                • {item}
                              </StyledHotSearchColumnItem>
                            ))}
                        </StyledHotSearchColumn>
                        <StyledHotSearchColumn sx={{ pl: { xs: 1.5, md: 2 } }}>
                          {hotSearch
                            .filter((_, index) => index % 2 === 1)
                            .map(item => (
                              <StyledHotSearchColumnItem
                                key={item}
                                onClick={() => handleQuickAction(item)}
                                sx={{
                                  minHeight: 24,
                                  pr: 1,
                                  fontSize: 13,
                                  lineHeight: 1.7,
                                }}
                              >
                                • {item}
                              </StyledHotSearchColumnItem>
                            ))}
                        </StyledHotSearchColumn>
                      </StyledHotSearchContainer>
                    </Box>
                  )}
                </PromptBrand>

                {searchMode === 'chat' ? (
                  <StyledInputWrapper
                    sx={{
                      mt: 1.5,
                      px: { xs: 1.25, md: 1.5 },
                      py: { xs: 0.75, md: 0.875 },
                      borderRadius: '16px',
                      minHeight: { xs: 58, md: 62 },
                      alignItems: 'center',
                      gap: 0.75,
                    }}
                  >
                    <StyledTextField
                      fullWidth
                      multiline
                      rows={1}
                      value={chatQuery}
                      onChange={event => setChatQuery(event.target.value)}
                      onKeyDown={event => {
                        const isComposing =
                          event.nativeEvent.isComposing ||
                          event.nativeEvent.keyCode === 229;
                        if (
                          event.key === 'Enter' &&
                          !event.shiftKey &&
                          chatQuery.trim() &&
                          !isComposing
                        ) {
                          event.preventDefault();
                          startInlineFlow('chat');
                        }
                      }}
                      placeholder={animatedPlaceholder}
                      autoComplete='off'
                      sx={{
                        '& .MuiInputBase-root': {
                          height: '40px !important',
                          alignItems: 'center',
                        },
                        textarea: {
                          paddingTop: '8px !important',
                          paddingBottom: '8px !important',
                          fontSize: 16,
                          lineHeight: '24px',
                        },
                      }}
                    />

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <IconButton
                        size='small'
                        disabled={!chatQuery.trim()}
                        onClick={() => startInlineFlow('chat')}
                      >
                        <IconFasong
                          sx={{
                            fontSize: 18,
                            color: chatQuery.trim()
                              ? 'primary.main'
                              : 'text.disabled',
                          }}
                        />
                      </IconButton>
                    </Box>
                  </StyledInputWrapper>
                ) : (
                  <PromptSearchField
                    fullWidth
                    value={searchQuery}
                    placeholder={animatedPlaceholder}
                    onChange={event => setSearchQuery(event.target.value)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' && searchQuery.trim()) {
                        event.preventDefault();
                        startInlineFlow('search');
                      }
                    }}
                    sx={{ mt: 2 }}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position='start'>
                            <IconJinsousuo
                              sx={{ fontSize: 20, color: 'text.secondary' }}
                            />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position='end'>
                            <IconButton
                              size='small'
                              onClick={() => startInlineFlow('search')}
                              disabled={!searchQuery.trim()}
                              sx={{
                                color: 'primary.main',
                                '&:hover': { bgcolor: 'primary.lighter' },
                                '&.Mui-disabled': { color: 'action.disabled' },
                              }}
                            >
                              <IconFasong sx={{ fontSize: 20 }} />
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                )}
              </>
            )}
          </EntryShell>
        </HeroInner>
      </HeroSection>

      <Section id='project-intro'>
        <SectionInner alignItems='center' gap={{ xs: 4, md: 5 }}>
          <Box sx={{ width: '100%', maxWidth: 920 }}>
            <Typography
              component='p'
              sx={{
                mb: 1.25,
                color: 'primary.main',
                fontSize: 14,
                fontWeight: 700,
                textAlign: { xs: 'left', md: 'center' },
              }}
            >
              项目介绍
            </Typography>
            <Typography
              component='h2'
              sx={{
                maxWidth: 760,
                mx: { xs: 0, md: 'auto' },
                fontSize: { xs: 30, md: 44 },
                lineHeight: { xs: '38px', md: '54px' },
                fontWeight: 800,
                textAlign: { xs: 'left', md: 'center' },
              }}
            >
              从文档入口到问答入口，让信息真的能被团队用起来
            </Typography>
            <Typography
              sx={{
                mt: 2,
                maxWidth: 760,
                mx: { xs: 0, md: 'auto' },
                color: 'text.secondary',
                fontSize: 16,
                lineHeight: 1.9,
                textAlign: { xs: 'left', md: 'center' },
              }}
            >
              首页把文档检索和智能问答收进同一个中心入口，访客既可以直接进入知识库浏览目录，也可以先用问题或关键词快速定位内容。
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              gap={1.5}
              sx={{ mt: 3 }}
            >
              {features.map(item => (
                <FeatureCard key={item.title}>
                  <Box sx={{ color: 'primary.main' }}>{item.icon}</Box>
                  <Typography sx={{ fontWeight: 800 }}>{item.title}</Typography>
                  <Typography
                    sx={{
                      color: 'text.secondary',
                      fontSize: 13,
                      lineHeight: 1.7,
                    }}
                  >
                    {item.desc}
                  </Typography>
                </FeatureCard>
              ))}
            </Stack>
          </Box>
        </SectionInner>
      </Section>

      {storySections.map((section, index) => (
        <Section
          key={section.title}
          sx={
            index % 2 === 1
              ? {
                  background:
                    'linear-gradient(180deg, rgba(232, 244, 236, 0.54), rgba(248, 251, 248, 0.92))',
                }
              : undefined
          }
        >
          <SectionInner
            direction={{
              xs: 'column',
              md: section.reverse ? 'row-reverse' : 'row',
            }}
            alignItems='center'
            gap={{ xs: 4, md: 7 }}
          >
            <Box sx={{ flex: 1.06, width: '100%' }}>
              <StoryMedia>
                <Image
                  src={section.image}
                  alt={section.title}
                  fill
                  unoptimized
                  sizes='(max-width: 900px) 100vw, 56vw'
                  style={{ objectFit: 'cover' }}
                />
                <StoryImageLabel>
                  <Typography
                    sx={{ fontSize: 13, lineHeight: 1.75, fontWeight: 600 }}
                  >
                    {section.imageLabel}
                  </Typography>
                </StoryImageLabel>
              </StoryMedia>
            </Box>

            <Stack
              sx={{
                flex: 0.94,
                width: '100%',
                gap: 2.25,
              }}
            >
              <Typography
                component='p'
                sx={{
                  color: 'primary.main',
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {section.eyebrow}
              </Typography>
              <Typography
                component='h2'
                sx={{
                  maxWidth: 560,
                  fontSize: { xs: 28, md: 42 },
                  lineHeight: { xs: '38px', md: '52px' },
                  fontWeight: 800,
                }}
              >
                {section.title}
              </Typography>
              <Typography
                sx={{
                  color: 'text.secondary',
                  fontSize: 16,
                  lineHeight: 1.9,
                }}
              >
                {section.description}
              </Typography>
              <Typography
                sx={{
                  maxWidth: 540,
                  color: 'text.secondary',
                  fontSize: 15,
                  lineHeight: 1.85,
                }}
              >
                {section.detail}
              </Typography>
              <Stack direction='row' gap={1} flexWrap='wrap' sx={{ pt: 0.5 }}>
                {section.tags.map(tag => (
                  <StoryTag key={tag}>{tag}</StoryTag>
                ))}
              </Stack>
            </Stack>
          </SectionInner>
        </Section>
      ))}

      <Section
        id='project-faq'
        sx={{
          background:
            'linear-gradient(180deg, rgba(240,244,255,0.56), rgba(251,252,251,0.9))',
        }}
      >
        <SectionInner gap={4}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent='space-between'
            gap={2}
          >
            <Box>
              <Typography
                component='p'
                sx={{
                  mb: 1,
                  color: 'primary.main',
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                QAD / FAQ
              </Typography>
              <Typography
                component='h2'
                sx={{
                  fontSize: { xs: 30, md: 42 },
                  lineHeight: { xs: '38px', md: '52px' },
                  fontWeight: 800,
                }}
              >
                常见问题和高频使用场景
              </Typography>
            </Box>
            <Button
              href={docPath}
              variant='outlined'
              startIcon={<IconTushu />}
              sx={{
                alignSelf: { xs: 'flex-start', md: 'center' },
                height: 44,
                px: 2.5,
                borderRadius: 999,
                color: '#101918',
                borderColor: 'rgba(16, 25, 24, 0.14)',
                textTransform: 'none',
                backgroundColor: 'rgba(255,255,255,0.84)',
              }}
            >
              进入知识库
            </Button>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} gap={3}>
            <Box
              sx={{
                flex: 0.96,
                borderRadius: 6,
                border: '1px solid rgba(16, 25, 24, 0.08)',
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.84), rgba(242,247,244,0.9))',
                boxShadow: '0 18px 40px rgba(16, 25, 24, 0.05)',
                p: { xs: 2.5, md: 3 },
              }}
            >
              <Typography
                sx={{
                  mb: 2,
                  color: 'primary.main',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                大家都在问什么？
              </Typography>
              <Stack gap={1.5}>
                {hotSearch.slice(0, 4).map(item => (
                  <Box
                    key={item}
                    sx={{
                      p: 1.5,
                      borderRadius: 4,
                      border: '1px solid rgba(16, 25, 24, 0.08)',
                      background:
                        'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(247,250,248,0.92))',
                    }}
                  >
                    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                      {item}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>

            <Box sx={{ flex: 1.12 }}>
              {defaultFaqs.map(item => (
                <FaqCard key={item.question} disableGutters>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ fontSize: 22 }} />}
                    sx={{
                      position: 'relative',
                      minHeight: 70,
                      px: 2.25,
                      '& .MuiAccordionSummary-expandIconWrapper': {
                        position: 'absolute',
                        right: 18,
                      },
                      '& .MuiAccordionSummary-content': {
                        alignItems: 'center',
                        justifyContent: 'center',
                        my: 0,
                        mx: 'auto',
                        pr: 4,
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        width: '100%',
                        textAlign: 'center',
                        fontSize: 16,
                        fontWeight: 800,
                      }}
                    >
                      {item.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={theme => ({
                      px: 2.25,
                      pt: 0,
                      pb: 2.25,
                      borderTop: `1px solid ${alpha(
                        theme.palette.text.primary,
                        0.08,
                      )}`,
                    })}
                  >
                    <Typography
                      sx={{
                        color: 'text.secondary',
                        fontSize: 14,
                        lineHeight: 1.8,
                      }}
                    >
                      {item.answer}
                    </Typography>
                  </AccordionDetails>
                </FaqCard>
              ))}
            </Box>
          </Stack>
        </SectionInner>
      </Section>

      <SharedLandingFooter
        onIntroClick={() => scrollToSection('project-intro')}
        onFaqClick={() => scrollToSection('project-faq')}
      />

      <QaModal />
    </LandingRoot>
  );
};

export default StandardLanding;
