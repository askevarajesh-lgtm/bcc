import React, { useEffect, useState } from 'react';
import {
  Typography, Card, Table, Select, Space, Button, Empty, Alert, Tag, message,
  Input, Row, Col, Popconfirm
} from 'antd';
import { Hash, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { seoWorkspaceApi } from '../../../../api/seoWorkspaceApi';
import ProjectSelector from '../components/shared/ProjectSelector';

const { Title, Text } = Typography;

const INTENT_OPTIONS = ['informational', 'navigational', 'commercial', 'transactional', 'unknown'];
const STATUS_COLORS = { Suggested: 'gold', Approved: 'green', Rejected: 'red' };

const KeywordsTab = () => {
  const [projectId, setProjectId] = useState(null);
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const [seedKeyword, setSeedKeyword] = useState('');
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);

  const [relatedInput, setRelatedInput] = useState('');
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [related, setRelated] = useState(null);

  const load = async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await seoWorkspaceApi.getKeywords({ projectId, status: statusFilter || undefined });
      setKeywords(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load keywords');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setRunResult(null); setKeywords([]); load(); }, [projectId, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const runResearch = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await seoWorkspaceApi.runKeywordResearchAgent(projectId, seedKeyword || undefined);
      setRunResult(res.data);
      message.success('Keyword research completed');
      load();
    } catch (err) {
      setError(err?.response?.data?.error || 'Keyword research failed');
    } finally {
      setRunning(false);
    }
  };

  const act = async (fn, successMsg) => {
    try {
      const res = await fn();
      message.success(`${successMsg}${res.modifiedCount != null ? ` (${res.modifiedCount})` : ''}`);
      setSelectedRowKeys([]);
      load();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Action failed');
    }
  };

  const fetchRelated = async () => {
    if (!relatedInput.trim()) return;
    setRelatedLoading(true);
    try {
      const res = await seoWorkspaceApi.getRelatedKeywords(projectId, relatedInput.trim());
      setRelated(res.data || []);
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to fetch related keywords');
    } finally {
      setRelatedLoading(false);
    }
  };

  const columns = [
    { title: 'Keyword', dataIndex: 'keyword', key: 'keyword' },
    { title: 'Volume', dataIndex: ['metrics', 'searchVolume'], key: 'volume', sorter: (a, b) => (a.metrics?.searchVolume || 0) - (b.metrics?.searchVolume || 0) },
    { title: 'Difficulty', dataIndex: ['metrics', 'keywordDifficulty'], key: 'kd' },
    { title: 'Intent', dataIndex: ['metrics', 'intent'], key: 'intent', render: (i) => <Tag>{i}</Tag> },
    { title: 'Rank', dataIndex: ['ranking', 'currentRank'], key: 'rank', render: (r) => r ?? '—' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={STATUS_COLORS[s] || 'default'}>{s}</Tag> },
    { title: 'Source', dataIndex: 'source', key: 'source', render: (s) => <Text type="secondary" style={{ fontSize: 12 }}>{s}</Text> }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Hash size={28} />
        <div>
          <Title level={4} style={{ margin: 0 }}>Keywords</Title>
          <Text type="secondary">Tracked keywords and AI-suggested opportunities per project.</Text>
        </div>
      </div>

      <ProjectSelector value={projectId} onChange={setProjectId} style={{ marginBottom: 20 }} />

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} closable onClose={() => setError(null)} />}

      {!projectId ? (
        <Empty description="Select or create a project to view keywords" />
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <Card size="small" title={<Space><Sparkles size={16} /> Keyword Research Agent</Space>} style={{ marginBottom: 16 }}>
              <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
                <Input placeholder="Optional seed keyword" value={seedKeyword} onChange={(e) => setSeedKeyword(e.target.value)} />
              </Space.Compact>
              <Button type="primary" block loading={running} onClick={runResearch}>Run Research</Button>
              {runResult && (
                <div style={{ marginTop: 12 }}>
                  <Text type="secondary">
                    {runResult.suggestedKeywords?.length || 0} suggestion(s) from {runResult.candidateCount || 0} candidate(s).
                  </Text>
                </div>
              )}
            </Card>

            <Card size="small" title="Related Keywords Lookup">
              <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
                <Input placeholder="e.g. running shoes" value={relatedInput} onChange={(e) => setRelatedInput(e.target.value)} onPressEnter={fetchRelated} />
                <Button loading={relatedLoading} onClick={fetchRelated}>Find</Button>
              </Space.Compact>
              {related && (
                <Table
                  rowKey={(r) => r.keyword}
                  size="small"
                  dataSource={related}
                  pagination={{ pageSize: 5 }}
                  locale={{ emptyText: <Empty description="No candidates found" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                  columns={[
                    { title: 'Keyword', dataIndex: 'keyword', key: 'keyword' },
                    { title: 'Volume', dataIndex: 'searchVolume', key: 'searchVolume' }
                  ]}
                />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={16}>
            <Card
              size="small"
              title="Tracked Keywords"
              extra={
                <Space>
                  <Select
                    allowClear
                    placeholder="Filter by status"
                    style={{ width: 160 }}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={['Suggested', 'Approved', 'Rejected'].map((s) => ({ value: s, label: s }))}
                  />
                  {selectedRowKeys.length > 0 && (
                    <>
                      <Popconfirm title={`Approve ${selectedRowKeys.length} keyword(s)?`} onConfirm={() => act(() => seoWorkspaceApi.approveKeywordSuggestions(projectId, selectedRowKeys), 'Approved')}>
                        <Button size="small" type="primary">Approve Selected</Button>
                      </Popconfirm>
                      <Button size="small" danger onClick={() => act(() => seoWorkspaceApi.rejectKeywordSuggestions(projectId, selectedRowKeys), 'Rejected')}>
                        Reject Selected
                      </Button>
                    </>
                  )}
                </Space>
              }
            >
              <Table
                rowKey="_id"
                size="small"
                loading={loading}
                dataSource={keywords}
                columns={columns}
                pagination={{ pageSize: 10 }}
                rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
                locale={{ emptyText: <Empty description="No keywords yet — run the research agent to get suggestions." /> }}
              />
            </Card>
          </Col>
        </Row>
      )}
    </motion.div>
  );
};

export default KeywordsTab;