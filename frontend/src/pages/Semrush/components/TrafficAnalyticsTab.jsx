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
  const [configStatus, setConfigStatus] = useState('available');

  useEffect(() => {
    const fetchTraffic = async () => {
      if (!project || !project._id) return;
      setLoading(true);
      try {
        const res = await semrushApi.getTrafficAnalytics(project._id, true);
        if (res && res.status) {
          setConfigStatus(res.status);
          if (res.status === 'available' && res.data && res.data.length > 0) {
            setData(res.data[0]);
          } else {
            setData(null);
          }
        }
      } catch (err) {
        console.error(err);
        setConfigStatus('failed');
      } finally {
        setLoading(false);
      }
    };
    fetchTraffic();
  }, [project]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}><Spin size="large" /></div>;
  }

  if (configStatus !== 'available' || !data) {
    let message = "Traffic Analytics data not available.";
    if (configStatus === 'not_configured') message = "Traffic Analytics — Semrush API not configured";
    if (configStatus === 'unavailable') message = "Traffic Analytics — Temporarily unavailable";
    if (configStatus === 'failed') message = "Traffic Analytics — Provider error";
    if (configStatus === 'rate_limited') message = "Traffic Analytics — Rate limited";
    
    return (
      <Card>
        <Empty description={message} />
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
