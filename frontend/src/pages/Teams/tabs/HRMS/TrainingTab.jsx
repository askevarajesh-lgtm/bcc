import React, { useState, useEffect } from 'react';
import { Typography, Table, Tag, Button, message, Card, Progress } from 'antd';
import { FileText, Plus, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { hrmsService } from '../../../../services/hrms.service';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const TrainingTab = () => {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrainings = async () => {
    try {
      setLoading(true);
      const res = await hrmsService.getTrainings({});
      if (res.success) setTrainings(res.data);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to fetch trainings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainings();
  }, []);

  const columns = [
    {
      title: 'Training Module',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', maxWidth: 300 }} className="text-truncate">{record.description}</div>
        </div>
      )
    },
    {
      title: 'Mandatory For',
      dataIndex: 'mandatoryFor',
      key: 'mandatoryFor',
      render: (depts) => {
        if (!depts || depts.length === 0) return <Text type="secondary" italic>Optional</Text>;
        return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{depts.map(d => <Tag key={d._id}>{d.name}</Tag>)}</div>;
      }
    },
    {
      title: 'Materials',
      dataIndex: 'materials',
      key: 'materials',
      render: (mats) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <BookOpen size={14} color="var(--text-secondary)" />
          <Text style={{ fontWeight: 500 }}>{mats?.length || 0}</Text>
        </div>
      )
    },
    {
      title: 'Completion Rate',
      dataIndex: 'enrolledEmployees',
      key: 'completion',
      render: (enrolled) => {
        if (!enrolled || enrolled.length === 0) return <Text type="secondary">-</Text>;
        const completed = enrolled.filter(e => e.status === 'Completed').length;
        const percent = Math.round((completed / enrolled.length) * 100);
        return (
          <div style={{ width: 120 }}>
            <Progress percent={percent} size="small" status={percent === 100 ? "success" : "active"} />
            <Text style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{completed}/{enrolled.length} completed</Text>
          </div>
        );
      }
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('MMM D, YYYY')
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button size="small" type="primary" ghost style={{ borderRadius: 6 }}>Manage</Button>
      )
    }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={4} style={{ margin: '0 0 4px 0', fontWeight: 800 }}>L&D / Training</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Create and track employee training modules.</Text>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button 
            type="primary" 
            icon={<Plus size={16} />} 
            style={{ borderRadius: 8, height: 40, background: 'var(--accent-primary)', fontWeight: 600 }}
          >
            Create Module
          </Button>
        </div>
      </div>

      <Card className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)' }}>
        <Table 
          columns={columns} 
          dataSource={trainings} 
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

export default TrainingTab;
