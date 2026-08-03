import React, { useState, useEffect, useMemo } from 'react';
import {
  Table, Button, Form, Input, DatePicker, Select, InputNumber, Drawer,
  Modal, Tabs, Card, Row, Col, Statistic, Space, Tag, Timeline, List,
  Divider, Popconfirm, Calendar, Tooltip, Badge, Avatar, Progress, Checkbox,
  message
} from 'antd';
import {
  PlusOutlined, SearchOutlined, CalendarOutlined, UnorderedListOutlined,
  BarChartOutlined, PaperClipOutlined, FileTextOutlined, TeamOutlined,
  UserOutlined, ClockCircleOutlined, LinkOutlined, DeleteOutlined,
  EditOutlined, CheckCircleOutlined, InfoCircleOutlined, CloseCircleOutlined,
  CalendarTwoTone, WarningOutlined, FileAddOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  useGetEventsQuery, useGetEventByIdQuery, useGetCalendarAnalyticsQuery,
  useCreateEventMutation, useUpdateEventMutation, useDeleteEventMutation,
  useUpdateEventStatusMutation, useAddEventNoteMutation,
  useAddEventAttachmentMutation
} from '../../api/calendarApi';
import { useGetUsersDropdownQuery } from '../../api/userApi';
import { useGetCompaniesDropdownQuery } from '../../api/companyApi';
import { useGetLeadsQuery } from '../../api/leadApi';
import { useGetProjectsDropdownQuery } from '../../api/projectApi';

const { TextArea } = Input;
const { Option } = Select;

// Custom styling for premium UI feel
const cardStyle = (isDark) => ({
  borderRadius: '12px',
  background: isDark ? '#1f1f1f' : '#ffffff',
  boxShadow: isDark ? '0 4px 12px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
  border: isDark ? '1px solid #303030' : '1px solid #f0f0f0',
  marginBottom: '24px',
  transition: 'transform 0.2s, box-shadow 0.2s',
});

const CalendarPage = () => {
  const { user: currentUser } = useAuth();
  const { isDark } = useTheme();
  const userRole = currentUser?.role;

  // Tabs state
  const [activeTab, setActiveTab] = useState('calendar');

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');

  // Calendar dates range
  const [dateRange, setDateRange] = useState({
    startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
    endDate: dayjs().endOf('month').format('YYYY-MM-DD'),
  });

  // Drawers and Modals state
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);

  // Note/Attachment inputs
  const [noteContent, setNoteContent] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  const [form] = Form.useForm();

  // Queries
  const { data: eventsResponse, refetch: refetchEvents, isLoading: isLoadingEvents } = useGetEventsQuery({
    search,
    eventType: typeFilter,
    clientId: clientFilter,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  });

  const { data: analyticsResponse, refetch: refetchAnalytics } = useGetCalendarAnalyticsQuery({});

  const { data: detailResponse, refetch: refetchDetail } = useGetEventByIdQuery(selectedEventId, {
    skip: !selectedEventId
  });

  // Dropdowns lists
  const { data: usersData } = useGetUsersDropdownQuery({});
  const { data: companiesData } = useGetCompaniesDropdownQuery({});
  const { data: leadsData } = useGetLeadsQuery({ limit: 500 });
  const { data: projectsData } = useGetProjectsDropdownQuery({});

  // Mutations
  const [createEvent, { isLoading: isCreating }] = useCreateEventMutation();
  const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation();
  const [deleteEvent] = useDeleteEventMutation();
  const [updateEventStatus] = useUpdateEventStatusMutation();
  const [addEventNote, { isLoading: isAddingNote }] = useAddEventNoteMutation();
  const [addEventAttachment] = useAddEventAttachmentMutation();

  const events = eventsResponse?.data?.events || [];
  const analytics = analyticsResponse?.data?.analytics || null;
  const detailData = detailResponse?.data || null;

  const users = usersData?.data?.users || usersData?.data || [];
  const clients = companiesData?.data?.companies || companiesData?.data || [];
  const leads = leadsData?.data?.leads || leadsData?.data || [];
  const projects = projectsData?.data?.projects || projectsData?.data || [];

  // Re-fetch on filter changes
  useEffect(() => {
    refetchEvents();
  }, [search, statusFilter, typeFilter, clientFilter, dateRange]);

  // Handle drawer close
  const closeDrawer = () => {
    setDrawerVisible(false);
    setEditingEvent(null);
    form.resetFields();
  };

  // Open drawer for creating
  const openCreateDrawer = () => {
    setEditingEvent(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  // Open drawer for editing
  const openEditDrawer = (event) => {
    if (event.source !== 'custom') {
      message.warning('This event is linked to another module (Meeting/Task/Lead) and must be modified there.');
      return;
    }
    setEditingEvent(event);
    form.setFieldsValue({
      title: event.title,
      dateRange: [dayjs(event.startDateTime), dayjs(event.endDateTime)],
      eventType: event.eventType,
      location: event.location,
      meetingLink: event.meetingLink,
      notes: event.notes,
      clientId: event.clientId?._id || event.clientId,
      leadId: event.leadId?._id || event.leadId,
      projectId: event.projectId?._id || event.projectId,
      attendees: event.attendees?.map(a => a._id || a)
    });
    setDrawerVisible(true);
  };

  // Handle submit create / edit form
  const handleFormSubmit = async (values) => {
    try {
      const payload = {
        title: values.title,
        eventType: values.eventType,
        startDateTime: values.dateRange[0].toISOString(),
        endDateTime: values.dateRange[1].toISOString(),
        location: values.location,
        meetingLink: values.meetingLink,
        notes: values.notes,
        clientId: values.clientId,
        leadId: values.leadId,
        projectId: values.projectId,
        attendees: values.attendees
      };

      if (editingEvent) {
        await updateEvent({ id: editingEvent._id, ...payload }).unwrap();
        message.success('Event updated successfully');
      } else {
        await createEvent(payload).unwrap();
        message.success('Event created successfully');
      }
      refetchEvents();
      refetchAnalytics();
      closeDrawer();
    } catch (err) {
      message.error(err.data?.message || 'Failed to save event');
    }
  };

  // Handle delete event
  const handleDeleteEvent = async (id, source) => {
    if (source !== 'custom') {
      message.warning('Only custom events can be deleted from Calendar. Tasks and Meetings should be deleted in their respective modules.');
      return;
    }
    try {
      await deleteEvent(id).unwrap();
      message.success('Event deleted successfully');
      refetchEvents();
      refetchAnalytics();
    } catch (err) {
      message.error(err.data?.message || 'Failed to delete event');
    }
  };

  // Handle status update
  const handleStatusUpdate = async (id, status, source) => {
    if (source !== 'custom') {
      message.warning('Status for Meetings and Tasks must be updated in their respective modules.');
      return;
    }
    try {
      await updateEventStatus({ id, status }).unwrap();
      message.success(`Event status updated to ${status}`);
      refetchEvents();
      refetchAnalytics();
      if (selectedEventId === id) {
        refetchDetail();
      }
    } catch (err) {
      message.error(err.data?.message || 'Failed to update status');
    }
  };

  // Add Note
  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    try {
      await addEventNote({ id: selectedEventId, content: noteContent }).unwrap();
      setNoteContent('');
      message.success('Note added');
      refetchDetail();
    } catch (err) {
      message.error('Failed to add note');
    }
  };

  // Add Attachment
  const handleAddAttachment = async () => {
    if (!attachmentUrl.trim() || !attachmentName.trim()) return;
    try {
      await addEventAttachment({
        id: selectedEventId,
        url: attachmentUrl,
        fileName: attachmentName,
        fileType: 'link'
      }).unwrap();
      setAttachmentUrl('');
      setAttachmentName('');
      message.success('Attachment added');
      refetchDetail();
    } catch (err) {
      message.error('Failed to add attachment');
    }
  };

  // Status rendering helpers
  const getStatusTag = (status) => {
    const statusMap = {
      upcoming: { color: 'blue', label: 'Upcoming' },
      awaiting_confirmation: { color: 'orange', label: 'Awaiting Confirm' },
      completed: { color: 'green', label: 'Completed' },
      cancelled: { color: 'red', label: 'Cancelled' },
      rescheduled: { color: 'purple', label: 'Rescheduled' },
      missed: { color: 'default', label: 'Missed' }
    };
    const { color, label } = statusMap[status] || { color: 'default', label: status };
    return <Tag color={color}>{label}</Tag>;
  };

  // Render Calendar events
  const getCalendarListData = (value) => {
    const dateStr = value.format('YYYY-MM-DD');
    return events.filter(e => dayjs(e.startDateTime).format('YYYY-MM-DD') === dateStr);
  };

  const calendarDateCellRender = (value) => {
    const listData = getCalendarListData(value);
    return (
      <ul className="events" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {listData.map(item => (
          <li key={item._id} style={{ margin: '2px 0' }}>
            <Tooltip title={`${item.title} (${dayjs(item.startDateTime).format('h:mm a')})`}>
              <Badge
                status={
                  item.source === 'meeting' ? 'processing' :
                    item.source === 'task' ? 'warning' : 'success'
                }
                text={
                  <span
                    style={{ fontSize: '11px', display: 'inline-block', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEventId(item._id);
                      setDetailModalVisible(true);
                    }}
                  >
                    {item.title}
                  </span>
                }
              />
            </Tooltip>
          </li>
        ))}
      </ul>
    );
  };

  // Handle month range changes
  const handlePanelChange = (value) => {
    setDateRange({
      startDate: value.startOf('month').format('YYYY-MM-DD'),
      endDate: value.endOf('month').format('YYYY-MM-DD'),
    });
  };

  // Table Columns config
  const columns = [
    {
      title: 'Event Title',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <span
            style={{ fontWeight: 600, color: 'var(--accent-primary)', cursor: 'pointer' }}
            onClick={() => {
              setSelectedEventId(record._id);
              setDetailModalVisible(true);
            }}
          >
            {text}
          </span>
          <div style={{ fontSize: '12px', color: '#8c8c8c', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {record.notes || 'No description provided'}
          </div>
        </div>
      )
    },
    {
      title: 'Timeline',
      dataIndex: 'startDateTime',
      key: 'startDateTime',
      render: (start, record) => (
        <div>
          <Space direction="vertical" size={0}>
            <span><CalendarOutlined style={{ marginRight: 6 }} />{dayjs(start).format('MMM DD, YYYY')}</span>
            <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
              <ClockCircleOutlined style={{ marginRight: 6 }} />
              {dayjs(start).format('h:mm a')} - {dayjs(record.endDateTime).format('h:mm a')}
            </span>
          </Space>
        </div>
      )
    },
    {
      title: 'Event Type',
      dataIndex: 'eventType',
      key: 'eventType',
      render: (type) => (
        <span style={{ textTransform: 'capitalize' }}>
          {type ? type.replace('_', ' ') : 'N/A'}
        </span>
      )
    },
    {
      title: 'Origin Module',
      dataIndex: 'source',
      key: 'source',
      render: (source) => {
        const sourceMap = {
          meeting: { color: 'blue', label: 'Meetings' },
          task: { color: 'purple', label: 'Task Milestones' },
          lead: { color: 'orange', label: 'CRM Leads' },
          custom: { color: 'green', label: 'Calendar Custom' }
        };
        const item = sourceMap[source] || { color: 'default', label: 'Custom' };
        return <Tag color={item.color}>{item.label}</Tag>;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          {record.meetingLink && (
            <Tooltip title="Join Meeting">
              <Button
                type="link"
                icon={<LinkOutlined />}
                href={record.meetingLink}
                target="_blank"
                style={{ color: '#52c41a' }}
              />
            </Tooltip>
          )}
          {record.source === 'custom' && ['supreme_super_admin', 'commander_admin', 'agency_super_admin', 'agency_manager'].includes(userRole) && (
            <>
              <Tooltip title="Edit">
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => openEditDrawer(record)}
                />
              </Tooltip>
              <Popconfirm
                title="Are you sure to delete this event?"
                onConfirm={() => handleDeleteEvent(record._id, record.source)}
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

  return (
    <div style={{ minHeight: '100vh', background: isDark ? '#0d1526' : '#f5f7fa' }}>

      {/* Top Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: isDark ? '#ffffff' : '#1f1f1f' }}>
            Calendar Dashboard
          </h1>
          <p style={{ margin: 0, color: '#8c8c8c' }}>
            Centralized schedule system monitoring Tasks, Client reviews, Campaigns, and Meetings.
          </p>
        </div>
        {['supreme_super_admin', 'commander_admin', 'agency_super_admin', 'agency_manager'].includes(userRole) && (
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={openCreateDrawer}
            style={{ borderRadius: '8px', background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-primary) 100%)', border: 'none' }}
          >
            Create Event
          </Button>
        )}
      </div>

      {/* KPI Stats Cards */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24, marginTop: 16 }}>
        <Col xs={12} sm={6}>
          <Card bodyStyle={{ padding: '30px 24px 24px', textAlign: 'center', position: 'relative' }} style={{ borderRadius: 16, background: isDark ? '#111c31' : '#ffffff', boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.08)', border: 'none', marginTop: 15 }}>
            <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(67, 56, 202, 0.4)' }}>
              <CalendarTwoTone style={{ fontSize: 24 }} twoToneColor="#ffffff" />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 12 }}>Total Events</div>
            <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1, color: isDark ? '#fff' : '#111c31' }}>{analytics?.totalEvents || events.length}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bodyStyle={{ padding: '30px 24px 24px', textAlign: 'center', position: 'relative' }} style={{ borderRadius: 16, background: isDark ? '#111c31' : '#ffffff', boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.08)', border: 'none', marginTop: 15 }}>
            <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #115e59 0%, #0d9488 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(13, 148, 136, 0.4)' }}>
              <ClockCircleOutlined style={{ fontSize: 24, color: '#fff' }} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 12 }}>Upcoming</div>
            <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1, color: isDark ? '#fff' : '#111c31' }}>{analytics?.statusStats?.upcoming || events.filter(e => e.status === 'upcoming').length}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bodyStyle={{ padding: '30px 24px 24px', textAlign: 'center', position: 'relative' }} style={{ borderRadius: 16, background: isDark ? '#111c31' : '#ffffff', boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.08)', border: 'none', marginTop: 15 }}>
            <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #701a75 0%, #a21caf 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(162, 28, 175, 0.4)' }}>
              <TeamOutlined style={{ fontSize: 24, color: '#fff' }} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 12 }}>Meetings</div>
            <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1, color: isDark ? '#fff' : '#111c31' }}>{analytics?.meetingsCount || 0}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bodyStyle={{ padding: '30px 24px 24px', textAlign: 'center', position: 'relative' }} style={{ borderRadius: 16, background: isDark ? '#111c31' : '#ffffff', boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.08)', border: 'none', marginTop: 15 }}>
            <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #831843 0%, #be123c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(190, 18, 60, 0.4)' }}>
              <CheckCircleOutlined style={{ fontSize: 24, color: '#fff' }} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 12 }}>Task Deadlines</div>
            <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1, color: isDark ? '#fff' : '#111c31' }}>{analytics?.tasksCount || 0}</div>
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
            key: 'calendar',
            label: <span><CalendarOutlined />Calendar View</span>,
            children: (
              <Card style={{ borderRadius: '12px', padding: '16px' }}>
                {/* Search & Filters */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                  <Input
                    placeholder="Search event title, details..."
                    prefix={<SearchOutlined />}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ width: 280, borderRadius: '8px' }}
                  />
                  <Select
                    placeholder="Filter by Type"
                    value={typeFilter}
                    onChange={setTypeFilter}
                    style={{ width: 180 }}
                    allowClear
                  >
                    <Option value="client_review">Client Review</Option>
                    <Option value="strategy_call">Strategy Call</Option>
                    <Option value="campaign_launch">Campaign Launch</Option>
                    <Option value="content_approval">Content Approval</Option>
                    <Option value="internal_sync">Internal Sync</Option>
                    <Option value="sales_call">Sales Call</Option>
                    <Option value="proposal_review">Proposal Review</Option>
                    <Option value="retainer_renewal">Retainer Renewal</Option>
                    <Option value="performance_review">Performance Review</Option>
                    <Option value="team_meeting">Team Meeting</Option>
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

                <Calendar
                  dateCellRender={calendarDateCellRender}
                  onPanelChange={handlePanelChange}
                />
              </Card>
            )
          },
          {
            key: 'list',
            label: <span><UnorderedListOutlined />Agenda View</span>,
            children: (
              <Card style={{ borderRadius: '12px', padding: '16px' }}>
                <Table
                  columns={columns}
                  dataSource={events}
                  rowKey="_id"
                  loading={isLoadingEvents}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            )
          },
          {
            key: 'analytics',
            label: <span><BarChartOutlined />Analytics</span>,
            children: (
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Card title="Event Categories Distribution" style={cardStyle(isDark)}>
                    <List
                      dataSource={Object.keys(analytics?.typeStats || {})}
                      renderItem={type => (
                        <List.Item>
                          <span style={{ textTransform: 'capitalize' }}>{type.replace('_', ' ')}</span>
                          <strong>{analytics.typeStats[type]}</strong>
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card title="Activity Summary Breakdown" style={cardStyle(isDark)}>
                    <p>Total custom events: <strong>{analytics?.customEventsCount || 0}</strong></p>
                    <p>Total linked Meetings: <strong>{analytics?.meetingsCount || 0}</strong></p>
                    <p>Total linked Deliverables/Tasks: <strong>{analytics?.tasksCount || 0}</strong></p>
                  </Card>
                </Col>
              </Row>
            )
          }
        ]}
      />

      {/* Create/Edit Drawer */}
      <Drawer
        title={editingEvent ? "Modify Custom Event" : "Create Custom Event"}
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
              {editingEvent ? "Save Changes" : "Create Event"}
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
            label="Event Title"
            rules={[{ required: true, message: 'Please enter event title' }]}
          >
            <Input placeholder="Enter title" />
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Timing (Start & End Date/Time)"
            rules={[{ required: true, message: 'Please select start and end time' }]}
          >
            <DatePicker.RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="eventType"
            label="Event Category"
            rules={[{ required: true, message: 'Please select category' }]}
          >
            <Select placeholder="Select category">
              <Option value="client_review">Client Review</Option>
              <Option value="strategy_call">Strategy Call</Option>
              <Option value="campaign_launch">Campaign Launch</Option>
              <Option value="content_approval">Content Approval</Option>
              <Option value="internal_sync">Internal Sync</Option>
              <Option value="sales_call">Sales Call</Option>
              <Option value="proposal_review">Proposal Review</Option>
              <Option value="retainer_renewal">Retainer Renewal</Option>
              <Option value="performance_review">Performance Review</Option>
              <Option value="team_meeting">Team Meeting</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="location"
            label="Location"
          >
            <Input placeholder="e.g. Conf Room A or Google Meet" />
          </Form.Item>

          <Form.Item
            name="meetingLink"
            label="Meeting Link"
          >
            <Input prefix={<LinkOutlined />} placeholder="https://..." />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Agenda & Notes"
          >
            <TextArea rows={3} placeholder="Event description details..." />
          </Form.Item>

          <Form.Item
            name="attendees"
            label="Attendees"
          >
            <Select mode="multiple" placeholder="Select attendees" filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}>
              {users.map(u => (
                <Option key={u._id} value={u._id}>{u.name} ({u.role})</Option>
              ))}
            </Select>
          </Form.Item>

          <Divider>Associated Items (Optional)</Divider>

          <Form.Item
            name="clientId"
            label="Client / Brand Account"
          >
            <Select placeholder="Select client" allowClear>
              {clients.map(c => (
                <Option key={c._id} value={c._id}>{c.companyName || c.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="leadId"
            label="CRM Lead"
          >
            <Select placeholder="Select lead" allowClear>
              {leads.map(l => (
                <Option key={l._id} value={l._id}>{l.fullName} ({l.companyName})</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="projectId"
            label="Linked Project"
          >
            <Select placeholder="Select project" allowClear>
              {projects.map(p => (
                <Option key={p._id} value={p._id}>{p.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Drawer>

      {/* Detail Modal */}
      <Modal
        title={
          <div>
            <span style={{ fontSize: '18px', fontWeight: 600 }}>{detailData?.event?.title}</span>
            <div style={{ marginTop: 4 }}>
              {detailData?.event && getStatusTag(detailData.event.status)}
            </div>
          </div>
        }
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedEventId(null);
        }}
        footer={null}
        width={720}
        styles={{ body: { padding: '0 24px 24px 24px' } }}
      >
        {detailData ? (
          <Tabs
            defaultActiveKey="overview"
            style={{ marginTop: '16px' }}
            items={[
              {
                key: 'overview',
                label: 'Overview',
                children: (
                  <Row gutter={16}>
                    <Col span={14}>
                      <p><strong>Description:</strong></p>
                      <p>{detailData.event?.notes || 'No notes provided.'}</p>

                      <p><strong>Schedule:</strong> {detailData.event?.startDateTime ? dayjs(detailData.event.startDateTime).format('MMMM DD, YYYY') : 'N/A'} at {detailData.event?.startDateTime ? dayjs(detailData.event.startDateTime).format('h:mm a') : ''} - {detailData.event?.endDateTime ? dayjs(detailData.event.endDateTime).format('h:mm a') : ''}</p>

                      {detailData.event?.meetingLink && (
                        <Button
                          type="primary"
                          icon={<LinkOutlined />}
                          href={detailData.event.meetingLink}
                          target="_blank"
                          style={{ marginBottom: '16px' }}
                        >
                          Join Meeting Link
                        </Button>
                      )}

                      <Divider />

                      <p><strong>Host:</strong> {detailData.event?.host?.name || 'N/A'}</p>
                      <p><strong>Attendees:</strong></p>
                      <List
                        size="small"
                        dataSource={Array.isArray(detailData.event?.attendees) ? detailData.event.attendees : []}
                        renderItem={p => (
                          <List.Item key={p._id}>
                            <Space>
                              <Avatar size="small" icon={<UserOutlined />} src={p.logo} />
                              <span>{p.name} ({p.role})</span>
                            </Space>
                          </List.Item>
                        )}
                      />
                    </Col>

                    <Col span={10}>
                      <Card title="Origin Details" size="small">
                        <p>Origin: <strong>{detailData.event?.source ? detailData.event.source.toUpperCase() : 'CALENDAR'}</strong></p>
                        {detailData.event?.clientId && <p>Client: {detailData.event.clientId.companyName || detailData.event.clientId.name}</p>}
                        {detailData.event?.projectId && <p>Project: {detailData.event.projectId.name}</p>}
                      </Card>
                    </Col>
                  </Row>
                ),
              },
              ...(detailData.event?.source === 'custom' ? [
                {
                  key: 'notes',
                  label: 'Event Notes',
                  children: (
                    <>
                      <List
                        dataSource={Array.isArray(detailData.notes) ? detailData.notes : []}
                        style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 16 }}
                        renderItem={note => (
                          <List.Item key={note._id}>
                            <List.Item.Meta
                              avatar={<Avatar icon={<UserOutlined />} />}
                              title={<span>{note.createdBy?.name || 'User'} <span style={{ fontSize: '11px', color: '#bfbfbf' }}>{dayjs(note.createdAt).format('MMM D, h:mm a')}</span></span>}
                              description={note.content}
                            />
                          </List.Item>
                        )}
                      />
                      <Divider />
                      <Form.Item label="Add note / comment">
                        <TextArea
                          rows={3}
                          value={noteContent}
                          onChange={e => setNoteContent(e.target.value)}
                          placeholder="Type details or discussions..."
                        />
                        <Button
                          type="primary"
                          style={{ marginTop: 12 }}
                          onClick={handleAddNote}
                          loading={isAddingNote}
                        >
                          Post Note
                        </Button>
                      </Form.Item>
                    </>
                  ),
                },
                {
                  key: 'attachments',
                  label: 'Attachments',
                  children: (
                    <>
                      <List
                        dataSource={Array.isArray(detailData.attachments) ? detailData.attachments : []}
                        renderItem={att => (
                          <List.Item key={att._id}>
                            <Space>
                              <PaperClipOutlined />
                              <a href={att.url} target="_blank" rel="noreferrer">{att.fileName}</a>
                            </Space>
                          </List.Item>
                        )}
                      />
                      <Divider />
                      <h4>Link Proposal / Doc Link</h4>
                      <Form layout="vertical">
                        <Form.Item label="Document Name" required>
                          <Input value={attachmentName} onChange={e => setAttachmentName(e.target.value)} placeholder="e.g. SEO Campaign Proposal" />
                        </Form.Item>
                        <Form.Item label="Document URL" required>
                          <Input value={attachmentUrl} onChange={e => setAttachmentUrl(e.target.value)} placeholder="https://drive.google.com/..." />
                        </Form.Item>
                        <Button type="primary" onClick={handleAddAttachment}>
                          Add Document
                        </Button>
                      </Form>
                    </>
                  ),
                },
              ] : []),
            ]}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '24px' }}>Loading event metadata...</div>
        )}
      </Modal>
    </div>
  );
};

export default CalendarPage;
