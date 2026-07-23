import React, { useState } from 'react';
import { Input, Button, Table, Spin, Typography, Alert, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { Link2, Globe, ArrowUpRight, ArrowDownRight, AlertCircle, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { semrushApi } from '../../../api/semrushApi';
import './DashboardTab.css'; 

const { Title, Text } = Typography;

const BacklinkAnalyticsTab = () => {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!domain) return;
    
    setLoading(true);
    setData(null);
    setError(null);

    try {
      const result = await semrushApi.getBacklinksOverview(domain);
      
      if (result && result.length > 0) {
          setData(result[0]);
      } else {
         setError('No backlink data found for this domain.');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch backlink analytics.');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Number(num).toLocaleString();
  };

  const MetricCard = ({ title, value, icon, color, trend, trendValue, delay }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="semrush-metric-card"
      style={{ '--card-accent': color, '--icon-bg': `${color}15` }}
    >
      <div className="metric-card-header">
        <h3 className="metric-card-title">{title}</h3>
        <div className="metric-icon-wrapper">
          {icon}
        </div>
      </div>
      <div className="metric-value">{value}</div>
      {trend && (
        <div className={`metric-trend ${trend === 'up' ? 'trend-up' : 'trend-down'}`} style={{ marginTop: 'auto' }}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trendValue} last 30d
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="semrush-dashboard-container">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="semrush-search-glass"
      >
        <div style={{ display: 'flex', gap: '16px', maxWidth: 800, margin: '0 auto' }}>
          <Input 
            size="large"
            placeholder="Enter domain (e.g., askeva.io)" 
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            onPressEnter={handleSearch}
            style={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
          />
          <Button 
            type="primary" 
            size="large" 
            onClick={handleSearch} 
            loading={loading}
            style={{ borderRadius: '8px', padding: '0 32px', fontWeight: 600, height: '46px' }}
          >
            Audit Backlinks
          </Button>
        </div>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <Alert message="Analysis Failed" description={error} type="error" showIcon />
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ textAlign: 'center', padding: '80px 0' }}
          >
            <Spin size="large" />
            <div style={{ marginTop: 16, color: '#8c8c8c', fontWeight: 500 }}>Scanning backlink profile...</div>
          </motion.div>
        ) : data ? (
          <motion.div 
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 24 }}>
              <Title level={3} style={{ margin: 0 }}>Backlink Profile for <span style={{ color: '#eb2f96' }}>{domain}</span></Title>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: 24 }}>
              <MetricCard 
                title="Total Backlinks" 
                value={formatNumber(data.total)} 
                icon={<Link2 size={24} />} 
                color="#eb2f96"
                delay={0.1}
              />
              <MetricCard 
                title="Referring Domains" 
                value={formatNumber(data.domains_num)} 
                icon={<Globe size={24} />} 
                color="#1890ff"
                delay={0.2}
              />
              <MetricCard 
                title="Referring IPs" 
                value={formatNumber(data.ips_num)} 
                icon={<Globe size={24} />} 
                color="#722ed1"
                delay={0.3}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <motion.div 
                className="semrush-chart-card" style={{ marginTop: 0 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="semrush-chart-header">
                  <h3 className="semrush-chart-title">Top Anchor Text</h3>
                  <Text type="secondary">Most common words linking to this domain</Text>
                </div>
                <div className="semrush-table-wrapper" style={{ background: 'var(--bg-secondary)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <Table 
                    dataSource={data.anchors || []}
                    rowKey="anchor"
                    columns={[
                      { title: 'Anchor Text', dataIndex: 'anchor', key: 'anchor', render: (val) => <Text strong>{val}</Text> },
                      { title: 'Backlinks', dataIndex: 'links', key: 'links', render: val => Number(val).toLocaleString(), align: 'right' },
                      { title: 'Domains', dataIndex: 'domains', key: 'domains', render: val => Number(val).toLocaleString(), align: 'right' },
                    ]}
                    pagination={false}
                    size="small"
                  />
                </div>
              </motion.div>

              <motion.div 
                className="semrush-chart-card" style={{ marginTop: 0 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <div className="semrush-chart-header">
                  <h3 className="semrush-chart-title">Referring Domains</h3>
                  <Text type="secondary">Top authoritative domains linking here</Text>
                </div>
                <div className="semrush-table-wrapper" style={{ background: 'var(--bg-secondary)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <Table 
                    dataSource={data.refDomains || []}
                    rowKey="domain"
                    columns={[
                      { title: 'Domain', dataIndex: 'domain', key: 'domain', render: (val) => <Text strong style={{ color: 'var(--accent-primary)' }}>{val}</Text> },
                      { 
                        title: 'Authority', 
                        dataIndex: 'authority', 
                        key: 'authority',
                        render: (val) => (
                          <Tag color={val > 50 ? 'gold' : val > 20 ? 'blue' : 'default'} icon={<Shield size={12} style={{ marginRight: 4 }} />}>
                            {val}
                          </Tag>
                        )
                      },
                      { title: 'Backlinks', dataIndex: 'links', key: 'links', render: val => Number(val).toLocaleString(), align: 'right' },
                    ]}
                    pagination={false}
                    size="small"
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : !error ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="semrush-empty-state"
          >
            <Link2 style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16, width: 48, height: 48 }} />
            <Title level={4} style={{ color: '#8c8c8c', margin: 0 }}>Backlink Analytics</Title>
            <Text type="secondary">Enter a domain above to audit its backlink profile.</Text>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default BacklinkAnalyticsTab;
