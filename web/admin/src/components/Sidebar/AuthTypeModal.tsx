import HelpCenter from '@/assets/json/help-center.json';
import IconUpgrade from '@/assets/json/upgrade.json';
import { useVersionInfo } from '@/hooks';
import { useAppSelector } from '@/store';
import { Box, Button, Stack } from '@mui/material';
import { Modal } from '@ctzhian/ui';
import dayjs from 'dayjs';
import LottieIcon from '../LottieIcon';
import { ConstsLicenseEdition } from '@/request/types';

interface AuthTypeModalProps {
  open: boolean;
  onClose: () => void;
  curVersion: string;
  latestVersion: string;
}

const AuthTypeModal = ({
  open,
  onClose,
  curVersion,
  latestVersion,
}: AuthTypeModalProps) => {
  const { license } = useAppSelector(state => state.config);

  const versionInfo = useVersionInfo();

  return (
    <>
      <Modal
        open={open}
        footer={null}
        title='关于 MindWeave'
        onCancel={onClose}
      >
        <Stack gap={1} sx={{ fontSize: 14, lineHeight: '32px' }}>
          <Stack direction={'row'} alignItems={'center'}>
            <Box sx={{ width: 120, flexShrink: 0 }}>当前版本</Box>
            <Stack direction={'row'} alignItems={'center'} gap={2}>
              <Box sx={{ fontWeight: 700, minWidth: 50 }}>{curVersion}</Box>
              {latestVersion === `v${curVersion}` ? (
                <Box sx={{ color: 'text.tertiary', fontSize: 12 }}>
                  已是最新版本，无需更新
                </Box>
              ) : (
                <Button
                  size='small'
                  startIcon={
                    <Box>
                      <LottieIcon
                        id='version'
                        src={latestVersion === '' ? HelpCenter : IconUpgrade}
                        style={{ width: 16, height: 16, display: 'flex' }}
                      />
                    </Box>
                  }
                  onClick={() => {
                    window.open(
                      'https://pandawiki.docs.baizhi.cloud/node/01971615-05b8-7924-9af7-15f73784f893',
                    );
                  }}
                >
                  立即更新
                </Button>
              )}
            </Stack>
          </Stack>
          <Stack direction={'row'} alignItems={'center'}>
            <Box sx={{ width: 120, flexShrink: 0 }}>产品型号</Box>
            <Stack direction={'row'} alignItems={'center'} gap={2}>
              <Box sx={{ minWidth: 50 }}>{versionInfo.label}</Box>
              <Button
                size='small'
                startIcon={
                  <Box>
                    <LottieIcon
                      id='consult'
                      src={HelpCenter}
                      style={{ width: 16, height: 16, display: 'flex' }}
                    />
                  </Box>
                }
                onClick={() => {
                  window.open('https://baizhi.cloud/consult');
                }}
              >
                商务咨询
              </Button>
            </Stack>
          </Stack>
          <Box
            sx={{ color: 'text.tertiary', fontSize: 12, ml: '120px', mt: -1 }}
          >
            当前本地源码部署未启用授权接口，默认按社区版能力运行。
          </Box>
          {license.edition! !== ConstsLicenseEdition.LicenseEditionFree && (
            <Box>
              <Stack direction={'row'} alignItems={'center'}>
                <Box sx={{ width: 120, flexShrink: 0 }}>授权时间</Box>
                <Box>
                  {dayjs.unix(license.started_at!).format('YYYY-MM-DD')}
                </Box>
                <Box sx={{ mx: 1 }}>~</Box>
                <Box>
                  {dayjs.unix(license.expired_at!).format('YYYY-MM-DD')}
                </Box>
              </Stack>
              {dayjs.unix(license.expired_at!).diff(dayjs(), 'day') < 0 && (
                <Box
                  sx={{
                    color: 'error.main',
                    ml: '120px',
                    fontSize: 13,
                    mt: -1,
                  }}
                >
                  授权已到期
                </Box>
              )}
            </Box>
          )}
        </Stack>
      </Modal>
    </>
  );
};

export default AuthTypeModal;
