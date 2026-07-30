import React, { useState } from 'react';
import { Typography, Card, Table, Button, Space, Empty, Alert, Tag, message, Popconfirm, Collapse } from 'antd';
import { Swords, History as HistoryIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { seoWorkspaceApi } from '../../../../api/seoWorkspaceApi';
import ProjectSelector from '../components/shared/ProjectSelector';

const { Title, Text, Paragraph } = Typography;

const THREAT_COLORS = { low: 'blue', medium: 'gold', high: 'red' };
const STATUS_COLORS = { Suggested: 'gold', Approved: 'green', Rejected: 'red' };

const CompetitorsTab = () => {
  const [projectId, setProjectId] = useState(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const run = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await seoWorkspaceApi.runCompetitorAgent(projectId);
      setResult(res.data);
      setSelectedRowKeys([]);
      message.success('Competitor analysis completed');
    } catch (err) {
      setError(err?.response?.data?.error || 'Competitor analysis failed');
    } finally {
      setRunning(false);
    }
  };

  const act = async (fn, successMsg) => {
    try {
      const res = await fn();
      message.success(`${successMsg}${res.modifiedCount != null ? ` (${res.modifiedCount})` : ''}`);
      setSelectedRowKeys([]);
    } catch (err) {
      message.error(err?.response?.data?.message || 'Action failed');
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await seoWorkspaceApi.getCompetitorHistory(projectId);
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      message.error('Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const columns = [
    { title: 'Domain', dataIndex: 'domain', key: 'domain' },
    { title: 'Threat', dataIndex: ['agent', 'threatLevel'], key: 'threat', render: (t) => <Tag color={THREAT_COLORS[t] || 'default'}>{(t || 'medium').toUpperCase()}</Tag> },
    { title: 'Organic Keywords', dataIndex: ['metrics', 'organicKeywords'], key: 'organicKeywords' },
    { title: 'Organic Traffic', dataIndex: ['metrics', 'organicTraffic'], key: 'organicTraffic' },
    { title: 'Common Keywords', dataIndex: ['metrics', 'commonKeywords'], key: 'commonKeywords' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={STATUS_COLORS[s] || 'default'}>{s}</Tag> }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Swords size={28} />
        <div>
          <Title level={4} style={{ margin: 0 }}>Competitors</Title>
          <Text type="secondary">AI-identified competitors, threat level, and content gaps per project.</Text>
        </div>
      </div>

      <ProjectSelector value={projectId} onChange={setProjectId} style={{ marginBottom: 20 }} />

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} closable onClose={() => setError(null)} />}

      {!projectId ? (
        <Empty description="Select or create a project to run competitor analysis" />
      ) : (
        <Card
          size="small"
          title="Competitor Agent"
          extra={
            <Space>
              {selectedRowKeys.length > 0 && (
                <>
                  <Popconfirm title={`Approve ${selectedRowKeys.length} competitor(s)?`} onConfirm={() => act(() => seoWorkspaceApi.approveCompetitorSuggestions(projectId, selectedRowKeys), 'Approved')}>
                    <Button size="small" type="primary">Approve Selected</Button>
                  </Popconfirm>
                  <Button size="small" danger onClick={() => act(() => seoWorkspaceApi.rejectCompetitorSuggestions(projectId, selectedRowKeys), 'Rejected')}>
                    Reject Selected
                  </Button>
                </>
              )}
              <Button type="primary" loading={running} onClick={run}>Run Analysis</Button>
            </Space>
          }
        >
          {!result ? (
            <Empty description="Run the competitor agent to discover competitors and content gaps." image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              {result.summary && <Paragraph>{result.summary}</Paragraph>}
              <Text type="secondary">{result.candidateCount} candidate(s) analyzed, {result.suggestedCompetitors?.length || 0} suggested.</Text>

              <Table
                rowKey="_id"
                size="small"
                dataSource={Array.isArray(result.suggestedCompetitors) ? result.suggestedCompetitors : []}
                columns={columns}
                rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys, getCheckboxProps: (r) => ({ disabled: r.status !== 'Suggested' }) }}
                pagination={{ pageSize: 10 }}
                expandable={{
                  rowExpandable: (r) => (r.agent?.strengths?.length || r.agent?.weaknesses?.length || r.agent?.contentGaps?.length),
                  expandedRowRender: (r) => (
                    <Space direction="vertical" size={4}>
                      {r.agent?.strengths?.length > 0 && <Text><Text strong>Strengths:</Text> {r.agent.strengths.join(', ')}</Text>}
                      {r.agent?.weaknesses?.length > 0 && <Text><Text strong>Weaknesses:</Text> {r.agent.weaknesses.join(', ')}</Text>}
                      {r.agent?.contentGaps?.length > 0 && <Text><Text strong>Content Gaps:</Text> {r.agent.contentGaps.join(', ')}</Text>}
                      {r.agent?.rationale && <Text type="secondary">{r.agent.rationale}</Text>}
                    </Space>
                  )
                }}
                locale={{ emptyText: <Empty description="No competitors suggested" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
              />
            </Space>
          )}

          <Collapse
            style={{ marginTop: 16 }}
            items={[{
              key: 'history',
              label: <Space><HistoryIcon size={14} /> Execution History</Space>,
              children: (
                <>
                  {!history && <Button size="small" loading={historyLoading} onClick={loadHistory}>Load history</Button>}
                  {history && (
                    <Table
                      rowKey={(r, i) => r._id || i}
                      size="small"
                      pagination={{ pageSize: 5 }}
                      dataSource={Array.isArray(history) ? history : []}
                      locale={{ emptyText: <Empty description="No previous runs" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                      columns={[
                        { title: 'Status', dataIndex: 'status', key: 'status' },
                        { title: 'Started', dataIndex: 'createdAt', key: 'createdAt', render: (d) => d ? new Date(d).toLocaleString() : '-' },
                        { title: 'Duration', dataIndex: 'durationMs', key: 'durationMs', render: (v) => v ? `${(v / 1000).toFixed(1)}s` : '-' }
                      ]}
                    />
                  )}
                </>
              )
            }]}
          />
        </Card>
      )}
    </motion.div>
  );
};

export default CompetitorsTab;