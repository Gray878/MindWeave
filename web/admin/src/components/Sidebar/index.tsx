import Logo from '@/assets/images/logo.png';
import Avatar from '../Avatar';
import { useAppSelector } from '@/store';
import { Box, Button, Stack, useTheme } from '@mui/material';
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

const MENUS: MenuItem[] = [
  {
    label: '文档',
    value: '/',
    pathname: 'document',
    icon: IconNeirongguanli,
    show: true,
    perms: [
      ConstsUserKBPermission.UserKBPermissionFullControl,
      ConstsUserKBPermission.UserKBPermissionDocManage,
    ],
  },
  {
    label: '统计',
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
    label: '图谱',
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
    label: '问答',
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
    label: '反馈',
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
    label: '发布',
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
    label: '配置',
    value: '/system',
    pathname: 'system',
    icon: IconAChilunshezhisheding,
    show: true,
    adminOnly: true,
    perms: [ConstsUserKBPermission.UserKBPermissionFullControl],
  },
  {
    label: '设置',
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
    const menu = menus.find(it => {
      if (it.value === '/') {
        return pathname === '/';
      }
      return pathname.startsWith(it.value);
    });

    if (!menu && menus.length > 0 && pathname !== '/system') {
      navigate(menus[0].value);
    }
  }, [pathname, menus, navigate]);

  return (
    <Stack
      sx={{
        width: 138,
        m: 2,
        zIndex: 999,
        p: 2,
        height: 'calc(100vh - 32px)',
        bgcolor: '#FFFFFF',
        borderRadius: '12px',
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'auto',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack
        direction={'row'}
        alignItems={'center'}
        justifyContent={'center'}
        sx={{
          flexShrink: 0,
          mb: 2,
          pb: 2,
          borderBottom: `2px solid ${theme.palette.divider}`,
        }}
      >
        <Avatar src={Logo} sx={{ width: 32, height: 32 }} />
      </Stack>
      <Box
        sx={{
          fontSize: '16px',
          fontWeight: 600,
          color: 'text.primary',
          textAlign: 'center',
          mb: 1,
        }}
      >
        MindWeave
      </Box>
      <Stack sx={{ py: 1, flexGrow: 1 }} gap={0.5}>
        {menus.map(it => {
          const isActive =
            it.value === '/' ? pathname === '/' : pathname.startsWith(it.value);

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
                variant='text'
                sx={{
                  width: '100%',
                  height: 44,
                  px: 1.5,
                  justifyContent: 'flex-start',
                  color: isActive ? 'primary.main' : 'text.secondary',
                  fontWeight: isActive ? '600' : '400',
                  bgcolor: isActive ? 'primary.lighter' : 'transparent',
                  borderLeft: isActive ? '3px solid' : '3px solid transparent',
                  borderLeftColor: isActive ? 'primary.main' : 'transparent',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  ':hover': {
                    bgcolor: isActive ? 'primary.lighter' : 'action.hover',
                    color: isActive ? 'primary.main' : 'text.primary',
                  },
                }}
              >
                <IconMenu
                  sx={{
                    fontSize: 16,
                    mr: 1,
                    color: isActive ? 'primary.main' : 'text.disabled',
                  }}
                />
                {it.label}
              </Button>
            </NavLink>
          );
        })}
      </Stack>
    </Stack>
  );
};

export default Sidebar;
