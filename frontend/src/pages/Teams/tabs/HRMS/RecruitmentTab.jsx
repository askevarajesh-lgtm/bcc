import React, { useState, useEffect } from 'react';
import { Typography, Table, Tag, Button, message, Card, Avatar } from 'antd';
import { Briefcase, Plus, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { hrmsService } from '../../../../services/hrms.service';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const RecruitmentTab = () => {
  const [recruitments, setRecruitments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecruitments = async () => {
    try {
      setLoading(true);
      const res = await hrmsService.getRecruitments({});
      if (res.success) setRecruitments(res.data);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to fetch job openings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecruitments();
  }, []);

  const columns = [
    {
      title: 'Job Title',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
      render: (title, record) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{record.departmentId?.name || 'Any Dept'}</div>
        </div>
      )
    },
    {
      title: 'Experience / Salary',
      key: 'exp',
      render: (_, record) => (
        <div>
          <Text style={{ fontSize: 13 }}>{record.experienceRequired || 'Not specified'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{record.salaryRange ? `₹${record.salaryRange}` : 'Negotiable'}</Text>
        </div>
      )
    },
    {
      title: 'Hiring Manager',
      dataIndex: 'hiringManagerId',
      key: 'manager',
      render: (mgr) => mgr ? `${mgr.firstName} ${mgr.lastName}` : 'Unassigned'
    },
    {
      title: 'Candidates Pipeline',
      dataIndex: 'candidates',
      key: 'candidates',
      render: (candidates) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={14} color="var(--text-secondary)" />
          <strong style={{ color: 'var(--accent-primary)' }}>{candidates?.length || 0}</strong>
          <Text type="secondary" style={{ fontSize: 12 }}>applied</Text>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'Open') color = 'success';
        if (status === 'In Progress') color = 'processing';
        if (status === 'Closed') color = 'error';
        if (status === 'On Hold') color = 'warning';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button size="small" type="primary" ghost style={{ borderRadius: 6 }}>View Board</Button>
      )
    }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={4} style={{ margin: '0 0 4px 0', fontWeight: 800 }}>Recruitment & ATS</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Manage job openings and candidate pipelines.</Text>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button 
            type="primary" 
            icon={<Plus size={16} />} 
            style={{ borderRadius: 8, height: 40, background: 'var(--accent-primary)', fontWeight: 600 }}
          >
            New Job Opening
          </Button>
        </div>
      </div>

      <Card className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)' }}>
        <Table 
          columns={columns} 
          dataSource={recruitments} 
          rowKey="_id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </motion.div>
  );
};

export default RecruitmentTab;
