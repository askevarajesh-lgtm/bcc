import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Space, Button, Progress, Tooltip, Row, Col, message } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { useOutletContext } from 'react-router-dom';
import { semrushApi } from '../../../api/semrushApi';
import SnapshotSelector from './SnapshotSelector';

const { Title, Text } = Typography;

const CompetitorAnalysisTab = () => {
  const { project, projectData, fetchProjectData } = useOutletContext();
  
  const [localData, setLocalData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const competitors = localData || projectData?.overview?.competitors || projectData?.competitors || [];

  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotError, setSnapshotError] = useState(false);

  const handleSnapshotSelect = async (snapshotId) => {
    if (snapshotId === 'latest') {
      setLocalData(projectData?.overview?.competitors || projectData?.competitors || []);
      setSnapshotError(false);
      return;
    }
    
    setSnapshotLoading(true);
    setSnapshotError(false);
    try {
      const res = await semrushApi.getSnapshotById(project._id, snapshotId);
      if (res.data.success && res.data.data) {
        const overviewData = res.data.data.overview;
        if (!overviewData || !overviewData.competitors || overviewData.competitors.length === 0) {
          setSnapshotError(true);
        } else {
          setLocalData(overviewData.competitors);
        }
      }
    } catch (err) {
      console.error(err);
      setSnapshotError(true);
    } finally {
      setSnapshotLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!project?._id) return;
    setRefreshing(true);
    try {
      const res = await semrushApi.getCompetitorAnalysis(project._id, true);
      if (res.data.success && res.data.data) {
        setLocalData(res.data.data.competitors || []);
        message.success('Competitors updated successfully');
        if (fetchProjectData) fetchProjectData();
      } else {
        message.error(res.data.errorCode || 'Failed to refresh Competitors');
      }
    } catch (err) {
      message.error('An error occurred during refresh');
    } finally {
      setRefreshing(false);
    }
  };

  const renderMetric = (val, isCurrency = false) => {
    if (val === null || val === undefined || val === '') return <Text type="secondary">Unavailable</Text>;
    const num = Number(val);
    if (isNaN(num)) return <Text type="secondary">Unavailable</Text>;
    if (isCurrency) return <Text>${num.toLocaleString()}</Text>;
    return <Text>{num.toLocaleString()}</Text>;
  };

  const columns = [
    {
      title: 'Domain',
      dataIndex: 'domain',
      key: 'domain',
      render: (text) => (
        <Space>
          <img src={`https://www.google.com/s2/favicons?domain=${text}`} alt="" width={16} />
          <Text strong style={{ color: 'var(--accent-primary)', cursor: 'pointer' }}>{text}</Text>
        </Space>
      )
    },
    {
      title: 'Com. Level',
      dataIndex: 'competitorRelevance',
      key: 'relevance',
      render: (val) => {
        if (val === null || val === undefined) return <Text type="secondary">Unavailable</Text>;
        const percent = Math.min(100, Number(val) * 100).toFixed(1);
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
      render: (val) => renderMetric(val)
    },
    {
      title: 'SE Keywords',
      dataIndex: 'organicKeywords',
      key: 'organicKeywords',
      render: (val) => renderMetric(val)
    },
    {
      title: 'SE Traffic',
      dataIndex: 'organicTraffic',
      key: 'organicTraffic',
      render: (val) => renderMetric(val)
    },
    {
      title: 'SE Traffic Cost',
      dataIndex: 'organicCost',
      key: 'organicCost',
      render: (val) => renderMetric(val, true)
    },
    {
      title: 'Ads Keywords',
      dataIndex: 'adwordsKeywords',
      key: 'adwordsKeywords',
      render: (val) => renderMetric(val)
    }
  ];

  return (
    <div style={{ padding: '0 0 40px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Organic Competitors</Title>
          <Text type="secondary">Domains competing for the same organic keywords as you.</Text>
        </div>
        
        <SnapshotSelector 
          projectId={project?._id} 
          tabKey="competitor-analysis" 
          onSnapshotSelect={handleSnapshotSelect} 
        />
        
        <Button 
          type="primary" 
          icon={<ReloadOutlined spin={refreshing} />} 
          onClick={handleRefresh} 
          loading={refreshing}
          style={{ borderRadius: 8, fontWeight: 600, background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Competitors'}
        </Button>
      </div>

      {snapshotError ? (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <Text type="secondary">Historical data not available for this snapshot.</Text>
        </div>
      ) : snapshotLoading ? (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <Text type="secondary">Loading historical data...</Text>
        </div>
      ) : (
        <Card title="Organic Competitors List" bordered={false} style={{ borderRadius: 12 }}>
          <Table
            columns={columns}
            dataSource={competitors}
            rowKey="domain"
            loading={refreshing}
            pagination={false}
            scroll={{ x: 'max-content' }}
          />
        </Card>
      )}
    </div>
  );
};

export default CompetitorAnalysisTab;
