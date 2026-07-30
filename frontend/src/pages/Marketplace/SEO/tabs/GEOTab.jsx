import React, { useState } from 'react';
import { Typography, Card, Row, Col, Progress, Tag, Space, Empty, Tooltip } from 'antd';
import { Globe2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { seoWorkspaceApi } from '../../../../api/seoWorkspaceApi';
import ProjectSelector from '../components/shared/ProjectSelector';
import AgentFindingsCard from '../components/shared/AgentFindingsCard';

const { Title, Text } = Typography;

const scoreColor = (score) => (score > 80 ? '#52c41a' : score > 50 ? '#faad14' : '#f5222d');
const scoreTagColor = (score) => (score > 80 ? 'green' : score > 50 ? 'gold' : 'red');

const GEOTab = () => {
  const [projectId, setProjectId] = useState(null);
  const [doc, setDoc] = useState(null);

  const entityConsistencyScore = doc?.agent?.entityConsistencyScore ?? null;

  const columns = [
    {
      title: 'Scope',
      dataIndex: 'scope',
      key: 'scope',
      width: 100,
      render: (scope) => <Tag color={scope === 'page' ? 'blue' : 'purple'}>{scope === 'page' ? 'Page' : 'Sitewide'}</Tag>
    },
    { title: 'Recommendation', dataIndex: 'title', key: 'title', render: (t) => <Text strong>{t}</Text> },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Page',
      dataIndex: 'pageUrl',
      key: 'pageUrl',
      render: (u) => u ? (
        <Tooltip title={u}>
          <a href={u} target="_blank" rel="noreferrer" style={{ wordBreak: 'break-all' }}>{u}</a>
        </Tooltip>
      ) : <Text type="secondary">—</Text>
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
    }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Globe2 size={28} />
        <div>
          <Title level={4} style={{ margin: 0 }}>GEO</Title>
          <Text type="secondary">Generative Engine Optimization — sitewide entity and schema consistency for generative engines (ChatGPT, Perplexity, Gemini, Copilot, Google AI Overviews).</Text>
        </div>
      </div>

      <ProjectSelector value={projectId} onChange={(v) => { setProjectId(v); setDoc(null); }} style={{ marginBottom: 20 }} />

      {!projectId ? (
        <Empty description="Select or create a project to run the GEO Agent" />
      ) : (
        <Row gutter={[16, 16]}>
          {entityConsistencyScore !== null && (
            <Col xs={24} lg={6}>
              <Card size="small" title="Entity Consistency" style={{ height: '100%' }}>
                <div style={{ textAlign: 'center' }}>
                  <Progress type="dashboard" percent={entityConsistencyScore} strokeColor={scoreColor(entityConsistencyScore)} />
                  <div style={{ marginTop: 8 }}>
                    <Tag color={scoreTagColor(entityConsistencyScore)}>{entityConsistencyScore}/100</Tag>
                  </div>
                </div>
              </Card>
            </Col>
          )}

          <Col xs={24} lg={entityConsistencyScore !== null ? 18 : 24}>
            <AgentFindingsCard
              title="GEO Agent"
              runLabel="Run GEO Agent"
              emptyHint="Run the GEO Agent to assess how consistently the whole site resolves as one identifiable entity for generative engines."
              findingsKey="recommendations"
              columns={columns}
              doc={doc}
              onDocChange={setDoc}
              onRun={() => seoWorkspaceApi.runGeoAgent(projectId)}
              onApprove={(auditId) => seoWorkspaceApi.approveGeoRecommendations(projectId, auditId)}
              onReject={(auditId, reason) => seoWorkspaceApi.rejectGeoRecommendations(projectId, auditId, reason)}
              onLoadHistory={() => seoWorkspaceApi.getGeoAgentHistory(projectId)}
            />
          </Col>
        </Row>
      )}
    </motion.div>
  );
};

export default GEOTab;