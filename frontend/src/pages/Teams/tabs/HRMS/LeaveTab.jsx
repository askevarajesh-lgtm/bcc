import React, { useState, useEffect } from 'react';
import { Typography, Table, Tag, Button, message, Modal, Form, Select, DatePicker, Input, Card } from 'antd';
import { Plus, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { hrmsService } from '../../../../services/hrms.service';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const LeaveTab = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isApplyModalVisible, setIsApplyModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const currentEmployeeId = '605c72a8b94f1c1a2c3a5b67'; // Placeholder for testing

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await hrmsService.getLeaves({});
      if (res.success) setLeaves(res.data);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to fetch leaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleApply = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        employeeId: currentEmployeeId, // Ideally this comes from auth context, or we pick it in form if admin
        leaveType: values.leaveType,
        startDate: values.dates[0].toDate(),
        endDate: values.dates[1].toDate(),
        reason: values.reason,
      };
      const res = await hrmsService.applyLeave(payload);
      if (res.success) {
        message.success('Leave applied successfully!');
        setIsApplyModalVisible(false);
        form.resetFields();
        fetchLeaves();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to apply leave');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await hrmsService.updateLeaveStatus(id, { status, rejectionReason: status === 'Rejected' ? 'Not approved by manager' : '' });
      if (res.success) {
        message.success(`Leave ${status.toLowerCase()} successfully`);
        fetchLeaves();
      }
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const columns = [
    {
      title: 'Employee',
      dataIndex: 'employeeId',
      key: 'employee',
      render: (emp) => emp ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{emp.firstName} {emp.lastName}</div>
          </div>
        </div>
      ) : 'Unknown'
    },
    {
      title: 'Leave Type',
      dataIndex: 'leaveType',
      key: 'leaveType',
      render: (type) => <Text style={{ fontWeight: 500 }}>{type}</Text>
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_, record) => (
        <div>
          <div>{dayjs(record.startDate).format('MMM D, YYYY')} - {dayjs(record.endDate).format('MMM D, YYYY')}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.totalDays} day{record.totalDays > 1 ? 's' : ''}</Text>
        </div>
      )
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason) => <Text style={{ maxWidth: 200 }} ellipsis={{ tooltip: reason }}>{reason}</Text>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'Approved') color = 'success';
        if (status === 'Rejected') color = 'error';
        if (status === 'Pending') color = 'warning';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        record.status === 'Pending' ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button size="small" type="primary" onClick={() => handleUpdateStatus(record._id, 'Approved')} style={{ background: 'var(--accent-primary)', border: 'none' }}>Approve</Button>
            <Button size="small" danger onClick={() => handleUpdateStatus(record._id, 'Rejected')}>Reject</Button>
          </div>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>Processed</Text>
        )
      )
    }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={4} style={{ margin: '0 0 4px 0', fontWeight: 800 }}>Leave Management</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Track and manage time off requests.</Text>
        </div>
        <Button 
          type="primary" 
          icon={<Plus size={16} />} 
          onClick={() => setIsApplyModalVisible(true)}
          style={{ borderRadius: 8, height: 40, background: 'var(--accent-warning)', fontWeight: 600 }}
        >
          Apply Leave
        </Button>
      </div>

      <Card className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)' }}>
        <Table 
          columns={columns} 
          dataSource={leaves} 
          rowKey="_id" 
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            position: ['bottomCenter']
          }}
        />
      </Card>

      <Modal
        title={<h2 style={{ margin: 0, fontWeight: 800 }}>Apply for Leave</h2>}
        visible={isApplyModalVisible}
        onCancel={() => setIsApplyModalVisible(false)}
        footer={null}
        width={500}
        className="glassmorphism-modal"
      >
        <Form form={form} layout="vertical" onFinish={handleApply} style={{ marginTop: 24 }}>
          <Form.Item name="leaveType" label="Leave Type" rules={[{ required: true }]}>
            <Select placeholder="Select Leave Type">
              <Option value="Casual Leave">Casual Leave</Option>
              <Option value="Sick Leave">Sick Leave</Option>
              <Option value="Paid Leave">Paid Leave</Option>
              <Option value="Comp Off">Comp Off</Option>
              <Option value="Loss Of Pay">Loss Of Pay</Option>
            </Select>
          </Form.Item>
          <Form.Item name="dates" label="Duration" rules={[{ required: true }]}>
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="Please describe the reason for your leave..." />
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <Button onClick={() => setIsApplyModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting} style={{ background: 'var(--accent-warning)' }}>
              Submit Request
            </Button>
          </div>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default LeaveTab;
