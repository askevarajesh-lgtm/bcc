import React, { useState, useEffect } from 'react';
import { Typography, Card, Row, Col, Statistic, Table, Tag, Skeleton, message, Alert, Space, Divider, Select, Button } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons';
import { useOutletContext } from 'react-router-dom';
import { semrushApi } from '../../../api/semrushApi';

const { Title, Text } = Typography;
const { Option } = Select;

const ActivityTab = () => {
  const { project } = useOutletContext();
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [snapshots, setSnapshots] = useState([]);
  
  const [fromId, setFromId] = useState(null);
  const [toId, setToId] = useState(null);
  
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState(null);
  const [dateError, setDateError] = useState(null);

  useEffect(() => {
    if (project?._id) {
      fetchSnapshots();
    }
  }, [project?._id]);

  const fetchSnapshots = async () => {
    setLoadingInitial(true);
    setError(null);
    try {
      const res = await semrushApi.getActivitySnapshots(project._id);
      if (res.data.success) {
        const snaps = res.data.snapshots || [];
        setSnapshots(snaps);
        
        if (snaps.length >= 2) {
          // snaps are sorted newest to oldest
          setToId(snaps[0]._id);
          setFromId(snaps[1]._id);
        } else if (snaps.length === 1) {
          setToId(snaps[0]._id);
          setFromId(null);
        }
      } else {
        setError(res.data.message || 'Failed to load snapshots.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred fetching snapshots.');
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    if (fromId && toId) {
      // Validate chronologically
      const fromIndex = snapshots.findIndex(s => s._id === fromId);
      const toIndex = snapshots.findIndex(s => s._id === toId);
      
      // Since snapshots are sorted newest to oldest, smaller index means newer date
      if (toIndex > fromIndex) {
        setDateError('Compare To must be later than Compare From.');
        setComparison(null);
      } else if (toIndex === fromIndex) {
        setDateError('Please select two different dates.');
        setComparison(null);
      } else {
        setDateError(null);
        fetchComparison(fromId, toId);
      }
    }
  }, [fromId, toId, snapshots]);

  const fetchComparison = async (from, to) => {
    setLoadingComparison(true);
    setError(null);
    try {
      const res = await semrushApi.getActivityComparison(project._id, { from, to });
      if (res.data.success) {
        setComparison(res.data.data);
      } else {
        setError(res.data.message || 'Failed to load activity comparison.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred fetching the comparison.');
    } finally {
      setLoadingComparison(false);
    }
  };

  if (loadingInitial) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" showIcon style={{ marginBottom: 24 }} />;
  }

  if (snapshots.length === 0) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="No Intelligence snapshots available."
          description="Wait for your first intelligence snapshot to be generated."
          type="info"
          showIcon
        />
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const renderDelta = (item) => {
    if (!item) return <Text type="secondary">Not available</Text>;
    if (item.status === 'unchanged') return <Text type="secondary"><MinusOutlined /> {item.curr !== null ? item.curr : 'Not available'}</Text>;
    if (item.status === 'improved') return <Text type="success"><ArrowUpOutlined /> {item.curr} (+{item.delta})</Text>;
    if (item.status === 'regression') return <Text type="danger"><ArrowDownOutlined /> {item.curr} ({item.delta})</Text>;
    return <Text>{item.curr}</Text>;
  };

  const renderScoreCard = (title, item) => {
    let color = 'var(--text-secondary)';
    let prefix = <MinusOutlined />;
    
    if (item?.status === 'improved') {
      color = '#38cb89';
      prefix = <ArrowUpOutlined />;
    } else if (item?.status === 'regression') {
      color = '#ff4d4f';
      prefix = <ArrowDownOutlined />;
    }

    return (
      <Card bordered={false} style={{ borderRadius: 12, height: '100%' }}>
        <Statistic
          title={title}
          value={item?.curr !== null ? item.curr : 'Not available'}
          precision={0}
          valueStyle={{ color, fontWeight: 600 }}
          prefix={prefix}
          suffix={item?.delta ? <span style={{ fontSize: 14, marginLeft: 8 }}>({item.delta > 0 ? '+' : ''}{item.delta})</span> : null}
        />
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
          Previous: {item?.prev !== null ? item.prev : 'Not available'}
        </div>
      </Card>
    );
  };

  const rankColumns = [
    { title: 'Keyword', dataIndex: 'keyword', key: 'keyword' },
    { title: 'Search Volume', dataIndex: 'searchVolume', key: 'searchVolume' },
    { 
      title: 'Previous Rank', 
      dataIndex: 'prevRank', 
      key: 'prevRank',
      render: (val) => val === null ? <Text type="secondary">— Ranking unavailable</Text> : val
    },
    { 
      title: 'Current Rank', 
      dataIndex: 'currRank', 
      key: 'currRank',
      render: (val) => val === null ? <Text type="secondary">— Ranking unavailable</Text> : val
    },
    {
      title: 'Change',
      key: 'change',
      render: (_, record) => {
        if (record.delta > 0) return <Tag color="success"><ArrowUpOutlined /> {record.delta}</Tag>;
        if (record.delta < 0) return <Tag color="error"><ArrowDownOutlined /> {Math.abs(record.delta)}</Tag>;
        return <Tag color="default">New / Lost / Unchanged</Tag>;
      }
    }
  ];

  return (
    <div style={{ padding: '0 0 24px 0' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <Title level={4}>Intelligence Activity</Title>
          <Text type="secondary">Compare historical snapshots over time.</Text>
        </div>
        
        <Card bordered={false} bodyStyle={{ padding: '16px' }} style={{ borderRadius: 12, minWidth: 500 }}>
          <Space align="center" size="large">
            <div>
              <div style={{ marginBottom: 4, fontSize: 12, color: 'var(--text-secondary)' }}>Compare From</div>
              <Select 
                style={{ width: 220 }} 
                value={fromId} 
                onChange={setFromId}
                placeholder="Select older snapshot"
              >
                {snapshots.map(s => (
                  <Option key={s._id} value={s._id}>{formatDate(s.collectedAt)}</Option>
                ))}
              </Select>
            </div>
            
            <ArrowUpOutlined style={{ transform: 'rotate(45deg)', color: 'var(--text-secondary)', marginTop: 20 }} />
            
            <div>
              <div style={{ marginBottom: 4, fontSize: 12, color: 'var(--text-secondary)' }}>Compare To</div>
              <Select 
                style={{ width: 220 }} 
                value={toId} 
                onChange={setToId}
                placeholder="Select newer snapshot"
              >
                {snapshots.map(s => (
                  <Option key={s._id} value={s._id}>{formatDate(s.collectedAt)}</Option>
                ))}
              </Select>
            </div>
          </Space>
        </Card>
      </div>

      {dateError && (
        <Alert message="Invalid Date Selection" description={dateError} type="warning" showIcon style={{ marginBottom: 24 }} />
      )}
      
      {!dateError && snapshots.length === 1 && (
        <Alert
          message="No previous snapshot available for comparison."
          description="We need at least two snapshots to compare activity. Check back after your next intelligence refresh."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {loadingComparison && (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <Skeleton active paragraph={{ rows: 6 }} />
          <Text type="secondary">Loading snapshot comparison...</Text>
        </div>
      )}

      {!loadingComparison && !dateError && comparison && (
        <>
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <Text type="secondary">
              Comparing<br/>
              <strong style={{ color: 'var(--text-primary)' }}>{formatDate(comparison.dates.previous)}</strong><br/>
              against<br/>
              <strong style={{ color: 'var(--text-primary)' }}>{formatDate(comparison.dates.current)}</strong>
            </Text>
          </div>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card bordered={false} style={{ background: 'var(--bg-secondary)', borderRadius: 12 }}>
                <Statistic title="Improvements" value={comparison.summary.improvements} valueStyle={{ color: '#38cb89' }} prefix={<ArrowUpOutlined />} />
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered={false} style={{ background: 'var(--bg-secondary)', borderRadius: 12 }}>
                <Statistic title="Regressions" value={comparison.summary.regressions} valueStyle={{ color: '#ff4d4f' }} prefix={<ArrowDownOutlined />} />
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered={false} style={{ background: 'var(--bg-secondary)', borderRadius: 12 }}>
                <Statistic title="Unchanged Metrics" value={comparison.summary.unchanged} valueStyle={{ color: 'var(--text-secondary)' }} prefix={<MinusOutlined />} />
              </Card>
            </Col>
          </Row>

          <Title level={5}>Overall Scores</Title>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={6}>{renderScoreCard('Overall Score', comparison.scores.overall)}</Col>
            <Col span={6}>{renderScoreCard('SEO Score', comparison.scores.seo)}</Col>
            <Col span={6}>{renderScoreCard('AEO Score', comparison.scores.aeo)}</Col>
            <Col span={6}>{renderScoreCard('GEO Score', comparison.scores.geo)}</Col>
          </Row>

          <Title level={5}>SEO Metrics Change</Title>
          <Card bordered={false} style={{ borderRadius: 12, marginBottom: 24 }}>
            <Row gutter={[16, 16]}>
              <Col span={8} style={{ marginBottom: 16 }}>
                <Text type="secondary">Authority Score:</Text> {renderDelta(comparison.seo.authorityScore)}
              </Col>
              <Col span={8} style={{ marginBottom: 16 }}>
                <Text type="secondary">Organic Traffic:</Text> {renderDelta(comparison.seo.organicTraffic)}
              </Col>
              <Col span={8} style={{ marginBottom: 16 }}>
                <Text type="secondary">Organic Keywords:</Text> {renderDelta(comparison.seo.organicKeywords)}
              </Col>
              <Col span={8}>
                <Text type="secondary">Backlinks:</Text> {renderDelta(comparison.seo.backlinks)}
              </Col>
              <Col span={8}>
                <Text type="secondary">Site Health Score:</Text> {renderDelta(comparison.seo.technicalScore)}
              </Col>
            </Row>
          </Card>

          {comparison.positionTracking && (comparison.positionTracking.improved.length > 0 || comparison.positionTracking.declined.length > 0 || comparison.positionTracking.new.length > 0 || comparison.positionTracking.unavailable.length > 0) && (
            <>
              <Title level={5}>Rankings Activity (Position Tracking)</Title>
              <Card bordered={false} style={{ borderRadius: 12, marginBottom: 24, padding: 0 }} bodyStyle={{ padding: 0 }}>
                <Table
                  dataSource={[...comparison.positionTracking.improved, ...comparison.positionTracking.declined, ...comparison.positionTracking.new, ...comparison.positionTracking.unavailable]}
                  columns={rankColumns}
                  rowKey="keyword"
                  pagination={{ pageSize: 10 }}
                  size="small"
                />
              </Card>
            </>
          )}

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={12}>
              <Title level={5}>AEO Metrics Change</Title>
              <Card bordered={false} style={{ borderRadius: 12, minHeight: 150 }}>
                {Object.keys(comparison.aeo).length === 0 ? (
                  <Text type="secondary">Not available</Text>
                ) : (
                  Object.keys(comparison.aeo).map(key => (
                    <div key={key} style={{ marginBottom: 8 }}>
                      <Text type="secondary" style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}:</Text> {renderDelta(comparison.aeo[key])}
                    </div>
                  ))
                )}
              </Card>
            </Col>
            <Col span={12}>
              <Title level={5}>GEO Metrics Change</Title>
              <Card bordered={false} style={{ borderRadius: 12, minHeight: 150 }}>
                {Object.keys(comparison.geo).length === 0 ? (
                  <Text type="secondary">Not available</Text>
                ) : (
                  Object.keys(comparison.geo).map(key => (
                    <div key={key} style={{ marginBottom: 8 }}>
                      <Text type="secondary" style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}:</Text> {renderDelta(comparison.geo[key])}
                    </div>
                  ))
                )}
              </Card>
            </Col>
          </Row>

          {comparison.siteHealth && (comparison.siteHealth.resolved.length > 0 || comparison.siteHealth.new.length > 0) && (
            <>
              <Title level={5}>Technical SEO Issues Activity</Title>
              <Card bordered={false} style={{ borderRadius: 12 }}>
                {comparison.siteHealth.new.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ color: '#ff4d4f' }}>New Issues Detected:</Text>
                    <ul>
                      {comparison.siteHealth.new.map(issue => (
                        <li key={issue.id}>Issue #{issue.id} (+{issue.currCount} pages affected)</li>
                      ))}
                    </ul>
                  </div>
                )}
                {comparison.siteHealth.resolved.length > 0 && (
                  <div>
                    <Text strong style={{ color: '#38cb89' }}>Issues Resolved:</Text>
                    <ul>
                      {comparison.siteHealth.resolved.map(issue => (
                        <li key={issue.id}>Issue #{issue.id} (was {issue.prevCount} pages, now 0)</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            </>
          )}
        </>
      )}

    </div>
  );
};

export default ActivityTab;
