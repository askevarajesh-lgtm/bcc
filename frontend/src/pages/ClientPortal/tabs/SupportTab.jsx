import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Table, Button, Tag, Modal, Form, Input, Select, message } from 'antd';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import SlabCard from '../../../components/SlabCard';
import { slaApi } from '../../../api/slaApi';
import { supportApi } from '../../../api/supportApi';
import { useAuth } from '../../../contexts/AuthContext';

const { Title, Text } = Typography;
const { TextArea } = Input;

const SupportTab = () => {
  const { role } = useAuth();
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const [tickets, setTickets] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [viewTicketModalVisible, setViewTicketModalVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await supportApi.getAssignableUsers();
        if (res && res.data) {
          setAssignableUsers(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch assignable users', err);
      }
    };
    fetchUsers();
  }, []);

  const fetchSupportTickets = async () => {
    try {
      const res = await slaApi.getSlas({ triggerType: 'Client Issue' });
      if (res && res.data) {
        const fetchedTickets = res.data.map((item, index) => {
          let type = 'General';
          if (item.description && item.description.startsWith('[')) {
            type = item.description.split(']')[0].substring(1);
          }

          const days = Math.floor((new Date() - new Date(item.createdAt)) / (1000 * 60 * 60 * 24));
          const openedStr = days === 0 ? 'Today' : `${days} days`;

          return {
            id: item._id || index,
            subject: item.title,
            type: type,
            priority: item.priority || 'Normal',
            am: item.assignedTo?.name || 'Unassigned',
            opened: openedStr,
            status: item.status || 'Open',
            action: 'View',
            original: item
          };
        });

        setTickets(fetchedTickets);
      }
    } catch (error) {
      console.error('Failed to fetch support tickets', error);
    }
  };

  useEffect(() => {
    fetchSupportTickets();
  }, []);

  const handleSubmitTicket = async (values) => {
    setSubmitting(true);
    try {
      await supportApi.createSupportTicket(values);
      message.success('Ticket raised successfully!');
      setIsModalVisible(false);
      form.resetFields();
      fetchSupportTickets();
    } catch (err) {
      message.error('Failed to raise ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityColor = (priority) => {
    if (priority === 'Critical' || priority === 'Urgent') return 'var(--accent-danger)';
    if (priority === 'High') return 'var(--accent-warning)';
    return 'var(--text-secondary)';
  };

  const columns = [
    { title: 'SUBJECT', dataIndex: 'subject', key: 'subject', render: (val) => <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{val}</span> },
    { title: 'TYPE', dataIndex: 'type', key: 'type', render: (val) => <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{val}</span> },
    { title: 'PRIORITY', dataIndex: 'priority', key: 'priority', render: (val) => <span style={{ color: getPriorityColor(val), fontWeight: 800 }}>{val}</span> },
    { title: 'ASSIGNED TO', dataIndex: 'am', key: 'am', render: (val) => <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{val}</span> },
    { title: 'OPENED', dataIndex: 'opened', key: 'opened', render: (val) => <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{val}</span> },
    { 
      title: 'STATUS', 
      dataIndex: 'status', 
      key: 'status', 
      render: (val) => (
        <Tag style={{ 
          margin: 0, 
          border: '1px solid var(--border-color)', 
          background: 'var(--bg-tertiary)', 
          color: 'var(--text-secondary)', 
          fontWeight: 700, 
          borderRadius: 12, 
          padding: '2px 10px' 
        }}>
          {val}
        </Tag>
      ) 
    },
    { 
      title: 'ACTION', 
      key: 'action', 
      render: (_, record) => (
        <Button 
          type="text" 
          style={{ color: 'var(--accent-secondary)', fontWeight: 700, padding: 0 }}
          onClick={() => {
            setSelectedTicket(record);
            setViewTicketModalVisible(true);
          }}
        >
          {record.action}
        </Button>
      ) 
    },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" >
      
      <motion.div variants={itemVariants} style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={2} style={{ margin: '0 0 8px 0', fontWeight: 800 }}>Support</Title>
          <Text type="secondary" style={{ fontSize: 15, fontWeight: 500 }}>Raise a request, track your tickets, or contact your team directly.</Text>
        </div>
        <Button 
          type="primary" 
          icon={<Plus size={16} />} 
          style={{ fontWeight: 800, borderRadius: 8, height: 40 }}
          onClick={() => setIsModalVisible(true)}
        >
          Raise Ticket
        </Button>
      </motion.div>

      <motion.div variants={itemVariants} style={{ marginBottom: 32 }}>
        <SlabCard bodyStyle={{ padding: 0 }}>
          <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color)' }}>
            <Text style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>My Open Tickets</Text>
          </div>
          <Table 
            dataSource={tickets} 
            columns={columns} 
            pagination={false} 
            rowKey="id"
            style={{ width: '100%' }}
            className="custom-table"
          />
        </SlabCard>
      </motion.div>

      <Modal
        title={<span style={{ fontWeight: 800, fontSize: 18 }}>Raise Support Ticket</span>}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitTicket} style={{ marginTop: 24 }}>
          <Form.Item name="subject" label={<span style={{ fontWeight: 600 }}>Subject</span>} rules={[{ required: true }]}>
            <Input placeholder="E.g., Need help with billing..." size="large" style={{ borderRadius: 8 }} />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="typeOfRequest" label={<span style={{ fontWeight: 600 }}>Type of Request</span>} rules={[{ required: true }]}>
                <Select size="large" style={{ borderRadius: 8 }}>
                  {role === 'brand_super_admin' ? (
                    <>
                      <Select.Option value="Plan Expiry">Plan Expiry</Select.Option>
                      <Select.Option value="Subscription Expiry">Subscription Expiry</Select.Option>
                      <Select.Option value="Account Event">Account-related Event</Select.Option>
                      <Select.Option value="Other">Other</Select.Option>
                    </>
                  ) : (
                    <>
                      <Select.Option value="Task Due Dates">Task Due Dates</Select.Option>
                      <Select.Option value="User Issue">User-related Issues</Select.Option>
                      <Select.Option value="Day-to-day">Day-to-day Activities</Select.Option>
                      <Select.Option value="Other">Other</Select.Option>
                    </>
                  )}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="priority" label={<span style={{ fontWeight: 600 }}>Priority Level</span>} rules={[{ required: true }]}>
                <Select size="large" style={{ borderRadius: 8 }}>
                  <Select.Option value="Normal">Normal (24h SLA)</Select.Option>
                  <Select.Option value="High">High (8h SLA)</Select.Option>
                  <Select.Option value="Critical">Critical (1h SLA)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="assignedToUserId" label={<span style={{ fontWeight: 600 }}>Assign To</span>} rules={[{ required: true, message: 'Please select an assignee' }]}>
            <Select size="large" placeholder="Select a manager or admin" loading={assignableUsers.length === 0} style={{ borderRadius: 8 }}>
              {assignableUsers.map(user => (
                <Select.Option key={user._id} value={user._id}>
                  {user.name} ({user.role})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="details" label={<span style={{ fontWeight: 600 }}>Details</span>} rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="Please describe your issue in detail..." style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 32 }}>
            <Button type="primary" htmlType="submit" size="large" loading={submitting} block style={{ borderRadius: 8, fontWeight: 800 }}>
              Submit Ticket
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<span style={{ fontWeight: 800, fontSize: 18 }}>Ticket Details</span>}
        open={viewTicketModalVisible}
        onCancel={() => setViewTicketModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setViewTicketModalVisible(false)} style={{ fontWeight: 800, borderRadius: 8 }}>
            Close
          </Button>
        ]}
        destroyOnClose
      >
        {selectedTicket && (
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 700 }}>SUBJECT</Text><br/>
              <Text style={{ fontSize: 16, fontWeight: 600 }}>{selectedTicket.subject}</Text>
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 700 }}>STATUS</Text><br/>
                <Tag style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontWeight: 700, border: '1px solid var(--border-color)', borderRadius: 12, margin: 0 }}>
                  {selectedTicket.status}
                </Tag>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 700 }}>TYPE</Text><br/>
                <Text style={{ fontWeight: 600 }}>{selectedTicket.type}</Text>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 700 }}>PRIORITY</Text><br/>
                <Text style={{ fontWeight: 600, color: getPriorityColor(selectedTicket.priority) }}>{selectedTicket.priority}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 700 }}>ASSIGNED TO</Text><br/>
                <Text style={{ fontWeight: 600 }}>{selectedTicket.am}</Text>
              </Col>
            </Row>
            <div>
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 700 }}>DETAILS</Text><br/>
              <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 8, marginTop: 4 }}>
                <Text style={{ fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                  {selectedTicket.original?.description?.includes(']') 
                    ? selectedTicket.original.description.split(']').slice(1).join(']').trim() 
                    : selectedTicket.original?.description}
                </Text>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default SupportTab;
