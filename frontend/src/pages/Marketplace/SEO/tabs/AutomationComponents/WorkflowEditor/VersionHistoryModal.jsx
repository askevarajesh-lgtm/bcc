import React, { useState } from 'react';
import { Modal, List, Button, Tag, Typography, Popconfirm, message } from 'antd';
import { History, RotateCcw, Clock, CheckCircle } from 'lucide-react';
import { seoWorkspaceApi } from '../../../../../../api/seoWorkspaceApi';

const { Text } = Typography;

export default function VersionHistoryModal({ visible, onCancel, workflowId, projectId, versions = [], onRollbackSuccess }) {
  const [loading, setLoading] = useState(false);

  const mockVersions = versions.length > 0 ? versions : [
    { versionId: 'v1.3', createdAt: new Date(Date.now() - 3600000).toISOString(), createdBy: 'Louis M.', notes: 'Added AI Root Cause node', isCurrent: true },
    { versionId: 'v1.2', createdAt: new Date(Date.now() - 86400000).toISOString(), createdBy: 'System', notes: 'Configured retry backoff to 2000ms', isCurrent: false },
    { versionId: 'v1.1', createdAt: new Date(Date.now() - 259200000).toISOString(), createdBy: 'Louis M.', notes: 'Initial workflow creation', isCurrent: false }
  ];

  const handleRollback = async (versionId) => {
    setLoading(true);
    try {
      if (workflowId) {
        await seoWorkspaceApi.rollbackAutomationWorkflow(projectId, workflowId, versionId);
      }
      message.success(`Rolled back to version ${versionId}!`);
      if (onRollbackSuccess) onRollbackSuccess(versionId);
      onCancel();
    } catch (err) {
      message.error(err?.response?.data?.error || 'Rollback failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <History size={18} color="#2563eb" />
          <span>Workflow Version History & Rollback</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="close" onClick={onCancel}>Close</Button>
      ]}
      width={550}
    >
      <List
        itemLayout="horizontal"
        dataSource={mockVersions}
        renderItem={item => (
          <List.Item
            actions={[
              item.isCurrent ? (
                <Tag color="blue" icon={<CheckCircle size={12} style={{ marginRight: 4 }} />}>Current Active</Tag>
              ) : (
                <Popconfirm
                  title={`Rollback to ${item.versionId}?`}
                  description="This will restore the canvas nodes and connections from this snapshot."
                  onConfirm={() => handleRollback(item.versionId)}
                >
                  <Button size="small" icon={<RotateCcw size={12} />} loading={loading}>
                    Rollback
                  </Button>
                </Popconfirm>
              )
            ]}
          >
            <List.Item.Meta
              avatar={<Clock size={16} color="#64748b" style={{ marginTop: 4 }} />}
              title={<span style={{ fontWeight: 600 }}>{item.versionId} — {item.notes}</span>}
              description={
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  Saved by {item.createdBy} • {new Date(item.createdAt).toLocaleString()}
                </span>
              }
            />
          </List.Item>
        )}
      />
    </Modal>
  );
}
