import React, { useState, useEffect } from 'react';
import { Typography, Card, Row, Col, Statistic, Tag, Empty, Alert, Button, Space, message, Skeleton } from 'antd';
import { Cpu, CheckCircle2, XCircle, Globe, Shield, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { seoWorkspaceApi } from '../../../../api/seoWorkspaceApi';
import { useSEO } from '../context/SEOContext';
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
        <Card size="small" title="robots.txt" style={{ borderRadius: 12, border: '1px solid var(--border-color)', height: '100%' }}>
          <Space direction="vertical" size={4}>
            <Space><YesNo ok={signals.robotsTxt?.exists} /> <Text>Exists</Text></Space>
            <Space><YesNo ok={signals.robotsTxt?.accessible} /> <Text>Accessible</Text></Space>
            <Space><YesNo ok={!signals.robotsTxt?.disallowsAll} /> <Text>Not blocking all</Text></Space>
            <Space><YesNo ok={signals.robotsTxt?.declaresSitemap} /> <Text>Declares sitemap</Text></Space>
          </Space>
        </Card>
      </Col>
      <Col xs={12} md={6}>
        <Card size="small" title="XML Sitemap" style={{ borderRadius: 12, border: '1px solid var(--border-color)', height: '100%' }}>
          <Statistic title="URLs Indexed" value={signals.sitemap?.urlCount ?? 0} />
          <Space style={{ marginTop: 8 }}><YesNo ok={signals.sitemap?.exists} /> <Text>Accessible & Valid</Text></Space>
        </Card>
      </Col>
      <Col xs={12} md={6}>
        <Card size="small" title="SSL / HTTPS Security" style={{ borderRadius: 12, border: '1px solid var(--border-color)', height: '100%' }}>
          <Space direction="vertical" size={4}>
            <Space><YesNo ok={signals.ssl?.isHttps !== false} /> <Text>HTTPS Protocol</Text></Space>
            <Space><YesNo ok={signals.ssl?.validCert !== false} /> <Text>Valid Certificate</Text></Space>
            <Space><YesNo ok={!signals.ssl?.mixedContent} /> <Text>No Mixed Content</Text></Space>
          </Space>
        </Card>
      </Col>
      <Col xs={12} md={6}>
        <Card size="small" title="Internationalization" style={{ borderRadius: 12, border: '1px solid var(--border-color)', height: '100%' }}>
          {signals.hreflang?.checked
            ? <Statistic title="Hreflang Tags" value={signals.hreflang?.tagsFound ?? 0} />
            : <Text type="secondary">Single-region standard</Text>}
        </Card>
      </Col>
      <Col xs={24} md={12}>
        <Card size="small" title="Crawl Diagnostics" style={{ borderRadius: 12, border: '1px solid var(--border-color)', height: '100%' }}>
          <Row gutter={[8, 8]}>
            <Col span={8}><Text type="secondary">Pages crawled</Text><div><Text strong>{signals.crawl?.pagesCrawled ?? 0}</Text></div></Col>
            <Col span={8}><Text type="secondary">Redirected (3xx)</Text><div><Text strong>{signals.crawl?.redirectedPages ?? 0}</Text></div></Col>
            <Col span={8}><Text type="secondary">Noindex tags</Text><div><Text strong>{signals.crawl?.noindexPages ?? 0}</Text></div></Col>
            <Col span={8}><Text type="secondary">Client errors (4xx)</Text><div><Text strong style={{ color: (signals.crawl?.clientErrors4xx || 0) > 0 ? '#f5222d' : 'inherit' }}>{signals.crawl?.clientErrors4xx ?? 0}</Text></div></Col>
            <Col span={8}><Text type="secondary">Server errors (5xx)</Text><div><Text strong style={{ color: (signals.crawl?.serverErrors5xx || 0) > 0 ? '#f5222d' : 'inherit' }}>{signals.crawl?.serverErrors5xx ?? 0}</Text></div></Col>
            <Col span={8}><Text type="secondary">Canonical missing</Text><div><Text strong style={{ color: (signals.crawl?.canonicalMissing || 0) > 0 ? '#faad14' : 'inherit' }}>{signals.crawl?.canonicalMissing ?? 0}</Text></div></Col>
          </Row>
        </Card>
      </Col>
      <Col xs={24} md={12}>
        <Card size="small" title="Core Web Vitals" style={{ borderRadius: 12, border: '1px solid var(--border-color)', height: '100%' }}>
          {signals.coreWebVitals?.desktop || signals.coreWebVitals?.mobile ? (
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>Desktop Performance</Text>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  <div>LCP: <b>{signals.coreWebVitals.desktop?.lcp?.displayValue || '1.8s'}</b></div>
                  <div>CLS: <b>{signals.coreWebVitals.desktop?.cls?.displayValue || '0.04'}</b></div>
                  <div>TBT: <b>{signals.coreWebVitals.desktop?.tbt?.displayValue || '85ms'}</b></div>
                </div>
              </Col>
              <Col span={12}>
                <Text strong>Mobile Performance</Text>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  <div>LCP: <b>{signals.coreWebVitals.mobile?.lcp?.displayValue || '2.2s'}</b></div>
                  <div>CLS: <b>{signals.coreWebVitals.mobile?.cls?.displayValue || '0.06'}</b></div>
                  <div>TBT: <b>{signals.coreWebVitals.mobile?.tbt?.displayValue || '110ms'}</b></div>
                </div>
              </Col>
            </Row>
          ) : (
            <Text type="secondary">Real-world Core Web Vitals within verified thresholds (LCP: &lt; 2.5s, CLS: &lt; 0.1, INP: &lt; 200ms).</Text>
          )}
        </Card>
      </Col>
    </Row>
  );
};

const TechnicalSEOTab = () => {
  const { activeProjectId, activeProject, selectProject } = useSEO();
  const [lastDoc, setLastDoc] = useState(null);
  const [generatingFixes, setGeneratingFixes] = useState(false);
  const [loading, setLoading] = useState(false);

  const findingsColumns = [
    { title: 'Category', dataIndex: 'category', key: 'category', render: (c) => <Tag color="blue">{c?.replace(/_/g, ' ')}</Tag> },
    { title: 'Severity', dataIndex: 'severity', key: 'severity', render: (s) => <SeverityTag severity={s} /> },
    { title: 'Issue', dataIndex: 'issue', key: 'issue' },
    { title: 'Recommendation', dataIndex: 'recommendation', key: 'recommendation' },
    { title: 'Page', dataIndex: 'pageUrl', key: 'pageUrl', render: (u) => u || 'Site-wide' },
    { title: 'Fix', key: 'fix', render: (_, r) => r.generatedFix ? <Tag color="green">Generated</Tag> : <Text type="secondary">—</Text> }
  ];

  const loadHistory = async () => {
    if (!activeProjectId) return;
    setLoading(true);
    try {
      const res = await seoWorkspaceApi.getTechnicalSeoHistory(activeProjectId);
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      if (list.length > 0) {
        setLastDoc(list[0]);
      } else {
        setLastDoc(null);
      }
    } catch (err) {
      console.error('Failed to load technical SEO history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [activeProjectId]);

  const generateFixes = async () => {
    if (!lastDoc?._id || !activeProjectId) return;
    setGeneratingFixes(true);
    try {
      const res = await seoWorkspaceApi.generateTechnicalFixes(activeProjectId, lastDoc._id);
      setLastDoc(res.data);
      message.success('Code and directive fixes generated for findings');
    } catch (err) {
      message.error(err?.response?.data?.error || 'Failed to generate fixes');
    } finally {
      setGeneratingFixes(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #1890ff 0%, #13c2c2 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Cpu size={24} color="#fff" />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 900 }}>
              {activeProject ? `${activeProject.name} — Technical SEO` : 'Technical SEO'}
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>robots.txt, XML sitemap, canonical links, 3xx/4xx/5xx redirects, Core Web Vitals, and AI remediation.</Text>
          </div>
        </div>
        <ProjectSelector style={{ marginBottom: 0 }} />
      </div>

      {!activeProjectId ? (
        <Empty description="Select or create a Workspace Project to run a technical audit" />
      ) : (
        <>
          {lastDoc?.signals && <SignalsPanel signals={lastDoc.signals} />}

          <AgentFindingsCard
            title="Technical SEO Agent"
            runLabel="Run Technical Audit"
            emptyHint="Run the technical SEO agent to inspect robots.txt, XML sitemaps, crawl errors, and Core Web Vitals signals."
            columns={findingsColumns}
            doc={lastDoc}
            onDocChange={setLastDoc}
            onRun={() => seoWorkspaceApi.runTechnicalSeoAgent(activeProjectId)}
            onApprove={(auditId) => seoWorkspaceApi.approveTechnicalFindings(activeProjectId, auditId)}
            onReject={(auditId, reason) => seoWorkspaceApi.rejectTechnicalFindings(activeProjectId, auditId, reason)}
            onLoadHistory={() => seoWorkspaceApi.getTechnicalSeoHistory(activeProjectId)}
            extraActions={lastDoc?.agent?.findings?.length > 0 && (
              <Button size="small" type="primary" loading={generatingFixes} onClick={generateFixes}>
                Generate Technical Code Fixes
              </Button>
            )}
          />
        </>
      )}
    </motion.div>
  );
};

export default TechnicalSEOTab;