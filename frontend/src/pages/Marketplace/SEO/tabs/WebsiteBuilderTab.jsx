import React, { useEffect, useState } from 'react';
import { Typography, Space, Select, Empty, Alert, Tag, message } from 'antd';
import { LayoutTemplate } from 'lucide-react';
import { motion } from 'framer-motion';
import { websiteSeoAgentApi } from '../../../../api/websiteSeoAgentApi';
import AgentFindingsCard from '../components/shared/AgentFindingsCard';
import { SeverityTag } from '../components/shared/StatusTags';

const { Title, Text } = Typography;

const WebsiteBuilderTab = () => {
  const [websites, setWebsites] = useState([]);
  const [websiteId, setWebsiteId] = useState(null);
  const [pages, setPages] = useState([]);
  const [pageId, setPageId] = useState(null);
  const [loadingWebsites, setLoadingWebsites] = useState(true);
  const [loadingPages, setLoadingPages] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoadingWebsites(true);
      try {
        const res = await websiteSeoAgentApi.getWebsites();
        setWebsites(res.data || []);
      } catch (err) {
        setError(err?.response?.data?.error || 'Failed to load websites');
      } finally {
        setLoadingWebsites(false);
      }
    })();
  }, []);

  useEffect(() => {
    setPageId(null);
    setPages([]);
    if (!websiteId) return;
    (async () => {
      setLoadingPages(true);
      try {
        const res = await websiteSeoAgentApi.getWebsiteDetails(websiteId);
        setPages(res.data?.pages || []);
      } catch (err) {
        message.error('Failed to load pages for this website');
      } finally {
        setLoadingPages(false);
      }
    })();
  }, [websiteId]);

  const findingsColumns = [
    { title: 'Type', dataIndex: 'findingType', key: 'findingType', render: (t) => <Tag>{t?.replace(/_/g, ' ')}</Tag> },
    { title: 'Severity', dataIndex: 'severity', key: 'severity', render: (s) => <SeverityTag severity={s} /> },
    { title: 'Current', dataIndex: 'currentValue', key: 'currentValue', ellipsis: true },
    { title: 'Proposed', dataIndex: 'proposedValue', key: 'proposedValue', ellipsis: true },
    { title: 'Rationale', dataIndex: 'rationale', key: 'rationale', ellipsis: true }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: 'linear-gradient(135deg, #722ed1 0%, #13c2c2 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <LayoutTemplate size={24} color="#fff" />
        </div>
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 900 }}>Website Builder SEO</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Per-page SEO findings and approvals for websites built in the Website Builder.</Text>
        </div>
      </div>

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} closable onClose={() => setError(null)} />}

      <Space style={{ marginBottom: 20 }} wrap>
        <Select
          loading={loadingWebsites}
          placeholder="Select a website"
          style={{ minWidth: 240 }}
          value={websiteId}
          onChange={setWebsiteId}
          options={websites.map((w) => ({ value: w._id, label: w.name }))}
          notFoundContent={<Empty description="No websites yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
        />
        <Select
          loading={loadingPages}
          placeholder="Select a page"
          style={{ minWidth: 240 }}
          value={pageId}
          onChange={setPageId}
          disabled={!websiteId}
          options={pages.map((p) => ({ value: p._id, label: `${p.title} (${p.path})` }))}
          notFoundContent={<Empty description="No pages on this website" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
        />
      </Space>

      {!websiteId || !pageId ? (
        <Empty description="Select a website and page to run the SEO agent" />
      ) : (
        <AgentFindingsCard
          key={pageId}
          title="Website Builder SEO Agent"
          runLabel="Run Page SEO Analysis"
          emptyHint="Run the SEO agent for this page to see findings."
          columns={findingsColumns}
          onRun={() => websiteSeoAgentApi.runWebsiteSeoAgent(websiteId, pageId)}
          onApprove={async (runId) => {
            const res = await websiteSeoAgentApi.approveWebsiteSeoFindings(websiteId, pageId, runId);
            return { data: res.data?.run, createdTasks: res.data?.createdTasks };
          }}
          onReject={(runId, reason) => websiteSeoAgentApi.rejectWebsiteSeoFindings(websiteId, pageId, runId, reason)}
          onLoadHistory={() => websiteSeoAgentApi.getWebsiteSeoHistory(websiteId, pageId)}
        />
      )}
    </motion.div>
  );
};

export default WebsiteBuilderTab;