import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Tag, Input, Modal, Switch, 
  Card, Tabs, Typography, Form, Select, Checkbox, Popconfirm, message
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, 
  LoginOutlined, StopOutlined, CheckCircleOutlined, ApiOutlined, SafetyCertificateOutlined 
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import api from '../../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const getRoleColor = (role) => {
  if (!role) return 'default';
  const colors = {
    super_admin: 'red',
    admin: 'purple',
    coordinator: 'blue',
    website_coordinator: 'geekblue',
    bde: 'orange',
    seo: 'green',
    designer: 'magenta',
    developer: 'volcano',
    client: 'default'
  };
  return colors[role] || 'default';
};

const UserManagementTab = () => {
  const [activeTab, setActiveTab] = useState('user');
  
  // States for data
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Search states
  const [userSearch, setUserSearch] = useState('');
  
  // Modals state
  const [userModal, setUserModal] = useState({ open: false, record: null });
  const [userForm] = Form.useForm();


  const [deptModal, setDeptModal] = useState({ open: false, record: null });
  const [deptForm] = Form.useForm();

  const [roleModal, setRoleModal] = useState({ open: false, record: null });
  const [roleForm] = Form.useForm();
  
  const [permissionRoleId, setPermissionRoleId] = useState(null);
  const [draftPermissions, setDraftPermissions] = useState({});

  const permissionGroups = {
    'General': ['Command Center', 'Settings'],
    'Clients': ['Accounts', 'SLA & Success', 'Portal Settings'],
    'Workspace': [
      'Strategy', 
      'SEO / AEO / GEO', 
      'Content', 
      'AI Studio', 
      'Social Media', 
      'Performance Ads', 
      'CRM & Leads', 
      'Automation', 
      'Task Management'
    ]
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, deptsRes, rolesRes] = await Promise.all([
        api.get('/users'),
        api.get('/departments'),
        api.get('/roles')
      ]);
      const allUsers = usersRes.data?.data || [];
      setUsers(allUsers.filter(u => u.role !== 'agency_client' && u.role !== 'client'));
      setDepartments(deptsRes.data?.data || []);
      setRoles(rolesRes.data?.data || []);
    } catch (err) {
      console.error(err);
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers
  const handleToggleUserStatus = async (record, isClient = false) => {
    try {
      await api.put(`/users/${record._id}`, { isActive: !record.isActive });
      message.success('Status updated');
      fetchData();
    } catch (err) {
      message.error('Failed to update status');
    }
  };

  const handleDeleteUser = async (id, isClient = false) => {
    try {
      await api.delete(`/users/${id}`);
      message.success('User deleted');
      fetchData();
    } catch (err) {
      message.error('Failed to delete user');
    }
  };

  // User Columns
  const userColumns = [
    { title: <strong style={{color:'var(--text-secondary)'}}>NAME</strong>, dataIndex: 'name', key: 'name', render: t => <strong style={{color:'var(--text-primary)'}}>{t}</strong> },
    { title: <strong style={{color:'var(--text-secondary)'}}>EMAIL</strong>, dataIndex: 'email', key: 'email', render: t => <span style={{fontWeight:500}}>{t}</span> },
    { title: <strong style={{color:'var(--text-secondary)'}}>ROLE</strong>, key: 'role', render: (_, record) => {
        let displayRole = record.roleName || record.role;
        return (
          <Tag color={getRoleColor(record.role)} style={{ borderRadius: 6, fontWeight: 700, padding: '2px 8px' }}>
            {displayRole.replace(/_/g, ' ').toUpperCase()}
          </Tag>
        );
    }},
    { title: <strong style={{color:'var(--text-secondary)'}}>DEPARTMENT</strong>, key: 'department', render: (_, record) => {
        return <span style={{fontWeight:500}}>{record.departmentName || '-'}</span>;
    }},
    { title: <strong style={{color:'var(--text-secondary)'}}>STATUS</strong>, dataIndex: 'isActive', key: 'isActive', render: isActive => (
        <Tag color={isActive ? 'success' : 'error'} style={{ borderRadius: 6, fontWeight: 700, padding: '2px 8px' }}>
          {isActive ? 'ACTIVE' : 'INACTIVE'}
        </Tag>
    )},
    {
      title: <strong style={{color:'var(--text-secondary)'}}>ACTIONS</strong>, key: 'actions', align: 'right', fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Button type="text" icon={<EyeOutlined />} style={{ color: 'var(--accent-info)', fontWeight: 600 }}>View</Button>
          <Button type="text" icon={<LoginOutlined />} style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Login as User</Button>
          <Button type="text" icon={<EditOutlined />} onClick={() => {
            setUserModal({ open: true, record });
            let formRole = record.role;
            if (record.customRoleId) {
               const customRole = roles.find(r => r._id === record.customRoleId);
               if (customRole) formRole = customRole.roleKey;
            }
            userForm.setFieldsValue({
              ...record,
              role: formRole,
              status: record.isActive ? 'active' : 'inactive'
            });
          }} style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>Edit</Button>
          <Popconfirm title="Delete this user?" onConfirm={() => handleDeleteUser(record._id)}>
            <Button type="text" danger icon={<DeleteOutlined />} style={{ fontWeight: 600 }}>Delete</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];


  // Department Columns
  const deptColumns = [
    { title: <strong style={{color:'var(--text-secondary)'}}>DEPARTMENT</strong>, dataIndex: 'name', key: 'name', render: t => <strong style={{color:'var(--text-primary)'}}>{t}</strong> },
    { title: <strong style={{color:'var(--text-secondary)'}}>SLUG</strong>, dataIndex: 'slug', key: 'slug', render: t => <span style={{fontWeight:500}}>{t}</span> },
    { title: <strong style={{color:'var(--text-secondary)'}}>STATUS</strong>, dataIndex: 'status', key: 'status', render: status => (
        <Tag color={status === 'active' ? 'success' : 'error'} style={{ borderRadius: 6, fontWeight: 700, padding: '2px 8px' }}>
          {String(status).toUpperCase()}
        </Tag>
    )},
    {
      title: <strong style={{color:'var(--text-secondary)'}}>ACTIONS</strong>, key: 'actions', align: 'right', fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => {
            setDeptModal({ open: true, record });
            deptForm.setFieldsValue(record);
          }} style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Edit</Button>
          <Popconfirm title="Delete this department?" onConfirm={async () => {
            try {
              await api.delete(`/departments/${record._id}`);
              message.success('Department deleted');
              fetchData();
            } catch (err) {
              message.error('Failed to delete department');
            }
          }}>
            <Button type="text" danger icon={<DeleteOutlined />} style={{ fontWeight: 600 }}>Delete</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // Role Columns
  const roleColumns = [
    { title: <strong style={{color:'var(--text-secondary)'}}>ROLE NAME</strong>, dataIndex: 'roleName', key: 'roleName', render: t => <strong style={{color:'var(--text-primary)'}}>{t}</strong> },
    { title: <strong style={{color:'var(--text-secondary)'}}>DEPARTMENT</strong>, key: 'department', render: (_, r) => (
        <span style={{fontWeight:500}}>{departments.find(d => d._id === r.departmentId)?.name || <Tag color="blue" style={{borderRadius: 6}}>System</Tag>}</span>
    )},
    { title: <strong style={{color:'var(--text-secondary)'}}>ROLE KEY</strong>, dataIndex: 'roleKey', key: 'roleKey', render: t => <span style={{fontWeight:500}}>{t}</span> },
    { title: <strong style={{color:'var(--text-secondary)'}}>STATUS</strong>, dataIndex: 'status', key: 'status', render: status => (
        <Tag color={status === 'active' ? 'success' : 'error'} style={{ borderRadius: 6, fontWeight: 700, padding: '2px 8px' }}>
          {String(status).toUpperCase()}
        </Tag>
    )},
    { title: <strong style={{color:'var(--text-secondary)'}}>ACCESS</strong>, key: 'access', render: (_, record) => (
        <Button type="text" icon={<SafetyCertificateOutlined />} onClick={() => setPermissionRoleId(record._id)} style={{ color: 'var(--accent-info)', fontWeight: 600 }}>Configure Permissions</Button>
    )},
    {
      title: <strong style={{color:'var(--text-secondary)'}}>ACTIONS</strong>, key: 'actions', align: 'right', fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => {
            setRoleModal({ open: true, record });
            roleForm.setFieldsValue(record);
          }} style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Edit</Button>
          <Popconfirm title="Delete this role?" onConfirm={async () => {
            try {
              await api.delete(`/roles/${record._id}`);
              message.success('Role deleted');
              fetchData();
            } catch (err) {
              message.error('Failed to delete role');
            }
          }}>
            <Button type="text" danger icon={<DeleteOutlined />} style={{ fontWeight: 600 }}>Delete</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const handleDeptSubmit = async () => {
    try {
      const values = await deptForm.validateFields();
      setSubmitLoading(true);
      if (deptModal.record) {
        await api.put(`/departments/${deptModal.record._id}`, values);
        message.success('Department updated');
      } else {
        await api.post('/departments', values);
        message.success('Department created');
      }
      setDeptModal({ open: false, record: null });
      fetchData();
    } catch (err) {
      console.error(err);
      if (err.response) message.error(err.response.data.message || 'Error saving department');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleRoleSubmit = async () => {
    try {
      const values = await roleForm.validateFields();
      setSubmitLoading(true);
      if (roleModal.record) {
        await api.put(`/roles/${roleModal.record._id}`, values);
        message.success('Role updated');
      } else {
        await api.post('/roles', values);
        message.success('Role created');
      }
      setRoleModal({ open: false, record: null });
      fetchData();
    } catch (err) {
      console.error(err);
      if (err.response) message.error(err.response.data.message || 'Error saving role');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUserSubmit = async () => {
    try {
      const values = await userForm.validateFields();
      setSubmitLoading(true);
      const payload = { ...values, isActive: values.status === 'active' };
      if (userModal.record) {
        await api.put(`/users/${userModal.record._id}`, payload);
        message.success('User updated');
      } else {
        await api.post('/users', payload);
        message.success('User created successfully');
      }
      setUserModal({ open: false, record: null });
      fetchData();
    } catch (err) {
      console.error(err);
      if (err.response) message.error(err.response.data.message || 'Error saving user');
    } finally {
      setSubmitLoading(false);
    }
  };



  const filteredUsers = users.filter(u => 
    (u.name || '').toLowerCase().includes((userSearch || '').toLowerCase()) || 
    (u.email || '').toLowerCase().includes((userSearch || '').toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 900 }}>User Management</Title>
          <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>Manage users, departments, and roles.</Text>
        </div>
        {activeTab === 'user' && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setUserModal({ open: true, record: null }); userForm.resetFields(); userForm.setFieldsValue({ status: 'active' }); }} style={{ background: 'var(--accent-primary)', border: 'none', borderRadius: 8, fontWeight: 700, height: 40, padding: '0 24px' }}>
            Add User
          </Button>
        )}
      </div>

      <Card 
        className="glassmorphism" 
        bodyStyle={{ padding: 0 }} 
        style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          size="large"
          tabBarStyle={{ padding: '0 24px', margin: 0, borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}
          items={[
            {
              key: 'user',
              label: <strong style={{ fontWeight: 600 }}>User</strong>,
              children: (
                <div>
                  <div style={{ padding: '24px 24px 0 24px' }}>
                    <Input 
                      placeholder="Search users by name or email..." 
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      prefix={<Search size={16} color="var(--text-tertiary)" />}
                      style={{ borderRadius: 10, maxWidth: 400, height: 44, fontWeight: 500 }}
                    />
                  </div>
                  <Table 
                    columns={userColumns} 
                    dataSource={filteredUsers} 
                    rowKey="_id" 
                    pagination={{ pageSize: 10 }} 
                    style={{ padding: 24 }}
                    rowClassName={() => 'hover-bg'}
                    scroll={{ x: 'max-content' }}
                    loading={loading}
                  />
                </div>
              )
            },
            {
              key: 'department',
              label: <strong style={{ fontWeight: 600 }}>Department</strong>,
              children: (
                <div>
                  <div style={{ padding: '24px 24px 0 24px', display: 'flex', justifyContent: 'space-between' }}>
                    <Input 
                      placeholder="Search departments..." 
                      prefix={<Search size={16} color="var(--text-tertiary)" />}
                      style={{ borderRadius: 10, maxWidth: 400, height: 44, fontWeight: 500 }}
                    />
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => { setDeptModal({open: true, record: null}); deptForm.resetFields(); deptForm.setFieldsValue({ status: 'active' }); }} style={{ background: 'var(--accent-secondary)', border: 'none', borderRadius: 8, fontWeight: 700, height: 40, padding: '0 24px' }}>
                      Add Department
                    </Button>
                  </div>
                  <Table 
                    columns={deptColumns} 
                    dataSource={departments} 
                    rowKey="_id" 
                    pagination={{ pageSize: 10 }} 
                    style={{ padding: 24 }}
                    rowClassName={() => 'hover-bg'}
                    scroll={{ x: 'max-content' }}
                    loading={loading}
                  />
                </div>
              )
            },
            {
              key: 'role',
              label: <strong style={{ fontWeight: 600 }}>Role</strong>,
              children: (
                <div>
                  <div style={{ padding: '24px 24px 0 24px', display: 'flex', justifyContent: 'space-between' }}>
                    <Input 
                      placeholder="Search roles..." 
                      prefix={<Search size={16} color="var(--text-tertiary)" />}
                      style={{ borderRadius: 10, maxWidth: 400, height: 44, fontWeight: 500 }}
                    />
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => { setRoleModal({open: true, record: null}); roleForm.resetFields(); roleForm.setFieldsValue({ status: 'active' }); }} style={{ background: 'var(--accent-primary)', border: 'none', borderRadius: 8, fontWeight: 700, height: 40, padding: '0 24px' }}>
                      Add Role
                    </Button>
                  </div>
                  <Table 
                    columns={roleColumns} 
                    dataSource={roles} 
                    rowKey="_id" 
                    pagination={{ pageSize: 10 }} 
                    style={{ padding: 24 }}
                    rowClassName={() => 'hover-bg'}
                    scroll={{ x: 'max-content' }}
                    loading={loading}
                  />
                </div>
              )
            }
          ]}
        />
      </Card>

      {/* Modals */}
      <Modal 
        title={<div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>{userModal.record ? 'Edit User' : 'Create User'}</div>}
        open={userModal.open} 
        onCancel={() => setUserModal({ open: false, record: null })} 
        onOk={handleUserSubmit}
        confirmLoading={submitLoading}
        okButtonProps={{ style: { background: 'var(--accent-primary)', borderRadius: 8, fontWeight: 700, border: 'none' } }}
        cancelButtonProps={{ style: { borderRadius: 8, fontWeight: 600, background: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' } }}
        className="glassmorphism-modal"
      >
        <Form form={userForm} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item name="name" label={<strong style={{ color: 'var(--text-secondary)' }}>Full Name</strong>} rules={[{ required: true }]}>
            <Input size="large" style={{ borderRadius: 8, background: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </Form.Item>
          <Form.Item name="email" label={<strong style={{ color: 'var(--text-secondary)' }}>Email Address</strong>} rules={[{ required: true, type: 'email' }]}>
            <Input size="large" style={{ borderRadius: 8, background: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </Form.Item>
          {!userModal.record && (
            <Form.Item name="password" label={<strong style={{ color: 'var(--text-secondary)' }}>Password</strong>} rules={[{ required: true, message: 'Please set a password' }]}>
              <Input.Password size="large" style={{ borderRadius: 8, background: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </Form.Item>
          )}
          <Form.Item name="departmentId" label={<strong style={{ color: 'var(--text-secondary)' }}>Department</strong>} rules={[{ required: true }]}>
            <Select size="large" placeholder="Select Department">
              {departments.map(d => <Option key={d._id} value={d._id}>{d.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="role" label={<strong style={{ color: 'var(--text-secondary)' }}>Role</strong>} rules={[{ required: true }]}>
            <Select size="large">
              {roles.map(r => <Option key={r._id} value={r.roleKey}>{r.roleName}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="status" label={<strong style={{ color: 'var(--text-secondary)' }}>Status</strong>} rules={[{ required: true }]}>
            <Select size="large">
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal 
        title={<div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>{deptModal.record ? 'Edit Department' : 'Create Department'}</div>}
        open={deptModal.open} 
        onCancel={() => setDeptModal({ open: false, record: null })} 
        onOk={handleDeptSubmit}
        confirmLoading={submitLoading}
        okButtonProps={{ style: { background: 'var(--accent-secondary)', borderRadius: 8, fontWeight: 700, border: 'none' } }}
        cancelButtonProps={{ style: { borderRadius: 8, fontWeight: 600, background: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' } }}
        className="glassmorphism-modal"
      >
        <Form form={deptForm} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item name="name" label={<strong style={{ color: 'var(--text-secondary)' }}>Name</strong>} rules={[{ required: true }]}>
            <Input size="large" style={{ borderRadius: 8, background: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </Form.Item>
          <Form.Item name="slug" label={<strong style={{ color: 'var(--text-secondary)' }}>Slug (optional)</strong>}>
            <Input size="large" style={{ borderRadius: 8, background: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </Form.Item>
          <Form.Item name="status" label={<strong style={{ color: 'var(--text-secondary)' }}>Status</strong>} rules={[{ required: true }]}>
            <Select size="large">
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal 
        title={<div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>{roleModal.record ? 'Edit Role' : 'Create Role'}</div>}
        open={roleModal.open} 
        onCancel={() => setRoleModal({ open: false, record: null })} 
        onOk={handleRoleSubmit}
        confirmLoading={submitLoading}
        okButtonProps={{ style: { background: 'var(--accent-primary)', borderRadius: 8, fontWeight: 700, border: 'none' } }}
        cancelButtonProps={{ style: { borderRadius: 8, fontWeight: 600, background: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' } }}
        className="glassmorphism-modal"
      >
        <Form form={roleForm} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item name="departmentId" label={<strong style={{ color: 'var(--text-secondary)' }}>Department</strong>} rules={[{ required: true }]}>
            <Select size="large">
              {departments.map(d => <Option key={d._id} value={d._id}>{d.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="roleName" label={<strong style={{ color: 'var(--text-secondary)' }}>Role Name</strong>} rules={[{ required: true }]}>
            <Input size="large" style={{ borderRadius: 8, background: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </Form.Item>
          <Form.Item name="roleKey" label={<strong style={{ color: 'var(--text-secondary)' }}>Role Key (optional)</strong>}>
            <Input size="large" style={{ borderRadius: 8, background: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </Form.Item>
          <Form.Item name="status" label={<strong style={{ color: 'var(--text-secondary)' }}>Status</strong>} rules={[{ required: true }]}>
            <Select size="large">
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>



      <Modal
        title={<div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>Module Permission Matrix <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>— {roles.find(r => r._id === permissionRoleId)?.roleName}</span></div>}
        width={900}
        open={!!permissionRoleId}
        onCancel={() => setPermissionRoleId(null)}
        footer={[
          <Button key="cancel" onClick={() => setPermissionRoleId(null)} style={{ borderRadius: 8, fontWeight: 600, background: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} size="large">Cancel</Button>,
          <Button key="ok" onClick={() => setPermissionRoleId(null)} style={{ background: '#d9363e', borderColor: '#d9363e', borderRadius: 8, fontWeight: 700, padding: '0 32px' }} size="large" type="primary">OK</Button>
        ]}
        className="glassmorphism-modal"
        styles={{ body: { maxHeight: "70vh", overflowY: "auto", overflowX: "hidden" } }}
      >
        <Tabs 
          items={Object.entries(permissionGroups).map(([group, modules]) => ({
            key: group,
            label: <strong style={{ fontWeight: 600 }}>{group}</strong>,
            children: (
              <Table
                rowKey="module"
                dataSource={modules.map(m => ({ module: m }))}
                pagination={false}
                scroll={{ y: 400 }}
                rowClassName={() => 'hover-bg'}
                columns={[
                  { title: <strong style={{color:'var(--text-secondary)'}}>Module</strong>, dataIndex: 'module', key: 'module', render: t => <span style={{fontWeight:500}}>{t}</span> },
                  ...['Read', 'View', 'Create', 'Edit', 'Delete'].map(field => ({
                    title: <strong style={{color:'var(--text-secondary)'}}>{field}</strong>,
                    key: field,
                    align: 'center',
                    render: (_, record) => (
                      <Checkbox 
                        checked={!!draftPermissions[`${group}-${record.module}`]?.[field] || (record.module === 'Dashboard' && field === 'Read')}
                        disabled={record.module === 'Dashboard' && field === 'Read'}
                        onChange={(e) => setDraftPermissions(prev => ({
                          ...prev,
                          [`${group}-${record.module}`]: {
                            ...(prev[`${group}-${record.module}`] || {}),
                            [field]: e.target.checked
                          }
                        }))}
                      />
                    )
                  }))
                ]}
              />
            )
          }))}
          tabBarStyle={{ marginBottom: 16 }}
        />
      </Modal>
    </motion.div>
  );
};

export default UserManagementTab;
