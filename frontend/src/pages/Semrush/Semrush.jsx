import React, { useState, useEffect } from 'react';
import { Typography, Tabs, Button, Select, Space, Badge, message, Spin } from 'antd';
import { ShareAltOutlined, ReloadOutlined, ExportOutlined, EllipsisOutlined } from '@ant-design/icons';
import { useParams, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { semrushApi } from '../../api/semrushApi';
import './components/DashboardTab.css';

const { Title, Text } = Typography;
const { Option } = Select;

const Semrush = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [selectedDatabase, setSelectedDatabase] = useState('us');

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  useEffect(() => {
    // Update active tab based on current route
    const path = location.pathname;
    if (path.includes('/domain-overview')) setActiveTab('domain-overview');
    else if (path.includes('/keyword-research')) setActiveTab('keyword-research');
    else if (path.includes('/backlinks')) setActiveTab('backlinks');
    else if (path.includes('/organic-keywords')) setActiveTab('organic-keywords');
    else if (path.includes('/site-health')) setActiveTab('site-health');
    else setActiveTab('dashboard');
  }, [location]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const res = await semrushApi.getProject(projectId);
      if (res.data.success) {
        setProject(res.data.project);
        setProjectData(res.data.data);
      }
    } catch (error) {
      console.error(error);
      message.error('Failed to load project data');
      navigate('/intelligence/semrush');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const res = await semrushApi.refreshProject(projectId, selectedDatabase.toLowerCase());
      if (res.data.success) {
        message.success('Project data refreshed successfully');
        setProject(res.data.project);
        setProjectData(res.data.data);
      }
    } catch (error) {
      console.error(error);
      message.error('Failed to refresh project data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDatabaseChange = async (val) => {
    setSelectedDatabase(val);
    try {
      setRefreshing(true);
      const res = await semrushApi.refreshProject(projectId, val.toLowerCase());
      if (res.data.success) {
        message.success(`Data updated for ${val.toUpperCase()} database`);
        setProject(res.data.project);
        setProjectData(res.data.data);
      }
    } catch (error) {
      console.error(error);
      message.error('Failed to update database');
    } finally {
      setRefreshing(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    message.success('Dashboard link copied to clipboard!');
  };

  const handleExport = () => {
    window.print();
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    if (key === 'dashboard') navigate(`/intelligence/semrush/${projectId}`);
    else navigate(`/intelligence/semrush/${projectId}/${key}`);
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' }}>
        <Spin size="large" tip="Loading project workspace..." />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="semrush-workspace-container">
      {/* Premium Header */}
      <div className="semrush-header-container">
        <div className="semrush-header-top">
          <div className="semrush-domain-info">
            <div className="semrush-domain-icon-box">
              <span style={{ fontSize: '28px' }}>🌐</span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <h1 className="semrush-domain-name">
                  {project.domain}
                </h1>
                <Badge status="success" text="Active" style={{ background: 'var(--bg-secondary)', padding: '4px 10px', borderRadius: '20px', border: '1px solid var(--border-color)', fontWeight: 600, fontSize: '12px' }} />
              </div>
              <div className="semrush-domain-meta">
                <span style={{ fontWeight: 600 }}>{project.name}</span>
                <span>•</span>
                <span>Last updated: {project.lastRefresh ? new Date(project.lastRefresh).toLocaleString() : 'Never'}</span>
              </div>
            </div>
          </div>
          
          <div className="semrush-header-actions">

            <Button type="text" icon={<ShareAltOutlined />} style={{ fontWeight: 500 }} onClick={handleShare}>Share</Button>
            <Button type="text" icon={<ExportOutlined />} style={{ fontWeight: 500 }} onClick={handleExport}>Export</Button>
            <Button type="primary" icon={<ReloadOutlined />} onClick={handleRefresh} loading={refreshing} style={{ borderRadius: '8px', fontWeight: 600, boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)' }}>
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="semrush-premium-tabs">
          <Tabs 
            activeKey={activeTab} 
            onChange={handleTabChange}
            items={[
              { key: 'dashboard', label: 'Dashboard' },
              { key: 'domain-overview', label: 'Domain Overview' },
              { key: 'organic-keywords', label: 'Organic Keywords' },
              { key: 'backlinks', label: 'Backlink Analytics' },
              { key: 'position-tracking', label: 'Position Tracking' },
              { key: 'site-health', label: 'Site Health' },
            ]}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="semrush-content-area">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet context={{ project, projectData }} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Semrush;
