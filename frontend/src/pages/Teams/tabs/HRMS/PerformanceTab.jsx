import React, { useState, useEffect } from 'react';
import { Typography, Table, Tag, Button, message, Card, Rate, Progress } from 'antd';
import { Star, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { hrmsService } from '../../../../services/hrms.service';

const { Title, Text } = Typography;

const PerformanceTab = () => {
  const [performances, setPerformances] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPerformances = async () => {
    try {
      setLoading(true);
      const res = await hrmsService.getPerformances({});
      if (res.success) setPerformances(res.data);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to fetch performance reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformances();
  }, []);

  const columns = [
    {
      title: 'Employee',
      dataIndex: 'employeeId',
      key: 'employee',
      render: (emp) => emp ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{emp.firstName} {emp.lastName}</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{emp.departmentId?.name || 'No Dept'}</div>
          </div>
        </div>
      ) : 'Unknown'
    },
    {
      title: 'Review Cycle',
      dataIndex: 'reviewCycle',
      key: 'reviewCycle',
      render: (cycle) => <Tag color="blue" style={{ borderRadius: 12, fontWeight: 600 }}>{cycle}</Tag>
    },
    {
      title: 'KPIs',
      dataIndex: 'kpis',
      key: 'kpis',
      render: (kpis) => {
        if (!kpis || kpis.length === 0) return '-';
        const scored = kpis.filter(k => k.score).length;
        const percent = Math.round((scored / kpis.length) * 100);
        return (
          <div style={{ width: 100 }}>
            <Progress percent={percent} size="small" status={percent === 100 ? "success" : "active"} />
            <Text style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{scored}/{kpis.length} Graded</Text>
          </div>
        );
      }
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => rating ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontWeight: 800, fontSize: 16 }}>{rating.toFixed(1)}</Text>
          <Rate disabled defaultValue={rating} allowHalf style={{ fontSize: 14, color: 'var(--accent-warning)' }} />
        </div>
      ) : (
        <Text type="secondary" italic>Pending</Text>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'Completed') color = 'success';
        if (status === 'Manager Review') color = 'processing';
        if (status === 'Submitted') color = 'purple';
        if (status === 'Draft') color = 'warning';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button size="small" type="primary" ghost style={{ borderRadius: 6 }}>View Review</Button>
      )
    }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={4} style={{ margin: '0 0 4px 0', fontWeight: 800 }}>Performance Reviews</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Track KPIs, goals, and periodic evaluations.</Text>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button 
            type="primary" 
            icon={<Plus size={16} />} 
            style={{ borderRadius: 8, height: 40, background: 'var(--accent-primary)', fontWeight: 600 }}
          >
            Start Review Cycle
          </Button>
        </div>
      </div>

      <Card className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)' }}>
        <Table 
          columns={columns} 
          dataSource={performances} 
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

export default PerformanceTab;
