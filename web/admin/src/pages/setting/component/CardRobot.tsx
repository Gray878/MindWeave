import { DomainKnowledgeBaseDetail } from '@/request/types';
import { Box } from '@mui/material';
import CardRobotWebComponent from './CardRobot/WebComponent';
import CardRobotApi from './CardRobotApi';
import CardRobotDing from './CardRobotDing';
import CardRobotDiscord from './CardRobotDiscord';
import CardRobotFeishu from './CardRobotFeishu';
import CardRobotLark from './CardRobotLark';

const CardRobot = ({
  kb,
  url,
}: {
  kb: DomainKnowledgeBaseDetail;
  url: string;
}) => {
  return (
    <Box
      sx={{
        width: 1000,
        margin: 'auto',
        pb: 4,
      }}
    >
      <CardRobotWebComponent kb={kb} />
      <CardRobotApi kb={kb} url={url} />
      <CardRobotDing kb={kb} />
      <CardRobotFeishu kb={kb} />
      <CardRobotLark kb={kb} url={url} />
      <CardRobotDiscord kb={kb} />
    </Box>
  );
};

export default CardRobot;
