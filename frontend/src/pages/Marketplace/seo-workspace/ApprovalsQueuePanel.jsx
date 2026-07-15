import React, { useEffect, useState, useMemo } from 'react';
import { Card, Select, Typography, Spin, Tag, Button, message, Collapse, Modal, Divider, Segmented } from 'antd';
import { CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import StatusTag from './components/StatusTag';
import ApprovalActionBar from './components/ApprovalActionBar';
import CollaborationDrawer from './components/CollaborationDrawer';
import useWorkspaceTasks from './hooks/useWorkspaceTasks';
import useWorkspaceStrategies from './hooks/useWorkspaceStrategies';

const { Title, Text } = Typography;
const { Option } = Select;

const PENDING_STRATEGY_STATUSES = ['Draft', 'Pending Approval'];

const ApprovalsQueuePanel = ({ projects, isViewOnly, canEdit }) => {
  const { tasks, loading: tasksLoading, fetchTasks, updateTaskStatus } = useWorkspaceTasks();
  const {
    strategies, loading: strategiesLoading, fetchStrategies,
    approveStrategy, rejectStrategy
  } = useWorkspaceStrategies();
  const [selectedProject, setSelectedProject] = useState(null);
  const [reviewStrategy, setReviewStrategy] = useState(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState('Pending');

  useEffect(() => {
    if (!selectedProject) return;
    fetchTasks(selectedProject);
    fetchStrategies({ projectId: selectedProject, page: 1, limit: 100 });
  }, [selectedProject, fetchTasks, fetchStrategies]);

  const visibleStrategies = useMemo(
    () => (viewMode === 'Pending' ? strategies.filter(s => PENDING_STRATEGY_STATUSES.includes(s.status)) : strategies),
    [strategies, viewMode]
  );
  const visibleTasks = useMemo(
    () => (viewMode === 'Pending' ? tasks.filter(t => t.status === 'Pending') : tasks),
    [tasks, viewMode]
  );

  const loading = tasksLoading || strategiesLoading;
  const isEmpty = !loading && visibleStrategies.length === 0 && visibleTasks.length === 0;

  const refetch = () => {
    fetchTasks(selectedProject);
    fetchStrategies({ projectId: selectedProject, page: 1, limit: 100 });
  };

  const handleTaskStatus = async (taskId, status) => {
    try {
      await updateTaskStatus(selectedProject, taskId, status);
      message.success(`Task ${status} successfully`);
      refetch();
    } catch (error) {
      message.error(`Failed to ${status} task`);
    }
  };

  const handleStrategyApprove = async (strategy) => {
    try {
      await approveStrategy(strategy.projectId?._id || strategy.projectId, strategy._id);
      message.success('Strategy approved.');
      setReviewModalVisible(false);
      refetch();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to approve strategy.');
    }
  };

  const handleStrategyReject = async (strategy) => {
    try {
      await rejectStrategy(strategy.projectId?._id || strategy.projectId, strategy._id);
      message.success('Strategy rejected.');
      setReviewModalVisible(false);
      refetch();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to reject strategy.');
    }
  };

  return (
    <>
      <Card className="seo-glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <Title level={4} style={{ margin: 0 }}>Approvals Queue</Title>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Segmented
              options={['Pending', 'All']}
              value={viewMode}
              onChange={setViewMode}
            />
            <Select placeholder="Select a project" style={{ width: 250 }} onChange={setSelectedProject} value={selectedProject}>
              {projects.map(p => <Option key={p._id} value={p._id}>{p.name}</Option>)}
            </Select>
          </div>
        </div>

        {!selectedProject ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <CheckCircle size={48} color="#ccc" style={{ marginBottom: 16 }} />
            <Text type="secondary" style={{ display: 'block' }}>Select a project to see everything waiting on approval — strategies and tasks together</Text>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}><Spin size="large" /></div>
        ) : isEmpty ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <CheckCircle size={48} color="#ccc" style={{ marginBottom: 16 }} />
            <Text type="secondary" style={{ display: 'block' }}>
              {viewMode === 'Pending' ? 'Nothing pending — all strategies and tasks are up to date.' : 'No strategies or tasks found for this project.'}
            </Text>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {visibleStrategies.map(strategy => {
              const isPending = PENDING_STRATEGY_STATUSES.includes(strategy.status);
              return (
                <Card
                  key={`strategy-${strategy._id}`}
                  size="small"
                  style={{
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderLeft: isPending ? '4px solid var(--accent-warning)'
                      : strategy.status === 'Rejected' ? '4px solid var(--accent-danger)'
                        : '4px solid var(--accent-success)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                        <Tag className="seo-badge seo-badge-info">Strategy · Gate 1</Tag>
                        <StatusTag status={strategy.status} />
                      </div>
                      <Title level={5} style={{ margin: '0 0 4px 0' }}>{strategy.title || 'SEO Content Strategy'}</Title>
                      <Text type="secondary">Generated {new Date(strategy.createdAt).toLocaleDateString()}</Text>
                      <div>
                        <Button type="link" style={{ paddingLeft: 0 }} onClick={() => { setReviewStrategy(strategy); setReviewModalVisible(true); }}>
                          Review full strategy
                        </Button>
                      </div>
                    </div>

                    {isPending && !isViewOnly && canEdit && (
                      <ApprovalActionBar
                        vertical
                        onApprove={() => handleStrategyApprove(strategy)}
                        onReject={() => handleStrategyReject(strategy)}
                      />
                    )}
                  </div>
                </Card>
              );
            })}

            {visibleTasks.map(task => (
              <Card
                key={`task-${task._id}`}
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
                      <Tag className="seo-badge seo-badge-info">{task.taskType} · Gate 2</Tag>
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
                      onApprove={() => handleTaskStatus(task._id, 'Approved')}
                      onReject={() => handleTaskStatus(task._id, 'Rejected')}
                    />
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
      <Modal
        title={<Title level={4} style={{ margin: 0, fontWeight: 800 }}>{reviewStrategy?.title || 'SEO Content Strategy'}</Title>}
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setReviewModalVisible(false)} className="seo-glow-btn-secondary">Close</Button>,
          ...(!isViewOnly && canEdit && reviewStrategy && PENDING_STRATEGY_STATUSES.includes(reviewStrategy.status) ? [
            <Button key="reject" danger onClick={() => handleStrategyReject(reviewStrategy)}>Reject</Button>,
            <Button key="approve" type="primary" onClick={() => handleStrategyApprove(reviewStrategy)} className="seo-glow-btn">Approve</Button>
          ] : [])
        ]}
        width={800}
      >
        {reviewStrategy?.status && <StatusTag status={reviewStrategy.status} className="seo-strategy-status-tag" />}
        <div className="seo-markdown-container" style={{ maxHeight: '45vh', overflowY: 'auto', marginTop: 16 }}>
          <ReactMarkdown>{reviewStrategy?.content || 'No content available.'}</ReactMarkdown>
        </div>
        <Divider />
        <CollaborationDrawer
          targetType="Strategy"
          targetId={reviewStrategy?._id}
          projectId={selectedProject}
          canWrite={!isViewOnly}
        />
      </Modal>

    </>
  );
};

export default ApprovalsQueuePanel;
