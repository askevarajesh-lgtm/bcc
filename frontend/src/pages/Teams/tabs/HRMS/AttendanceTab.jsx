import React, { useState, useEffect } from 'react';
import { Typography, Table, Tag, Button, DatePicker, message, Spin, Row, Col, Card } from 'antd';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { hrmsService } from '../../../../services/hrms.service';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const AttendanceTab = () => {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [clockingIn, setClockingIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);

  // We hardcode the employeeId for demo purposes, since we don't have the logged-in user's employee profile yet.
  // In a real scenario, this would come from the auth context.
  // const { user } = useAuth();
  // const currentEmployeeId = user.employeeId;
  const currentEmployeeId = '605c72a8b94f1c1a2c3a5b67'; // Placeholder object ID for testing

  const fetchAttendances = async () => {
    try {
      setLoading(true);
      const res = await hrmsService.getAttendances({ date: selectedDate.format('YYYY-MM-DD') });
      if (res.success) {
        setAttendances(res.data);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendances();
  }, [selectedDate]);

  const handleClockIn = async () => {
    try {
      setClockingIn(true);
      const res = await hrmsService.clockIn({ employeeId: currentEmployeeId, location: 'Office' });
      if (res.success) {
        message.success('Clocked in successfully!');
        fetchAttendances();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to clock in');
    } finally {
      setClockingIn(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setClockingOut(true);
      const res = await hrmsService.clockOut({ employeeId: currentEmployeeId });
      if (res.success) {
        message.success('Clocked out successfully!');
        fetchAttendances();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to clock out');
    } finally {
      setClockingOut(false);
    }
  };

  const columns = [
    {
      title: 'Employee',
      dataIndex: 'employeeId',
      key: 'employee',
      render: (emp) => emp ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{emp.firstName} {emp.lastName}</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{emp.employeeCode}</div>
          </div>
        </div>
      ) : 'Unknown'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'Present') color = 'success';
        if (status === 'Absent') color = 'error';
        if (status === 'On Leave') color = 'warning';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: 'Clock In',
      dataIndex: 'clockIn',
      key: 'clockIn',
      render: (time) => time ? dayjs(time).format('hh:mm A') : '-'
    },
    {
      title: 'Clock Out',
      dataIndex: 'clockOut',
      key: 'clockOut',
      render: (time) => time ? dayjs(time).format('hh:mm A') : '-'
    },
    {
      title: 'Work Hours',
      dataIndex: 'workHours',
      key: 'workHours',
      render: (hours) => hours ? `${hours} hrs` : '-'
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      render: (loc) => loc || '-'
    }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={4} style={{ margin: '0 0 4px 0', fontWeight: 800 }}>Attendance Tracker</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Monitor daily clock-ins and working hours.</Text>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <DatePicker 
            value={selectedDate} 
            onChange={(date) => setSelectedDate(date || dayjs())} 
            allowClear={false}
            style={{ borderRadius: 8, height: 40 }}
          />
          <Button 
            type="primary" 
            icon={<CheckCircle size={16} />} 
            onClick={handleClockIn}
            loading={clockingIn}
            style={{ borderRadius: 8, height: 40, background: 'var(--accent-primary)', fontWeight: 600 }}
          >
            Clock In
          </Button>
          <Button 
            danger 
            icon={<XCircle size={16} />} 
            onClick={handleClockOut}
            loading={clockingOut}
            style={{ borderRadius: 8, height: 40, fontWeight: 600 }}
          >
            Clock Out
          </Button>
        </div>
      </div>

      <Card className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)' }}>
        <Table 
          columns={columns} 
          dataSource={attendances} 
          rowKey="_id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </motion.div>
  );
};

export default AttendanceTab;
