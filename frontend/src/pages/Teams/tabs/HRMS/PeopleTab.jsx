import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Tag, Avatar, Input, Typography, Spin, message, Modal, Form, Select, DatePicker, Table } from 'antd';
import { UserPlus, Search, LayoutGrid, List, Calendar, IndianRupee, Star, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { hrmsService } from '../../../../services/hrms.service';
import AddEmployeeModal from './AddEmployeeModal';

const { Title, Text } = Typography;

const PeopleTab = () => {
  const [view, setView] = useState('cards');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await hrmsService.getEmployees({ search });
      if (res.success) {
        setEmployees(res.data);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchEmployees();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const getTagColor = (status) => {
    switch (status) {
      case 'Active': return { bg: 'rgba(16, 185, 129, 0.15)', text: 'var(--accent-primary)' };
      case 'On Leave': return { bg: 'rgba(245, 158, 11, 0.15)', text: 'var(--accent-warning)' };
      default: return { bg: 'var(--bg-tertiary)', text: 'var(--text-secondary)' };
    }
  };

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible">
      {/* Directory Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={4} style={{ margin: '0 0 4px 0', fontWeight: 800, color: 'var(--text-primary)' }}>Employee Directory</Title>
          <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
            {employees.length} active employee{employees.length !== 1 && 's'}
          </Text>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 8, padding: 4, border: '1px solid var(--border-color)' }}>
            <Button type={view === 'cards' ? 'primary' : 'text'} onClick={() => setView('cards')} icon={<LayoutGrid size={16} />} style={{ borderRadius: 6, height: 32, padding: '0 12px', background: view === 'cards' ? 'var(--bg-tertiary)' : 'transparent', color: view === 'cards' ? 'var(--text-primary)' : 'var(--text-tertiary)', fontWeight: 600, border: 'none', boxShadow: 'none' }}>Cards</Button>
            <Button type={view === 'list' ? 'primary' : 'text'} onClick={() => setView('list')} icon={<List size={16} />} style={{ borderRadius: 6, height: 32, padding: '0 12px', background: view === 'list' ? 'var(--bg-tertiary)' : 'transparent', color: view === 'list' ? 'var(--text-primary)' : 'var(--text-tertiary)', fontWeight: 600, border: 'none', boxShadow: 'none' }}>List</Button>
          </div>
          <Input 
            prefix={<Search size={16} color="var(--text-tertiary)" />} 
            placeholder="Search employees..." 
            style={{ width: 250, borderRadius: 8, background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }} 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="primary" icon={<UserPlus size={16} />} onClick={() => setIsModalVisible(true)} style={{ borderRadius: 8, fontWeight: 600, height: 40, background: 'var(--accent-warning)' }}>
            Add Employee
          </Button>
        </div>
      </div>

      {/* Directory Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
        </div>
      ) : view === 'list' ? (
        <Card className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)', padding: 0 }} bodyStyle={{ padding: 0 }}>
          <Table 
            dataSource={employees} 
            rowKey="_id" 
            pagination={{ pageSize: 10 }}
            columns={[
              {
                title: 'Employee',
                key: 'employee',
                render: (_, record) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar src={record.profilePhoto} style={{ backgroundColor: 'var(--accent-primary)', fontWeight: 'bold' }}>
                      {!record.profilePhoto && `${record.firstName.charAt(0)}${record.lastName.charAt(0)}`}
                    </Avatar>
                    <div>
                      <div style={{ fontWeight: 600 }}>{record.firstName} {record.lastName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{record.employeeCode}</div>
                    </div>
                  </div>
                )
              },
              { title: 'Designation', dataIndex: ['designationId', 'title'], key: 'designation', render: (val) => val || '-' },
              { title: 'Department', dataIndex: ['departmentId', 'name'], key: 'department', render: (val) => val || '-' },
              { 
                title: 'Status', 
                key: 'status', 
                render: (_, record) => {
                  const s = getTagColor(record.status);
                  return <Tag style={{ background: s.bg, color: s.text, border: 'none', fontWeight: 600 }}>{record.status?.toUpperCase() || 'ACTIVE'}</Tag>;
                }
              },
              {
                title: 'Actions',
                key: 'actions',
                render: (_, record) => (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button size="small" type="link" onClick={() => { setSelectedEmployee(record); setProfileModalOpen(true); }}>Profile</Button>
                    <Button size="small" type="link" onClick={() => { setSelectedEmployee(record); setTaskModalOpen(true); }}>Assign Task</Button>
                  </div>
                )
              }
            ]}
          />
        </Card>
      ) : (
        <Row gutter={[24, 24]}>
          {employees.map((member) => {
            const initials = member.firstName.charAt(0) + member.lastName.charAt(0);
            const color = 'var(--accent-primary)'; // Or generate based on ID
            const statusTag = getTagColor(member.status);

            return (
              <Col xs={24} md={12} xl={8} key={member._id}>
                <Card 
                  className="glassmorphism hover-bg" 
                  style={{ borderRadius: 16, border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}
                  bodyStyle={{ padding: 24 }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, background: color }} />
                  
                  <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                    <Avatar size={56} src={member.profilePhoto} style={{ background: color, fontSize: 20, fontWeight: 800, flexShrink: 0 }}>
                      {!member.profilePhoto && initials}
                    </Avatar>
                    <div>
                      <Title level={5} style={{ margin: '0 0 2px 0', fontWeight: 800 }}>{member.firstName} {member.lastName}</Title>
                      <Text type="secondary" style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 2 }}>{member.designationId?.title || 'No Designation'}</Text>
                      <Text type="tertiary" style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-tertiary)' }}>{member.employeeCode}</Text>
                    </div>
                  </div>

                  {/* Tags */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                    <Tag style={{ margin: 0, borderRadius: 12, border: 'none', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-info)', fontWeight: 800, fontSize: 10, padding: '2px 8px' }}>
                      {member.employmentType?.toUpperCase()}
                    </Tag>
                    <Tag style={{ margin: 0, borderRadius: 12, border: 'none', background: statusTag.bg, color: statusTag.text, fontWeight: 800, fontSize: 10, padding: '2px 8px' }}>
                      {member.status?.toUpperCase()}
                    </Tag>
                  </div>

                  {/* Info Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <Calendar size={14} color="var(--text-tertiary)" style={{ marginTop: 2 }} />
                      <div>
                        <Text style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 2 }}>Joined: {new Date(member.joiningDate).toLocaleDateString()}</Text>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <Briefcase size={14} color="var(--text-tertiary)" style={{ marginTop: 2 }} />
                      <div>
                        <Text style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 2 }}>{member.departmentId?.name || 'No Dept'}</Text>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <IndianRupee size={14} color="var(--text-warning)" style={{ marginTop: 2 }} />
                      <div>
                        <strong style={{ fontSize: 12, color: 'var(--text-primary)', display: 'block' }}>{member.salaryStructure?.ctc ? `₹${member.salaryStructure.ctc.toLocaleString()}/yr` : 'TBD'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                    <Button type="text" onClick={() => { setSelectedEmployee(member); setProfileModalOpen(true); }} style={{ padding: '0 8px', fontWeight: 600, color: 'var(--text-secondary)' }}>View Profile</Button>
                    <Button type="text" onClick={() => { setSelectedEmployee(member); setTaskModalOpen(true); }} style={{ padding: '0 8px', fontWeight: 600, color: 'var(--text-secondary)' }}>Assign Task</Button>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Add Employee Modal */}
      <AddEmployeeModal 
        visible={isModalVisible} 
        onCancel={() => setIsModalVisible(false)} 
        onSuccess={() => {
          setIsModalVisible(false);
          fetchEmployees();
        }}
      />

      {/* View Profile Modal */}
      <Modal
        title={<h2 style={{ margin: 0 }}>Employee Profile</h2>}
        open={profileModalOpen}
        onCancel={() => setProfileModalOpen(false)}
        footer={[<Button key="close" onClick={() => setProfileModalOpen(false)}>Close</Button>]}
      >
        {selectedEmployee && (
          <div style={{ padding: '20px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <Avatar size={64} style={{ backgroundColor: 'var(--accent-primary)' }}>
                {selectedEmployee.firstName.charAt(0)}{selectedEmployee.lastName.charAt(0)}
              </Avatar>
              <div>
                <Title level={4} style={{ margin: 0 }}>{selectedEmployee.firstName} {selectedEmployee.lastName}</Title>
                <Text type="secondary">{selectedEmployee.designationId?.title || 'Employee'}</Text>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Employee Code</Text>
                <div style={{ fontWeight: 600 }}>{selectedEmployee.employeeCode}</div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Email</Text>
                <div style={{ fontWeight: 600 }}>{selectedEmployee.email}</div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Department</Text>
                <div style={{ fontWeight: 600 }}>{selectedEmployee.departmentId?.name || '-'}</div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Employment Type</Text>
                <div style={{ fontWeight: 600 }}>{selectedEmployee.employmentType}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Assign Task Modal */}
      <Modal
        title={<h2 style={{ margin: 0 }}>Assign Task</h2>}
        open={taskModalOpen}
        onCancel={() => setTaskModalOpen(false)}
        onOk={() => {
          message.success(`Task assigned to ${selectedEmployee?.firstName} successfully!`);
          setTaskModalOpen(false);
        }}
        okText="Assign Task"
      >
        {selectedEmployee && (
          <Form layout="vertical" style={{ marginTop: 20 }}>
            <Text style={{ marginBottom: 16, display: 'block' }}>Assigning a new task to <strong>{selectedEmployee.firstName} {selectedEmployee.lastName}</strong></Text>
            <Form.Item label="Task Title" required>
              <Input placeholder="e.g. Update marketing assets" />
            </Form.Item>
            <Form.Item label="Priority">
              <Select defaultValue="Normal">
                <Select.Option value="High">High</Select.Option>
                <Select.Option value="Normal">Normal</Select.Option>
                <Select.Option value="Low">Low</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Due Date">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </motion.div>
  );
};

export default PeopleTab;
