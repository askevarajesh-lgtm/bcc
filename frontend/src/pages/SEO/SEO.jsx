import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Button, Avatar, Select, Spin, message } from 'antd';
import axios from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Play, Search, MessageSquare, Sparkles, Target } from 'lucide-react';
import SEOTab from './tabs/SEOTab';
import AEOTab from './tabs/AEOTab';
import GEOTab from './tabs/GEOTab';

const { Title, Text } = Typography;

const SEO = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workspaceData, setWorkspaceData] = useState({ audits: [], keywords: [], strategies: [] });
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchWorkspaceData();
  }, []);

  const fetchWorkspaceData = async () => {
    try {
      setLoading(true);
      const [projectsRes, auditsRes, keywordsRes, strategiesRes] = await Promise.all([
        axios.get('/seo-workspace/projects'),
        axios.get('/seo-workspace/audits'),
        axios.get('/seo-workspace/keywords'),
        axios.get('/seo-workspace/strategies')
      ]);
      const fetchedProjects = projectsRes.data.data || [];
      setProjects(fetchedProjects);
      setWorkspaceData({
        audits: auditsRes.data || [],
        keywords: keywordsRes.data || [],
        strategies: strategiesRes.data || []
      });
      if (fetchedProjects.length > 0) {
        setSelectedProjectId(fetchedProjects[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch workspace data', error);
      message.error('Failed to load SEO workspace data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchAnalytics(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchAnalytics = async (projectId) => {
    try {
      const res = await axios.get(`/seo-workspace/projects/${projectId}/analytics`);
      setAnalytics(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const selectedProject = projects.find(p => p._id === selectedProjectId);
  const projectAudits = workspaceData.audits.filter(a => (a.projectId?._id || a.projectId) === selectedProjectId);
  const projectKeywords = workspaceData.keywords.filter(k => (k.projectId?._id || k.projectId) === selectedProjectId);
  const projectStrategies = workspaceData.strategies.filter(s => (s.projectId?._id || s.projectId) === selectedProjectId);

  const latestAudit = projectAudits.length > 0 ? projectAudits[0] : null;
  const seoScore = latestAudit?.summary?.score || latestAudit?.metrics?.performance || 0;
  const aeoScore = analytics?.aeoScore || 0;
  const geoScore = analytics?.geoVisibilityScore || 0;
  const unifiedScore = analytics?.unifiedScore || Math.round((seoScore + aeoScore + geoScore) / 3) || 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  const renderTabContent = () => {
    if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>;
    if (!selectedProject) return <div style={{ textAlign: 'center', padding: 40 }}>No SEO projects found.</div>;

    const commonProps = {
      itemVariants,
      project: selectedProject,
      analytics,
      audits: projectAudits,
      keywords: projectKeywords,
      strategies: projectStrategies
    };

    switch (activeTab) {
      case 0: return <SEOTab {...commonProps} />;
      case 1: return <AEOTab {...commonProps} />;
      case 2: return <GEOTab {...commonProps} />;
      case 3: return <SEOTab {...commonProps} />; // Placeholder for Unified Search
      default: return <SEOTab {...commonProps} />;
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>

          <Title level={2} style={{ margin: '4px 0 0 0', fontWeight: 800 }}>SEO / AEO / GEO</Title>
          <Text type="secondary">Search - Answer Engine - Generative Engine — unified in one view.</Text>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Select 
              value={selectedProjectId}
              onChange={val => setSelectedProjectId(val)}
              style={{ width: 250 }}
              options={projects.map(p => ({ label: p.name, value: p._id }))}
              placeholder="Select Project"
              loading={loading}
            />
          </div>
        </div>
      </motion.div>

      {/* NEW INNER GLOW AURA CARDS / TABS */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { label: 'SEO', title: 'SEO HEALTH', val: seoScore, sub: '', color: 'var(--accent-secondary)', icon: <Search size={24} />, glowPos: 'top-left', subText: 'Search Engine Optimisation' },
          { label: 'AEO', title: 'ANSWER ENGINE', val: aeoScore, sub: '', color: 'var(--accent-primary)', icon: <MessageSquare size={24} />, glowPos: 'bottom-right', subText: 'Answer Engine Optimisation' },
          { label: 'GEO', title: 'GENERATIVE ENGINE', val: geoScore, sub: '', color: 'var(--accent-info)', icon: <Sparkles size={24} />, glowPos: 'top-right', subText: 'Generative Engine Optimisation' },
          { label: 'UNIFIED SEARCH', title: 'UNIFIED SEARCH', val: unifiedScore, sub: selectedProject ? `Avg. Unified Score` : 'No Project', color: 'var(--accent-warning)', icon: <Target size={24} />, glowPos: 'bottom-left', isOverall: true }
        ].map((kpi, i) => {
          const isActive = activeTab === i;
          return (
            <Col style={{ flex: '1 1 200px', minWidth: 200 }} key={i}>
              <motion.div variants={itemVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }} style={{ height: '100%', cursor: 'pointer' }} onClick={() => setActiveTab(i)}>
                <Card
                  bodyStyle={{ padding: 24, height: '100%' }}
                  style={{
                    borderRadius: 16,
                    background: isActive ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderBottom: isActive ? `3px solid ${kpi.color}` : '1px solid var(--border-color)',
                    boxShadow: isActive ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                    position: 'relative',
                    overflow: 'hidden',
                    height: '100%',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {/* Radial Glow Aura */}
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      top: kpi.glowPos.includes('top') ? '-20%' : 'auto',
                      bottom: kpi.glowPos.includes('bottom') ? '-20%' : 'auto',
                      left: kpi.glowPos.includes('left') ? '-20%' : 'auto',
                      right: kpi.glowPos.includes('right') ? '-20%' : 'auto',
                      width: '60%',
                      height: '60%',
                      background: `radial-gradient(circle, ${kpi.color} 0%, transparent 70%)`,
                      opacity: 0.15,
                      filter: 'blur(30px)',
                      pointerEvents: 'none'
                    }} />
                  )}

                  {kpi.isOverall ? (
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', height: '100%' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Text type="secondary" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5 }}>{kpi.title}</Text>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 16 }}>
                          <Title level={1} style={{ margin: 0, color: 'var(--text-primary)', fontSize: 40, fontWeight: 800 }}>{kpi.val}</Title>
                          <Text type="secondary" style={{ fontSize: 16, fontWeight: 500 }}>/100</Text>
                        </div>
                        <Text style={{ color: kpi.color, fontSize: 13, fontWeight: 600, marginTop: 8 }}>{kpi.sub}</Text>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', border: `4px solid ${kpi.color}`, color: kpi.color, fontSize: 24, fontWeight: 800 }}>
                        {kpi.val}
                      </div>
                    </div>
                  ) : (
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ color: isActive ? kpi.color : 'var(--text-tertiary)', background: isActive ? `${kpi.color}15` : 'var(--bg-tertiary)', padding: 12, borderRadius: 12, transition: 'all 0.3s ease' }}>
                          {kpi.icon}
                        </div>
                        <div>
                          <Text style={{ fontSize: 16, fontWeight: 800, color: isActive ? kpi.color : 'var(--text-primary)' }}>{kpi.label}</Text>
                          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{kpi.subText}</Text>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <Title level={2} style={{ margin: 0, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: 28, fontWeight: 800 }}>{kpi.val}</Title>
                        <Text type="secondary" style={{ fontSize: 11 }}>/100</Text>
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            </Col>
          );
        })}
      </Row>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
          {renderTabContent()}
        </motion.div>
      </AnimatePresence>

    </motion.div>
  );
};

export default SEO;
