import React, { useState } from 'react';
import { Card, Select, Button, Typography, Table, Row, Col, message, Form, Tag, Spin, Input } from 'antd';
import { MapPin, Search } from 'lucide-react';
import { useGetLocalSeoQuery } from '../../../api/seoIntelligenceApi';

const { Title, Text } = Typography;

const GeoInsightsTab = ({ projects }) => {
  const [selectedProject, setSelectedProject] = useState(projects[0]?._id);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasRun, setHasRun] = useState(false);

  const { data: localData, isLoading } = useGetLocalSeoQuery(
    { websiteId: selectedProject, keyword: searchQuery }, 
    { skip: !hasRun || !selectedProject || !searchQuery }
  );

  const results = localData?.data || [];

  const handleRunLocalScan = () => {
    if (!selectedProject) return message.warning('Select a project first');
    if (!searchQuery) return message.warning('Enter a target keyword');
    setHasRun(true);
  };

  const columns = [
    { title: 'Rank', dataIndex: 'rank_absolute', key: 'rank', render: val => <Tag color="blue">{val}</Tag> },
    { title: 'Business Name', dataIndex: 'title', key: 'title', render: t => <Text strong>{t}</Text> },
    { title: 'Rating', dataIndex: 'rating', key: 'rating', render: r => r?.value ? `${r.value}⭐ (${r.votes_count})` : '-' },
    { title: 'Address', dataIndex: 'address', key: 'address' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' }
  ];

  return (
    <div style={{ padding: '24px 0' }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card title="Local SEO & GEO Insights" style={{ borderRadius: 16, border: '1px solid var(--border-color)', height: '100%' }}>
            <Form layout="vertical">
              <Form.Item label="Target Project">
                <Select 
                  size="large" 
                  value={selectedProject} 
                  onChange={(val) => {
                    setSelectedProject(val);
                    setHasRun(false);
                  }}
                  options={projects.map(p => ({ label: p.domain, value: p._id }))}
                />
              </Form.Item>
              <Form.Item label="Target Keyword (Local)">
                <Input 
                  size="large" 
                  placeholder="e.g. dentists near me" 
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setHasRun(false);
                  }}
                  prefix={<MapPin size={16} color="var(--text-tertiary)" />}
                />
              </Form.Item>
              <Button type="primary" size="large" block loading={isLoading} onClick={handleRunLocalScan} icon={<Search size={18} />} style={{ borderRadius: 8 }}>
                Scan Local Pack
              </Button>
            </Form>
            
            <div style={{ marginTop: 24 }}>
              <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
                This tool checks live Google Maps/Local Pack rankings for your target keyword in the project's configured GEO location.
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card title={<Text strong>Local Search Results</Text>} style={{ borderRadius: 16, border: '1px solid var(--border-color)', height: '100%' }} bodyStyle={{ padding: 0 }}>
             {isLoading ? (
                <div style={{ padding: '80px 0', textAlign: 'center' }}><Spin size="large" /></div>
              ) : results.length > 0 ? (
                <Table 
                  dataSource={results}
                  rowKey="rank_absolute"
                  pagination={false}
                  style={{ borderTop: '1px solid var(--border-color)' }}
                  columns={columns}
                />
              ) : (
                <div style={{ padding: '80px 0', textAlign: 'center', opacity: 0.6 }}>
                  <MapPin size={48} color="var(--text-secondary)" style={{ marginBottom: 16, opacity: 0.3 }} />
                  {!hasRun ? (
                    <Text type="secondary" style={{ display: 'block' }}>Click "Scan Local Pack" to fetch live GEO rankings.</Text>
                  ) : (
                    <Text type="secondary" style={{ display: 'block' }}>No local pack results found for this keyword.</Text>
                  )}
                </div>
              )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default GeoInsightsTab;
