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
  const { project, projectData, setProjectData } = useOutletContext();
  const [loading, setLoading] = useState(false);
  const [geoData, setGeoData] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
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

  useEffect(() => {
    if (projectId) {
      fetchGeoData();
    }
  }, [projectId]);

  const fetchGeoData = async () => {
    try {
      setGeoLoading(true);
      const res = await geoAeoApi.getDashboardData(projectId);
      if (res.data.success) {
        setGeoData(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch GEO data', error);
    } finally {
      setGeoLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      // Refresh both Semrush and AI scoring concurrently
      const [semrushRes, geoRes] = await Promise.all([
        semrushApi.refreshProject(projectId, 'us'),
        geoAeoApi.refreshScores(projectId)
      ]);

      if (semrushRes.data.success) {
        setProjectData(semrushRes.data.data);
      }
      
      if (geoRes.data.success) {
        // Fetch new historical trend after refresh
        fetchGeoData();
        message.success('Enterprise AI Dashboard refreshed successfully!');
      }
    } catch (error) {
      console.error(error);
      message.error('Failed to audit dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading || geoLoading) {
    return <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" tip="Running Enterprise AI Analysis..." /></div>;
  }

  const currentScore = geoData?.current || {};
  const prevScore = geoData?.previous || {};

  return (
    <div className="semrush-dashboard-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, padding: '0 12px' }}>
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 800 }}>AI Optimization Intelligence</Title>
          <Text type="secondary">Enterprise SEO, GEO, and AEO tracking and analysis.</Text>
        </div>
        <Button type="primary" icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading} style={{ borderRadius: 8, fontWeight: 600, background: 'var(--text-primary)', color: 'var(--bg-primary)' }}>
          Refresh AI Analysis
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
                  score={currentScore.overallScore} 
                  previousScore={prevScore.overallScore} 
                  color="var(--accent-primary)"
                  description="Combined SEO, GEO, and AEO performance metric."
                  delay={0.1}
                  details={[
                    { label: 'Technical SEO', value: currentScore.seoScore, color: 'var(--accent-secondary)' },
                    { label: 'Generative Engine', value: currentScore.geoScore, color: 'var(--accent-warning)' },
                    { label: 'Answer Engine', value: currentScore.aeoScore, color: 'var(--accent-info)' }
                  ]}
                />
              </Col>
              <Col xs={24} md={12} xl={6}>
                <ScoreGaugeCard 
                  title="SEO Score" 
                  score={currentScore.seoScore} 
                  previousScore={prevScore.seoScore} 
                  color="var(--accent-secondary)"
                  description="Traditional Search Engine Optimization score based on authority and technical health."
                  delay={0.2}
                  details={[
                    { label: 'Authority Score', value: currentScore.seoMetrics?.authorityScore },
                    { label: 'Technical Health', value: currentScore.seoMetrics?.technicalScore },
                    { label: 'Core Web Vitals', value: currentScore.seoMetrics?.coreWebVitals }
                  ]}
                />
              </Col>
              <Col xs={24} md={12} xl={6}>
                <ScoreGaugeCard 
                  title="GEO Score" 
                  score={currentScore.geoScore} 
                  previousScore={prevScore.geoScore} 
                  color="var(--accent-warning)"
                  description="Generative Engine Optimization: Entity coverage, LLM formatting, and topical authority."
                  delay={0.3}
                  details={[
                    { label: 'E-E-A-T Signals', value: currentScore.geoMetrics?.eeatSignals },
                    { label: 'Topical Authority', value: currentScore.geoMetrics?.topicalAuthority },
                    { label: 'Semantic Coverage', value: currentScore.geoMetrics?.semanticCoverage },
                    { label: 'LLM Formatting', value: currentScore.geoMetrics?.llmFormatting }
                  ]}
                />
              </Col>
              <Col xs={24} md={12} xl={6}>
                <ScoreGaugeCard 
                  title="AEO Score" 
                  score={currentScore.aeoScore} 
                  previousScore={prevScore.aeoScore} 
                  color="var(--accent-info)"
                  description="Answer Engine Optimization: Voice search, FAQ schema, and direct answer quality."
                  delay={0.4}
                  details={[
                    { label: 'Answer Intent', value: currentScore.aeoMetrics?.answerIntent },
                    { label: 'Voice Search', value: currentScore.aeoMetrics?.voiceSearchScore },
                    { label: 'FAQ Schema', value: currentScore.aeoMetrics?.faqSchema },
                    { label: 'Conversational', value: currentScore.aeoMetrics?.conversationalContent }
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
                <div style={{ height: 350, width: '100%', padding: '20px 0' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={geoData?.trend || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <RechartsTooltip />
                      <Area type="monotone" name="Overall" dataKey="overallScore" stroke="var(--accent-primary)" fillOpacity={0.1} fill="var(--accent-primary)" />
                      <Area type="monotone" name="GEO" dataKey="geoScore" stroke="var(--accent-warning)" fillOpacity={0} />
                      <Area type="monotone" name="AEO" dataKey="aeoScore" stroke="var(--accent-info)" fillOpacity={0} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

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
