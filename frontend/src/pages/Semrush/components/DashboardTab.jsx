import React, { useEffect, useState } from 'react';
import { Typography, Row, Col, Progress, Divider, Button, message, Spin, Table, Tag } from 'antd';
import { Trophy, TrendingUp, Globe, Link as LinkIcon, AlertCircle, CheckCircle2, Zap, LayoutDashboard, Share2, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { ReloadOutlined } from '@ant-design/icons';
import { semrushApi } from '../../../api/semrushApi';
import { geoAeoApi } from '../../../api/geoAeoApi';
import ScoreGaugeCard from '../../SEO/components/ScoreGaugeCard';
import RecommendationsTable from '../../SEO/components/RecommendationsTable';
import './DashboardTab.css';

const { Title, Text } = Typography;

const DashboardTab = () => {
  const { projectId } = useParams();
  const { project, projectData, triggerRefresh } = useOutletContext();
  const navigate = useNavigate();

  const domain = project?.domain;
  const data = projectData?.overview || {};
  const backlinks = projectData?.backlinksOverview || {};
  const health = projectData?.siteHealth || {};
  const keywords = projectData?.organicKeywords || [];

  const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return 'Unavailable';
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

  useEffect(() => {
    // Rely exclusively on projectData from Outlet
  }, [projectId]);

  const isRefreshing = projectData?.activeJob && ['QUEUED', 'RUNNING'].includes(projectData.activeJob.status);

  const currentScore = projectData?.snapshot?.scores || { overall: null, seo: null, geo: null, aeo: null };
  const prevScore = {}; // Semrush snapshot doesn't track diffs natively yet without time-series queries

  return (
    <div className="semrush-dashboard-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, padding: '0 12px' }}>
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 800 }}>AI Optimization Intelligence</Title>
          <Text type="secondary">Enterprise SEO, GEO, and AEO tracking and analysis.</Text>
        </div>
        <Button type="primary" icon={<ReloadOutlined spin={isRefreshing} />} onClick={triggerRefresh} loading={isRefreshing} style={{ borderRadius: 8, fontWeight: 600, background: 'var(--text-primary)', color: 'var(--bg-primary)' }}>
          {isRefreshing ? 'Analyzing...' : 'Refresh AI Analysis'}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {projectData && currentScore ? (
          <motion.div 
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Enterprise Score Cards */}
            <Row gutter={[24, 24]} style={{ marginBottom: 24, alignItems: 'stretch' }}>
              <Col xs={24} md={12} xl={6}>
                <ScoreGaugeCard 
                  title="Overall Optimization" 
                  score={currentScore.overall} 
                  previousScore={null} 
                  color="var(--accent-primary)"
                  description="Combined SEO, GEO, and AEO performance metric."
                  delay={0.1}
                  details={[
                    { label: 'Technical SEO', value: currentScore.seo, color: 'var(--accent-secondary)' },
                    { label: 'Generative Engine', value: currentScore.geo, color: 'var(--accent-warning)' },
                    { label: 'Answer Engine', value: currentScore.aeo, color: 'var(--accent-info)' }
                  ]}
                />
              </Col>
              <Col xs={24} md={12} xl={6}>
                <ScoreGaugeCard 
                  title="SEO Score" 
                  score={currentScore.seo} 
                  previousScore={null} 
                  color="var(--accent-secondary)"
                  description="Traditional Search Engine Optimization score based on authority and technical health."
                  delay={0.2}
                  details={[
                    { label: 'Authority Score', ...(projectData?.snapshot?.seo?.authorityScore || {}) },
                    { label: 'Technical Health', ...(projectData?.snapshot?.seo?.technicalScore || {}) },
                    { label: 'Core Web Vitals', ...(projectData?.snapshot?.seo?.coreWebVitals || {}) }
                  ]}
                />
              </Col>
              <Col xs={24} md={12} xl={6}>
                <ScoreGaugeCard 
                  title="GEO Score" 
                  score={currentScore.geo} 
                  previousScore={null} 
                  color="var(--accent-warning)"
                  description="Generative Engine Optimization readiness for AI summaries."
                  delay={0.3}
                  details={[
                    { label: 'E-E-A-T Signals', ...(projectData?.snapshot?.geo?.eeatSignals || {}) },
                    { label: 'AI Readability', ...(projectData?.snapshot?.geo?.aiReadability || {}) },
                    { label: 'LLM Formatting', ...(projectData?.snapshot?.geo?.llmFormatting || {}) }
                  ]}
                />
              </Col>
              <Col xs={24} md={12} xl={6}>
                <ScoreGaugeCard 
                  title="AEO Score" 
                  score={currentScore.aeo} 
                  previousScore={null} 
                  color="var(--accent-info)"
                  description="Answer Engine Optimization for voice and direct answers."
                  delay={0.4}
                  details={[
                    { label: 'Answer Intent', ...(projectData?.snapshot?.aeo?.answerIntent || {}) },
                    { label: 'Conversational', ...(projectData?.snapshot?.aeo?.conversationalContent || {}) },
                    { label: 'FAQ Schema', ...(projectData?.snapshot?.aeo?.faqSchema || {}) }
                  ]}
                />
              </Col>
            </Row>

            <div className="semrush-masonry-grid" style={{ marginBottom: 24 }}>
              {/* Historical Trend */}
              <div className="col-span-12 semrush-widget-card" style={{ height: 'auto' }}>
                <div className="semrush-widget-header">
                  <h3 className="semrush-widget-title"><TrendingUp size={18} /> Historical Optimization Trend</h3>
                </div>
                <div style={{ height: 300, width: '100%' }}>
                {projectData?.overview?.trend && projectData.overview.trend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projectData.overview.trend} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} dx={-10} domain={[0, 'auto']} />
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Area type="monotone" dataKey="traffic" stroke="var(--accent-primary)" name="Organic Traffic" strokeWidth={2} fillOpacity={1} fill="url(#colorOverall)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                    No historical trend data available from Semrush
                  </div>
                )}
              </div>            </div>

              {/* AI Recommendations */}
              <div className="col-span-12" style={{ height: '100%' }}>
                <RecommendationsTable recommendations={currentScore.recommendations} />
              </div>
            </div>

            {/* Legacy Dashboard Grid */}
            <div className="semrush-masonry-grid">
              {/* SEO Scope */}
              <div className="col-span-4 semrush-widget-card">
                <div className="semrush-widget-header">
                  <h3 className="semrush-widget-title"><Search size={18} /> SEO Scope</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 12px' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Authority Score</Text>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{backlinks.score ?? data['Rank'] ?? <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Unavailable</span>}</div>
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
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-primary)' }}>{formatNumber(backlinks.domains_num)}</div>
                  </div>
                </div>
              </div>

              {/* Site Audit */}
              <div className="col-span-4 semrush-widget-card">
                <div className="semrush-widget-header">
                  <h3 className="semrush-widget-title"><AlertCircle size={18} /> Site Audit</h3>
                  <Text type="secondary" style={{ fontSize: 12 }}>Health</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '100%' }}>
                  <div style={{ position: 'relative', width: 120, height: 120 }}>
                    <Progress 
                      type="circle" 
                      percent={typeof health.overallScore === 'number' ? health.overallScore : 0} 
                      strokeColor={getHealthColor(typeof health.overallScore === 'number' ? health.overallScore : 0)}
                      width={120}
                      format={() => <span style={{ fontSize: 24, fontWeight: 800, color: getHealthColor(typeof health.overallScore === 'number' ? health.overallScore : 0) }}>{typeof health.overallScore === 'number' ? `${health.overallScore}%` : 'Unavailable'}</span>}
                    />
                  </div>
                  <div>
                    <div style={{ marginBottom: 12 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Errors</Text>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#f5222d' }}>{health.rawData?.errors ? health.rawData.errors.reduce((acc, curr) => acc + curr.count, 0) : 'Unavailable'}</div>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>Warnings</Text>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#faad14' }}>{health.rawData?.warnings ? health.rawData.warnings.reduce((acc, curr) => acc + curr.count, 0) : 'Unavailable'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-4 semrush-widget-card">
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
            <Text type="secondary">Click the 'Refresh AI Analysis' button above to fetch the latest insights.</Text>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardTab;
