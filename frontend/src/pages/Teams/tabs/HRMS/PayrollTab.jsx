import React, { useState, useEffect } from 'react';
import { Typography, Table, Tag, Button, message, Card, DatePicker } from 'antd';
import { IndianRupee, Download, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { hrmsService } from '../../../../services/hrms.service';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const PayrollTab = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().subtract(1, 'month')); // Default to last month

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const res = await hrmsService.getPayrolls({ month: selectedMonth.format('YYYY-MM') });
      if (res.success) setPayrolls(res.data);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to fetch payrolls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, [selectedMonth]);

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await hrmsService.updatePayrollStatus(id, { status });
      if (res.success) {
        message.success(`Payroll marked as ${status}`);
        fetchPayrolls();
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
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{emp.employeeCode}</div>
          </div>
        </div>
      ) : 'Unknown'
    },
    {
      title: 'Gross Earnings',
      key: 'gross',
      render: (_, record) => {
        const gross = (record.basicPay || 0) + (record.hra || 0) + (record.allowances || 0) + (record.bonus || 0);
        return <Text style={{ fontWeight: 500 }}>₹{gross.toLocaleString()}</Text>;
      }
    },
    {
      title: 'Deductions',
      key: 'deductions',
      render: (_, record) => {
        const deductions = (record.pf || 0) + (record.esi || 0) + (record.professionalTax || 0) + (record.incomeTax || 0) + (record.otherDeductions || 0);
        return <Text type="danger" style={{ fontWeight: 500 }}>-₹{deductions.toLocaleString()}</Text>;
      }
    },
    {
      title: 'Net Salary',
      dataIndex: 'netSalary',
      key: 'netSalary',
      render: (net) => <strong style={{ color: 'var(--accent-primary)', fontSize: 15 }}>₹{net?.toLocaleString() || 0}</strong>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'Paid') color = 'success';
        if (status === 'Processed') color = 'processing';
        if (status === 'Draft') color = 'warning';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          {record.status !== 'Paid' && (
            <Button size="small" type="primary" onClick={() => handleUpdateStatus(record._id, 'Paid')} style={{ background: 'var(--accent-primary)', border: 'none' }}>
              Mark Paid
            </Button>
          )}
          <Button size="small" icon={<Download size={14} />}>Payslip</Button>
        </div>
      )
    }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={4} style={{ margin: '0 0 4px 0', fontWeight: 800 }}>Payroll Processing</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Manage salaries, deductions, and payslips.</Text>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <DatePicker.MonthPicker 
            value={selectedMonth} 
            onChange={(date) => setSelectedMonth(date || dayjs())} 
            allowClear={false}
            style={{ borderRadius: 8, height: 40 }}
          />
          <Button 
            type="primary" 
            icon={<IndianRupee size={16} />} 
            style={{ borderRadius: 8, height: 40, background: 'var(--accent-warning)', fontWeight: 600 }}
          >
            Generate Payroll
          </Button>
        </div>
      </div>

      <Card className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)' }}>
        <Table 
          columns={columns} 
          dataSource={payrolls} 
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
    </motion.div>
  );
};

export default PayrollTab;
