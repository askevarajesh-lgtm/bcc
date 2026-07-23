import React, { useState } from 'react';
import { Input, Button, Spin, Typography, Alert } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { Trophy, TrendingUp, Globe, MousePointerClick, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { semrushApi } from '../../../api/semrushApi';
import './DashboardTab.css';

const { Title, Text } = Typography;

const DashboardTab = () => {
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
      const result = await semrushApi.getDomainOverview(domain);
      
      if (result && result.length > 0) {
          setData(result[0]);
      } else {
          setError('No data found for this domain.');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
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

  const MetricCard = ({ title, value, icon, color, trend, delay }) => (
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
        <div className={`metric-trend ${trend > 0 ? 'trend-up' : 'trend-down'}`}>
          {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend)}% vs last month
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
            placeholder="Enter domain (e.g., example.com)" 
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
            Analyze
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
            <div style={{ marginTop: 16, color: '#8c8c8c', fontWeight: 500 }}>Analyzing domain footprint...</div>
          </motion.div>
        ) : data ? (
          <motion.div 
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 24 }}>
              <Title level={3} style={{ margin: 0 }}>Overview for <span style={{ color: '#1890ff' }}>{domain}</span></Title>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
              <MetricCard 
                title="Authority Score" 
                value={data.As || data.score || '-'} 
                icon={<Trophy size={24} />} 
                color="#faad14"
                delay={0.1}
              />
              <MetricCard 
                title="Organic Traffic" 
                value={formatNumber(data.Ot)} 
                icon={<TrendingUp size={24} />} 
                color="#52c41a"
                delay={0.2}
              />
              <MetricCard 
                title="Organic Keywords" 
                value={formatNumber(data.Or)} 
                icon={<Globe size={24} />} 
                color="#1890ff"
                delay={0.3}
              />
              <MetricCard 
                title="Ad Traffic" 
                value={formatNumber(data.At)} 
                icon={<MousePointerClick size={24} />} 
                color="#722ed1"
                delay={0.4}
              />
            </div>
            
            {data.trend && data.trend.length > 0 && (
              <motion.div 
                className="semrush-chart-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <div className="semrush-chart-header">
                  <h3 className="semrush-chart-title">Organic Traffic Trend</h3>
                  <Text type="secondary">Estimated monthly traffic over time</Text>
                </div>
                <div style={{ height: 320, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1890ff" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#1890ff" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#8c8c8c', fontSize: 12 }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#8c8c8c', fontSize: 12 }}
                        tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
                        dx={-10}
                      />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value) => [value.toLocaleString(), 'Traffic']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="traffic" 
                        stroke="#1890ff" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorTraffic)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : !error ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="semrush-empty-state"
          >
            <SearchOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
            <Title level={4} style={{ color: '#8c8c8c', margin: 0 }}>Discover SEO insights</Title>
            <Text type="secondary">Enter a domain above to analyze its digital footprint and authority.</Text>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default DashboardTab;
