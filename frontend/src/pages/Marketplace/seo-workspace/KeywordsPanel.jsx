import React, { useEffect, useState } from 'react';
import { Card, Table, Select, Typography, Tag } from 'antd';
import { CheckCircle } from 'lucide-react';
import useWorkspaceKeywords from './hooks/useWorkspaceKeywords';

const { Title, Text } = Typography;
const { Option } = Select;

const KeywordsPanel = ({ projects }) => {
  const { keywords, pagination, loading, fetchKeywords } = useWorkspaceKeywords();
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    if (selectedProject) fetchKeywords({ projectId: selectedProject, page: 1, limit: 20 });
  }, [selectedProject, fetchKeywords]);

  const columns = [
    { title: 'Keyword', dataIndex: 'keyword', key: 'keyword', render: text => <strong>{text}</strong> },
    { title: 'Project', dataIndex: ['projectId', 'name'], key: 'projectName' },
    { title: 'Volume', dataIndex: ['metrics', 'searchVolume'], key: 'volume' },
    { title: 'Position', dataIndex: ['ranking', 'currentRank'], key: 'position' },
    {
      title: 'Difficulty', dataIndex: ['metrics', 'keywordDifficulty'], key: 'difficulty',
      render: dif => <Tag color={dif > 60 ? 'red' : dif > 30 ? 'orange' : 'green'}>{dif || 'N/A'}</Tag>
    },
  ];

  return (
    <Card className="seo-glass-panel seo-table">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>Keyword Tracking</Title>
        <Select placeholder="Select a project" style={{ width: 250 }} onChange={setSelectedProject} value={selectedProject}>
          {projects.map(p => <Option key={p._id} value={p._id}>{p.name}</Option>)}
        </Select>
      </div>

      {!selectedProject ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <CheckCircle size={48} color="#ccc" style={{ marginBottom: 16 }} />
          <Text type="secondary" style={{ display: 'block' }}>Select a project to view its keywords</Text>
        </div>
      ) : (
        <Table
          dataSource={keywords}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (page, pageSize) => fetchKeywords({ projectId: selectedProject, page, limit: pageSize })
          }}
        />
      )}
    </Card>
  );
};

export default KeywordsPanel;
