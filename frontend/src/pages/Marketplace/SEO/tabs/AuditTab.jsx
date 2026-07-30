import React, { useEffect, useState } from 'react';
import { Typography, Card, Row, Col, Button, Progress, Table, Space, Empty, Alert, message, Tag } from 'antd';
import { ClipboardCheck, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { seoWorkspaceApi } from '../../../../api/seoWorkspaceApi';
import ProjectSelector from '../components/shared/ProjectSelector';
import AgentFindingsCard from '../components/shared/AgentFindingsCard';
import { SeverityTag } from '../components/shared/StatusTags';

const { Title, Text } = Typography;

const scoreColor = (score) => (score > 80 ? '#52c41a' : score > 50 ? '#faad14' : '#f5222d');

const AuditTab = () => {
  const [projectId, setProjectId] = useState(null);
  const [runningBasic, setRunningBasic] = useState(false);
  const [basicAudit, setBasicAudit] = useState(null);
  const [pastAudits, setPastAudits] = useState([]);
  const [loadingPast, setLoadingPast] = useState(false);
  const [error, setError] = useState(null);

  const loadPastAudits = async (pid) => {
    setLoadingPast(true);
    try {
      const audits = await seoWorkspaceApi.getAudits(pid);
      setPastAudits(Array.isArray(audits) ? audits : []);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load past audits');
    } finally {
      setLoadingPast(false);
    }
  };

  useEffect(() => {
    setBasicAudit(null);
    if (projectId) loadPastAudits(projectId);
  }, [projectId]);

  const runBasicAudit = async () => {
    setRunningBasic(true);
    setError(null);
    try {
      const res = await seoWorkspaceApi.runAudit(projectId);
      setBasicAudit(res.data);
      message.success('Audit completed');
      loadPastAudits(projectId);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to run audit');
    } finally {
      setRunningBasic(false);
    }
  };

  const findingsColumns = [
    { title: 'Category', dataIndex: 'category', key: 'category', render: (c) => <Tag>{c?.replace(/_/g, ' ')}</Tag> },
    { title: 'Severity', dataIndex: 'severity', key: 'severity', render: (s) => <SeverityTag severity={s} /> },
    { title: 'Issue', dataIndex: 'issue', key: 'issue' },
    { title: 'Recommendation', dataIndex: 'recommendation', key: 'recommendation' },
    { title: 'Page', dataIndex: 'pageUrl', key: 'pageUrl', render: (u) => u || '—' }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <ClipboardCheck size={28} />
        <div>
          <Title level={4} style={{ margin: 0 }}>Audit</Title>
          <Text type="secondary">Run technical/on-page score audits and the AI SEO Auditor agent per project.</Text>
        </div>
      </div>

      <ProjectSelector value={projectId} onChange={setProjectId} style={{ marginBottom: 20 }} />

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} closable onClose={() => setError(null)} />}

      {!projectId ? (
        <Empty description="Select or create a project to run an audit" />
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <Card size="small" title={<Space><Activity size={16} /> On-Page Score</Space>} style={{ height: '100%' }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Progress
                  type="dashboard"
                  percent={Math.round(basicAudit?.metrics?.overall || basicAudit?.metrics?.onpageScore || 0)}
                  strokeColor={scoreColor(basicAudit?.metrics?.overall || basicAudit?.metrics?.onpageScore || 0)}
                />
              </div>
              <Button type="primary" block loading={runningBasic} onClick={runBasicAudit}>Run Audit</Button>

              {basicAudit && (
                <div style={{ marginTop: 16 }}>
                  <Row gutter={[8, 8]}>
                    <Col span={12}><Text type="secondary">Pages crawled</Text><div><Text strong>{basicAudit.metrics?.pagesCrawled ?? 0}</Text></div></Col>
                    <Col span={12}><Text type="secondary">Errors</Text><div><Text strong>{basicAudit.metrics?.pagesWithErrors ?? 0}</Text></div></Col>
                    <Col span={12}><Text type="secondary">Broken links</Text><div><Text strong>{basicAudit.issues?.brokenLinks ?? 0}</Text></div></Col>
                    <Col span={12}><Text type="secondary">SSL issues</Text><div><Text strong>{basicAudit.issues?.sslIssues ?? 0}</Text></div></Col>
                  </Row>
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={16}>
            <AgentFindingsCard
              title="SEO Auditor Agent"
              runLabel="Run AI Audit"
              emptyHint="Run the SEO Auditor agent to get AI-analyzed findings with severity and recommendations."
              columns={findingsColumns}
              onRun={() => seoWorkspaceApi.runAuditorAgent(projectId)}
              onApprove={(auditId) => seoWorkspaceApi.approveAuditFindings(projectId, auditId)}
              onReject={(auditId, reason) => seoWorkspaceApi.rejectAuditFindings(projectId, auditId, reason)}
              onLoadHistory={() => seoWorkspaceApi.getAuditorHistory(projectId)}
            />
          </Col>

          <Col span={24}>
            <Card size="small" title="Past Audits">
              <Table
                rowKey="_id"
                size="small"
                loading={loadingPast}
                dataSource={pastAudits || []}
                pagination={{ pageSize: 5 }}
                locale={{ emptyText: <Empty description="No audits run yet for this project" /> }}
                columns={[
                  { title: 'Date', dataIndex: 'createdAt', key: 'createdAt', render: (d) => new Date(d).toLocaleString() },
                  { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag>{s}</Tag> },
                  { title: 'Overall Score', key: 'overall', render: (_, r) => r.metrics?.overall ?? r.metrics?.onpageScore ?? '—' },
                  { title: 'Findings', key: 'findings', render: (_, r) => r.agent?.findings?.length ?? 0 },
                  { title: 'Approval', key: 'approval', render: (_, r) => r.agent?.approvalStatus || 'Not Requested' }
                ]}
              />
            </Card>
          </Col>
        </Row>
      )}
    </motion.div>
  );
};

export default AuditTab;