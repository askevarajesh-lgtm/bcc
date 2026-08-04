import React, { useEffect, useState } from 'react';
import { Typography, Space, Select, Empty, Alert, Tag } from 'antd';
import { Store as StoreIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { storeSeoAgentApi } from '../../../../api/storeSeoAgentApi';
import AgentFindingsCard from '../components/shared/AgentFindingsCard';
import { SeverityTag } from '../components/shared/StatusTags';

const { Title, Text } = Typography;

const StoreSEOTab = () => {
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState(null);
  const [loadingStores, setLoadingStores] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoadingStores(true);
      try {
        const res = await storeSeoAgentApi.getStores();
        setStores(res.data || []);
      } catch (err) {
        setError(err?.response?.data?.error || 'Failed to load stores');
      } finally {
        setLoadingStores(false);
      }
    })();
  }, []);

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
          background: 'linear-gradient(135deg, #fa8c16 0%, #eb2f96 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <StoreIcon size={24} color="#fff" />
        </div>
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 900 }}>Store SEO</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>SEO findings and approvals for e-commerce stores.</Text>
        </div>
      </div>

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} closable onClose={() => setError(null)} />}

      <Space style={{ marginBottom: 20 }} wrap>
        <Select
          loading={loadingStores}
          placeholder="Select a store"
          style={{ minWidth: 260 }}
          value={storeId}
          onChange={setStoreId}
          options={stores.map((s) => ({ value: s._id, label: s.name }))}
          notFoundContent={<Empty description="No stores yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
        />
      </Space>

      {!storeId ? (
        <Empty description="Select a store to run the SEO agent" />
      ) : (
        <AgentFindingsCard
          key={storeId}
          title="Store SEO Agent"
          runLabel="Run Store SEO Analysis"
          emptyHint="Run the SEO agent for this store to see findings."
          columns={findingsColumns}
          onRun={() => storeSeoAgentApi.runStoreSeoAgent(storeId)}
          onApprove={async (runId) => {
            const res = await storeSeoAgentApi.approveStoreSeoFindings(storeId, runId);
            return { data: res.data?.run, createdTasks: res.data?.createdTasks };
          }}
          onReject={(runId, reason) => storeSeoAgentApi.rejectStoreSeoFindings(storeId, runId, reason)}
          onLoadHistory={() => storeSeoAgentApi.getStoreSeoHistory(storeId)}
        />
      )}
    </motion.div>
  );
};

export default StoreSEOTab;