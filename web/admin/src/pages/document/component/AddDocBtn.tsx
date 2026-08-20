import TreeMenu, { TreeMenuItem } from '@/components/Drag/DragTree/TreeMenu';
import { ConstsCrawlerSource } from '@/request';
import { Box, Button } from '@mui/material';
import { useState } from 'react';
import AddDocByType from './AddDocByType';
import { CREATE_DOC_IMPORT_TYPES, TYPE_CONFIG } from './AddDocByType/constants';
import DocAddByCustomText from './DocAddByCustomText';

interface InputContentProps {
  exportFile?: boolean;
  refresh?: () => void;
  context?: React.ReactElement<{ onClick?: any; 'aria-describedby'?: any }>;
  createLocal?: (node: {
    id: string;
    name: string;
    type: 1 | 2;
    emoji?: string;
    parentId?: string | null;
    content_type?: string;
  }) => void;
  scrollTo?: (id: string) => void;
}

const AddDocBtn = ({
  exportFile = true,
  refresh,
  context,
  createLocal,
  scrollTo,
}: InputContentProps) => {
  const [customDocOpen, setCustomDocOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [key, setKey] = useState<ConstsCrawlerSource | null>(null);
  const [docFileKey, setDocFileKey] = useState<1 | 2>(1);

  const importMenuItems: TreeMenuItem[] = exportFile
    ? CREATE_DOC_IMPORT_TYPES.map(type => ({
        key: type,
        label: TYPE_CONFIG[type].label,
        onClick: () => {
          setUploadOpen(true);
          setKey(type);
        },
      }))
    : [];

  const menuItems: TreeMenuItem[] = [
    {
      key: 'docFile',
      label: '创建文件夹',
      onClick: () => {
        setDocFileKey(1);
        setCustomDocOpen(true);
      },
    },
    {
      key: 'next-line',
      label: '创建文档',
      onClick: () => {
        setDocFileKey(2);
        setCustomDocOpen(true);
      },
    },
    ...importMenuItems,
  ];

  const close = () => {
    setUploadOpen(false);
    setCustomDocOpen(false);
  };

  return (
    <Box>
      <TreeMenu
        menu={menuItems}
        context={context || <Button variant='contained'>创建文档</Button>}
      />
      {key && (
        <AddDocByType
          type={key}
          open={uploadOpen}
          refresh={refresh}
          onCancel={close}
          parentId={null}
        />
      )}
      <DocAddByCustomText
        type={docFileKey}
        open={customDocOpen}
        refresh={refresh}
        onCreated={node => {
          createLocal?.(node);
          scrollTo?.(node.id);
        }}
        onClose={() => setCustomDocOpen(false)}
      />
    </Box>
  );
};

export default AddDocBtn;
