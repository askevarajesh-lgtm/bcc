import React, { useState } from 'react';
import { Typography, Card, Row, Col, Statistic, Tag, Empty, Alert, Button, Space, message } from 'antd';
import { Cpu, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { seoWorkspaceApi } from '../../../../api/seoWorkspaceApi';
import ProjectSelector from '../components/shared/ProjectSelector';
import AgentFindingsCard from '../components/shared/AgentFindingsCard';
import { SeverityTag } from '../components/shared/StatusTags';

const { Title, Text } = Typography;

const YesNo = ({ ok }) => ok
  ? <CheckCircle2 size={16} color="#52c41a" />
  : <XCircle size={16} color="#f5222d" />;

const SignalsPanel = ({ signals }) => {
  if (!signals) return null;
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col xs={12} md={6}>
        <Card size="small" title="robots.txt">
          <Space direction="vertical" size={2}>
            <Space><YesNo ok={signals.robotsTxt?.exists} /> <Text>Exists</Text></Space>
            <Space><YesNo ok={signals.robotsTxt?.accessible} /> <Text>Accessible</Text></Space>
            <Space><YesNo ok={!signals.robotsTxt?.disallowsAll} /> <Text>Not blocking all</Text></Space>
            <Space><YesNo ok={signals.robotsTxt?.declaresSitemap} /> <Text>Declares sitemap</Text></Space>
          </Space>
        </Card>
      </Col>
      <Col xs={12} md={6}>
        <Card size="small" title="Sitemap">
          <Statistic title="URLs" value={signals.sitemap?.urlCount ?? 0} />
          <Space style={{ marginTop: 8 }}><YesNo ok={signals.sitemap?.exists} /> <Text>Exists</Text></Space>
        </Card>
      </Col>
      <Col xs={12} md={6}>
        <Card size="small" title="SSL">
          <Space><YesNo ok={signals.ssl?.isHttps} /> <Text>HTTPS enabled</Text></Space>
        </Card>
      </Col>
      <Col xs={12} md={6}>
        <Card size="small" title="Hreflang">
          {signals.hreflang?.checked
            ? <Statistic title="Tags found" value={signals.hreflang?.tagsFound ?? 0} />
            : <Text type="secondary">Not applicable (single language)</Text>}
        </Card>
      </Col>
      <Col xs={24} md={12}>
        <Card size="small" title="Crawl Summary">
          <Row gutter={[8, 8]}>
            <Col span={8}><Text type="secondary">Pages crawled</Text><div><Text strong>{signals.crawl?.pagesCrawled ?? 0}</Text></div></Col>
            <Col span={8}><Text type="secondary">Redirected</Text><div><Text strong>{signals.crawl?.redirectedPages ?? 0}</Text></div></Col>
            <Col span={8}><Text type="secondary">Noindex</Text><div><Text strong>{signals.crawl?.noindexPages ?? 0}</Text></div></Col>
            <Col span={8}><Text type="secondary">4xx errors</Text><div><Text strong>{signals.crawl?.clientErrors4xx ?? 0}</Text></div></Col>
            <Col span={8}><Text type="secondary">5xx errors</Text><div><Text strong>{signals.crawl?.serverErrors5xx ?? 0}</Text></div></Col>
            <Col span={8}><Text type="secondary">Canonical missing</Text><div><Text strong>{signals.crawl?.canonicalMissing ?? 0}</Text></div></Col>
          </Row>
        </Card>
      </Col>
      <Col xs={24} md={12}>
        <Card size="small" title="Core Web Vitals">
          {signals.coreWebVitals?.desktop || signals.coreWebVitals?.mobile ? (
            <Row gutter={16}>
              <Col span={12}>
                <Text type="secondary">Desktop</Text>
                <pre style={{ fontSize: 12, margin: 0 }}>{JSON.stringify(signals.coreWebVitals.desktop, null, 2)}</pre>
              </Col>
              <Col span={12}>
                <Text type="secondary">Mobile</Text>
                <pre style={{ fontSize: 12, margin: 0 }}>{JSON.stringify(signals.coreWebVitals.mobile, null, 2)}</pre>
              </Col>
            </Row>
          ) : (
            <Text type="secondary">No Core Web Vitals data for this run ({signals.dataSource === 'dataforseo' ? 'source did not return CWV' : 'internal-only data source'}).</Text>
          )}
        </Card>
      </Col>
    </Row>
  );
};

const TechnicalSEOTab = () => {
  const [projectId, setProjectId] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);
  const [generatingFixes, setGeneratingFixes] = useState(false);

  const findingsColumns = [
    { title: 'Category', dataIndex: 'category', key: 'category', render: (c) => <Tag>{c?.replace(/_/g, ' ')}</Tag> },
    { title: 'Severity', dataIndex: 'severity', key: 'severity', render: (s) => <SeverityTag severity={s} /> },
    { title: 'Issue', dataIndex: 'issue', key: 'issue' },
    { title: 'Recommendation', dataIndex: 'recommendation', key: 'recommendation' },
    { title: 'Page', dataIndex: 'pageUrl', key: 'pageUrl', render: (u) => u || '—' },
    { title: 'Fix', key: 'fix', render: (_, r) => r.generatedFix ? <Tag color="green">Generated</Tag> : <Text type="secondary">—</Text> }
  ];

  const generateFixes = async () => {
    if (!lastDoc?._id) return;
    setGeneratingFixes(true);
    try {
      // Handled outside the shared card since it's specific to this agent.
      const seoWorkspaceApiRes = await seoWorkspaceApi.generateTechnicalFixes(projectId, lastDoc._id);
      setLastDoc(seoWorkspaceApiRes.data);
      message.success('Fixes generated for findings');
    } catch (err) {
      message.error(err?.response?.data?.error || 'Failed to generate fixes');
    } finally {
      setGeneratingFixes(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Cpu size={28} />
        <div>
          <Title level={4} style={{ margin: 0 }}>Technical SEO</Title>
          <Text type="secondary">robots.txt, sitemap, canonical, redirects, Core Web Vitals, and AI findings per project.</Text>
        </div>
      </div>

      <ProjectSelector value={projectId} onChange={setProjectId} style={{ marginBottom: 20 }} />

      {!projectId ? (
        <Empty description="Select or create a project to run a technical audit" />
      ) : (
        <>
          {lastDoc?.signals && <SignalsPanel signals={lastDoc.signals} />}

          <AgentFindingsCard
            title="Technical SEO Agent"
            runLabel="Run Technical Audit"
            emptyHint="Run the technical SEO agent to see robots.txt, sitemap, crawl, and Core Web Vitals signals plus findings."
            columns={findingsColumns}
            doc={lastDoc}
            onDocChange={setLastDoc}
            onRun={() => seoWorkspaceApi.runTechnicalSeoAgent(projectId)}
            onApprove={(auditId) => seoWorkspaceApi.approveTechnicalFindings(projectId, auditId)}
            onReject={(auditId, reason) => seoWorkspaceApi.rejectTechnicalFindings(projectId, auditId, reason)}
            onLoadHistory={() => seoWorkspaceApi.getTechnicalSeoHistory(projectId)}
            extraActions={lastDoc?.agent?.findings?.length > 0 && (
              <Button size="small" loading={generatingFixes} onClick={generateFixes}>Generate Fixes</Button>
            )}
          />
        </>
      )}
    </motion.div>
  );
};

export default TechnicalSEOTab;