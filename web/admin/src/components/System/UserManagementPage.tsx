import { ConstsUserRole } from '@/request/types';
import { useAppSelector } from '@/store';
import { Box } from '@mui/material';
import { Navigate } from 'react-router-dom';
import Member from './component/Member';

const UserManagementPage = () => {
  const { user } = useAppSelector(state => state.config);

  if (!user.id) return <></>;

  if (user.role !== ConstsUserRole.UserRoleAdmin) {
    return <Navigate to='/401' replace />;
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <Member />
    </Box>
  );
};

export default UserManagementPage;
