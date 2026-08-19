import React, { useState } from 'react';
import { Card, Typography, Row, Col, Statistic, Empty, Button, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useOutletContext } from 'react-router-dom';
import { semrushApi } from '../../../api/semrushApi';

const { Title, Text } = Typography;

const TrafficAnalyticsTab = () => {
  const { project, projectData, fetchProjectData } = useOutletContext();
  const [refreshing, setRefreshing] = useState(false);
  const [localData, setLocalData] = useState(null);

  const rawData = localData || projectData?.trafficAnalytics;
  const configStatus = rawData ? 'available' : 'unavailable';
  const data = Array.isArray(rawData) ? rawData[0] : rawData;

  const handleRefresh = async () => {
    if (!project?._id) return;
    setRefreshing(true);
    try {
      const res = await semrushApi.getTrafficAnalytics(project._id, true);
      if (res.data.success && res.data.data) {
        setLocalData(res.data.data);
        message.success('Traffic Analytics updated successfully');
        if (fetchProjectData) fetchProjectData();
      } else {
        message.error(res.data.errorCode || 'Failed to refresh Traffic Analytics');
      }
    } catch (err) {
      message.error('An error occurred during refresh');
    } finally {
      setRefreshing(false);
    }
  };

  if (configStatus !== 'available' || !data) {
    let msg = "Traffic Analytics data not available.";
    if (configStatus === 'not_configured') msg = "Traffic Analytics — SEO API not configured";
    if (configStatus === 'unavailable') msg = "Traffic Analytics — Temporarily unavailable";
    if (configStatus === 'failed') msg = "Traffic Analytics — Provider error";
    if (configStatus === 'rate_limited') msg = "Traffic Analytics — Rate limited";
    
    return (
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text strong>{msg}</Text>
          <Button icon={<ReloadOutlined spin={refreshing} />} onClick={handleRefresh} loading={refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
        <Empty description={msg} />
      </Card>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Traffic Analytics</Title>
          <Text type="secondary">Estimated total traffic and engagement across all devices.</Text>
        </div>
        <Button 
          type="primary" 
          icon={<ReloadOutlined spin={refreshing} />} 
          onClick={handleRefresh} 
          loading={refreshing}
          style={{ borderRadius: 8, fontWeight: 600, background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>

      {data.isFallback ? (
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card style={{ background: '#fffbe6', borderColor: '#ffe58f' }}>
              <Text strong style={{ color: '#faad14' }}>Notice:</Text> Traffic Analytics add-on is not available on this SEO API account. 
              Showing search traffic estimates based on standard Domain Analytics.
            </Card>
          </Col>
          <Col span={8}><Card><Statistic title="Total Search Traffic" value={data.visits ?? 'Unavailable'} /></Card></Col>
          <Col span={8}><Card><Statistic title="Organic Search Traffic" value={data.organic_traffic ?? 'Unavailable'} /></Card></Col>
          <Col span={8}><Card><Statistic title="Paid Search Traffic" value={data.paid_traffic ?? 'Unavailable'} /></Card></Col>
        </Row>
      ) : (
        <Row gutter={[24, 24]}>
          <Col span={8}><Card><Statistic title="Visits" value={data.visits ?? 'Unavailable'} /></Card></Col>
          <Col span={8}><Card><Statistic title="Unique Visitors" value={data.unique_visitors ?? 'Unavailable'} /></Card></Col>
          <Col span={8}><Card><Statistic title="Pages / Visit" value={data.page_views !== null && data.page_views !== undefined && data.visits ? (Number(data.page_views) / Number(data.visits)).toFixed(2) : 'Unavailable'} /></Card></Col>
          
          <Col span={8}><Card><Statistic title="Avg. Visit Duration" value={data.avg_visit_duration !== null && data.avg_visit_duration !== undefined ? `${Math.floor(Number(data.avg_visit_duration) / 60)}m ${Number(data.avg_visit_duration) % 60}s` : 'Unavailable'} /></Card></Col>
          <Col span={8}><Card><Statistic title="Bounce Rate" value={data.bounce_rate !== null && data.bounce_rate !== undefined ? `${(Number(data.bounce_rate) * 100).toFixed(2)}%` : 'Unavailable'} /></Card></Col>
          <Col span={8}><Card><Statistic title="Mobile Share" value={data.mobile_share !== null && data.mobile_share !== undefined ? `${(Number(data.mobile_share) * 100).toFixed(2)}%` : 'Unavailable'} /></Card></Col>

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
