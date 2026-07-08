import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Card, Button, Table, Modal, Form, Input, message, Spin, Tag, Select, Statistic, Switch, Tabs } from 'antd';
import { Search, Activity, FileText, CheckCircle, BarChart2, Plus, Globe, TrendingUp, Users, MousePointer2, Settings as SettingsIcon } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import './SEOWorkspace.css';
const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const SEOWorkspace = () => {
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [projects, setProjects] = useState([]);
  const [audits, setAudits] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [strategyModalVisible, setStrategyModalVisible] = useState(false);
  const [activeStrategy, setActiveStrategy] = useState(null);
  const [auditModalVisible, setAuditModalVisible] = useState(false);
  const [activeAudit, setActiveAudit] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedAnalyticsProject, setSelectedAnalyticsProject] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [selectedTaskProject, setSelectedTaskProject] = useState(null);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [reports, setReports] = useState([]);
  const [selectedReportProject, setSelectedReportProject] = useState(null);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [activeReport, setActiveReport] = useState(null);
  const [selectedSettingsProject, setSelectedSettingsProject] = useState(null);
  const [form] = Form.useForm();
  
  const fetchWorkspaceData = async () => {
    try {
      setLoading(true);
      const [projectsRes, auditsRes, keywordsRes, strategiesRes] = await Promise.all([
        axios.get('/api/seo-workspace/projects'),
        axios.get('/api/seo-workspace/audits'),
        axios.get('/api/seo-workspace/keywords'),
        axios.get('/api/seo-workspace/strategies')
      ]);
      setProjects(projectsRes.data.data || []);
      setAudits(auditsRes.data);
      setKeywords(keywordsRes.data);
      setStrategies(strategiesRes.data);
    } catch (error) {
      console.error('Failed to fetch workspace data', error);
      message.error('Failed to load SEO workspace data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, []);

  useEffect(() => {
    if (selectedAnalyticsProject && activeSubTab === 'analytics') {
      fetchAnalytics(selectedAnalyticsProject);
    }
  }, [selectedAnalyticsProject, activeSubTab]);

  const fetchAnalytics = async (projectId) => {
    try {
      setLoadingAnalytics(true);
      const res = await axios.get(`/api/seo-workspace/projects/${projectId}/analytics`);
      setAnalyticsData(res.data);
    } catch (error) {
      console.error(error);
      message.error('Failed to load analytics data');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (selectedTaskProject && activeSubTab === 'approvals') {
      fetchTasks(selectedTaskProject);
    }
  }, [selectedTaskProject, activeSubTab]);

  const fetchTasks = async (projectId) => {
    try {
      setLoadingTasks(true);
      const res = await axios.get(`/api/seo-workspace/projects/${projectId}/tasks`);
      setTasks(res.data);
    } catch (error) {
      console.error(error);
      message.error('Failed to load approval tasks');
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId, status) => {
    try {
      await axios.put(`/api/seo-workspace/projects/${selectedTaskProject}/tasks/${taskId}/status`, { status });
      message.success(`Task ${status} successfully`);
      fetchTasks(selectedTaskProject);
    } catch (error) {
      console.error(error);
      message.error(`Failed to ${status} task`);
    }
  };

  useEffect(() => {
    if (selectedReportProject && activeSubTab === 'reports') {
      fetchReports(selectedReportProject);
    }
  }, [selectedReportProject, activeSubTab]);

  const fetchReports = async (projectId) => {
    try {
      setLoadingReports(true);
      const res = await axios.get(`/api/seo-workspace/projects/${projectId}/reports`);
      setReports(res.data);
    } catch (error) {
      console.error(error);
      message.error('Failed to load reports');
    } finally {
      setLoadingReports(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedReportProject) return;
    try {
      setLoadingReports(true);
      message.loading({ content: 'AI is analyzing before/after audits...', key: 'report', duration: 0 });
      await axios.post(`/api/seo-workspace/projects/${selectedReportProject}/generate-report`);
      message.success({ content: 'Report generated successfully!', key: 'report' });
      fetchReports(selectedReportProject);
    } catch (error) {
      console.error(error);
      message.error({ content: error.response?.data?.error || 'Failed to generate report. Make sure you have at least 2 audits.', key: 'report' });
      setLoadingReports(false);
    }
  };

  const handleUpdateSettings = async (projectId, settings) => {
    try {
      await axios.put(`/api/seo-workspace/projects/${projectId}/settings`, { settings });
      message.success('Settings updated successfully');
      fetchWorkspaceData(); // Refresh project data to reflect new settings
    } catch (error) {
      console.error(error);
      message.error('Failed to update settings');
    }
  };

  const handleCreateProject = async (values) => {
    try {
      await axios.post('/api/seo-workspace/projects', {
        name: values.name,
        siteUrl: values.siteUrl,
        targets: {
          primary_keywords: [],
          competitors: [],
          location_code: 2840,
          language_code: "en"
        }
      });
      message.success('Project created successfully!');
      setIsModalVisible(false);
      form.resetFields();
      fetchWorkspaceData();
    } catch (error) {
      message.error('Failed to create project');
      console.error(error);
    }
  };

  const triggerAudit = async (projectId) => {
    try {
      setLoading(true);
      message.loading({ content: 'Running crawler...', key: 'audit' });
      await axios.post(`/api/seo-workspace/projects/${projectId}/audit`);
      message.success({ content: 'Audit completed successfully!', key: 'audit' });
      fetchWorkspaceData();
    } catch (error) {
      console.error('Audit failed:', error);
      message.error({ content: 'Failed to run audit.', key: 'audit' });
      setLoading(false);
    }
  };

  const triggerStrategy = async (projectId) => {
    try {
      setLoading(true);
      message.loading({ content: 'AI Agents are analyzing data and generating strategy...', key: 'strategy', duration: 0 });
      await axios.post(`/api/seo-workspace/projects/${projectId}/generate-strategy`);
      message.success({ content: 'Strategy generated successfully!', key: 'strategy' });
      fetchWorkspaceData();
    } catch (error) {
      console.error('Strategy generation failed:', error);
      message.error({ content: 'Failed to generate strategy.', key: 'strategy' });
      setLoading(false);
    }
  };

  const handlePublishStrategy = async () => {
    if (!activeStrategy) return;
    try {
      setLoading(true);
      message.loading({ content: 'Publishing to WordPress...', key: 'publish' });
      await axios.post(`/api/seo-workspace/projects/${activeStrategy.projectId?._id || activeStrategy.projectId}/strategies/${activeStrategy._id}/publish`);
      message.success({ content: 'Strategy published successfully to WordPress!', key: 'publish' });
      setStrategyModalVisible(false);
      fetchWorkspaceData();
    } catch (error) {
      console.error('Publish failed:', error);
      message.error({ content: 'Failed to publish strategy.', key: 'publish' });
      setLoading(false);
    }
  };

  // Tables Columns Configuration
  const projectColumns = [
    { title: 'Project Name', dataIndex: 'name', key: 'name', render: (text) => <strong>{text}</strong> },
    { title: 'Site URL', dataIndex: 'domain', key: 'domain', render: (text) => <a href={`https://${text}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)' }}>{text}</a> },
    { title: 'Phase', dataIndex: 'phase', key: 'phase', render: phase => <Tag color="blue">{phase.toUpperCase()}</Tag> },
    { title: 'Action', key: 'action', render: (_, record) => (
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button type="primary" size="small" onClick={() => triggerAudit(record._id)}>1. Audit</Button>
        <Button type="default" size="small" onClick={() => triggerStrategy(record._id)} disabled={record.phase === 'intake'}>2. Strategy</Button>
      </div>
    ) },
  ];

  const auditColumns = [
    { title: 'Project', dataIndex: ['projectId', 'name'], key: 'projectName', render: text => <strong>{text || 'Unknown Project'}</strong> },
    { title: 'Date', dataIndex: 'completedAt', key: 'completedAt', render: date => date ? new Date(date).toLocaleDateString() : 'N/A' },
    { title: 'URLs Crawled', dataIndex: ['metrics', 'pagesCrawled'], key: 'pagesCrawled' },
    { title: 'Performance', dataIndex: ['metrics', 'performance'], key: 'performance' },
    { title: 'On-Page SEO', dataIndex: ['metrics', 'onPage'], key: 'onPage' },
    { title: 'Action', key: 'action', render: (_, record) => (
      <Button type="link" onClick={() => {
        setActiveAudit(record);
        setAuditModalVisible(true);
      }}>View Report</Button>
    ) },
  ];

  const keywordColumns = [
    { title: 'Keyword', dataIndex: 'keyword', key: 'keyword', render: text => <strong>{text}</strong> },
    { title: 'Project', dataIndex: ['projectId', 'name'], key: 'projectName' },
    { title: 'Volume', dataIndex: ['metrics', 'searchVolume'], key: 'volume' },
    { title: 'Position', dataIndex: ['ranking', 'currentRank'], key: 'position' },
    { title: 'Difficulty', dataIndex: ['metrics', 'keywordDifficulty'], key: 'difficulty', render: dif => <Tag color={dif > 60 ? 'red' : dif > 30 ? 'orange' : 'green'}>{dif || 'N/A'}</Tag> },
  ];

  const strategyColumns = [
    { title: 'Project', dataIndex: ['projectId', 'name'], key: 'projectName', render: text => <strong>{text || 'Unknown Project'}</strong> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: status => <Tag color={status === 'Approved' ? 'green' : 'gold'}>{status}</Tag> },
    { title: 'Date Generated', dataIndex: 'createdAt', key: 'createdAt', render: date => new Date(date).toLocaleDateString() },
    { title: 'Action', key: 'action', render: (_, record) => (
      <Button type="link" onClick={() => {
        setActiveStrategy(record);
        setStrategyModalVisible(true);
      }}>Review Strategy</Button>
    ) },
  ];

  return (
    <div className="seo-workspace-container">
      <div className="seo-tabs-container">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'projects', label: 'Projects' },
          { key: 'audits', label: 'Audits' },
          { key: 'keywords', label: 'Keywords' },
          { key: 'content', label: 'Content Strategy' },
          { key: 'approvals', label: 'Approvals Queue' },
          { key: 'reports', label: 'Reports' },
          { key: 'analytics', label: 'Analytics' },
          { key: 'settings', label: 'Settings' }
        ].map(tab => (
          <button 
            key={tab.key}
            className={`seo-tab-btn ${activeSubTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveSubTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'overview' && (
        <Row gutter={[24, 24]}>
          <Col span={24}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Spin size="large" />
              </div>
            ) : projects.length === 0 ? (
              <Card className="seo-glass-panel seo-empty-state">
                <Activity className="seo-empty-icon" />
                <Title level={3} style={{ marginBottom: 8 }}>Welcome to the SEO Agent Team Workspace</Title>
                <Text className="seo-empty-text" style={{ display: 'block', marginBottom: 24 }}>Connect a project to start auditing and building AI SEO strategies.</Text>
                <Button type="primary" size="large" icon={<Plus size={18}/>} className="seo-glow-btn" onClick={() => setIsModalVisible(true)}>Create New SEO Project</Button>
              </Card>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <Title level={4} style={{ margin: 0, fontWeight: 700 }}>Your Projects</Title>
                  <Button type="primary" icon={<Plus size={16}/>} className="seo-glow-btn" onClick={() => setIsModalVisible(true)}>New Project</Button>
                </div>
                <Row gutter={[24, 24]}>
                  {projects.map(project => (
                    <Col xs={24} lg={12} xl={8} key={project._id}>
                      <Card className="seo-glass-panel" style={{ cursor: 'pointer' }} bodyStyle={{ padding: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: 12, borderRadius: 12 }}>
                            <Globe size={24} color="var(--accent-primary)" />
                          </div>
                          <Tag color="blue" className="seo-badge seo-badge-info">{project.phase.toUpperCase()}</Tag>
                        </div>
                        <Title level={4} style={{ margin: '0 0 4px 0', fontWeight: 800 }}>{project.name}</Title>
                        <Text type="secondary" style={{ fontSize: 13 }}>{(project.siteUrl || project.domain)}</Text>
                        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: 16 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>Created {new Date(project.createdAt).toLocaleDateString()}</Text>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Button type="primary" size="small" onClick={() => triggerAudit(project._id)} className="seo-glow-btn">1. Audit</Button>
                            <Button type="default" size="small" onClick={() => triggerStrategy(project._id)} disabled={project.phase === 'intake'} className="seo-glow-btn-secondary">2. Strategy</Button>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </Col>
        </Row>
      )}

      {/* Projects Tab */}
      {activeSubTab === 'projects' && (
        <Card className="seo-glass-panel seo-table">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0 }}>All Projects</Title>
            <Button type="primary" icon={<Plus size={16}/>} className="seo-glow-btn" onClick={() => setIsModalVisible(true)}>New Project</Button>
          </div>
          <Table dataSource={projects} columns={projectColumns} rowKey="_id" loading={loading} />
        </Card>
      )}

      {/* Audits Tab */}
      {activeSubTab === 'audits' && (
        <Card className="seo-glass-panel seo-table">
          <Title level={4} style={{ margin: '0 0 16px 0' }}>Recent Audits</Title>
          <Table dataSource={audits} columns={auditColumns} rowKey="_id" loading={loading} />
        </Card>
      )}

      {/* Keywords Tab */}
      {activeSubTab === 'keywords' && (
        <Card className="seo-glass-panel seo-table">
          <Title level={4} style={{ margin: '0 0 16px 0' }}>Keyword Tracking</Title>
          <Table dataSource={keywords} columns={keywordColumns} rowKey="_id" loading={loading} />
        </Card>
      )}

      {/* Content Strategy Tab */}
      {activeSubTab === 'content' && (
        <Card className="seo-glass-panel seo-table">
          <Title level={4} style={{ margin: '0 0 16px 0' }}>Content Strategies</Title>
          <Table dataSource={strategies} columns={strategyColumns} rowKey="_id" loading={loading} />
        </Card>
      )}

      {/* Approvals Queue Tab */}
      {activeSubTab === 'approvals' && (
        <Card className="seo-glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>Gate 2: Approvals Queue</Title>
            <Select 
              placeholder="Select a project" 
              style={{ width: 250 }} 
              onChange={setSelectedTaskProject}
              value={selectedTaskProject}
            >
              {projects.map(p => (
                <Option key={p._id} value={p._id}>{p.name}</Option>
              ))}
            </Select>
          </div>

          {!selectedTaskProject ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <CheckCircle size={48} color="#ccc" style={{ marginBottom: 16 }} />
              <Text type="secondary" style={{ display: 'block' }}>Select a project to view pending AI edits</Text>
            </div>
          ) : loadingTasks ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Spin size="large" />
            </div>
          ) : tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Text type="secondary" style={{ display: 'block' }}>No pending tasks found for this project.</Text>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {tasks.map(task => (
                <Card key={task._id} size="small" style={{ borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderLeft: task.status === 'Pending' ? '4px solid var(--accent-warning)' : task.status === 'Approved' || task.status === 'Implemented' ? '4px solid var(--accent-success)' : '4px solid var(--accent-danger)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                        <Tag className="seo-badge seo-badge-info">{task.taskType}</Tag>
                        <Tag className={`seo-badge ${task.status === 'Pending' ? 'seo-badge-pending' : task.status === 'Approved' || task.status === 'Implemented' ? 'seo-badge-success' : ''}`}>{task.status}</Tag>
                      </div>
                      <Title level={5} style={{ margin: '0 0 4px 0' }}>{task.pageUrl}</Title>
                      <Text type="secondary">{task.description}</Text>
                      
                      <div style={{ marginTop: 16, background: 'rgba(0,0,0,0.05)', padding: 12, borderRadius: 8, fontSize: 13 }}>
                        <strong>Proposed Changes:</strong>
                        <pre style={{ margin: '8px 0 0 0', whiteSpace: 'pre-wrap' }}>
                          {JSON.stringify(task.proposedChanges, null, 2)}
                        </pre>
                      </div>
                    </div>
                    
                    {task.status === 'Pending' && (
                      <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                        <Button type="primary" onClick={() => handleUpdateTaskStatus(task._id, 'Approved')} className="seo-glow-btn" style={{ background: 'var(--accent-success)' }}>Approve</Button>
                        <Button danger onClick={() => handleUpdateTaskStatus(task._id, 'Rejected')} style={{ borderRadius: 12 }}>Reject</Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Reports Tab */}
      {activeSubTab === 'reports' && (
        <Card className="seo-glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>Executive ROI Reports</Title>
            <div style={{ display: 'flex', gap: '16px' }}>
              <Select 
                placeholder="Select a project" 
                style={{ width: 250 }} 
                onChange={setSelectedReportProject}
                value={selectedReportProject}
              >
                {projects.map(p => (
                  <Option key={p._id} value={p._id}>{p.name}</Option>
                ))}
              </Select>
              <Button type="primary" onClick={handleGenerateReport} disabled={!selectedReportProject || loadingReports} icon={<FileText size={16} />} className="seo-glow-btn">
                Generate New Report
              </Button>
            </div>
          </div>

          {!selectedReportProject ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <FileText size={48} color="#ccc" style={{ marginBottom: 16 }} />
              <Text type="secondary" style={{ display: 'block' }}>Select a project to view its final executive reports</Text>
            </div>
          ) : loadingReports ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Spin size="large" />
            </div>
          ) : reports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Text type="secondary" style={{ display: 'block' }}>No reports found. Generate one to compare your latest audits.</Text>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {reports.map(report => (
                <Card key={report._id} size="small" className="seo-glass-panel" style={{ cursor: 'pointer', borderRadius: 8, borderLeft: '4px solid var(--accent-primary)' }} onClick={() => { setActiveReport(report); setReportModalVisible(true); }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Title level={5} style={{ margin: '0 0 4px 0' }}>{report.title}</Title>
                      <Text type="secondary">Generated on {new Date(report.createdAt).toLocaleDateString()}</Text>
                    </div>
                    <Button type="link" className="seo-glow-btn-secondary">Read Report</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Analytics Tab */}
      {activeSubTab === 'analytics' && (
        <Card className="seo-glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>Project Analytics</Title>
            <Select 
              placeholder="Select a project" 
              style={{ width: 250 }} 
              onChange={setSelectedAnalyticsProject}
              value={selectedAnalyticsProject}
            >
              {projects.map(p => (
                <Option key={p._id} value={p._id}>{p.name}</Option>
              ))}
            </Select>
          </div>
          
          {!selectedAnalyticsProject ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <BarChart2 size={48} color="#ccc" style={{ marginBottom: 16 }} />
              <Text type="secondary" style={{ display: 'block' }}>Select a project to view its SEO analytics</Text>
            </div>
          ) : loadingAnalytics ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Spin size="large" />
            </div>
          ) : analyticsData ? (
            <div>
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={6}>
                  <Card size="small" className="seo-metric-card" bordered={false}>
                    <Statistic title={<span className="seo-metric-title">Total Clicks (GSC)</span>} value={analyticsData.gsc?.clicks || 0} prefix={<MousePointer2 size={16} />} valueStyle={{ color: 'transparent' }} formatter={(value) => <span className="seo-metric-value">{value}</span>} />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small" className="seo-metric-card" bordered={false}>
                    <Statistic title={<span className="seo-metric-title">Avg Position (GSC)</span>} value={analyticsData.gsc?.position || 0} precision={1} prefix={<TrendingUp size={16} />} valueStyle={{ color: 'transparent' }} formatter={(value) => <span className="seo-metric-value">{value}</span>} />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small" className="seo-metric-card" bordered={false}>
                    <Statistic title={<span className="seo-metric-title">Sessions (GA4)</span>} value={analyticsData.ga4?.sessions || 0} prefix={<Users size={16} />} valueStyle={{ color: 'transparent' }} formatter={(value) => <span className="seo-metric-value">{value}</span>} />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small" className="seo-metric-card" bordered={false}>
                    <Statistic title={<span className="seo-metric-title">Conversions (GA4)</span>} value={analyticsData.ga4?.conversions || 0} prefix={<CheckCircle size={16} />} valueStyle={{ color: 'transparent' }} formatter={(value) => <span className="seo-metric-value">{value}</span>} />
                  </Card>
                </Col>
              </Row>
              
              <Row gutter={[24, 24]}>
                <Col span={12}>
                  <Card title="GSC Clicks & Impressions (30 Days)" size="small" className="seo-glass-panel">
                    <div style={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsData.gsc?.rows || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="date" hide />
                          <YAxis yAxisId="left" stroke="var(--text-secondary)" />
                          <YAxis yAxisId="right" orientation="right" stroke="var(--text-secondary)" />
                          <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: 'none', borderRadius: '8px', boxShadow: 'var(--shadow-md)', color: 'var(--text-primary)' }} />
                          <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
                          <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="var(--accent-primary)" strokeWidth={3} name="Clicks" dot={false} activeDot={{ r: 6 }} />
                          <Line yAxisId="right" type="monotone" dataKey="impressions" stroke="var(--accent-secondary)" strokeWidth={3} name="Impressions" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="GA4 Sessions & Users (30 Days)" size="small" className="seo-glass-panel">
                    <div style={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsData.ga4?.rows || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="date" hide />
                          <YAxis stroke="var(--text-secondary)" />
                          <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: 'none', borderRadius: '8px', boxShadow: 'var(--shadow-md)', color: 'var(--text-primary)' }} />
                          <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
                          <Line type="monotone" dataKey="sessions" stroke="var(--accent-warning)" strokeWidth={3} name="Sessions" dot={false} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="users" stroke="var(--accent-success)" strokeWidth={3} name="Users" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>
          ) : null}
        </Card>
      )}

      {/* Settings Tab */}
      {activeSubTab === 'settings' && (
        <Card className="seo-glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>Project Settings & Autopilot</Title>
            <Select 
              placeholder="Select a project" 
              style={{ width: 250 }} 
              onChange={setSelectedSettingsProject}
              value={selectedSettingsProject}
            >
              {projects.map(p => (
                <Option key={p._id} value={p._id}>{p.name}</Option>
              ))}
            </Select>
          </div>

          {!selectedSettingsProject ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <SettingsIcon size={48} color="#ccc" style={{ marginBottom: 16 }} />
              <Text type="secondary" style={{ display: 'block' }}>Select a project to configure settings</Text>
            </div>
          ) : (
            (() => {
              const project = projects.find(p => p._id === selectedSettingsProject);
              return (
                <div style={{ maxWidth: 600 }}>
                  <Card size="small" title="Autopilot Mode" className="seo-glass-panel" style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Text strong>Enable Autopilot</Text>
                        <br />
                        <Text type="secondary">When enabled, the AI will continuously monitor rankings and automatically generate implementation tasks if rankings drop.</Text>
                      </div>
                      <Switch 
                        checked={project?.settings?.autopilot} 
                        onChange={(checked) => handleUpdateSettings(project._id, { ...project.settings, autopilot: checked })}
                      />
                    </div>
                    
                    {project?.settings?.autopilot && (
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed var(--border-color)' }}>
                        <Text strong>Check Frequency</Text>
                        <Select 
                          value={project?.settings?.frequency || 'weekly'}
                          onChange={(val) => handleUpdateSettings(project._id, { ...project.settings, frequency: val })}
                          style={{ width: '100%', marginTop: 8 }}
                        >
                          <Option value="daily">Daily</Option>
                          <Option value="weekly">Weekly</Option>
                        </Select>
                      </div>
                    )}
                  </Card>
                </div>
              );
            })()
          )}
        </Card>
      )}

      {/* Create Project Modal */}
      <Modal
        title={<Title level={4} style={{ margin: 0, fontWeight: 800 }}>Create New SEO Project</Title>}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreateProject} style={{ marginTop: 24 }}>
          <Form.Item label="Project Name" name="name" rules={[{ required: true, message: 'Please enter a project name' }]}>
            <Input size="large" placeholder="e.g. Acme Corp" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item label="Website URL" name="siteUrl" rules={[{ required: true, type: 'url', message: 'Please enter a valid URL' }]}>
            <Input size="large" placeholder="https://example.com" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right', marginTop: 32 }}>
            <Button onClick={() => setIsModalVisible(false)} className="seo-glow-btn-secondary" style={{ marginRight: 12 }}>Cancel</Button>
            <Button type="primary" htmlType="submit" className="seo-glow-btn">Create Project</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Review Strategy Modal */}
      <Modal
        title={<Title level={4} style={{ margin: 0, fontWeight: 800 }}>{activeStrategy?.title || 'SEO Content Strategy'}</Title>}
        open={strategyModalVisible}
        onCancel={() => setStrategyModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setStrategyModalVisible(false)} className="seo-glow-btn-secondary">Close</Button>,
          <Button key="publish" type="primary" onClick={handlePublishStrategy} className="seo-glow-btn">Publish to WordPress</Button>
        ]}
        width={800}
      >
        <div className="seo-markdown-container" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <ReactMarkdown>{activeStrategy?.content || 'No content available.'}</ReactMarkdown>
        </div>
      </Modal>

      {/* Audit Report Modal */}
      <Modal
        title={<Title level={4} style={{ margin: 0, fontWeight: 800 }}>Audit Report for {activeAudit?.projectId?.name || 'Project'}</Title>}
        open={auditModalVisible}
        onCancel={() => setAuditModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setAuditModalVisible(false)} className="seo-glow-btn-secondary">Close</Button>
        ]}
      >
        {activeAudit && (
          <div style={{ padding: '24px 0' }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small" title="URLs Crawled" className="seo-metric-card" bordered={false}>
                  <Title level={3} style={{ margin: 0 }}>{activeAudit.metrics?.pagesCrawled || 0}</Title>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Date Crawled" className="seo-metric-card" bordered={false}>
                  <Text strong>{activeAudit.completedAt ? new Date(activeAudit.completedAt).toLocaleString() : 'N/A'}</Text>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Performance Score" className="seo-metric-card" bordered={false}>
                  <Title level={3} className="seo-metric-value">{activeAudit.metrics?.performance || 0}/100</Title>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="On-Page SEO Score" className="seo-metric-card" bordered={false}>
                  <Title level={3} className="seo-metric-value">{activeAudit.metrics?.onPage || 0}/100</Title>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Crawlability Score" className="seo-metric-card" bordered={false}>
                  <Title level={3} className="seo-metric-value">{activeAudit.metrics?.crawlability || 0}/100</Title>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Security Score" className="seo-metric-card" bordered={false}>
                  <Title level={3} className="seo-metric-value">{activeAudit.metrics?.security || 0}/100</Title>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* Report Modal */}
      <Modal
        title={<Title level={4} style={{ margin: 0, fontWeight: 800 }}>{activeReport?.title || 'SEO Report'}</Title>}
        open={reportModalVisible}
        onCancel={() => setReportModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setReportModalVisible(false)} className="seo-glow-btn-secondary">Close</Button>,
          <Button key="export" type="primary" className="seo-glow-btn">Export to PDF</Button>
        ]}
        width={800}
      >
        <div className="seo-markdown-container" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <ReactMarkdown>{activeReport?.content || 'No content available.'}</ReactMarkdown>
        </div>
      </Modal>
    </div>
  );
};

export default SEOWorkspace;
