import Logo from '@/assets/images/logo.png';
import Avatar from '../Avatar';
import { useAppSelector } from '@/store';
import { Box, Button, Stack, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ConstsUserKBPermission, ConstsUserRole } from '@/request/types';
import {
  IconAChilunshezhisheding,
  IconNeirongguanli,
  IconTongjifenxi1,
  IconJushou,
  IconPaperFull,
  IconDuihualishi1,
  IconChilun,
} from '@panda-wiki/icons';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import { ElementType, useEffect, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

type MenuItem = {
  label: string;
  value: string;
  pathname: string;
  icon: ElementType;
  show: boolean;
  perms: ConstsUserKBPermission[];
  adminOnly?: boolean;
};

export const SIDEBAR_WIDTH = 176;
export const SIDEBAR_LAYOUT_OFFSET = SIDEBAR_WIDTH + 32;

const MENUS: MenuItem[] = [
  {
    label: '\u6570\u636e\u7edf\u8ba1',
    value: '/stat',
    pathname: 'stat',
    icon: IconTongjifenxi1,
    show: true,
    perms: [
      ConstsUserKBPermission.UserKBPermissionFullControl,
      ConstsUserKBPermission.UserKBPermissionDataOperate,
    ],
  },
  {
    label: '\u6587\u6863\u7ba1\u7406',
    value: '/document',
    pathname: 'document',
    icon: IconNeirongguanli,
    show: true,
    perms: [
      ConstsUserKBPermission.UserKBPermissionFullControl,
      ConstsUserKBPermission.UserKBPermissionDocManage,
    ],
  },
  {
    label: '\u77e5\u8bc6\u56fe\u8c31',
    value: '/graph',
    pathname: 'graph',
    icon: AccountTreeIcon,
    show: true,
    perms: [
      ConstsUserKBPermission.UserKBPermissionFullControl,
      ConstsUserKBPermission.UserKBPermissionDataOperate,
    ],
  },
  {
    label: '\u95ee\u7b54\u8bb0\u5f55',
    value: '/conversation',
    pathname: 'conversation',
    icon: IconDuihualishi1,
    show: true,
    perms: [
      ConstsUserKBPermission.UserKBPermissionFullControl,
      ConstsUserKBPermission.UserKBPermissionDataOperate,
    ],
  },
  {
    label: '\u7528\u6237\u53cd\u9988',
    value: '/feedback',
    pathname: 'feedback',
    icon: IconJushou,
    show: true,
    perms: [
      ConstsUserKBPermission.UserKBPermissionFullControl,
      ConstsUserKBPermission.UserKBPermissionDataOperate,
    ],
  },
  {
    label: '\u5185\u5bb9\u53d1\u5e03',
    value: '/release',
    pathname: 'release',
    icon: IconPaperFull,
    show: true,
    perms: [
      ConstsUserKBPermission.UserKBPermissionFullControl,
      ConstsUserKBPermission.UserKBPermissionDocManage,
    ],
  },
  {
    label: '\u6a21\u578b\u914d\u7f6e',
    value: '/model-config',
    pathname: 'model-config',
    icon: IconAChilunshezhisheding,
    show: true,
    adminOnly: true,
    perms: [ConstsUserKBPermission.UserKBPermissionFullControl],
  },
  {
    label: '\u7528\u6237\u7ba1\u7406',
    value: '/user-management',
    pathname: 'user-management',
    icon: ManageAccountsOutlinedIcon,
    show: true,
    adminOnly: true,
    perms: [ConstsUserKBPermission.UserKBPermissionFullControl],
  },
  {
    label: '\u5e94\u7528\u8bbe\u7f6e',
    value: '/setting',
    pathname: 'application-setting',
    icon: IconChilun,
    show: true,
    perms: [ConstsUserKBPermission.UserKBPermissionFullControl],
  },
];

const Sidebar = () => {
  const { pathname } = useLocation();
  const { kbDetail, user } = useAppSelector(state => state.config);
  const theme = useTheme();
  const navigate = useNavigate();
  const menus = useMemo(() => {
    return MENUS.filter(it => {
      const hasPermission = it.perms.includes(kbDetail.perm!);
      const hasRoleAccess =
        !it.adminOnly || user.role === ConstsUserRole.UserRoleAdmin;
      return hasPermission && hasRoleAccess;
    });
  }, [kbDetail, user.role]);

  useEffect(() => {
    const menu = menus.find(
      it => pathname === it.value || pathname.startsWith(`${it.value}/`),
    );

    if (!menu && menus.length > 0 && pathname !== '/system') {
      navigate(menus[0].value);
    }
  }, [pathname, menus, navigate]);

  return (
    <Stack
      sx={{
        width: SIDEBAR_WIDTH,
        m: 2,
        zIndex: 999,
        p: 1.75,
        height: 'calc(100vh - 32px)',
        bgcolor: '#FFFFFF',
        borderRadius: '20px',
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'auto',
        border: `1px solid ${alpha(theme.palette.common.black, 0.08)}`,
        boxShadow: '0px 20px 40px rgba(18, 24, 40, 0.04)',
      }}
    >
      <Stack
        direction='row'
        alignItems='center'
        gap={1.25}
        sx={{
          flexShrink: 0,
          mb: 2,
          pb: 2,
          borderBottom: `1px solid ${alpha(theme.palette.common.black, 0.08)}`,
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '14px',
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'background.paper3',
            border: `1px solid ${alpha(theme.palette.common.black, 0.08)}`,
            flexShrink: 0,
          }}
        >
          <Avatar src={Logo} sx={{ width: 24, height: 24 }} />
        </Box>
        <Box
          sx={{
            fontSize: '17px',
            fontWeight: 700,
            color: 'text.primary',
            letterSpacing: '0.01em',
          }}
        >
          MindWeave
        </Box>
      </Stack>
      <Stack sx={{ py: 0.5, flexGrow: 1 }} gap={0.75}>
        {menus.map(it => {
          const isActive =
            pathname === it.value || pathname.startsWith(`${it.value}/`);

          if (!it.show) return null;
          const IconMenu = it.icon;
          return (
            <NavLink
              key={it.pathname}
              to={it.value}
              style={{
                textDecoration: 'none',
              }}
            >
              <Button
                disableRipple
                variant='text'
                sx={{
                  width: '100%',
                  minHeight: 48,
                  px: 1.25,
                  py: 0.75,
                  justifyContent: 'flex-start',
                  gap: 1.25,
                  position: 'relative',
                  color: isActive ? 'text.primary' : 'text.secondary',
                  fontWeight: isActive ? 600 : 500,
                  bgcolor: isActive
                    ? alpha(theme.palette.primary.main, 0.06)
                    : 'transparent',
                  border: `1px solid ${
                    isActive
                      ? alpha(theme.palette.primary.main, 0.12)
                      : 'transparent'
                  }`,
                  borderRadius: '14px',
                  transition:
                    'transform 180ms ease, background-color 180ms ease, border-color 180ms ease, color 180ms ease',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 8,
                    top: 14,
                    bottom: 14,
                    width: 3,
                    borderRadius: '999px',
                    bgcolor: isActive ? 'primary.main' : 'transparent',
                    transition: 'background-color 180ms ease',
                  },
                  ':hover': {
                    bgcolor: isActive
                      ? alpha(theme.palette.primary.main, 0.08)
                      : alpha(theme.palette.common.black, 0.03),
                    borderColor: isActive
                      ? alpha(theme.palette.primary.main, 0.16)
                      : alpha(theme.palette.common.black, 0.08),
                    color: 'text.primary',
                    transform: 'translateX(2px)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '10px',
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: isActive ? '#FFFFFF' : 'background.paper3',
                    border: `1px solid ${
                      isActive
                        ? alpha(theme.palette.primary.main, 0.12)
                        : alpha(theme.palette.common.black, 0.06)
                    }`,
                    transition:
                      'background-color 180ms ease, border-color 180ms ease, transform 180ms ease',
                  }}
                >
                  <IconMenu
                    sx={{
                      fontSize: 16,
                      color: isActive ? 'primary.main' : 'text.disabled',
                      transition: 'color 180ms ease, transform 180ms ease',
                    }}
                  />
                </Box>
                <Box
                  sx={{
                    lineHeight: 1.2,
                    textAlign: 'left',
                  }}
                >
                  {it.label}
                </Box>
              </Button>
            </NavLink>
          );
        })}
      </Stack>
    </Stack>
  );
};

export default Sidebar;
