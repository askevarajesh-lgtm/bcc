import React, { useState } from 'react';
import { Input, Button, Spin, Typography, Alert } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { Trophy, TrendingUp, Globe, Link as LinkIcon, DollarSign, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { semrushApi } from '../../../api/semrushApi';
import './DashboardTab.css'; 

const { Title, Text } = Typography;

const DomainOverviewTab = () => {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [backlinksData, setBacklinksData] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!domain) return;
    
    setLoading(true);
    setData(null);
    setBacklinksData(null);
    setError(null);

    try {
      const [overviewResult, backlinksResult] = await Promise.all([
        semrushApi.getDomainOverview(domain),
        semrushApi.getBacklinksOverview(domain)
      ]);
      
      let hasRealData = false;

      if (overviewResult && overviewResult.length > 0) {
          setData(overviewResult[0]);
          hasRealData = true;
      }

      if (backlinksResult && backlinksResult.length > 0) {
          setBacklinksData(backlinksResult[0]);
          hasRealData = true;
      }

      if (!hasRealData) {
          setError('No data found for this domain.');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch domain overview data.');
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

  const MetricCard = ({ title, value, icon, color, delay }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="semrush-metric-card"
      style={{ '--card-accent': color, '--icon-bg': `${color}15`, minHeight: '140px' }}
    >
      <div className="metric-card-header">
        <h3 className="metric-card-title">{title}</h3>
        <div className="metric-icon-wrapper">
          {icon}
        </div>
      </div>
      <div className="metric-value">{value}</div>
    </motion.div>
  );

  const pieData = backlinksData ? [
    { name: 'Follow', value: Number(backlinksData.follows_num || 0), color: '#52c41a' },
    { name: 'Nofollow', value: Number(backlinksData.nofollows_num || 0), color: '#faad14' }
  ].filter(d => d.value > 0) : [];

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
            placeholder="Enter domain (e.g., apple.com)" 
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
            Deep Dive
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
            <div style={{ marginTop: 16, color: '#8c8c8c', fontWeight: 500 }}>Running deep domain analysis...</div>
          </motion.div>
        ) : (data || backlinksData) ? (
          <motion.div 
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 24 }}>
              <Title level={3} style={{ margin: 0 }}>Deep Analysis for <span style={{ color: '#722ed1' }}>{domain}</span></Title>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              <MetricCard 
                title="Authority Score" 
                value={backlinksData?.score || data?.As || '-'} 
                icon={<Trophy size={24} />} 
                color="#faad14"
                delay={0.1}
              />
              <MetricCard 
                title="Organic Traffic" 
                value={formatNumber(data?.Ot)} 
                icon={<TrendingUp size={24} />} 
                color="#52c41a"
                delay={0.2}
              />
              <MetricCard 
                title="Organic Keywords" 
                value={formatNumber(data?.Or)} 
                icon={<Globe size={24} />} 
                color="#1890ff"
                delay={0.3}
              />
              <MetricCard 
                title="Total Backlinks" 
                value={formatNumber(backlinksData?.total)} 
                icon={<LinkIcon size={24} />} 
                color="#eb2f96"
                delay={0.4}
              />
              <MetricCard 
                title="Referring Domains" 
                value={formatNumber(backlinksData?.domains_num)} 
                icon={<Activity size={24} />} 
                color="#13c2c2"
                delay={0.5}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {pieData.length > 0 && (
                <motion.div 
                  className="semrush-chart-card" style={{ marginTop: 0 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <div className="semrush-chart-header">
                    <h3 className="semrush-chart-title">Backlink Profile</h3>
                    <Text type="secondary">Follow vs Nofollow ratio</Text>
                  </div>
                  <div style={{ height: 260, display: 'flex', alignItems: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(val) => val.toLocaleString()} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ paddingRight: 40 }}>
                      {pieData.map(item => (
                        <div key={item.name} style={{ marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: item.color }}></div>
                              <Text type="secondary">{item.name}</Text>
                          </div>
                          <Title level={4} style={{ margin: 0 }}>{formatNumber(item.value)}</Title>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {data?.Oc !== undefined && (
                <motion.div 
                  className="semrush-chart-card" style={{ marginTop: 0 }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <div className="semrush-chart-header">
                    <h3 className="semrush-chart-title">Traffic Value Insights</h3>
                    <Text type="secondary">Estimated cost of organic traffic in Google Ads</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    <div style={{ width: '100%', padding: '20px', background: 'rgba(82, 196, 26, 0.05)', borderRadius: 12, border: '1px solid rgba(82, 196, 26, 0.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                        <div style={{ background: '#52c41a', color: 'white', padding: 12, borderRadius: 12 }}>
                          <DollarSign size={32} />
                        </div>
                        <div>
                          <Text type="secondary" style={{ fontSize: 16 }}>Organic Traffic Cost</Text>
                          <Title level={2} style={{ margin: 0, color: '#52c41a' }}>
                            ${formatNumber(data?.Oc)}
                          </Title>
                        </div>
                      </div>
                      <Text type="secondary">
                        This domain would need to spend approximately <b>${formatNumber(data?.Oc)}</b> per month in Google Ads to acquire the same number of visitors it currently gets organically.
                      </Text>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            
          </motion.div>
        ) : !error ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="semrush-empty-state"
          >
            <Globe style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16, width: 48, height: 48 }} />
            <Title level={4} style={{ color: '#8c8c8c', margin: 0 }}>Deep Domain Analysis</Title>
            <Text type="secondary">Enter a domain above to view its comprehensive SEO overview and backlink profile.</Text>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default DomainOverviewTab;
