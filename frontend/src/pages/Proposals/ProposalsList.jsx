import React from 'react';
import { Card, Typography, Button, Table, Tag, Space } from 'antd';
import { PlusOutlined, EditOutlined, FilePdfOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const ProposalsList = () => {
  const navigate = useNavigate();
  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Proposals</Title>
          <Text type="secondary">Manage client proposals</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('new')}>
          Create Proposal
        </Button>
      </div>
      <Card>
        <Table 
          columns={[
            { title: 'Proposal #', dataIndex: 'proposalNumber', key: 'proposalNumber' },
            { title: 'Name', dataIndex: 'name', key: 'name' },
            { title: 'Client', dataIndex: 'clientId', key: 'client' },
            { title: 'Amount', dataIndex: 'grandTotal', key: 'grandTotal', render: (val) => `$${val}` },
            { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Tag color="blue">{status}</Tag> },
            { title: 'Actions', key: 'actions', render: () => (
              <Space>
                <Button type="text" icon={<EditOutlined />} />
                <Button type="text" icon={<FilePdfOutlined />} />
              </Space>
            )}
          ]} 
          dataSource={[]} 
        />
      </Card>
    </div>
  );
};

export default ProposalsList;
