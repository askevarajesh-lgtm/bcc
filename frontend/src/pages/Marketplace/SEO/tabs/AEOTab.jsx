import React, { useState } from 'react';
import { Typography, Card, Row, Col, Progress, Tag, Space, Empty, Tooltip, Collapse, List } from 'antd';
import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { seoWorkspaceApi } from '../../../../api/seoWorkspaceApi';
import ProjectSelector from '../components/shared/ProjectSelector';
import AgentFindingsCard from '../components/shared/AgentFindingsCard';

const { Title, Text, Paragraph } = Typography;

const scoreColor = (score) => (score > 80 ? '#52c41a' : score > 50 ? '#faad14' : '#f5222d');

const AEOTab = () => {
  const [projectId, setProjectId] = useState(null);
  const [doc, setDoc] = useState(null);

  const pages = Array.isArray(doc?.agent?.pages) ? doc.agent.pages : [];
  const avgScore = pages.length
    ? Math.round(pages.reduce((sum, p) => sum + (p.aeoReadinessScore || 0), 0) / pages.length)
    : null;

  const columns = [
    {
      title: 'Page',
      dataIndex: 'pageUrl',
      key: 'pageUrl',
      render: (u) => (
        <Tooltip title={u}>
          <a href={u} target="_blank" rel="noreferrer" style={{ wordBreak: 'break-all' }}>{u}</a>
        </Tooltip>
      )
    },
    {
      title: 'Readiness',
      dataIndex: 'aeoReadinessScore',
      key: 'aeoReadinessScore',
      width: 120,
      sorter: (a, b) => (a.aeoReadinessScore || 0) - (b.aeoReadinessScore || 0),
      render: (score) => score === null || score === undefined
        ? <Text type="secondary">—</Text>
        : <Tag color={scoreColor(score) === '#52c41a' ? 'green' : scoreColor(score) === '#faad14' ? 'gold' : 'red'}>{score}/100</Tag>
    },
    {
      title: 'Missing Elements',
      dataIndex: 'missingElements',
      key: 'missingElements',
      render: (items) => (
        <Space size={[4, 4]} wrap>
          {(items || []).length === 0 ? <Text type="secondary">—</Text> : items.map((m, i) => <Tag key={i}>{m}</Tag>)}
        </Space>
      )
    },
    {
      title: 'Direct Answer Suggestion',
      dataIndex: 'directAnswerSuggestion',
      key: 'directAnswerSuggestion',
      render: (text) => text ? <Text type="secondary" style={{ fontSize: 12 }}>{text}</Text> : <Text type="secondary">—</Text>
    },
    {
      title: 'FAQ Suggestions',
      dataIndex: 'suggestedFaqBlock',
      key: 'suggestedFaqBlock',
      render: (faqs) => (!faqs || faqs.length === 0) ? <Text type="secondary">—</Text> : (
        <Collapse
          size="small"
          ghost
          items={[{
            key: 'faqs',
            label: <Text style={{ fontSize: 12 }}>{faqs.length} question{faqs.length > 1 ? 's' : ''}</Text>,
            children: (
              <List
                size="small"
                dataSource={faqs}
                renderItem={(f) => (
                  <List.Item>
                    <div>
                      <Text strong style={{ fontSize: 12 }}>{f.question}</Text>
                      <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 0 }}>{f.answer}</Paragraph>
                    </div>
                  </List.Item>
                )}
              />
            )
          }]}
        />
      )
    }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <MessageCircle size={28} />
        <div>
          <Title level={4} style={{ margin: 0 }}>AEO</Title>
          <Text type="secondary">Answer Engine Optimization — per-page readiness for AI answer engines (Google AI Overviews, ChatGPT, Perplexity, Gemini, Copilot).</Text>
        </div>
      </div>

      <ProjectSelector value={projectId} onChange={(v) => { setProjectId(v); setDoc(null); }} style={{ marginBottom: 20 }} />

      {!projectId ? (
        <Empty description="Select or create a project to run the AEO Agent" />
      ) : (
        <Row gutter={[16, 16]}>
          {avgScore !== null && (
            <Col xs={24} lg={6}>
              <Card size="small" title="Avg. AEO Readiness" style={{ height: '100%' }}>
                <div style={{ textAlign: 'center' }}>
                  <Progress type="dashboard" percent={avgScore} strokeColor={scoreColor(avgScore)} />
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">{pages.length} page{pages.length !== 1 ? 's' : ''} analyzed</Text>
                  </div>
                </div>
              </Card>
            </Col>
          )}

          <Col xs={24} lg={avgScore !== null ? 18 : 24}>
            <AgentFindingsCard
              title="AEO Agent"
              runLabel="Run AEO Agent"
              emptyHint="Run the AEO Agent to score each page's answer-engine readiness and get direct-answer / FAQ suggestions."
              findingsKey="pages"
              columns={columns}
              doc={doc}
              onDocChange={setDoc}
              onRun={() => seoWorkspaceApi.runAeoAgent(projectId)}
              onApprove={(auditId) => seoWorkspaceApi.approveAeoRecommendations(projectId, auditId)}
              onReject={(auditId, reason) => seoWorkspaceApi.rejectAeoRecommendations(projectId, auditId, reason)}
              onLoadHistory={() => seoWorkspaceApi.getAeoAgentHistory(projectId)}
            />
          </Col>
        </Row>
      )}
    </motion.div>
  );
};

export default AEOTab;