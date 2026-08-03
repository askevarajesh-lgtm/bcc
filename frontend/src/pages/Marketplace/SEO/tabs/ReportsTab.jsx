import React, { useEffect, useState, useCallback } from 'react';
import { Typography, Card, Table, Button, Space, Empty, Alert, Tag, message, Switch, Select, Input, Form, Drawer, Tooltip, Dropdown, Menu } from 'antd';
import { FileText, Download, Eye, MoreVertical, RefreshCw, Share2, Trash2, Archive } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSEO } from '../context/SEOContext';
import { seoWorkspaceApi } from '../../../../api/seoWorkspaceApi';
import ProjectSelector from '../components/shared/ProjectSelector';
import ReportPreview from './components/ReportPreview'; // We will create this

const { Title, Text } = Typography;
const { Search } = Input;

const STATUS_COLORS = {
  Draft: 'default',
  Queued: 'gold',
  Running: 'blue',
  'Collecting Metrics': 'cyan',
  'Generating AI': 'purple',
  'Building Charts': 'geekblue',
  Completed: 'green',
  Failed: 'red',
  Archived: 'default',
  deleted: 'red'
};

const LEGACY_STATUS_COLORS = { pending: 'default', processing: 'gold', completed: 'green', failed: 'red' };

const ReportsTab = () => {
  const { activeProjectId: projectId, activeProject } = useSEO();
  
  // Data state
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  
  // Generation State
  const [generating, setGenerating] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState('weekly');
  const [emailRecipients, setEmailRecipients] = useState('');
  const [template, setTemplate] = useState('executive_summary');

  // Preview State
  const [previewReport, setPreviewReport] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const loadReports = useCallback(async (silent = false) => {
    if (!projectId) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      // Use new GET API if available in your client, otherwise fallback
      // For this implementation, we assume seoWorkspaceApi.getReports supports query params
      const response = await seoWorkspaceApi.getReports(projectId, { page, limit: pageSize, search, status: statusFilter });
      // Support both legacy array response and new paginated object response
      if (Array.isArray(response)) {
        setReports(response);
        setTotal(response.length);
      } else if (response.data) {
        setReports(response.data);
        setTotal(response.total);
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load reports');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [projectId, page, pageSize, search, statusFilter]);

  useEffect(() => { loadReports(); }, [loadReports]);

  // Polling for live updates if there are processing reports
  useEffect(() => {
    const hasActiveReports = reports.some(r => ['queued', 'processing', 'Queued', 'Running', 'Collecting Metrics', 'Generating AI', 'Building Charts'].includes(r.status || r.reportStatus));
    let interval;
    if (hasActiveReports) {
      interval = setInterval(() => {
        loadReports(true);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [reports, loadReports]);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      await seoWorkspaceApi.generateReport(projectId, {
        isScheduled,
        scheduleFrequency: isScheduled ? scheduleFrequency : undefined,
        emailRecipients: emailRecipients ? emailRecipients.split(',').map((s) => s.trim()).filter(Boolean) : [],
        template
      });
      message.success('Report generation queued');
      setPage(1);
      loadReports();
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || 'Failed to generate report.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePreview = async (record) => {
    setPreviewLoading(true);
    try {
      // If preview API exists, use it. Otherwise, use standard report.
      const res = await seoWorkspaceApi.previewReport(projectId, record._id);
      setPreviewReport(res.data || res);
    } catch (err) {
      message.error('Failed to load report preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const download = async (report) => {
    try {
      const { blob, filename } = await seoWorkspaceApi.downloadReport(projectId, report._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      message.error(err?.response?.data?.error || 'Failed to download report');
    }
  };

  const handleMenuClick = (action, record) => {
    if (action === 'download') download(record);
    if (action === 'preview') handlePreview(record);
    // Future actions: archive, delete, share
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (text, record) => <a onClick={() => handlePreview(record)}>{text}</a> },
    { title: 'Template', dataIndex: 'reportTemplate', key: 'reportTemplate', render: (t, r) => <Tag>{(t || r.type)?.replace(/_/g, ' ')}</Tag> },
    { title: 'Status', dataIndex: 'reportStatus', key: 'status', render: (s, r) => {
        const status = s || r.status;
        const color = STATUS_COLORS[status] || LEGACY_STATUS_COLORS[status] || 'default';
        return <Tag color={color}>{status}</Tag>;
    }},
    { title: 'Scheduled', dataIndex: 'isScheduled', key: 'isScheduled', render: (v, r) => v ? <Tag color="blue">{r.scheduleFrequency}</Tag> : '—' },
    { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', render: (d) => new Date(d).toLocaleString() },
    {
      title: 'Actions', key: 'actions',
      render: (_, r) => (
        <Space>
          <Tooltip title="Preview">
            <Button size="small" type="text" icon={<Eye size={16} />} onClick={() => handlePreview(r)} />
          </Tooltip>
          <Tooltip title="Download">
            <Button size="small" type="text" icon={<Download size={16} />} disabled={r.status !== 'completed'} onClick={() => download(r)} />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                { key: 'share', icon: <Share2 size={14} />, label: 'Share Link' },
                { key: 'archive', icon: <Archive size={14} />, label: 'Archive' },
                { key: 'delete', danger: true, icon: <Trash2 size={14} />, label: 'Delete' }
              ],
              onClick: ({ key }) => handleMenuClick(key, r)
            }}
            trigger={['click']}
          >
            <Button size="small" type="text" icon={<MoreVertical size={16} />} />
          </Dropdown>
        </Space>
      )
    }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <FileText size={28} />
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {activeProject ? `${activeProject.name} — Enterprise Reports` : 'Enterprise Reports'}
          </Title>
          <Text type="secondary">Generate, schedule, and preview comprehensive, immutable SEO reports.</Text>
        </div>
      </div>

      <ProjectSelector style={{ marginBottom: 20 }} />

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} closable onClose={() => setError(null)} />}

      {!projectId ? (
        <Empty description="Select or create a Workspace Project to view reports" />
      ) : (
        <Card
          size="small"
          title={
            <Space>
              <Search placeholder="Search reports..." allowClear onSearch={setSearch} style={{ width: 200 }} />
              <Select placeholder="Filter Status" allowClear style={{ width: 150 }} onChange={setStatusFilter}>
                <Select.Option value="Completed">Completed</Select.Option>
                <Select.Option value="Queued">Queued</Select.Option>
                <Select.Option value="Failed">Failed</Select.Option>
              </Select>
              <Button icon={<RefreshCw size={14} />} onClick={() => loadReports()} loading={loading} />
            </Space>
          }
          extra={
            <Form layout="inline" style={{ flexWrap: 'wrap', rowGap: 8 }}>
               <Form.Item style={{ marginBottom: 0 }}>
                  <Select value={template} onChange={setTemplate} style={{ width: 160 }} options={[
                    { value: 'executive_summary', label: 'Executive Summary' },
                    { value: 'technical', label: 'Technical SEO' },
                    { value: 'comprehensive', label: 'Comprehensive' }
                  ]} />
               </Form.Item>
              <Form.Item label="Scheduled" style={{ marginBottom: 0 }}>
                <Switch checked={isScheduled} onChange={setIsScheduled} />
              </Form.Item>
              {isScheduled && (
                <>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Select value={scheduleFrequency} onChange={setScheduleFrequency} style={{ width: 110 }} options={['daily', 'weekly', 'monthly'].map((f) => ({ value: f, label: f }))} />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Input placeholder="Email(s)" style={{ width: 150 }} value={emailRecipients} onChange={(e) => setEmailRecipients(e.target.value)} />
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
            loading={loading && !reports.length}
            dataSource={reports}
            pagination={{ 
              current: page, 
              pageSize, 
              total, 
              onChange: (p, s) => { setPage(p); setPageSize(s); }
            }}
            columns={columns}
          />
        </Card>
      )}

      <Drawer
        title={previewReport ? previewReport.name : 'Report Preview'}
        width="80%"
        open={!!previewReport}
        onClose={() => setPreviewReport(null)}
        destroyOnClose
        extra={
          <Space>
             <Button onClick={() => setPreviewReport(null)}>Close</Button>
             <Button type="primary" icon={<Download size={14} />} onClick={() => previewReport && download(previewReport)}>Download PDF</Button>
          </Space>
        }
      >
        {previewReport ? (
          <ReportPreview report={previewReport} />
        ) : (
          <Empty description="No report selected" />
        )}
      </Drawer>
    </motion.div>
  );
};

export default ReportsTab;