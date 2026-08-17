import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Statistic, Empty, Spin, Button, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useOutletContext } from 'react-router-dom';
import { semrushApi } from '../../../api/semrushApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const { Title, Text } = Typography;

const TrafficAnalyticsTab = () => {
  const { project } = useOutletContext();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    // Traffic Analytics requires a specific add-on. For the Intelligence background job,
    // this data is omitted to save credits. Show empty state or mock state.
    setData(null);
  }, [project]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}><Spin size="large" /></div>;
  }

  if (!data) {
    return (
      <Card>
        <Empty 
          description="Traffic Analytics data not available. This requires connecting a live Semrush API key with the Traffic Analytics add-on. Use the global 'Refresh Intelligence' button for high-level snapshot data."
        />
      </Card>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Traffic Analytics</Title>
          <Text type="secondary">Estimated total traffic and engagement across all devices.</Text>
        </div>
      </div>

      {data.isFallback ? (
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card style={{ background: '#fffbe6', borderColor: '#ffe58f' }}>
              <Text strong style={{ color: '#faad14' }}>Notice:</Text> Traffic Analytics add-on is not available on this Semrush API account. 
              Showing search traffic estimates based on standard Domain Analytics.
            </Card>
          </Col>
          <Col span={8}><Card><Statistic title="Total Search Traffic" value={Number(data.visits || 0).toLocaleString()} /></Card></Col>
          <Col span={8}><Card><Statistic title="Organic Search Traffic" value={Number(data.organic_traffic || 0).toLocaleString()} /></Card></Col>
          <Col span={8}><Card><Statistic title="Paid Search Traffic" value={Number(data.paid_traffic || 0).toLocaleString()} /></Card></Col>
        </Row>
      ) : (
        <Row gutter={[24, 24]}>
          <Col span={8}><Card><Statistic title="Visits" value={Number(data.visits || 0).toLocaleString()} /></Card></Col>
          <Col span={8}><Card><Statistic title="Unique Visitors" value={Number(data.unique_visitors || 0).toLocaleString()} /></Card></Col>
          <Col span={8}><Card><Statistic title="Pages / Visit" value={Number(data.page_views || 0) / Math.max(1, Number(data.visits || 1))} precision={2} /></Card></Col>
          
          <Col span={8}><Card><Statistic title="Avg. Visit Duration" value={`${Math.floor(Number(data.avg_visit_duration || 0) / 60)}m ${Number(data.avg_visit_duration || 0) % 60}s`} /></Card></Col>
          <Col span={8}><Card><Statistic title="Bounce Rate" value={`${(Number(data.bounce_rate || 0) * 100).toFixed(2)}%`} /></Card></Col>
          <Col span={8}><Card><Statistic title="Mobile Share" value={`${(Number(data.mobile_share || 0) * 100).toFixed(2)}%`} /></Card></Col>

          <Col span={24}>
            <Card title="Traffic Trend">
              <div style={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Empty description="Historical trend data requires the Traffic Analytics History API." />
              </div>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default TrafficAnalyticsTab;
