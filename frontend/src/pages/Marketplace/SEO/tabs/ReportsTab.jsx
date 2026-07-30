import React, { useEffect, useState } from 'react';
import { Typography, Card, Table, Button, Space, Empty, Alert, Tag, message, Switch, Select, Input, Form } from 'antd';
import { FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { seoWorkspaceApi } from '../../../../api/seoWorkspaceApi';
import ProjectSelector from '../components/shared/ProjectSelector';

const { Title, Text } = Typography;

const STATUS_COLORS = { pending: 'default', processing: 'gold', completed: 'green', failed: 'red' };

const ReportsTab = () => {
  const [projectId, setProjectId] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState('weekly');
  const [emailRecipients, setEmailRecipients] = useState('');

  const load = async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await seoWorkspaceApi.getReports(projectId);
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      await seoWorkspaceApi.generateReport(projectId, {
        isScheduled,
        scheduleFrequency: isScheduled ? scheduleFrequency : undefined,
        emailRecipients: emailRecipients ? emailRecipients.split(',').map((s) => s.trim()).filter(Boolean) : []
      });
      message.success('Report generated');
      load();
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || 'Failed to generate report — this endpoint requires at least 2 completed audits.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <FileText size={28} />
        <div>
          <Title level={4} style={{ margin: 0 }}>Reports</Title>
          <Text type="secondary">Comparative reports generated from audit history per project.</Text>
        </div>
      </div>

      <ProjectSelector value={projectId} onChange={setProjectId} style={{ marginBottom: 20 }} />

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} closable onClose={() => setError(null)} />}

      {!projectId ? (
        <Empty description="Select or create a project to view reports" />
      ) : (
        <Card
          size="small"
          title="Reports"
          extra={
            <Form layout="inline" style={{ flexWrap: 'wrap', rowGap: 8 }}>
              <Form.Item label="Scheduled" style={{ marginBottom: 0 }}>
                <Switch checked={isScheduled} onChange={setIsScheduled} />
              </Form.Item>
              {isScheduled && (
                <>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Select
                      value={scheduleFrequency}
                      onChange={setScheduleFrequency}
                      style={{ width: 110 }}
                      options={['daily', 'weekly', 'monthly'].map((f) => ({ value: f, label: f }))}
                    />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Input placeholder="Email(s), comma-separated" style={{ width: 220 }} value={emailRecipients} onChange={(e) => setEmailRecipients(e.target.value)} />
                  </Form.Item>
                </>
              )}
              <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" loading={generating} onClick={generate}>Generate Report</Button>
              </Form.Item>
            </Form>
          }
        >
          <Table
            rowKey="_id"
            size="small"
            loading={loading}
            dataSource={reports}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: <Empty description="No reports yet — generate one once you have at least 2 audits." /> }}
            columns={[
              { title: 'Name', dataIndex: 'name', key: 'name' },
              { title: 'Type', dataIndex: 'type', key: 'type', render: (t) => <Tag>{t?.replace(/_/g, ' ')}</Tag> },
              { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={STATUS_COLORS[s] || 'default'}>{s}</Tag> },
              { title: 'Scheduled', dataIndex: 'isScheduled', key: 'isScheduled', render: (v, r) => v ? <Tag color="blue">{r.scheduleFrequency}</Tag> : '—' },
              { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', render: (d) => new Date(d).toLocaleString() },
              {
                title: '', key: 'download',
                render: (_, r) => r.downloadUrl ? <a href={r.downloadUrl} target="_blank" rel="noreferrer">Download</a> : <Text type="secondary">—</Text>
              }
            ]}
          />
        </Card>
      )}
    </motion.div>
  );
};

export default ReportsTab;