import React, { useEffect, useState } from 'react';
import {
  Typography, Card, Table, Button, Space, Empty, Alert, Tag, message,
  Popconfirm, Collapse, Modal, Form, Input, Select, Switch, InputNumber
} from 'antd';
import { Zap, History as HistoryIcon, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { seoWorkspaceApi } from '../../../../api/seoWorkspaceApi';
import ProjectSelector from '../components/shared/ProjectSelector';
import { ApprovalStatusTag } from '../components/shared/StatusTags';

const { Title, Text } = Typography;
const { Option } = Select;

const RULE_TYPES = [
  { value: 'rank_drop_alert', label: 'Rank Drop Alert' },
  { value: 'scheduled_report', label: 'Scheduled Report' },
  { value: 'content_freshness', label: 'Content Freshness' },
  { value: 'backlink_loss', label: 'Backlink Loss' },
  { value: 'credential_health_check', label: 'Credential Health Check' }
];
const FREQUENCIES = ['daily', 'weekly', 'monthly'];
const ACTION_TYPES = [
  { value: 'create_task', label: 'Create Task' },
  { value: 'send_report', label: 'Send Report' },
  { value: 'send_notification', label: 'Send Notification' },
  { value: 'pause_autopilot', label: 'Pause Autopilot' }
];
const OPERATORS = [
  { value: 'gt', label: '>' }, { value: 'gte', label: '>=' },
  { value: 'lt', label: '<' }, { value: 'lte', label: '<=' }, { value: 'eq', label: '=' }
];
const TASK_TYPES = ['Update Meta Tags', 'Content Edit', 'Schema Injection', 'Create Redirect', 'Internal Linking', 'Image Optimization'];

const AutomationTab = () => {
  const [projectId, setProjectId] = useState(null);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await seoWorkspaceApi.getAutomationRules(projectId);
      setRules(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load automation rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); setHistory(null); }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const runNow = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await seoWorkspaceApi.runAutomationAgent(projectId);
      const { triggered = [], skipped = [], failures = [] } = res.data || {};
      message.success(`Run complete — ${triggered.length} triggered, ${skipped.length} skipped, ${failures.length} failed`);
      load();
    } catch (err) {
      setError(err?.response?.data?.error || 'Automation run failed');
    } finally {
      setRunning(false);
    }
  };

  const act = async (fn, successMsg) => {
    try {
      await fn();
      message.success(successMsg);
      load();
    } catch (err) {
      message.error(err?.response?.data?.message || err?.response?.data?.error || 'Action failed');
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await seoWorkspaceApi.getAutomationHistory(projectId);
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      message.error('Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCreate = async () => {
    const values = await form.validateFields();
    setCreating(true);
    try {
      const payload = {
        name: values.name,
        ruleType: values.ruleType,
        frequency: values.frequency,
        trigger: values.ruleType === 'scheduled_report' ? {} : {
          metric: values.metric || null,
          operator: values.operator || null,
          value: values.value ?? null
        },
        action: {
          type: values.actionType,
          config: values.actionType === 'create_task' ? { taskType: values.taskType } : {}
        }
      };
      await seoWorkspaceApi.createAutomationRule(projectId, payload);
      message.success('Automation rule created — pending approval');
      setModalOpen(false);
      form.resetFields();
      load();
    } catch (err) {
      message.error(err?.response?.data?.error || 'Failed to create automation rule');
    } finally {
      setCreating(false);
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (t) => <Text strong>{t}</Text> },
    { title: 'Type', dataIndex: 'ruleType', key: 'ruleType', render: (t) => <Tag>{RULE_TYPES.find((r) => r.value === t)?.label || t}</Tag> },
    { title: 'Frequency', dataIndex: 'frequency', key: 'frequency', render: (f) => <Tag color="purple">{f}</Tag> },
    { title: 'Action', dataIndex: ['action', 'type'], key: 'action' },
    { title: 'Approval', dataIndex: 'approvalStatus', key: 'approvalStatus', render: (s) => <ApprovalStatusTag status={s} /> },
    {
      title: 'Enabled', dataIndex: 'isEnabled', key: 'isEnabled',
      render: (enabled, record) => (
        <Switch
          size="small"
          checked={enabled}
          disabled={record.approvalStatus !== 'Approved'}
          onChange={(checked) => act(() => seoWorkspaceApi.toggleAutomationRule(projectId, record._id, checked), checked ? 'Rule enabled' : 'Rule disabled')}
        />
      )
    },
    {
      title: 'Last Triggered', dataIndex: 'lastTriggeredAt', key: 'lastTriggeredAt',
      render: (d) => (d ? new Date(d).toLocaleString() : 'Never')
    },
    {
      title: '', key: 'rowAction',
      render: (_, record) => (
        <Space>
          {record.approvalStatus === 'Pending Approval' && (
            <>
              <Popconfirm title="Approve this rule?" onConfirm={() => act(() => seoWorkspaceApi.approveAutomationRule(projectId, record._id), 'Rule approved')}>
                <Button size="small" type="primary">Approve</Button>
              </Popconfirm>
              <Button size="small" danger onClick={() => act(() => seoWorkspaceApi.rejectAutomationRule(projectId, record._id, 'Rejected from Automation tab'), 'Rule rejected')}>
                Reject
              </Button>
            </>
          )}
          {record.approvalStatus === 'Approved' && (
            <Button size="small" onClick={() => act(() => seoWorkspaceApi.retryAutomationRule(projectId, record._id), 'Rule executed')}>
              Run Now
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Zap size={28} />
        <div>
          <Title level={4} style={{ margin: 0 }}>Automation</Title>
          <Text type="secondary">Autopilot rules, workflows, and scheduled SEO tasks (daily / weekly / monthly).</Text>
        </div>
      </div>

      <ProjectSelector value={projectId} onChange={setProjectId} style={{ marginBottom: 20 }} />

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} closable onClose={() => setError(null)} />}

      {!projectId ? (
        <Empty description="Select or create a project to manage automation rules" />
      ) : (
        <Card
          size="small"
          title="Automation Rules"
          extra={
            <Space>
              <Button icon={<Plus size={14} />} onClick={() => setModalOpen(true)}>New Rule</Button>
              <Button type="primary" loading={running} onClick={runNow}>Run Now</Button>
            </Space>
          }
        >
          <Table
            rowKey="_id"
            size="small"
            loading={loading}
            dataSource={rules}
            columns={columns}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: <Empty description="No automation rules yet for this project" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
          />

          <Collapse
            style={{ marginTop: 16 }}
            items={[{
              key: 'history',
              label: <Space><HistoryIcon size={14} /> Execution History</Space>,
              children: (
                <>
                  {!history && <Button size="small" loading={historyLoading} onClick={loadHistory}>Load history</Button>}
                  {history && (
                    <Table
                      rowKey={(r, i) => r._id || i}
                      size="small"
                      pagination={{ pageSize: 5 }}
                      dataSource={Array.isArray(history) ? history : []}
                      locale={{ emptyText: <Empty description="No previous runs" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                      columns={[
                        { title: 'Status', dataIndex: 'status', key: 'status' },
                        { title: 'Started', dataIndex: 'createdAt', key: 'createdAt', render: (d) => d ? new Date(d).toLocaleString() : '-' },
                        { title: 'Duration', dataIndex: 'durationMs', key: 'durationMs', render: (v) => v ? `${(v / 1000).toFixed(1)}s` : '-' }
                      ]}
                    />
                  )}
                </>
              )
            }]}
          />
        </Card>
      )}

      <Modal
        title="New Automation Rule"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleCreate}
        confirmLoading={creating}
        okText="Create"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Rule name" rules={[{ required: true, message: 'Enter a name for this rule' }]}>
            <Input placeholder="e.g. Weekly rank-drop watch" />
          </Form.Item>

          <Form.Item name="ruleType" label="Rule type" rules={[{ required: true, message: 'Select a rule type' }]}>
            <Select placeholder="What should this rule watch?">
              {RULE_TYPES.map((rt) => <Option key={rt.value} value={rt.value}>{rt.label}</Option>)}
            </Select>
          </Form.Item>

          <Form.Item name="frequency" label="Frequency" initialValue="daily" rules={[{ required: true }]}>
            <Select>
              {FREQUENCIES.map((f) => <Option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</Option>)}
            </Select>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.ruleType !== cur.ruleType}>
            {({ getFieldValue }) => getFieldValue('ruleType') && getFieldValue('ruleType') !== 'scheduled_report' && (
              <>
                <Form.Item name="metric" label="Trigger metric" tooltip="e.g. rankDrop, daysSinceAudit, totalBacklinks">
                  <Input placeholder="metric name" />
                </Form.Item>
                <Space.Compact block>
                  <Form.Item name="operator" label="Operator" style={{ width: '50%' }}>
                    <Select placeholder="Operator">
                      {OPERATORS.map((op) => <Option key={op.value} value={op.value}>{op.label}</Option>)}
                    </Select>
                  </Form.Item>
                  <Form.Item name="value" label="Threshold value" style={{ width: '50%' }}>
                    <InputNumber style={{ width: '100%' }} placeholder="e.g. 2" />
                  </Form.Item>
                </Space.Compact>
              </>
            )}
          </Form.Item>

          <Form.Item name="actionType" label="Action" rules={[{ required: true, message: 'Select an action' }]}>
            <Select placeholder="What should happen when this rule fires?">
              {ACTION_TYPES.map((at) => <Option key={at.value} value={at.value}>{at.label}</Option>)}
            </Select>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.actionType !== cur.actionType}>
            {({ getFieldValue }) => getFieldValue('actionType') === 'create_task' && (
              <Form.Item name="taskType" label="Task type" rules={[{ required: true, message: 'Select a task type' }]}>
                <Select placeholder="Task type for the generated task">
                  {TASK_TYPES.map((t) => <Option key={t} value={t}>{t}</Option>)}
                </Select>
              </Form.Item>
            )}
          </Form.Item>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default AutomationTab;