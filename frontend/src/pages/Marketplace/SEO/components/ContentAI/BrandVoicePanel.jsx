import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Switch, Space, message, Popconfirm, Tag } from 'antd';
import { contentAiApi } from '../../../../../api/contentAiApi';

const { TextArea } = Input;

const VOCAB_OPTIONS = ['simple', 'professional', 'technical'];
const SENTENCE_OPTIONS = ['short', 'mixed', 'long'];

// Every one of the 14 generators resolves brand voice through this same
// model (audience / tone / language / style) — see
// content-ai-platform-architecture.md §3. This panel is the only place
// that data is authored.
const BrandVoicePanel = () => {
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const res = await contentAiApi.getBrandVoices();
      setVoices(res.data || []);
    } catch (err) {
      message.error('Failed to load brand voices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (voice) => {
    setEditing(voice);
    form.setFieldsValue({
      name: voice.name,
      isDefault: voice.isDefault,
      audienceDescription: voice.audience?.description,
      painPoints: (voice.audience?.painPoints || []).join(', '),
      tonePrimary: voice.tone?.primary,
      toneTraits: (voice.tone?.traits || []).join(', '),
      language: voice.language?.primary,
      locale: voice.language?.locale,
      vocabularyLevel: voice.style?.vocabularyLevel,
      sentenceLength: voice.style?.sentenceLength,
      prohibitedWords: (voice.style?.prohibitedWords || []).join(', '),
      requiredPhrases: (voice.style?.requiredPhrases || []).join(', ')
    });
    setModalOpen(true);
  };

  const toArray = (str) => (str || '').split(',').map((s) => s.trim()).filter(Boolean);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = {
      name: values.name,
      isDefault: Boolean(values.isDefault),
      audience: { description: values.audienceDescription || '', painPoints: toArray(values.painPoints) },
      tone: { primary: values.tonePrimary || 'Professional', traits: toArray(values.toneTraits) },
      language: { primary: values.language || 'en', locale: values.locale || 'en-US' },
      style: {
        vocabularyLevel: values.vocabularyLevel || 'professional',
        sentenceLength: values.sentenceLength || 'mixed',
        prohibitedWords: toArray(values.prohibitedWords),
        requiredPhrases: toArray(values.requiredPhrases)
      }
    };

    try {
      if (editing) {
        await contentAiApi.updateBrandVoice(editing._id, payload);
      } else {
        await contentAiApi.createBrandVoice(payload);
      }
      message.success('Brand voice saved');
      setModalOpen(false);
      load();
    } catch (err) {
      message.error(err?.response?.data?.error || 'Failed to save brand voice');
    }
  };

  const handleDelete = async (id) => {
    try {
      await contentAiApi.deleteBrandVoice(id);
      message.success('Brand voice deleted');
      load();
    } catch (err) {
      message.error(err?.response?.data?.error || 'Failed to delete brand voice');
    }
  };

  const columns = [
    {
      title: 'Name', dataIndex: 'name', key: 'name',
      render: (name, record) => <Space>{name}{record.isDefault && <Tag color="blue">Default</Tag>}</Space>
    },
    { title: 'Tone', key: 'tone', render: (_, r) => r.tone?.primary },
    { title: 'Language', key: 'language', render: (_, r) => `${r.language?.primary} (${r.language?.locale})` },
    { title: 'Vocabulary', key: 'vocab', render: (_, r) => r.style?.vocabularyLevel },
    {
      title: '', key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEdit(record)}>Edit</Button>
          <Popconfirm title="Delete this brand voice?" onConfirm={() => handleDelete(record._id)}>
            <Button size="small" danger>Delete</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Card
      size="small"
      title="Brand Voice"
      style={{ borderRadius: 12, border: '1px solid var(--border-color)' }}
      extra={<Button type="primary" onClick={openCreate}>New Brand Voice</Button>}
    >
      <Table rowKey="_id" loading={loading} columns={columns} dataSource={voices} size="small" pagination={false} />

      <Modal
        title={editing ? 'Edit Brand Voice' : 'New Brand Voice'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        width={640}
        okText="Save"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Default, Clinic Line, B2B Line" />
          </Form.Item>
          <Form.Item name="isDefault" label="Set as workspace default" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item name="audienceDescription" label="Audience description">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="painPoints" label="Audience pain points (comma-separated)">
            <Input />
          </Form.Item>

          <Space style={{ width: '100%' }}>
            <Form.Item name="tonePrimary" label="Primary tone" style={{ width: 260 }}>
              <Input placeholder="e.g. Friendly-Authoritative" />
            </Form.Item>
            <Form.Item name="toneTraits" label="Tone traits (comma-separated)" style={{ width: 260 }}>
              <Input placeholder="e.g. warm, direct" />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }}>
            <Form.Item name="language" label="Language" style={{ width: 130 }}>
              <Input placeholder="en" />
            </Form.Item>
            <Form.Item name="locale" label="Locale" style={{ width: 130 }}>
              <Input placeholder="en-US" />
            </Form.Item>
            <Form.Item name="vocabularyLevel" label="Vocabulary level" style={{ width: 180 }}>
              <Select options={VOCAB_OPTIONS.map((v) => ({ value: v, label: v }))} />
            </Form.Item>
            <Form.Item name="sentenceLength" label="Sentence length" style={{ width: 180 }}>
              <Select options={SENTENCE_OPTIONS.map((v) => ({ value: v, label: v }))} />
            </Form.Item>
          </Space>

          <Form.Item name="prohibitedWords" label="Prohibited words/phrases (comma-separated)">
            <Input />
          </Form.Item>
          <Form.Item name="requiredPhrases" label="Preferred phrases (comma-separated)">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default BrandVoicePanel;
