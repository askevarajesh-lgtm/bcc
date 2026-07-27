import React from 'react';
import { Typography, Table, Tag, Progress, Divider } from 'antd';
import { Trophy, TrendingUp, Globe, Link as LinkIcon, AlertCircle, CheckCircle2, Zap, LayoutDashboard, Share2, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useOutletContext, useNavigate } from 'react-router-dom';
import './DashboardTab.css';

const { Title, Text } = Typography;

const DashboardTab = () => {
  const { project, projectData } = useOutletContext();
  const navigate = useNavigate();
  const domain = project?.domain;
  const data = projectData?.overview || {};
  const backlinks = projectData?.backlinksOverview || {};
  const health = projectData?.siteHealth || {};
  const keywords = projectData?.organicKeywords || [];

  const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Number(num).toLocaleString();
  };

  const getHealthColor = (score) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#f5222d';
  };

  const topKeywords = keywords.slice(0, 3);
  const healthScore = health.score || 0;

  return (
    <div className="semrush-dashboard-container">
      <AnimatePresence mode="wait">
        {projectData ? (
          <motion.div 
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="semrush-masonry-grid">
              
              {/* Row 1: Search Intent & SEO Scope */}
              <div className="col-span-8 semrush-widget-card" style={{ background: 'linear-gradient(to right, #f9f0ff, #e6f7ff)' }}>
                <div className="semrush-widget-header" style={{ borderBottom: 'none' }}>
                  <h3 className="semrush-widget-title" style={{ color: '#722ed1' }}><Zap size={18} /> Search Intent Distribution</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 8 }}>
                  {(() => {
                    const intentCounts = { C: 0, I: 0, N: 0, T: 0 };
                    keywords.forEach(kw => {
                      if (kw.intent !== undefined && kw.intent !== null) {
                        const intents = String(kw.intent).split(',').map(Number);
                        if (intents.includes(0)) intentCounts.C++;
                        if (intents.includes(1)) intentCounts.I++;
                        if (intents.includes(2)) intentCounts.N++;
                        if (intents.includes(3)) intentCounts.T++;
                      }
                    });
                    const total = Math.max(1, keywords.length);
                    return (
                      <>
                        <div>
                          <Text type="secondary">Informational</Text>
                          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>{Math.round((intentCounts.I / total) * 100)}%</Title>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{intentCounts.I} keywords</div>
                        </div>
                        <div>
                          <Text type="secondary">Navigational</Text>
                          <Title level={2} style={{ margin: 0, color: '#722ed1' }}>{Math.round((intentCounts.N / total) * 100)}%</Title>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{intentCounts.N} keywords</div>
                        </div>
                        <div>
                          <Text type="secondary">Commercial</Text>
                          <Title level={2} style={{ margin: 0, color: '#faad14' }}>{Math.round((intentCounts.C / total) * 100)}%</Title>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{intentCounts.C} keywords</div>
                        </div>
                        <div>
                          <Text type="secondary">Transactional</Text>
                          <Title level={2} style={{ margin: 0, color: '#52c41a' }}>{Math.round((intentCounts.T / total) * 100)}%</Title>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{intentCounts.T} keywords</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="col-span-4 semrush-widget-card">
                <div className="semrush-widget-header">
                  <h3 className="semrush-widget-title"><Search size={18} /> SEO Scope</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 12px' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Authority Score</Text>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{backlinks.score || data['Rank'] || '0'}</div>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Organic Traffic</Text>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#52c41a' }}>{formatNumber(data['Organic Traffic'])}</div>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Paid Keywords</Text>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{formatNumber(data['Adwords Traffic'])}</div>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Ref. Domains</Text>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#1890ff' }}>{formatNumber(backlinks.domains_num)}</div>
                  </div>
                </div>
              </div>

              {/* Row 2: Position Tracking & Site Audit */}
              <div className="col-span-8 semrush-widget-card">
                <div className="semrush-widget-header">
                  <h3 className="semrush-widget-title"><TrendingUp size={18} /> Position Tracking</h3>
                  <a style={{ fontSize: 12 }} onClick={() => navigate(`/intelligence/semrush/${project._id}/organic-keywords`)}>View all</a>
                </div>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div style={{ flex: 1 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Visibility Index</Text>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#1890ff', marginBottom: 16 }}>
                      {Math.min(100, (data['Organic Traffic'] / Math.max(1, (data['Organic Traffic'] + 1000))) * 100).toFixed(1)}%
                    </div>
                    {data.trend && data.trend.length > 0 ? (
                      <div style={{ height: 120, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={data.trend}>
                            <Area type="monotone" dataKey="traffic" stroke="#1890ff" strokeWidth={2} fillOpacity={0.1} fill="#1890ff" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div style={{ height: 120, background: '#f5f5f5', borderRadius: 8 }} />
                    )}
                  </div>
                  <Divider type="vertical" style={{ height: 'auto' }} />
                  <div style={{ flex: 1.5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Top Keywords</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>Pos</Text>
                    </div>
                    {topKeywords.map((kw, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <Text strong style={{ color: '#1890ff', fontSize: 13, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '70%' }}>{kw.keyword}</Text>
                        <Tag color={kw.position <= 3 ? 'green' : 'blue'} style={{ margin: 0 }}>{kw.position}</Tag>
                      </div>
                    ))}
                    {topKeywords.length === 0 && <Text type="secondary">No keywords tracked</Text>}
                  </div>
                </div>
              </div>

              <div className="col-span-4 semrush-widget-card">
                <div className="semrush-widget-header">
                  <h3 className="semrush-widget-title"><AlertCircle size={18} /> Site Audit</h3>
                  <Text type="secondary" style={{ fontSize: 12 }}>Health</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '100%' }}>
                  <div style={{ position: 'relative', width: 120, height: 120 }}>
                    <Progress 
                      type="circle" 
                      percent={health.overallScore || 0} 
                      strokeColor={getHealthColor(health.overallScore || 0)}
                      width={120}
                      format={percent => <span style={{ fontSize: 24, fontWeight: 800, color: getHealthColor(health.overallScore || 0) }}>{percent}%</span>}
                    />
                  </div>
                  <div>
                    <div style={{ marginBottom: 12 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Errors/Weaknesses</Text>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#f5222d' }}>{health.insights?.weaknesses?.length || 0}</div>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>Passed/Strengths</Text>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>{health.insights?.strengths?.length || 0}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Organic Rankings & Backlinks */}
              <div className="col-span-6 semrush-widget-card">
                <div className="semrush-widget-header">
                  <h3 className="semrush-widget-title"><Globe size={18} /> Organic Rankings (Pos Distribution)</h3>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Total Keywords</Text>
                    <div style={{ fontSize: 24, fontWeight: 800 }}>{formatNumber(data['Organic Keywords'])}</div>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Traffic Cost</Text>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#52c41a' }}>${formatNumber(data['Organic Cost'])}</div>
                  </div>
                </div>
                <div style={{ height: 80, display: 'flex', gap: 4, alignItems: 'flex-end' }}>
                  {(() => {
                    // Calculate real position distribution from live keywords
                    const dist = { '1-3': 0, '4-10': 0, '11-20': 0, '21-50': 0, '51+': 0 };
                    keywords.forEach(kw => {
                      const p = Number(kw.position);
                      if (p <= 3) dist['1-3']++;
                      else if (p <= 10) dist['4-10']++;
                      else if (p <= 20) dist['11-20']++;
                      else if (p <= 50) dist['21-50']++;
                      else dist['51+']++;
                    });
                    
                    const maxCount = Math.max(1, ...Object.values(dist));
                    
                    return Object.entries(dist).map(([label, count], i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                        <div style={{ width: '100%', height: `${(count / maxCount) * 100}%`, background: '#1890ff', borderRadius: '4px 4px 0 0', minHeight: 4, transition: 'height 0.5s ease' }} />
                        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 600 }}>{label}</div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              <div className="col-span-6 semrush-widget-card">
                <div className="semrush-widget-header">
                  <h3 className="semrush-widget-title"><LinkIcon size={18} /> Backlinks Analytics</h3>
                </div>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Referring Domains</Text>
                    <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>{formatNumber(backlinks.domains_num)}</div>
                    
                    <Text type="secondary" style={{ fontSize: 12 }}>Total Backlinks</Text>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{formatNumber(backlinks.total)}</div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#52c41a', fontWeight: 600 }}>Follow</span>
                      <span style={{ color: '#faad14', fontWeight: 600 }}>Nofollow</span>
                    </div>
                    <div style={{ height: 8, display: 'flex', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${(backlinks.follows_num / Math.max(1, backlinks.total)) * 100}%`, background: '#52c41a' }} />
                      <div style={{ flex: 1, background: '#faad14' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)' }}>
                      <span>{formatNumber(backlinks.follows_num)}</span>
                      <span>{formatNumber(backlinks.nofollows_num)}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="semrush-empty-state"
          >
            <Title level={4} style={{ color: '#8c8c8c', margin: 0 }}>No Data Available</Title>
            <Text type="secondary">Click the 'Refresh Data' button to fetch the latest insights from Semrush.</Text>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardTab;
