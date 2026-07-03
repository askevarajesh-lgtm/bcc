import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Form, Input, DatePicker, Select, InputNumber, Drawer, 
  Modal, Tabs, Card, Row, Col, Statistic, Space, Tag, Timeline, List, 
  Divider, Popconfirm, Tooltip, Badge, Avatar, Progress, Checkbox,
  message
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, FolderOutlined, UnorderedListOutlined, 
  BarChartOutlined, PaperClipOutlined, FileTextOutlined, TeamOutlined, 
  UserOutlined, ClockCircleOutlined, LinkOutlined, DeleteOutlined, 
  EditOutlined, CheckCircleOutlined, InfoCircleOutlined, CloseCircleOutlined,
  BookOutlined, FileSyncOutlined, CheckSquareOutlined, CommentOutlined,
  CloudUploadOutlined, SmileOutlined, WarningOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  useGetDeliverablesQuery, useGetDeliverableByIdQuery, useGetDeliverableAnalyticsQuery, 
  useCreateDeliverableMutation, useUpdateDeliverableMutation, useDeleteDeliverableMutation, 
  useSubmitForApprovalMutation, useApproveDeliverableMutation, useRequestRevisionMutation,
  useUploadDeliverableFileMutation, useAddDeliverableCommentMutation 
} from '../../api/deliverableApi';
import { useGetUsersDropdownQuery } from '../../api/userApi';
import { useGetCompaniesDropdownQuery } from '../../api/companyApi';
import { useGetProjectsDropdownQuery } from '../../api/projectApi';
import { useGetTasksQuery } from '../../api/taskApi';

const { TextArea } = Input;
const { Option } = Select;

const cardStyle = (isDark) => ({
  borderRadius: '12px',
  background: isDark ? '#1f1f1f' : '#ffffff',
  boxShadow: isDark ? '0 4px 12px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
  border: isDark ? '1px solid #303030' : '1px solid #f0f0f0',
  marginBottom: '24px',
});

const DeliverablesPage = () => {
  const { user: currentUser } = useAuth();
  const { isDark } = useTheme();
  const userRole = currentUser?.role;

  // Tabs state
  const [activeTab, setActiveTab] = useState('kanban');

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');

  // Modals / Drawers state
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDeliverableId, setSelectedDeliverableId] = useState(null);
  
  // Comments and files inputs
  const [commentText, setCommentText] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [remarks, setRemarks] = useState('');

  const [form] = Form.useForm();

  // Queries
  const { data: deliverablesResponse, refetch: refetchDeliverables, isLoading: isLoadingDeliverables } = useGetDeliverablesQuery({
    search,
    status: statusFilter,
    deliverableType: typeFilter,
    clientId: clientFilter
  });
  
  const { data: analyticsResponse, refetch: refetchAnalytics } = useGetDeliverableAnalyticsQuery({});
  
  const { data: detailResponse, refetch: refetchDetail } = useGetDeliverableByIdQuery(selectedDeliverableId, {
    skip: !selectedDeliverableId
  });

  const { data: usersData } = useGetUsersDropdownQuery({});
  const { data: companiesData } = useGetCompaniesDropdownQuery({});
  const { data: projectsData } = useGetProjectsDropdownQuery({});
  const { data: tasksData } = useGetTasksQuery({ limit: 500 });

  // Mutations
  const [createDeliverable, { isLoading: isCreating }] = useCreateDeliverableMutation();
  const [updateDeliverable, { isLoading: isUpdating }] = useUpdateDeliverableMutation();
  const [deleteDeliverable] = useDeleteDeliverableMutation();
  const [submitForApproval] = useSubmitForApprovalMutation();
  const [approveDeliverable] = useApproveDeliverableMutation();
  const [requestRevision] = useRequestRevisionMutation();
  const [uploadFile] = useUploadDeliverableFileMutation();
  const [addComment] = useAddDeliverableCommentMutation();

  const deliverables = deliverablesResponse?.data?.deliverables || [];
  const analytics = analyticsResponse?.data?.analytics || null;
  const detailData = detailResponse?.data || null;

  const users = Array.isArray(usersData?.data?.users) ? usersData.data.users : 
                Array.isArray(usersData?.data) ? usersData.data : 
                Array.isArray(usersData) ? usersData : [];

  const clients = Array.isArray(companiesData?.data?.companies) ? companiesData.data.companies : 
                  Array.isArray(companiesData?.data) ? companiesData.data : 
                  Array.isArray(companiesData) ? companiesData : [];

  const projects = Array.isArray(projectsData?.data?.projects) ? projectsData.data.projects : 
                   Array.isArray(projectsData?.data) ? projectsData.data : 
                   Array.isArray(projectsData) ? projectsData : [];

  const tasks = Array.isArray(tasksData?.data?.data) ? tasksData.data.data :
                Array.isArray(tasksData?.data?.tasks) ? tasksData.data.tasks :
                Array.isArray(tasksData?.data) ? tasksData.data :
                Array.isArray(tasksData) ? tasksData : [];

  // Refetch on filters
  useEffect(() => {
    refetchDeliverables();
  }, [search, statusFilter, typeFilter, clientFilter]);

  const closeDrawer = () => {
    setDrawerVisible(false);
    setEditingDeliverable(null);
    form.resetFields();
  };

  const openCreateDrawer = () => {
    setEditingDeliverable(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const openEditDrawer = (record) => {
    setEditingDeliverable(record);
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      deliverableType: record.deliverableType,
      status: record.status,
      priority: record.priority,
      dueDate: dayjs(record.dueDate),
      clientId: record.clientId?._id || record.clientId,
      projectId: record.projectId?._id || record.projectId,
      taskId: record.taskId?._id || record.taskId,
      assignee: record.assignee?._id || record.assignee,
      approver: record.approver?._id || record.approver
    });
    setDrawerVisible(true);
  };

  const handleFormSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        dueDate: values.dueDate.toISOString()
      };

      if (editingDeliverable) {
        await updateDeliverable({ id: editingDeliverable._id, ...payload }).unwrap();
        message.success('Deliverable updated successfully');
      } else {
        await createDeliverable(payload).unwrap();
        message.success('Deliverable created successfully');
      }
      refetchDeliverables();
      refetchAnalytics();
      closeDrawer();
    } catch (err) {
      message.error(err.data?.message || 'Failed to save deliverable');
    }
  };

  const handleDeleteDeliverable = async (id) => {
    try {
      await deleteDeliverable(id).unwrap();
      message.success('Deliverable deleted successfully');
      refetchDeliverables();
      refetchAnalytics();
    } catch (err) {
      message.error('Failed to delete deliverable');
    }
  };

  // Approval operations
  const handleSubmitReview = async () => {
    try {
      await submitForApproval({ id: selectedDeliverableId, remarks }).unwrap();
      message.success('Submitted for approval review');
      setRemarks('');
      refetchDetail();
      refetchDeliverables();
    } catch (err) {
      message.error('Failed to submit approval');
    }
  };

  const handleApprove = async () => {
    try {
      await approveDeliverable({ id: selectedDeliverableId, remarks }).unwrap();
      message.success('Deliverable approved successfully');
      setRemarks('');
      refetchDetail();
      refetchDeliverables();
      refetchAnalytics();
    } catch (err) {
      message.error('Failed to approve');
    }
  };

  const handleRequestRevision = async () => {
    try {
      await requestRevision({ id: selectedDeliverableId, remarks }).unwrap();
      message.success('Revisions requested successfully');
      setRemarks('');
      refetchDetail();
      refetchDeliverables();
      refetchAnalytics();
    } catch (err) {
      message.error('Failed to request revisions');
    }
  };

  // Upload/Comments callbacks
  const handleUploadFile = async () => {
    if (!fileName.trim() || !fileUrl.trim()) return;
    try {
      await uploadFile({ id: selectedDeliverableId, fileName, url: fileUrl }).unwrap();
      setFileName('');
      setFileUrl('');
      message.success('File link attached');
      refetchDetail();
      refetchDeliverables();
    } catch (err) {
      message.error('Failed to upload file link');
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    try {
      await addComment({ id: selectedDeliverableId, content: commentText }).unwrap();
      setCommentText('');
      message.success('Comment posted');
      refetchDetail();
    } catch (err) {
      message.error('Failed to post comment');
    }
  };

  // Status badging mapping
  const getStatusBadge = (status) => {
    const map = {
      backlog: { color: 'default', label: 'Backlog' },
      in_progress: { color: 'blue', label: 'In Progress' },
      in_review: { color: 'orange', label: 'In Review' },
      revisions: { color: 'purple', label: 'Revisions' },
      approved: { color: 'green', label: 'Approved' }
    };
    const item = map[status] || { color: 'default', label: status };
    return <Badge status={item.color} text={item.label} />;
  };

  // Render columns for Table
  const tableColumns = [
    {
      title: 'Deliverable Title',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <span 
            style={{ fontWeight: 600, color: '#1890ff', cursor: 'pointer' }}
            onClick={() => {
              setSelectedDeliverableId(record._id);
              setDetailModalVisible(true);
            }}
          >
            {text}
          </span>
          <div style={{ fontSize: '11px', color: '#8c8c8c' }}>{record.deliverableType.replace('_', ' ').toUpperCase()}</div>
        </div>
      )
    },
    {
      title: 'Client Account',
      dataIndex: 'clientId',
      key: 'clientId',
      render: (client) => client?.companyName || client?.name || 'N/A'
    },
    {
      title: 'Assignee',
      dataIndex: 'assignee',
      key: 'assignee',
      render: (user) => (
        user ? (
          <Space>
            <Avatar size="small" icon={<UserOutlined />} src={user.logo} />
            <span>{user.name}</span>
          </Space>
        ) : 'Unassigned'
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusBadge(status)
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      render: (pct) => <Progress percent={pct} size="small" status={pct === 100 ? 'success' : 'active'} />
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date) => {
        const isOverdue = dayjs(date).isBefore(dayjs()) && !date;
        return (
          <span style={{ color: isOverdue ? '#f5222d' : 'inherit', fontWeight: isOverdue ? 600 : 'normal' }}>
            {dayjs(date).format('MMM DD, YYYY')}
            {isOverdue && <WarningOutlined style={{ marginLeft: 4 }} />}
          </span>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Overview / Uploads">
            <Button 
              type="link" 
              icon={<InfoCircleOutlined />} 
              onClick={() => {
                setSelectedDeliverableId(record._id);
                setDetailModalVisible(true);
              }}
            />
          </Tooltip>
          {['supreme_super_admin', 'commander_admin', 'agency_super_admin', 'agency_manager'].includes(userRole) && (
            <>
              <Tooltip title="Edit">
                <Button 
                  type="link" 
                  icon={<EditOutlined />} 
                  onClick={() => openEditDrawer(record)} 
                />
              </Tooltip>
              <Popconfirm
                title="Are you sure to delete this deliverable?"
                onConfirm={() => handleDeleteDeliverable(record._id)}
                okText="Yes"
                cancelText="No"
              >
                <Tooltip title="Delete">
                  <Button 
                    type="link" 
                    danger 
                    icon={<DeleteOutlined />} 
                  />
                </Tooltip>
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ];

  // Kanban view mapping helper
  const renderKanbanColumn = (stage, title) => {
    const list = deliverables.filter(d => d.status === stage);
    return (
      <Col xs={24} md={4} style={{ padding: '0 8px' }} key={stage}>
        <div style={{ background: isDark ? '#141414' : '#f0f2f5', padding: '12px', borderRadius: '8px', minHeight: '500px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, textTransform: 'uppercase', fontSize: '12px', fontWeight: 600 }}>{title}</h4>
            <Badge count={list.length} style={{ backgroundColor: '#1890ff' }} />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {list.map(d => (
              <Card 
                key={d._id} 
                hoverable
                style={{ borderRadius: '8px', border: isDark ? '1px solid #303030' : '1px solid #e8e8e8' }}
                onClick={() => {
                  setSelectedDeliverableId(d._id);
                  setDetailModalVisible(true);
                }}
                bodyStyle={{ padding: '12px' }}
              >
                <div style={{ fontWeight: 600, fontSize: '13px', color: '#1890ff', marginBottom: '4px' }}>{d.title}</div>
                <div style={{ fontSize: '11px', color: '#8c8c8c', marginBottom: '8px' }}>{d.clientId?.companyName || d.clientId?.name || 'N/A'}</div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <Tag style={{ fontSize: '10px' }}>{d.deliverableType.replace('_', ' ')}</Tag>
                  <Tag color={d.priority === 'critical' || d.priority === 'high' ? 'red' : 'blue'} style={{ fontSize: '9px' }}>
                    {d.priority}
                  </Tag>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#8c8c8c' }}>
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    {dayjs(d.dueDate).format('MMM DD')}
                  </span>
                  {d.assignee && (
                    <Avatar size="small" icon={<UserOutlined />} src={d.assignee.logo} title={d.assignee.name} />
                  )}
                </div>
                
                <Progress percent={d.progress} size="small" showInfo={false} style={{ marginTop: '8px', marginBottom: 0 }} />
              </Card>
            ))}
            {list.length === 0 && (
              <div style={{ textAlign: 'center', color: '#bfbfbf', padding: '24px 0', fontSize: '12px' }}>Empty</div>
            )}
          </div>
        </div>
      </Col>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: isDark ? '#141414' : '#f5f7fa' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: isDark ? '#ffffff' : '#1f1f1f' }}>
            Deliverables Management
          </h1>
          <p style={{ margin: 0, color: '#8c8c8c' }}>
            Track design, content, audits, plans, and campaign assets through client approvals.
          </p>
        </div>
        {['supreme_super_admin', 'commander_admin', 'agency_super_admin', 'agency_manager'].includes(userRole) && (
          <Button 
            type="primary" 
            size="large" 
            icon={<PlusOutlined />} 
            onClick={openCreateDrawer}
            style={{ borderRadius: '8px', background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', border: 'none' }}
          >
            Create Deliverable
          </Button>
        )}
      </div>

      {/* KPI Stats Cards */}
      <Row gutter={16}>
        <Col xs={12} sm={6} md={4}>
          <Card style={cardStyle(isDark)}>
            <Statistic title="Total Assets" value={analytics?.total || 0} prefix={<FolderOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card style={cardStyle(isDark)}>
            <Statistic title="In Progress" value={analytics?.inProgress || 0} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card style={cardStyle(isDark)}>
            <Statistic title="Pending Review" value={analytics?.inReview || 0} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card style={cardStyle(isDark)}>
            <Statistic title="Need Revision" value={analytics?.revisions || 0} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card style={cardStyle(isDark)}>
            <Statistic title="Overdue Items" value={analytics?.overdue || 0} valueStyle={{ color: '#f5222d' }} prefix={<WarningOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card style={cardStyle(isDark)}>
            <Statistic title="Completed Approved" value={analytics?.approved || 0} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      {/* Main Tabs */}
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        type="card"
        style={{ marginBottom: '24px' }}
        items={[
          {
            key: 'kanban',
            label: <span><FolderOutlined />Workflow Board</span>,
            children: (
              <Card style={{ borderRadius: '12px', padding: '16px' }}>
                {/* Search & Filters */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                  <Input
                    placeholder="Search deliverable title..."
                    prefix={<SearchOutlined />}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ width: 280, borderRadius: '8px' }}
                  />
                  <Select
                    placeholder="Filter by Category"
                    value={typeFilter}
                    onChange={setTypeFilter}
                    style={{ width: 180 }}
                    allowClear
                  >
                    <Option value="ad_creative">Ad Creative</Option>
                    <Option value="landing_page">Landing Page</Option>
                    <Option value="content">Content</Option>
                    <Option value="report">Report</Option>
                    <Option value="social_post">Social Post</Option>
                    <Option value="seo_audit">SEO Audit</Option>
                    <Option value="strategy_deck">Strategy Deck</Option>
                    <Option value="website_design">Website Design</Option>
                    <Option value="video_creative">Video Creative</Option>
                    <Option value="campaign_plan">Campaign Plan</Option>
                  </Select>
                  <Select
                    placeholder="Filter by Client"
                    value={clientFilter}
                    onChange={setClientFilter}
                    style={{ width: 200 }}
                    allowClear
                  >
                    {clients.map(c => (
                      <Option key={c._id} value={c._id}>{c.companyName || c.name}</Option>
                    ))}
                  </Select>
                </div>

                <Row gutter={16}>
                  {renderKanbanColumn('backlog', 'Backlog')}
                  {renderKanbanColumn('in_progress', 'In Progress')}
                  {renderKanbanColumn('in_review', 'In Review')}
                  {renderKanbanColumn('revisions', 'Revisions')}
                  {renderKanbanColumn('approved', 'Approved')}
                </Row>
              </Card>
            )
          },
          {
            key: 'list',
            label: <span><UnorderedListOutlined />List Agenda</span>,
            children: (
              <Card style={{ borderRadius: '12px', padding: '16px' }}>
                <Table
                  columns={tableColumns}
                  dataSource={deliverables}
                  rowKey="_id"
                  loading={isLoadingDeliverables}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            )
          },
          {
            key: 'analytics',
            label: <span><BarChartOutlined />Workload Analytics</span>,
            children: (
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Card title="Client Account Load Distribution" style={cardStyle(isDark)}>
                    <List
                      dataSource={analytics?.clientBreakdown || []}
                      renderItem={item => (
                        <List.Item key={item._id}>
                          <span>{item.clientName || 'General'}</span>
                          <strong>{item.count} assets</strong>
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card title="Team Member Workloads" style={cardStyle(isDark)}>
                    <List
                      dataSource={analytics?.assigneeBreakdown || []}
                      renderItem={item => (
                        <List.Item key={item._id}>
                          <span>{item.name || 'Unassigned'}</span>
                          <strong>{item.count} assigned</strong>
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
              </Row>
            )
          }
        ]}
      />

      {/* Create / Edit Drawer */}
      <Drawer
        title={editingDeliverable ? "Edit Deliverable Details" : "Create Deliverable Asset"}
        width={560}
        onClose={closeDrawer}
        open={drawerVisible}
        styles={{ body: { paddingBottom: 80 } }}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={closeDrawer} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button 
              onClick={() => form.submit()} 
              type="primary" 
              loading={isCreating || isUpdating}
            >
              Save Deliverable
            </Button>
          </div>
        }
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleFormSubmit}
        >
          <Form.Item
            name="title"
            label="Deliverable Title"
            rules={[{ required: true, message: 'Please enter deliverable title' }]}
          >
            <Input placeholder="e.g. July FB Ad Copy Mockups" />
          </Form.Item>

          <Form.Item
            name="deliverableType"
            label="Category Type"
            rules={[{ required: true, message: 'Please select category type' }]}
          >
            <Select placeholder="Select type">
              <Option value="ad_creative">Ad Creative</Option>
              <Option value="landing_page">Landing Page</Option>
              <Option value="content">Content Copy / Blog</Option>
              <Option value="report">Attribution Report</Option>
              <Option value="social_post">Social Media Post</Option>
              <Option value="seo_audit">SEO Audit Report</Option>
              <Option value="strategy_deck">Strategy Slide Deck</Option>
              <Option value="website_design">Website Figma Design</Option>
              <Option value="video_creative">Video Asset</Option>
              <Option value="campaign_plan">Campaign Roadmap Plan</Option>
              <Option value="other">Other Asset</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label="Priority Level"
            rules={[{ required: true }]}
            initialValue="medium"
          >
            <Select>
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
              <Option value="critical">Critical</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="dueDate"
            label="Target Due Date"
            rules={[{ required: true, message: 'Due date is required' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="clientId"
            label="Client Account"
            rules={[{ required: true, message: 'Client account is required' }]}
          >
            <Select placeholder="Select brand/client">
              {clients.map(c => (
                <Option key={c._id} value={c._id}>{c.companyName || c.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="assignee"
            label="Assignee (Owner)"
          >
            <Select placeholder="Select team member" allowClear>
              {users.map(u => (
                <Option key={u._id} value={u._id}>{u.name} ({u.role})</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="approver"
            label="Reviewer Approver"
          >
            <Select placeholder="Select approver" allowClear>
              {users.map(u => (
                <Option key={u._id} value={u._id}>{u.name} ({u.role})</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Asset Scope Description"
          >
            <TextArea rows={4} placeholder="Detail requirements, instructions, colors, copy scope..." />
          </Form.Item>

          <Divider>Module Links (Optional)</Divider>

          <Form.Item
            name="projectId"
            label="Link Project Workspace"
          >
            <Select placeholder="Select project" allowClear>
              {projects.map(p => (
                <Option key={p._id} value={p._id}>{p.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="taskId"
            label="Link Related Task"
          >
            <Select placeholder="Select task milestone" allowClear>
              {tasks.map(t => (
                <Option key={t._id} value={t._id}>{t.title} ({t.status})</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Drawer>

      {/* Details Timeline, Files & Comments Modal */}
      <Modal
        title={
          <div>
            <span style={{ fontSize: '18px', fontWeight: 600 }}>{detailData?.deliverable?.title}</span>
            <div style={{ marginTop: 4 }}>
              {detailData?.deliverable && getStatusBadge(detailData.deliverable.status)}
            </div>
          </div>
        }
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedDeliverableId(null);
        }}
        footer={null}
        width={720}
        styles={{ body: { padding: '0 24px 24px 24px' } }}
      >
        {detailData ? (
          <Tabs defaultActiveKey="overview" style={{ marginTop: '16px' }}>
            <Tabs.TabPane tab="Overview" key="overview">
              <Row gutter={16}>
                <Col span={14}>
                  <p><strong>Requirement Scope:</strong></p>
                  <p>{detailData.deliverable.description || 'No requirements documented.'}</p>
                  
                  <p><strong>Due Date:</strong> {dayjs(detailData.deliverable.dueDate).format('MMMM DD, YYYY')}</p>
                  <Progress percent={detailData.deliverable.progress} status="active" />

                  <Divider />
                  
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div>
                      <p><strong>Assignee:</strong></p>
                      {detailData.deliverable.assignee ? (
                        <Space>
                          <Avatar size="small" src={detailData.deliverable.assignee.logo} icon={<UserOutlined />} />
                          <span>{detailData.deliverable.assignee.name}</span>
                        </Space>
                      ) : 'None'}
                    </div>
                    <div>
                      <p><strong>Approver Reviewer:</strong></p>
                      {detailData.deliverable.approver ? (
                        <Space>
                          <Avatar size="small" src={detailData.deliverable.approver.logo} icon={<UserOutlined />} />
                          <span>{detailData.deliverable.approver.name}</span>
                        </Space>
                      ) : 'None'}
                    </div>
                  </div>

                  <Divider />
                  
                  {/* Approval Actions block */}
                  <div style={{ background: '#f9f9f9', padding: '12px', borderRadius: '8px' }}>
                    <h4>Approval Desk</h4>
                    <Form.Item label="Action Remarks">
                      <Input 
                        value={remarks} 
                        onChange={e => setRemarks(e.target.value)} 
                        placeholder="e.g. Approve or request changes" 
                      />
                    </Form.Item>
                    
                    <Space>
                      {detailData.deliverable.status !== 'approved' && (
                        <>
                          {(userRole === 'agency_client' || userRole === 'client' || ['supreme_super_admin', 'commander_admin', 'agency_super_admin'].includes(userRole)) ? (
                            <>
                              <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleApprove} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}>
                                Approve & Signoff
                              </Button>
                              <Button danger icon={<CloseCircleOutlined />} onClick={handleRequestRevision}>
                                Request Changes
                              </Button>
                            </>
                          ) : (
                            <Button type="primary" icon={<FileSyncOutlined />} onClick={handleSubmitReview}>
                              Submit to Client Approval
                            </Button>
                          )}
                        </>
                      )}
                    </Space>
                  </div>
                </Col>

                <Col span={10}>
                  <Card title="Activity Log" size="small" style={{ maxHeight: 350, overflowY: 'auto' }}>
                    <Timeline 
                      items={(detailData.deliverable.activityHistory || []).map(h => ({
                        children: (
                          <div>
                            <span style={{ fontSize: '11px', fontWeight: 600 }}>{h.action.replace('_', ' ').toUpperCase()}</span>
                            <div style={{ fontSize: '10px', color: '#8c8c8c' }}>{h.details}</div>
                            <div style={{ fontSize: '9px', color: '#bfbfbf' }}>{dayjs(h.timestamp).format('MMM D, h:mm a')}</div>
                          </div>
                        )
                      }))}
                    />
                  </Card>
                </Col>
              </Row>
            </Tabs.TabPane>

            <Tabs.TabPane tab={<span><PaperClipOutlined />Uploaded Files ({detailData.files?.length || 0})</span>} key="files">
              <List
                dataSource={detailData.files}
                style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 16 }}
                renderItem={file => (
                  <List.Item key={file._id}>
                    <Space>
                      <PaperClipOutlined />
                      <a href={file.url} target="_blank" rel="noreferrer">
                        {file.fileName} (v{file.version})
                      </a>
                      <span style={{ fontSize: '11px', color: '#bfbfbf' }}>Uploaded by {file.uploadedBy?.name}</span>
                    </Space>
                  </List.Item>
                )}
              />
              <Divider />
              <h4>Attach Deliverable Assets</h4>
              <Form layout="vertical">
                <Form.Item label="Asset Filename" required>
                  <Input value={fileName} onChange={e => setFileName(e.target.value)} placeholder="e.g. Homepage mockup v1" />
                </Form.Item>
                <Form.Item label="Asset URL (Figma / Drive / File URL)" required>
                  <Input value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="https://figma.com/..." />
                </Form.Item>
                <Button type="primary" icon={<CloudUploadOutlined />} onClick={handleUploadFile}>
                  Attach Link/File
                </Button>
              </Form>
            </Tabs.TabPane>

            <Tabs.TabPane tab={<span><CommentOutlined />Feedback Comments ({detailData.comments?.length || 0})</span>} key="comments">
              <List
                dataSource={detailData.comments}
                style={{ maxHeight: 240, overflowY: 'auto', marginBottom: 16 }}
                renderItem={c => (
                  <List.Item key={c._id}>
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} src={c.createdBy?.logo} />}
                      title={<span>{c.createdBy?.name || 'User'} <span style={{ fontSize: '10px', color: '#bfbfbf' }}>{dayjs(c.createdAt).format('MMM D, h:mm a')}</span></span>}
                      description={c.content}
                    />
                  </List.Item>
                )}
              />
              <Divider />
              <Form.Item label="Write comment / revision feedback">
                <TextArea rows={3} value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Provide feedback..." />
                <Button type="primary" style={{ marginTop: 12 }} onClick={handlePostComment}>
                  Send Feedback
                </Button>
              </Form.Item>
            </Tabs.TabPane>
          </Tabs>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px' }}>Loading deliverable metadata...</div>
        )}
      </Modal>
    </div>
  );
};

export default DeliverablesPage;
