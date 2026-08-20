import { getApiProV1Prompt, postApiProV1Prompt } from '@/request/pro/Prompt';
import { DomainKnowledgeBaseDetail } from '@/request/types';
import { PROFESSION_VERSION_PERMISSION } from '@/constant/version';
import { useAppSelector } from '@/store';
import { message, Modal } from '@ctzhian/ui';
import { Box, TextField } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormItem, SettingCardItem } from './Common';
import { DomainCreatePromptReq } from '@/request/pro/types';

interface CardAIProps {
  kb: DomainKnowledgeBaseDetail;
}

const CardAI = ({ kb }: CardAIProps) => {
  const [isEdit, setIsEdit] = useState(false);
  const { license } = useAppSelector(state => state.config);

  const { control, handleSubmit, setValue, getValues } = useForm({
    defaultValues: {
      content: '',
      summary_content: '',
    },
  });

  const onSubmit = handleSubmit(async data => {
    await postApiProV1Prompt({
      kb_id: kb.id!,
      content: data.content,
      summary_content: data.summary_content,
    });

    message.success('保存成功');
    setIsEdit(false);
  });

  const isPro = useMemo(() => {
    return PROFESSION_VERSION_PERMISSION.includes(license.edition!);
  }, [license]);

  useEffect(() => {
    if (!kb.id || !PROFESSION_VERSION_PERMISSION.includes(license.edition!))
      return;
    getApiProV1Prompt({ kb_id: kb.id! }).then(res => {
      setValue('content', res.content || '');
      setValue('summary_content', res.summary_content || '');
    });
  }, [kb, isPro]);

  const onResetPrompt = (type: 'content' | 'summary_content' = 'content') => {
    Modal.confirm({
      title: '提示',
      content: `确定要重置为默认${type === 'content' ? '智能问答' : '智能摘要'}提示词吗？`,
      onOk: () => {
        let params: DomainCreatePromptReq = {
          kb_id: kb.id!,
          content: '',
          summary_content: getValues('summary_content'),
        };
        if (type === 'summary_content') {
          params = {
            kb_id: kb.id!,
            summary_content: '',
            content: getValues('content'),
          };
        }
        postApiProV1Prompt(params).then(() => {
          getApiProV1Prompt({ kb_id: kb.id! }).then(res => {
            setValue(type, res[type] || '');
          });
        });
      },
    });
  };

  return (
    <Box
      sx={{
        width: 1000,
        margin: 'auto',
        pb: 4,
      }}
    >
      <SettingCardItem title='智能问答' isEdit={isEdit} onSubmit={onSubmit}>
        <FormItem
          vertical
          extra={
            <Box
              sx={{
                fontSize: 12,
                color: 'primary.main',
                display: 'block',
                cursor: 'pointer',
              }}
              onClick={() => onResetPrompt('content')}
            >
              重置为默认提示词
            </Box>
          }
          label='智能问答提示词'
        >
          <Controller
            control={control}
            name='content'
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                disabled={!isPro}
                multiline
                rows={20}
                placeholder='智能问答提示词'
                onChange={e => {
                  field.onChange(e.target.value);
                  setIsEdit(true);
                }}
              />
            )}
          />
        </FormItem>
        <FormItem
          vertical
          extra={
            <Box
              sx={{
                fontSize: 12,
                color: 'primary.main',
                display: 'block',
                cursor: 'pointer',
              }}
              onClick={() => onResetPrompt('summary_content')}
            >
              重置为默认提示词
            </Box>
          }
          label='智能摘要提示词'
        >
          <Controller
            control={control}
            name='summary_content'
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                disabled={!isPro}
                multiline
                rows={5}
                placeholder='智能摘要提示词'
                onChange={e => {
                  field.onChange(e.target.value);
                  setIsEdit(true);
                }}
              />
            )}
          />
        </FormItem>
      </SettingCardItem>
    </Box>
  );
};

export default CardAI;
