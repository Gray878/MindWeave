import Card from '@/components/Card';
import { getApiV1ModelList } from '@/request/Model';
import {
  ConstsUserRole,
  GithubComChaitinPandaWikiDomainModelListItem,
} from '@/request/types';
import { useAppDispatch, useAppSelector } from '@/store';
import { setModelList, setModelStatus } from '@/store/slices/config';
import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import ModelConfig from './component/ModelConfig';

const ModelConfigPage = () => {
  const dispatch = useAppDispatch();
  const { user, modelList } = useAppSelector(state => state.config);
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
      <Card
        sx={{
          height: 'calc(100vh - 148px)',
          overflow: 'auto',
        }}
      >
        <ModelConfig
          onCloseModal={() => {}}
          chatModelData={chatModelData}
          embeddingModelData={embeddingModelData}
          rerankModelData={rerankModelData}
          analysisModelData={analysisModelData}
          analysisVLModelData={analysisVLModelData}
          getModelList={getModelList}
        />
      </Card>
    </Box>
  );
};

export default ModelConfigPage;
