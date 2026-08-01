import React, { useState, useEffect } from 'react';
import { Table, Tag, message, Button, Drawer } from 'antd';
import { RefreshCw, Search } from 'lucide-react';
import { seoWorkspaceApi } from '../../../../../../api/seoWorkspaceApi';

export default function ExecutionHistory({ projectId }) {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, [projectId]);

  const fetchHistory = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const res = await seoWorkspaceApi.getAutomationHistoryLogs(projectId);
      setRuns(res.data || []);
    } catch (error) {
      message.error('Failed to load execution history');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (runId) => {
    try {
      const res = await axios.get(`/api/v1/automation/projects/${projectId}/history/${runId}/logs`);
      setLogs(res.data.data || []);
    } catch (error) {
      message.error('Failed to load logs');
    }
  };

  const handleRowClick = (record) => {
    setSelectedRun(record);
    fetchLogs(record._id);
  };

  const columns = [
    { title: 'Workflow ID', dataIndex: 'workflowId', key: 'workflowId' },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status', 
      render: s => <Tag color={s === 'Succeeded' ? 'green' : s === 'Failed' ? 'red' : 'orange'}>{s}</Tag> 
    },
    { title: 'Start Time', dataIndex: 'startTime', key: 'startTime', render: t => new Date(t).toLocaleString() },
    { title: 'Duration (ms)', dataIndex: 'durationMs', key: 'durationMs' },
    { title: 'Retries', dataIndex: 'retryCount', key: 'retryCount' }
  ];

  return (
    <div style={{ padding: '0 8px' }}>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<RefreshCw size={14} />} onClick={fetchHistory}>Refresh</Button>
      </div>
      <Table 
        columns={columns} 
        dataSource={runs} 
        rowKey="_id"
        loading={loading}
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
          style: { cursor: 'pointer' }
        })}
      />

      <Drawer
        title="Execution Details"
        placement="right"
        width={600}
        onClose={() => setSelectedRun(null)}
        open={!!selectedRun}
      >
        {selectedRun && (
          <div>
            <p><b>Status:</b> {selectedRun.status}</p>
            <p><b>Error:</b> {selectedRun.error || 'None'}</p>
            <h3>Node Logs</h3>
            <Table
              dataSource={logs}
              rowKey="_id"
              pagination={false}
              size="small"
              columns={[
                { title: 'Node', dataIndex: 'nodeName', key: 'nodeName' },
                { title: 'Type', dataIndex: 'nodeType', key: 'nodeType' },
                { title: 'Status', dataIndex: 'status', key: 'status', render: s => <Tag>{s}</Tag> },
                { title: 'Duration', dataIndex: 'durationMs', key: 'durationMs' },
              ]}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
}
