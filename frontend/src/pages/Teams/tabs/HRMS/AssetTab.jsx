import React, { useState, useEffect } from 'react';
import { Typography, Table, Tag, Button, message, Card } from 'antd';
import { Laptop, Plus, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { hrmsService } from '../../../../services/hrms.service';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const AssetTab = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await hrmsService.getAssets({});
      if (res.success) setAssets(res.data);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const columns = [
    {
      title: 'Asset Name',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <Laptop size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{record.assetType} • S/N: {record.serialNumber || 'N/A'}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      render: (emp) => emp ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserCheck size={14} color="var(--accent-success)" />
          <Text style={{ fontWeight: 500 }}>{emp.firstName} {emp.lastName}</Text>
        </div>
      ) : <Text type="secondary" italic>Unassigned</Text>
    },
    {
      title: 'Assignment Date',
      dataIndex: 'assignmentDate',
      key: 'assignmentDate',
      render: (date) => date ? dayjs(date).format('MMM D, YYYY') : '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'Available') color = 'success';
        if (status === 'Assigned') color = 'processing';
        if (status === 'Under Repair') color = 'warning';
        if (status === 'Retired') color = 'error';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button size="small" type="primary" ghost style={{ borderRadius: 6 }}>
          {record.status === 'Assigned' ? 'Return Asset' : 'Assign'}
        </Button>
      )
    }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={4} style={{ margin: '0 0 4px 0', fontWeight: 800 }}>Asset Management</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Track company laptops, licenses, and other equipment.</Text>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button 
            type="primary" 
            icon={<Plus size={16} />} 
            style={{ borderRadius: 8, height: 40, background: 'var(--accent-warning)', fontWeight: 600 }}
          >
            Add Asset
          </Button>
        </div>
      </div>

      <Card className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)' }}>
        <Table 
          columns={columns} 
          dataSource={assets} 
          rowKey="_id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </motion.div>
  );
};

export default AssetTab;
