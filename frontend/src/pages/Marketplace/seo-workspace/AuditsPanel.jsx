import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Typography, Modal, Row, Col } from 'antd';
import ScoreCard from './components/ScoreCard';
import useWorkspaceAudits from './hooks/useWorkspaceAudits';

const { Title } = Typography;

const AuditsPanel = () => {
  const { audits, pagination, loading, fetchAudits } = useWorkspaceAudits();
  const [activeAudit, setActiveAudit] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => { fetchAudits({ page: 1, limit: 20 }); }, [fetchAudits]);

  const columns = [
    { title: 'Project', dataIndex: ['projectId', 'name'], key: 'projectName', render: text => <strong>{text || 'Unknown Project'}</strong> },
    { title: 'Date', dataIndex: 'completedAt', key: 'completedAt', render: date => date ? new Date(date).toLocaleDateString() : 'N/A' },
    { title: 'URLs Crawled', dataIndex: ['metrics', 'pagesCrawled'], key: 'pagesCrawled' },
    { title: 'Performance', dataIndex: ['metrics', 'performance'], key: 'performance' },
    { title: 'On-Page SEO', dataIndex: ['metrics', 'onPage'], key: 'onPage' },
    {
      title: 'Action', key: 'action', render: (_, record) => (
        <Button type="link" onClick={() => { setActiveAudit(record); setModalVisible(true); }}>View Report</Button>
      )
    }
  ];

  return (
    <>
      <Card className="seo-glass-panel seo-table">
        <Title level={4} style={{ margin: '0 0 16px 0' }}>Recent Audits</Title>
        <Table
          dataSource={audits}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (page, pageSize) => fetchAudits({ page, limit: pageSize })
          }}
        />
      </Card>

      <Modal
        title={<Title level={4} style={{ margin: 0, fontWeight: 800 }}>Audit Report for {activeAudit?.projectId?.name || 'Project'}</Title>}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[<Button key="close" onClick={() => setModalVisible(false)} className="seo-glow-btn-secondary">Close</Button>]}
      >
        {activeAudit && (
          <div style={{ padding: '24px 0' }}>
            <Row gutter={[16, 16]}>
              <Col span={12}><ScoreCard title="URLs Crawled" value={activeAudit.metrics?.pagesCrawled} /></Col>
              <Col span={12}>
                <ScoreCard title="Date Crawled" value={activeAudit.completedAt ? new Date(activeAudit.completedAt).toLocaleString() : 'N/A'} />
              </Col>
              <Col span={12}><ScoreCard title="Performance Score" value={activeAudit.metrics?.performance} suffix="/100" /></Col>
              <Col span={12}><ScoreCard title="On-Page SEO Score" value={activeAudit.metrics?.onPage} suffix="/100" /></Col>
              <Col span={12}><ScoreCard title="Crawlability Score" value={activeAudit.metrics?.crawlability} suffix="/100" /></Col>
              <Col span={12}><ScoreCard title="Security Score" value={activeAudit.metrics?.security} suffix="/100" /></Col>
            </Row>
          </div>
        )}
      </Modal>
    </>
  );
};

export default AuditsPanel;
