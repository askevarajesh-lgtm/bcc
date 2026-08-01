import React, { useEffect, useState } from 'react';
import { Tabs, Table, Tag, Typography, Progress, Button, Spin } from 'antd';
import dayjs from 'dayjs';
import { CheckCircle, Download } from 'lucide-react';
import TaskListView from '../../Tasks/TaskListView';
import ClientBilling from './ClientBilling';
import ClientActivity from './ClientActivity';

const { Title, Text } = Typography;

const getStatusTagColor = (status) => {
  if (!status) return 'default';
  const s = status.toLowerCase();
  if (s === 'approved' || s === 'active' || s === 'paid' || s === 'completed') return 'success';
  if (s === 'pending' || s === 'in progress' || s === 'partially paid') return 'warning';
  if (s === 'overdue' || s === 'rejected' || s === 'cancelled') return 'error';
  return 'default';
};

const ClientDetailContent = ({
  selectedClient,
  allowedFeatures,
  getStatusColor,
  getScoreColor,
  onTaskClick,
}) => {
  const [proposals, setProposals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const clientId = selectedClient?._id || selectedClient?.id;

  useEffect(() => {
    if (!clientId) return;
    const fetchAll = async () => {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };

      const safeArray = (val) => (Array.isArray(val) ? val : []);

      // Proposals
      try {
        const res = await fetch(`/api/proposals?clientId=${clientId}`, { headers });
        if (res.ok) {
          const d = await res.json();
          setProposals(safeArray(d?.data?.proposals || d?.data || d?.proposals || d));
        }
      } catch (e) { console.warn('proposals fetch failed', e.message); }

      // Projects — API returns: { success, data: { projects: [], pagination: {} } }
      try {
        const res = await fetch(`/api/projects?clientId=${clientId}`, { headers });
        if (res.ok) {
          const d = await res.json();
          setProjects(safeArray(d?.data?.projects || d?.projects || d?.data || d));
        }
      } catch (e) { console.warn('projects fetch failed', e.message); }

      // Invoices
      try {
        const res = await fetch(`/api/invoices?clientId=${clientId}`, { headers });
        if (res.ok) {
          const d = await res.json();
          setInvoices(safeArray(d?.data?.invoices || d?.data || d?.invoices || d));
        }
      } catch (e) { console.warn('invoices fetch failed', e.message); }

      setLoading(false);
    };
    fetchAll();
  }, [clientId]);

  const proposalColumns = [
    {
      title: 'Proposal #',
      dataIndex: 'proposalNumber',
      key: 'proposalNumber',
      render: (val) => <Text style={{ fontWeight: 700 }}>{typeof val === 'string' || typeof val === 'number' ? val : '—'}</Text>,
    },
    {
      title: 'Title',
      dataIndex: 'name',
      key: 'name',
      render: (val) => <Text style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{typeof val === 'string' ? val : '—'}</Text>,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d) => d && typeof d === 'string' ? dayjs(d).format('DD MMM YYYY') : '—',
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v, r) => {
        const amt = Number(v) || Number(r.grandTotal) || 0;
        return <Text style={{ fontWeight: 700 }}>₹{amt.toLocaleString()}</Text>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <Tag color={getStatusTagColor(s)} style={{ borderRadius: 8, fontWeight: 600 }}>{typeof s === 'string' ? s : 'Draft'}</Tag>,
    },
  ];

  const projectColumns = [
    {
      title: 'Project',
      dataIndex: 'name',
      key: 'name',
      render: (val) => <Text style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{typeof val === 'string' ? val : '—'}</Text>,
    },
    {
      title: 'Billing Type',
      dataIndex: 'billingType',
      key: 'billingType',
      render: (v) => typeof v === 'string' && v ? <Tag style={{ borderRadius: 8, fontWeight: 600 }}>{v}</Tag> : '—',
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (d) => d ? dayjs(d).format('DD MMM YYYY') : '—',
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (d) => d ? dayjs(d).format('DD MMM YYYY') : '—',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <Tag color={getStatusTagColor(s)} style={{ borderRadius: 8, fontWeight: 600 }}>{typeof s === 'string' ? s : 'Active'}</Tag>,
    },
  ];

  const invoiceColumns = [
    {
      title: 'Invoice #',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (val) => <Text style={{ fontWeight: 700 }}>{typeof val === 'string' || typeof val === 'number' ? val : '—'}</Text>,
    },
    {
      title: 'Date',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
      render: (d) => d && typeof d === 'string' ? dayjs(d).format('DD MMM YYYY') : '—',
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (d) => d && typeof d === 'string' ? dayjs(d).format('DD MMM YYYY') : '—',
    },
    {
      title: 'Amount',
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      render: (v, r) => {
        const amt = Number(v) || Number(r.totalAmount) || 0;
        return <Text style={{ fontWeight: 700 }}>₹{amt.toLocaleString()}</Text>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (s) => <Tag color={getStatusTagColor(s)} style={{ borderRadius: 8, fontWeight: 600 }}>{typeof s === 'string' ? s : 'Pending'}</Tag>,
    },
    {
      title: 'Actions',
      key: 'download',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button
            type="default"
            size="small"
            icon={<Download size={13} />}
            style={{ borderRadius: 6, fontWeight: 600, fontSize: 12 }}
            onClick={() => {
              const id = record._id || record.id;
              if (id) window.open(`/workspace/invoices/${id}/view`, '_blank');
            }}
          >
            View / Print
          </Button>
        </div>
      ),
    },
  ];

  const emptyState = (label) => (
    <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-tertiary)' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
      <Text type="secondary">No {label} found for this client.</Text>
    </div>
  );

  const tableProps = {
    size: 'small',
    pagination: { pageSize: 8, size: 'small' },
    style: { borderRadius: 12, overflow: 'hidden' },
  };

  return (
    <Spin spinning={loading}>
      <Tabs
        defaultActiveKey="overview"
        tabBarStyle={{ fontWeight: 600, marginBottom: 0 }}
        items={[
          {
            key: 'overview',
            label: 'Overview',
            children: (
              <div style={{ paddingTop: 16 }}>
                {/* KPI row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                  {[
                    { label: 'Proposals', value: proposals.length, color: '#6366f1' },
                    { label: 'Projects', value: projects.length, color: '#0ea5e9' },
                    { label: 'Invoices', value: invoices.length, color: '#10b981' },
                    { label: 'Tasks', value: '—', color: '#f59e0b' },
                  ].map(kpi => (
                    <div key={kpi.label} style={{ background: `${kpi.color}10`, border: `1px solid ${kpi.color}25`, borderRadius: 12, padding: '14px 16px' }}>
                      <Text style={{ fontSize: 11, fontWeight: 700, color: kpi.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{kpi.label}</Text>
                      <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.2, marginTop: 4 }}>{kpi.value}</div>
                    </div>
                  ))}
                </div>

                {/* Client info */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
                  <Text style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-tertiary)', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 14 }}>Client Info</Text>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
                    {[
                      { label: 'Email', value: selectedClient.adminEmail || selectedClient.email },
                      { label: 'Phone', value: selectedClient.phone },
                      { label: 'Package', value: selectedClient.packageName || 'Custom' },
                      { label: 'Account Manager', value: selectedClient.am || 'Unassigned' },
                      { label: 'Address', value: selectedClient.address },
                      { label: 'Industry', value: selectedClient.industry },
                    ].map(item => item.value ? (
                      <div key={item.label}>
                        <Text style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', display: 'block' }}>{item.label}</Text>
                        <Text style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</Text>
                      </div>
                    ) : null)}
                  </div>
                </div>

                {/* MOS Scores */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 14, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    <Progress type="circle" percent={selectedClient.mos} strokeColor={getStatusColor(selectedClient.status)} trailColor="var(--bg-tertiary)" size={64} format={() => <span style={{ fontWeight: 900, color: 'var(--text-primary)', fontSize: 16 }}>{selectedClient.mos}</span>} />
                    <div>
                      <Text style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-tertiary)', letterSpacing: 1, textTransform: 'uppercase' }}>MOS Score</Text>
                      <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>{selectedClient.mos} / 100</div>
                      <Tag style={{ margin: 0, marginTop: 4, borderRadius: 6, background: `${getStatusColor(selectedClient.status)}15`, color: getStatusColor(selectedClient.status), border: 'none', fontWeight: 700, fontSize: 11 }}>{selectedClient.status}</Tag>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {selectedClient.scores && Object.entries(selectedClient.scores).map(([label, score]) => (
                      <div key={label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-tertiary)', letterSpacing: 1 }}>{label}</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>{score}</span>
                        </div>
                        <Progress percent={score} showInfo={false} strokeColor={getScoreColor(score)} trailColor="var(--bg-tertiary)" size="small" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: 'proposals',
            label: `Proposals${proposals.length ? ` (${proposals.length})` : ''}`,
            children: (
              <div style={{ paddingTop: 12 }}>
                {proposals.length === 0 && !loading ? emptyState('proposals') : (
                  <Table {...tableProps} columns={proposalColumns} dataSource={proposals} rowKey={(r, i) => r._id || r.id || String(i)} />
                )}
              </div>
            ),
          },
          {
            key: 'projects',
            label: `Projects${projects.length ? ` (${projects.length})` : ''}`,
            children: (
              <div style={{ paddingTop: 12 }}>
                {projects.length === 0 && !loading ? emptyState('projects') : (
                  <Table {...tableProps} columns={projectColumns} dataSource={projects} rowKey={(r, i) => r._id || r.id || String(i)} />
                )}
              </div>
            ),
          },
          {
            key: 'tasks',
            label: 'Tasks',
            children: (
              <div style={{ paddingTop: 12 }}>
                <TaskListView clientId={clientId} onTaskClick={onTaskClick} />
              </div>
            ),
          },
          {
            key: 'invoices',
            label: `Invoices${invoices.length ? ` (${invoices.length})` : ''}`,
            children: (
              <div style={{ paddingTop: 12 }}>
                {invoices.length === 0 && !loading ? emptyState('invoices') : (
                  <Table {...tableProps} columns={invoiceColumns} dataSource={invoices} rowKey={(r, i) => r._id || r.id || String(i)} />
                )}
              </div>
            ),
          },
          {
            key: 'features',
            label: 'Features',
            children: (
              <div style={{ paddingTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: 16, background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                  <div>
                    <Text style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>Assigned Package</Text>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{selectedClient.packageName || 'Custom'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {allowedFeatures.length > 0 ? allowedFeatures.map(feat => {
                    const enabled = (selectedClient.features || []).includes(feat.id);
                    return (
                      <div key={feat.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: enabled ? 'var(--bg-tertiary)' : 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border-color)', opacity: enabled ? 1 : 0.5 }}>
                        <div style={{ color: enabled ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}><CheckCircle size={15} /></div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{feat.label}</span>
                        <div style={{ marginLeft: 'auto' }}>
                          <Tag color={enabled ? 'success' : 'default'} style={{ margin: 0, borderRadius: 8, fontWeight: 600, fontSize: 11 }}>{enabled ? 'Enabled' : 'Disabled'}</Tag>
                        </div>
                      </div>
                    );
                  }) : (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', borderRadius: 12, border: '1px dashed var(--border-color)' }}>
                      No modules configured.
                    </div>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: 'activity',
            label: 'Activity',
            children: <ClientActivity clientId={clientId} />,
          },
        ]}
      />
    </Spin>
  );
};

export default ClientDetailContent;
