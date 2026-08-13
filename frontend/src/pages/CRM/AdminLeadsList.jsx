import React, { useState } from 'react';
import { Table, Tag, Space, Button, Typography, Input, Card, Modal, Select, Form, message, Upload, Row, Col, Tabs, Descriptions, Empty, DatePicker } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, PlusOutlined, DownloadOutlined, UploadOutlined, FileTextOutlined, AudioOutlined, PictureOutlined, VideoCameraOutlined, FileOutlined, WhatsAppOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { 
  useCreateLeadMutation, 
  useUpdateLeadMutation, 
  useDeleteLeadMutation, 
  useGetAssignableBdeUsersQuery,
  useLazyExportLeadsCsvQuery,
  useImportLeadsCsvMutation,
  useAddLeadNoteMutation,
  useDeleteLeadNoteMutation,
  useAddLeadReminderMutation
} from '../../api/leadApi';
import { useSyncWhatsAppLeadsMutation } from '../../api/integrationApi';
import PhoneInput from '../../components/common/PhoneInput';
import { isValidPhoneNumber } from 'libphonenumber-js';
import dayjs from 'dayjs';
import { useActionPermissions } from "../../hooks/useActionPermissions";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CustomLabel = ({ text }) => (
  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
    {text}
  </span>
);

const AdminLeadsList = ({ leads = [], refetch }) => {
  const { canAdd, canEdit, canDelete, canView } = useActionPermissions('/crm');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [viewingLead, setViewingLead] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState('text');
  
  const [reminderDesc, setReminderDesc] = useState('');
  const [reminderDate, setReminderDate] = useState(null);
  const [reminderTo, setReminderTo] = useState(null);

  const [leadCountryCode, setLeadCountryCode] = useState('91');
  const [leadCountryIso, setLeadCountryIso] = useState('IN');

  const [form] = Form.useForm();
  
  const currentViewingLead = viewingLead ? leads.find(l => l._id === viewingLead._id) || viewingLead : null;
  
  const [createLead, { isLoading: isCreating }] = useCreateLeadMutation();
  const [updateLead, { isLoading: isUpdating }] = useUpdateLeadMutation();
  const [deleteLead] = useDeleteLeadMutation();
  const [addLeadNote, { isLoading: isAddingNote }] = useAddLeadNoteMutation();
  const [deleteLeadNote] = useDeleteLeadNoteMutation();
  const [addLeadReminder, { isLoading: isAddingReminder }] = useAddLeadReminderMutation();
  const { data: bdeData } = useGetAssignableBdeUsersQuery();
  const [exportCsv, { isFetching: isExporting }] = useLazyExportLeadsCsvQuery();
  const [importCsv, { isLoading: isImporting }] = useImportLeadsCsvMutation();
  const [syncWhatsApp, { isLoading: isSyncingWhatsApp }] = useSyncWhatsAppLeadsMutation();

  const bdeUsers = bdeData?.data?.users || [];

  const columns = [
    { title: <strong style={{ color: 'var(--text-secondary)' }}>Name</strong>, dataIndex: 'fullName', key: 'fullName', render: t => <strong style={{ color: 'var(--text-primary)' }}>{t}</strong> },
    { title: <strong style={{ color: 'var(--text-secondary)' }}>Company</strong>, dataIndex: 'companyName', key: 'companyName' },
    { title: <strong style={{ color: 'var(--text-secondary)' }}>Phone Number</strong>, dataIndex: 'phoneNumber', key: 'phoneNumber' },
    { title: <strong style={{ color: 'var(--text-secondary)' }}>Email</strong>, dataIndex: 'email', key: 'email' },
    { title: <strong style={{ color: 'var(--text-secondary)' }}>Project Type</strong>, dataIndex: 'projectType', key: 'projectType', render: p => p || '—' },
    { title: <strong style={{ color: 'var(--text-secondary)' }}>Lead Source</strong>, dataIndex: 'source', key: 'source', render: s => <Tag color="purple" style={{ borderRadius: 6, fontWeight: 600 }}>{s}</Tag> },
    { title: <strong style={{ color: 'var(--text-secondary)' }}>Status</strong>, dataIndex: 'status', key: 'status', render: s => <Tag color="blue" style={{ borderRadius: 6, fontWeight: 700, textTransform: 'uppercase' }}>{s}</Tag> },
    { title: <strong style={{ color: 'var(--text-secondary)' }}>Assigned To</strong>, dataIndex: 'assignedTo', key: 'assignedTo', render: a => a || '—' },
    { 
      title: <strong style={{ color: 'var(--text-secondary)' }}>Action</strong>, key: 'action', fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          {canView && <Button type="text" icon={<EyeOutlined />} style={{ color: 'var(--accent-info)' }} onClick={() => setViewingLead(record)} />}
          {canEdit && <Button type="text" icon={<EditOutlined />} style={{ color: 'var(--accent-secondary)' }} onClick={() => handleEditClick(record)} />}
          {canDelete && <Button type="text" icon={<DeleteOutlined />} danger onClick={() => handleDeleteClick(record)} />}
        </Space>
      )
    }
  ];

  const handleEditClick = (record) => {
    setEditingLead(record);
    setLeadCountryCode(record.countryCode || '91');
    setLeadCountryIso(record.countryIso || '');
    form.setFieldsValue({
      fullName: record.fullName,
      companyName: record.companyName,
      phoneNumber: record.phoneNumber,
      email: record.email,
      projectType: record.projectType,
      source: record.source,
      status: record.status?.toUpperCase(),
      assignedTo: record.assignedTo,
      notes: record.notes
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (record) => {
    Modal.confirm({
      title: 'Delete Lead',
      content: `Are you sure you want to delete ${record.fullName}?`,
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await deleteLead(record._id).unwrap();
          message.success('Lead deleted successfully');
          refetch?.();
        } catch (error) {
          message.error('Failed to delete lead');
        }
      }
    });
  };

  const handleAddSubmit = () => {
    form.validateFields().then(async (values) => {
      try {
        if (editingLead) {
          await updateLead({ id: editingLead._id, ...values, countryCode: leadCountryCode, status: values.status.toLowerCase() }).unwrap();
          message.success('Lead updated successfully');
        } else {
          await createLead({ ...values, countryCode: leadCountryCode, status: values.status.toLowerCase() }).unwrap();
          message.success('Lead created successfully');
        }
        refetch?.();
        setIsModalOpen(false);
        setEditingLead(null);
        form.resetFields();
        setLeadCountryCode('91');
        setLeadCountryIso('IN');
      } catch (error) {
        message.error(error?.data?.message || error.message || 'Failed to save lead');
      }
    });
  };

  const handleExport = async () => {
    try {
      const blob = await exportCsv('all').unwrap();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads_export_${dayjs().format('YYYY-MM-DD')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error('Failed to export leads');
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim() || !currentViewingLead) return;
    try {
      await addLeadNote({ leadId: currentViewingLead._id, noteType, content: noteContent }).unwrap();
      message.success('Note added successfully');
      setNoteContent('');
      refetch?.();
    } catch (error) {
      message.error('Failed to add note');
    }
  };

  const handleAddReminder = async () => {
    if (!reminderDesc.trim() || !reminderDate || !reminderTo) {
      message.error("Please fill all reminder fields");
      return;
    }
    try {
      await addLeadReminder({
        leadId: currentViewingLead._id,
        description: reminderDesc,
        remindAt: reminderDate.toISOString(),
        remindTo: reminderTo
      }).unwrap();
      message.success('Reminder added successfully');
      setReminderDesc('');
      setReminderDate(null);
      setReminderTo(null);
      refetch?.();
    } catch (error) {
      message.error('Failed to add reminder');
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteLeadNote({ leadId: currentViewingLead._id, noteId }).unwrap();
      message.success('Note deleted successfully');
      refetch?.();
    } catch (error) {
      message.error('Failed to delete note');
    }
  };

  const handleImport = async (file) => {
    try {
      await importCsv(file).unwrap();
      message.success('Leads imported successfully');
      refetch?.();
    } catch (error) {
      message.error(error?.data?.message || 'Failed to import leads');
    }
    return false; // Prevent default upload behavior
  };

  const handleSyncWhatsApp = async () => {
    try {
      await syncWhatsApp().unwrap();
      message.success('WhatsApp leads synchronized successfully');
      refetch?.();
    } catch (error) {
      message.error(error?.data?.message || 'Failed to sync WhatsApp leads');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card 
        bodyStyle={{ padding: 0 }} 
        style={{ borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', overflow: 'hidden' }}
      >
        <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
          <Space>
            <Button type="text" style={{ fontWeight: 600, color: 'var(--accent-primary)', borderBottom: '2px solid var(--accent-primary)', borderRadius: 0, paddingBottom: 8 }}>All leads</Button>
            <Button type="text" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Reminder leads</Button>
          </Space>
          
          <Space>
            {canView && (
              <>
                <Button 
                  icon={<WhatsAppOutlined />} 
                  loading={isSyncingWhatsApp} 
                  onClick={handleSyncWhatsApp} 
                  style={{ borderRadius: 8, fontWeight: 600, borderColor: '#25D366', color: '#25D366' }}
                >
                  Fetch WhatsApp Leads
                </Button>
                <Upload accept=".csv" showUploadList={false} customRequest={({ file }) => handleImport(file)}>
                  <Button icon={<UploadOutlined />} loading={isImporting} style={{ borderRadius: 8, fontWeight: 600, borderColor: 'var(--border-color)' }}>Import</Button>
                </Upload>
                <Button icon={<DownloadOutlined />} loading={isExporting} onClick={handleExport} style={{ borderRadius: 8, fontWeight: 600, borderColor: 'var(--border-color)' }}>Export</Button>
              </>
            )}
            {canAdd && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingLead(null); form.resetFields(); setLeadCountryCode('91'); setLeadCountryIso('IN'); setIsModalOpen(true); }} style={{ borderRadius: 8, fontWeight: 600, background: '#0e4ca2', border: 'none' }}>Add Lead</Button>
            )}
          </Space>
        </div>
        
        <Table 
          columns={columns} 
          dataSource={leads} 
          rowKey="_id"
          pagination={{ pageSize: 10 }}
          rowSelection={{ type: 'checkbox' }}
          style={{ padding: 24 }}
          scroll={{ x: 'max-content' }}
          rowClassName={() => 'hover-bg'}
        />
      </Card>

      {/* Add / Edit Lead Modal */}
      <Modal
        title={<Title level={4} style={{ margin: 0, color: 'var(--text-primary)' }}>{editingLead ? 'Edit lead' : 'Add new lead'}</Title>}
        open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); setEditingLead(null); }}
        onOk={handleAddSubmit}
        width={700}
        confirmLoading={isCreating || isUpdating}
        okText={editingLead ? "Update Lead" : "Create Lead"}
        cancelText="Cancel"
        className="glassmorphism-modal"
        okButtonProps={{ style: { background: '#0e4ca2', border: 'none', borderRadius: 6, fontWeight: 600, padding: '0 24px' } }}
        cancelButtonProps={{ style: { borderRadius: 6, fontWeight: 600, padding: '0 24px' } }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 24, paddingRight: 12 }}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="fullName" label={<CustomLabel text="Name" />} rules={[{ required: true, message: 'Name is required' }]}>
                <Input size="large" placeholder="Name" style={{ borderRadius: 6 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="companyName" label={<CustomLabel text="Company Name" />} rules={[{ required: true, message: 'Company Name is required' }]}>
                <Input size="large" placeholder="Company name" style={{ borderRadius: 6 }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item 
                name="phoneNumber" 
                label={<CustomLabel text="Phone Number" />} 
                rules={[
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      if (isValidPhoneNumber(value, leadCountryIso)) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Please enter a valid phone number for the selected country'));
                    }
                  }
                ]}
              >
                <PhoneInput 
                  size="large" 
                  style={{ borderRadius: 6 }} 
                  countryCodeValue={leadCountryCode}
                  onCountryCodeChange={setLeadCountryCode}
                  isoCountryValue={leadCountryIso}
                  onCountryIsoChange={setLeadCountryIso}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label={<CustomLabel text="Email" />}>
                <Input size="large" placeholder="Email (optional)" style={{ borderRadius: 6 }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="projectType" label={<CustomLabel text="Project Type" />} rules={[{ required: true, message: 'Project Type is required' }]}>
                <Select size="large" placeholder="Select project type">
                  <Option value="SEO">SEO</Option>
                  <Option value="SMM">SMM</Option>
                  <Option value="Website">Website</Option>
                  <Option value="Performance Marketing">Performance Marketing</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="source" label={<CustomLabel text="Lead Source" />} rules={[{ required: true, message: 'Source is required' }]} initialValue="Website">
                <Select size="large">
                  <Option value="Website">Website</Option>
                  <Option value="Referral">Referral</Option>
                  <Option value="Social Media">Social Media</Option>
                  <Option value="Cold Call">Cold Call</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="status" label={<CustomLabel text="Status" />} initialValue="NEW">
                <Select size="large">
                  <Option value="NEW">NEW</Option>
                  <Option value="CONTACTED">CONTACTED</Option>
                  <Option value="FOLLOW_UP">FOLLOW UP</Option>
                  <Option value="IN_PROGRESS">IN PROGRESS</Option>
                  <Option value="CONVERTED">CONVERTED</Option>
                  <Option value="LOST">LOST</Option>
                  <Option value="JUNK">JUNK</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item name="notes" label={<CustomLabel text="Notes" />}>
                <TextArea rows={4} placeholder="Internal notes (optional)" style={{ borderRadius: 6 }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* View Lead Modal */}
      <Modal
        title={<Title level={4} style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>Lead — {currentViewingLead?.fullName}</Title>}
        open={!!viewingLead}
        onCancel={() => setViewingLead(null)}
        footer={null}
        width={900}
        className="glassmorphism-modal"
        styles={{ body: { paddingTop: 0 } }}
      >
        <Tabs 
          defaultActiveKey="details"
          items={[
            {
              key: 'reminders',
              label: <strong style={{ fontWeight: 600 }}>Reminders</strong>,
              children: (
                <div style={{ padding: '12px 0', minHeight: 400 }}>
                  <Title level={5} style={{ marginBottom: 16 }}>Set New Reminder</Title>
                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={24}>
                      <span style={{ color: 'red' }}>*</span> <span style={{ fontWeight: 600, fontSize: 13 }}>Description</span>
                      <TextArea rows={3} value={reminderDesc} onChange={e => setReminderDesc(e.target.value)} placeholder="Enter reminder description or select from quick replies" style={{ borderRadius: 6, marginTop: 4 }} />
                    </Col>
                  </Row>
                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={12}>
                      <span style={{ color: 'red' }}>*</span> <span style={{ fontWeight: 600, fontSize: 13 }}>Date & Time to be notified</span>
                      <DatePicker showTime style={{ width: '100%', borderRadius: 6, marginTop: 4 }} value={reminderDate} onChange={setReminderDate} placeholder="Select date" />
                    </Col>
                    <Col span={12}>
                      <span style={{ color: 'red' }}>*</span> <span style={{ fontWeight: 600, fontSize: 13 }}>Set reminder to</span>
                      <Select style={{ width: '100%', marginTop: 4 }} placeholder="Select BDE" value={reminderTo} onChange={setReminderTo}>
                        {bdeUsers.map(b => (
                          <Option key={b._id} value={b.fullName || b.username}>{b.fullName || b.username}</Option>
                        ))}
                      </Select>
                    </Col>
                  </Row>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
                    <Button type="primary" loading={isAddingReminder} onClick={handleAddReminder} style={{ borderRadius: 6, fontWeight: 600, background: '#0e4ca2' }}>Add Reminder</Button>
                  </div>

                  <Table 
                    dataSource={currentViewingLead?.reminders || []}
                    rowKey="_id"
                    columns={[
                      { title: 'S.No', render: (t,r,i) => i+1 },
                      { title: 'Date', dataIndex: 'remindAt', render: d => dayjs(d).format('YYYY-MM-DD HH:mm') },
                      { title: 'Description', dataIndex: 'description' },
                      { title: 'Remind', dataIndex: 'remindTo' },
                      { title: 'Status', dataIndex: 'status', render: s => <Tag color={s === 'completed' ? 'green' : 'orange'}>{s?.toUpperCase()}</Tag> }
                    ]}
                    pagination={false}
                    locale={{ emptyText: <Empty description="No data" /> }}
                    size="small"
                  />
                </div>
              )
            },
            {
              key: 'details',
              label: <strong style={{ fontWeight: 600 }}>Lead Details</strong>,
              children: (
                <div style={{ padding: '12px 0' }}>
                  <Descriptions bordered column={3} size="middle" labelStyle={{ fontWeight: 600, color: 'var(--text-secondary)', background: 'transparent' }} contentStyle={{ color: 'var(--text-primary)' }}>
                    <Descriptions.Item label="Name">{currentViewingLead?.fullName || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Company Name">{currentViewingLead?.companyName || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Phone Number">{currentViewingLead?.phoneNumber || '—'}</Descriptions.Item>
                    
                    <Descriptions.Item label="Email">{currentViewingLead?.email || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Project Type"><Tag style={{borderRadius: 4}}>{currentViewingLead?.projectType || '—'}</Tag></Descriptions.Item>
                    <Descriptions.Item label="Lead Source"><Tag color="purple" style={{borderRadius: 4}}>{currentViewingLead?.source || '—'}</Tag></Descriptions.Item>
                    
                    <Descriptions.Item label="Status"><Tag color="blue" style={{borderRadius: 4}}>{currentViewingLead?.status || 'NEW'}</Tag></Descriptions.Item>
                    <Descriptions.Item label="Assigned To">{currentViewingLead?.assignedTo || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Last Interaction">{currentViewingLead?.updatedAt ? dayjs(currentViewingLead.updatedAt).format('YYYY-MM-DD HH:mm') : '—'}</Descriptions.Item>
                    
                    <Descriptions.Item label="Notes" span={3}>{currentViewingLead?.notes || '—'}</Descriptions.Item>
                  </Descriptions>
                </div>
              )
            },
            {
              key: 'notes',
              label: <strong style={{ fontWeight: 600 }}>Notes</strong>,
              children: (
                <div style={{ padding: '12px 0', minHeight: 400 }}>
                  <Title level={5} style={{ marginBottom: 16 }}>Add New Note</Title>
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13 }}>Select Note Type:</span>
                    <Space size="middle">
                      <Button type={noteType === 'text' ? 'primary' : 'default'} icon={<FileTextOutlined />} onClick={() => setNoteType('text')} style={{ borderRadius: 6, fontWeight: 600, ...(noteType === 'text' ? {background: '#0e4ca2'} : {}) }}>Text</Button>
                      <Button type={noteType === 'audio' ? 'primary' : 'default'} icon={<AudioOutlined />} onClick={() => setNoteType('audio')} style={{ borderRadius: 6, fontWeight: 500, ...(noteType === 'audio' ? {background: '#0e4ca2'} : {}) }}>Audio</Button>
                      <Button type={noteType === 'image' ? 'primary' : 'default'} icon={<PictureOutlined />} onClick={() => setNoteType('image')} style={{ borderRadius: 6, fontWeight: 500, ...(noteType === 'image' ? {background: '#0e4ca2'} : {}) }}>Image</Button>
                      <Button type={noteType === 'video' ? 'primary' : 'default'} icon={<VideoCameraOutlined />} onClick={() => setNoteType('video')} style={{ borderRadius: 6, fontWeight: 500, ...(noteType === 'video' ? {background: '#0e4ca2'} : {}) }}>Video</Button>
                      <Button type={noteType === 'document' ? 'primary' : 'default'} icon={<FileOutlined />} onClick={() => setNoteType('document')} style={{ borderRadius: 6, fontWeight: 500, ...(noteType === 'document' ? {background: '#0e4ca2'} : {}) }}>Document</Button>
                    </Space>
                  </div>
                  
                  <TextArea rows={4} value={noteContent} onChange={e => setNoteContent(e.target.value)} placeholder="Enter your note here..." style={{ borderRadius: 6, marginBottom: 16 }} />
                  
                  <Button type="primary" loading={isAddingNote} onClick={handleAddNote} style={{ borderRadius: 6, fontWeight: 600, background: '#0e4ca2' }}>Add Note</Button>
                  
                  <div style={{ marginTop: 32 }}>
                    <Title level={5} style={{ marginBottom: 16 }}>All Notes ({currentViewingLead?.leadNotes?.length || 0})</Title>
                    <Table 
                      dataSource={currentViewingLead?.leadNotes || []} 
                      rowKey="_id"
                      columns={[
                        { title: 'S.No', render: (t,r,i) => i+1 },
                        { title: 'Date & Time', dataIndex: 'createdAt', render: d => dayjs(d).format('YYYY-MM-DD HH:mm') },
                        { title: 'Type', dataIndex: 'noteType', render: t => <Tag color="blue">{t?.toUpperCase()}</Tag> },
                        { title: 'Content', dataIndex: 'content' },
                        { title: 'Action', key: 'action', render: (_, record) => <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteNote(record._id)} /> },
                      ]}
                      pagination={false}
                      locale={{ emptyText: <Empty description="No notes found" /> }}
                      size="small"
                    />
                  </div>
                </div>
              )
            },
            {
              key: 'logs',
              label: <strong style={{ fontWeight: 600 }}>Activity Logs</strong>,
              children: (currentViewingLead?.activityLogs?.length > 0 ? (
                <Table 
                  dataSource={currentViewingLead.activityLogs}
                  rowKey="_id"
                  columns={[
                    { title: 'Date', dataIndex: 'createdAt', render: d => dayjs(d).format('YYYY-MM-DD HH:mm:ss') },
                    { title: 'Action', dataIndex: 'actionType', render: t => <Tag color="purple">{t?.toUpperCase()}</Tag> },
                    { title: 'Details', dataIndex: 'details', render: d => typeof d === 'string' ? d : JSON.stringify(d) },
                  ]}
                  pagination={false}
                  size="small"
                />
              ) : (
                <Empty description="No activity logs found" style={{ margin: '40px 0' }} />
              ))
            }
          ]}
        />
      </Modal>

    </motion.div>
  );
};

export default AdminLeadsList;
