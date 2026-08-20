import Card from '@/components/Card';
import { useURLSearchParams } from '@/hooks';
import { getApiV1ModelList } from '@/request/Model';
import {
  ConstsUserRole,
  GithubComChaitinPandaWikiDomainModelListItem,
} from '@/request/types';
import { useAppDispatch, useAppSelector } from '@/store';
import { setModelList, setModelStatus } from '@/store/slices/config';
import { Box, Tab, Tabs, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import Member from './component/Member';
import ModelConfig from './component/ModelConfig';

const SystemTabs = [
  { label: '模型配置', id: 'model-config' },
  { label: '用户管理', id: 'user-management' },
];

const System = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { user, modelList } = useAppSelector(state => state.config);
  const [searchParams, setSearchParams] = useURLSearchParams();
  const activeTab = searchParams.get('tab') || 'model-config';
  const [chatModelData, setChatModelData] =
    useState<GithubComChaitinPandaWikiDomainModelListItem | null>(null);
  const [embeddingModelData, setEmbeddingModelData] =
    useState<GithubComChaitinPandaWikiDomainModelListItem | null>(null);
  const [rerankModelData, setRerankModelData] =
    useState<GithubComChaitinPandaWikiDomainModelListItem | null>(null);
  const [analysisModelData, setAnalysisModelData] =
    useState<GithubComChaitinPandaWikiDomainModelListItem | null>(null);
  const [analysisVLModelData, setAnalysisVLModelData] =
    useState<GithubComChaitinPandaWikiDomainModelListItem | null>(null);

  const getModelList = () => {
    getApiV1ModelList().then(res => {
      dispatch(
        setModelList(res as GithubComChaitinPandaWikiDomainModelListItem[]),
      );
    });
  };

  const handleModelList = (
    list: GithubComChaitinPandaWikiDomainModelListItem[],
  ) => {
    const chat = list.find(it => it.type === 'chat') || null;
    const embedding = list.find(it => it.type === 'embedding') || null;
    const rerank = list.find(it => it.type === 'rerank') || null;
    const analysis = list.find(it => it.type === 'analysis') || null;
    const analysisVL = list.find(it => it.type === 'analysis-vl') || null;

    setChatModelData(chat);
    setEmbeddingModelData(embedding);
    setRerankModelData(rerank);
    setAnalysisModelData(analysis);
    setAnalysisVLModelData(analysisVL);

    const status = !!(chat && embedding && rerank);
    dispatch(setModelStatus(status));
  };

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  useEffect(() => {
    if (modelList) {
      handleModelList(modelList);
    }
  }, [modelList]);

  useEffect(() => {
    if (
      user.role === ConstsUserRole.UserRoleAdmin &&
      (!modelList || modelList.length === 0)
    ) {
      getModelList();
    }
  }, [modelList, user.role]);

  if (!user.id) return <></>;

  if (user.role !== ConstsUserRole.UserRoleAdmin) {
    return <Navigate to='/401' replace />;
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <Card sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
        <Tabs
          value={activeTab}
          onChange={(event, newValue) => setActiveTab(newValue as string)}
          aria-label='system tabs'
          sx={{
            '& .MuiTabs-indicator': {
              display: 'none',
            },
            '& .MuiTab-root': {
              minHeight: 48,
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 400,
              color: theme.palette.text.secondary,
              position: 'relative',
              '&.Mui-selected': {
                color: theme.palette.primary.main,
                fontWeight: 500,
              },
              '&.Mui-selected::after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '40px',
                height: '2px',
                backgroundColor: theme.palette.primary.main,
                zIndex: 1,
              },
            },
          }}
        >
          {SystemTabs.map(tab => (
            <Tab key={tab.id} label={tab.label} value={tab.id} />
          ))}
        </Tabs>
      </Card>
      <Card
        sx={{
          height: 'calc(100vh - 148px)',
          overflow: 'auto',
        }}
      >
        {activeTab === 'user-management' && (
          <Box>
            <Member />
          </Box>
        )}
        {activeTab === 'model-config' && (
          <Box>
            <ModelConfig
              onCloseModal={() => {}}
              chatModelData={chatModelData}
              embeddingModelData={embeddingModelData}
              rerankModelData={rerankModelData}
              analysisModelData={analysisModelData}
              analysisVLModelData={analysisVLModelData}
              getModelList={getModelList}
            />
          </Box>
        )}
      </Card>
    </Box>
  );
};

export default System;
