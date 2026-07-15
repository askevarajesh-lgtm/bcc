import React, { useEffect, useState } from 'react';
import { Card, Select, Typography, Spin, Tag, Button, message, Collapse } from 'antd';
import { CheckCircle } from 'lucide-react';
import StatusTag from './components/StatusTag';
import ApprovalActionBar from './components/ApprovalActionBar';
import CollaborationDrawer from './components/CollaborationDrawer';
import useWorkspaceTasks from './hooks/useWorkspaceTasks';

const { Title, Text } = Typography;
const { Option } = Select;

const TasksPanel = ({ projects, isViewOnly, canEdit }) => {
  const { tasks, loading, fetchTasks, updateTaskStatus } = useWorkspaceTasks();
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    if (selectedProject) fetchTasks(selectedProject);
  }, [selectedProject, fetchTasks]);

  const handleUpdateStatus = async (taskId, status) => {
    try {
      await updateTaskStatus(selectedProject, taskId, status);
      message.success(`Task ${status} successfully`);
      fetchTasks(selectedProject);
    } catch (error) {
      message.error(`Failed to ${status} task`);
    }
  };

  return (
    <Card className="seo-glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>Gate 2: Approvals Queue</Title>
        <Select placeholder="Select a project" style={{ width: 250 }} onChange={setSelectedProject} value={selectedProject}>
          {projects.map(p => <Option key={p._id} value={p._id}>{p.name}</Option>)}
        </Select>
      </div>

      {!selectedProject ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <CheckCircle size={48} color="#ccc" style={{ marginBottom: 16 }} />
          <Text type="secondary" style={{ display: 'block' }}>Select a project to view pending AI edits</Text>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}><Spin size="large" /></div>
      ) : tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Text type="secondary" style={{ display: 'block' }}>No pending tasks found for this project.</Text>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {tasks.map(task => (
            <Card
              key={task._id}
              size="small"
              style={{
                borderRadius: 12,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-color)',
                borderLeft: task.status === 'Pending' ? '4px solid var(--accent-warning)'
                  : (task.status === 'Approved' || task.status === 'Implemented') ? '4px solid var(--accent-success)'
                  : '4px solid var(--accent-danger)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <Tag className="seo-badge seo-badge-info">{task.taskType}</Tag>
                    <StatusTag status={task.status} />
                  </div>
                  <Title level={5} style={{ margin: '0 0 4px 0' }}>{task.pageUrl}</Title>
                  <Text type="secondary">{task.description}</Text>

                  <div style={{ marginTop: 16, background: 'rgba(0,0,0,0.05)', padding: 12, borderRadius: 8, fontSize: 13 }}>
                    <strong>Proposed Changes:</strong>
                    <pre style={{ margin: '8px 0 0 0', whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(task.proposedChanges, null, 2)}
                    </pre>
                  </div>

                  <Collapse
                    ghost
                    style={{ marginTop: 12 }}
                    items={[{
                      key: 'collab',
                      label: 'Comments / Attachments / History',
                      children: (
                        <CollaborationDrawer
                          targetType="Task"
                          targetId={task._id}
                          projectId={selectedProject}
                          canWrite={!isViewOnly}
                        />
                      )
                    }]}
                  />
                </div>

                {task.status === 'Pending' && !isViewOnly && canEdit && (
                  <ApprovalActionBar
                    vertical
                    onApprove={() => handleUpdateStatus(task._id, 'Approved')}
                    onReject={() => handleUpdateStatus(task._id, 'Rejected')}
                  />
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
};

export default TasksPanel;
