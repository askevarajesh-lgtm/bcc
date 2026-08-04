import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Space, Button, Progress, Tooltip, Row, Col } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { useOutletContext } from 'react-router-dom';
import { semrushApi } from '../../../api/semrushApi';

const { Title, Text } = Typography;

const CompetitorAnalysisTab = () => {
  const { project } = useOutletContext();
  const [loading, setLoading] = useState(false);
  const [competitors, setCompetitors] = useState([]);

  useEffect(() => {
    if (project?.domain) {
      fetchCompetitors();
    }
  }, [project]);

  const fetchCompetitors = async (force = false) => {
    try {
      setLoading(true);
      const res = await semrushApi.getCompetitorAnalysis(project.domain, 'us', 20, force);
      setCompetitors(res || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Domain',
      dataIndex: 'domain',
      key: 'domain',
      render: (text) => (
        <Space>
          <img src={`https://www.google.com/s2/favicons?domain=${text}`} alt="" width={16} />
          <Text strong style={{ color: '#1890ff', cursor: 'pointer' }}>{text}</Text>
        </Space>
      )
    },
    {
      title: 'Com. Level',
      dataIndex: 'competitorRelevance',
      key: 'relevance',
      render: (val) => {
        const percent = Math.min(100, Number(val || 0) * 100).toFixed(1);
        return (
          <Tooltip title={`Relevance score: ${val}`}>
            <Progress percent={percent} size="small" status="active" />
          </Tooltip>
        );
      }
    },
    {
      title: 'Common Keywords',
      dataIndex: 'commonKeywords',
      key: 'commonKeywords',
      render: (val) => <Text>{Number(val || 0).toLocaleString()}</Text>
    },
    {
      title: 'SE Keywords',
      dataIndex: 'organicKeywords',
      key: 'organicKeywords',
      render: (val) => <Text>{Number(val || 0).toLocaleString()}</Text>
    },
    {
      title: 'SE Traffic',
      dataIndex: 'organicTraffic',
      key: 'organicTraffic',
      render: (val) => <Text>{Number(val || 0).toLocaleString()}</Text>
    },
    {
      title: 'SE Traffic Cost',
      dataIndex: 'organicCost',
      key: 'organicCost',
      render: (val) => <Text>${Number(val || 0).toLocaleString()}</Text>
    },
    {
      title: 'Ads Keywords',
      dataIndex: 'adwordsKeywords',
      key: 'adwordsKeywords',
      render: (val) => <Text>{Number(val || 0).toLocaleString()}</Text>
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Organic Competitors</Title>
          <Text type="secondary">Domains competing for the same keywords in organic search.</Text>
        </div>
        <Space>
          <Button type="primary" icon={<ReloadOutlined />} onClick={() => fetchCompetitors(true)} loading={loading} style={{ borderRadius: 8, fontWeight: 600 }}>
            Audit Data
          </Button>
          <Button icon={<DownloadOutlined />}>Export</Button>
        </Space>
      </div>

      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card title="Organic Competitors List">
            <Table
              columns={columns}
              dataSource={competitors}
              rowKey="domain"
              loading={loading}
              pagination={false}
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CompetitorAnalysisTab;
