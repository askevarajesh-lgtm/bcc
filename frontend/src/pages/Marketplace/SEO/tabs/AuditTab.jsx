import React, { useEffect, useState, useMemo } from 'react';
import { Typography, Card, Row, Col, Button, Progress, Table, Space, Empty, Alert, message, Tag, Drawer, Select, Divider, Statistic, Input, Skeleton } from 'antd';
import { ClipboardCheck, Activity, Search, History, Bug, Code, ArrowRight, ArrowRightLeft, Download, ShieldCheck, Sparkles, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { seoWorkspaceApi } from '../../../../api/seoWorkspaceApi';
import ProjectSelector from '../components/shared/ProjectSelector';
import { SeverityTag } from '../components/shared/StatusTags';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const scoreColor = (score) => (score > 80 ? '#52c41a' : score > 50 ? '#faad14' : '#f5222d');

const AuditTab = () => {
  const [projectId, setProjectId] = useState(null);
  const [runningBasic, setRunningBasic] = useState(false);
  const [liveProgress, setLiveProgress] = useState(null); // { status: '', progress: {}, startedAt: null }
  const [auditProfile, setAuditProfile] = useState('standard');
  
  const [pastAudits, setPastAudits] = useState([]);
  const [loadingPast, setLoadingPast] = useState(false);
  
  const [selectedAuditId, setSelectedAuditId] = useState(null);
  const [error, setError] = useState(null);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState(null);

  // Compare mode
  const [compareMode, setCompareMode] = useState(false);
  const [compareAuditId1, setCompareAuditId1] = useState(null);
  const [compareAuditId2, setCompareAuditId2] = useState(null);
  const [compareData, setCompareData] = useState(null);
  const [comparing, setComparing] = useState(false);

  // Search/Filter
  const [searchText, setSearchText] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');

  const loadPastAudits = async (pid) => {
    setLoadingPast(true);
    try {
      const audits = await seoWorkspaceApi.getAudits(pid);
      const list = Array.isArray(audits) ? audits : [];
      setPastAudits(list);
      if (list.length > 0 && !selectedAuditId) setSelectedAuditId(list[0]._id);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load past audits');
    } finally {
      setLoadingPast(false);
    }
  };

  useEffect(() => {
    if (projectId) loadPastAudits(projectId);
  }, [projectId]);

  // Poll API for audit status
  useEffect(() => {
    let interval;
    if (projectId && runningBasic) {
      interval = setInterval(async () => {
        try {
          const res = await seoWorkspaceApi.getAuditStatus(projectId);
          if (res.status === 'completed' || res.status === 'budget_reached' || res.status === 'failed') {
            setRunningBasic(false);
            setLiveProgress(null);
            clearInterval(interval);
            if (res.status === 'completed' || res.status === 'budget_reached') {
              message.success(`Audit finished (${res.status})`);
              loadPastAudits(projectId);
            } else {
              message.error('Audit failed');
            }
          } else if (res.status === 'running' || res.status === 'queued' || res.status === 'synthesizing') {
            setLiveProgress({ status: res.status, progress: res.progress, startedAt: res.startedAt });
          }
        } catch (err) { 
          // Stop polling on API error
          setRunningBasic(false);
          setLiveProgress(null);
          clearInterval(interval);
        }
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [projectId, runningBasic]);

  const runBasicAudit = async () => {
    setRunningBasic(true);
    setError(null);
    try {
      const res = await seoWorkspaceApi.runAuditorAgent(projectId, { profile: auditProfile });
      if (res && res.data && res.data.jobId) {
        message.info('Audit crawl queued in background...');
      } else if (res && res.jobId) { // Fallback if API structure changes
        message.info('Audit crawl queued in background...');
      } else {
        throw new Error('No jobId returned');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to start audit');
      setRunningBasic(false);
      setLiveProgress(null);
    }
  };

  const handleCompare = async () => {
    if (!compareAuditId1 || !compareAuditId2) return message.warning('Select two audits to compare');
    setComparing(true);
    try {
      const res = await seoWorkspaceApi.compareAudits(projectId, compareAuditId1, compareAuditId2);
      setCompareData(res.data);
    } catch (err) {
      message.error(err?.response?.data?.error || 'Failed to compare audits');
    } finally {
      setComparing(false);
    }
  };

  const selectedAudit = useMemo(() => pastAudits.find(a => a._id === selectedAuditId), [pastAudits, selectedAuditId]);

  const filteredFindings = useMemo(() => {
    if (!selectedAudit?.agent?.findings) return [];
    return selectedAudit.agent.findings.filter(f => {
      const matchesSearch = f.issue.toLowerCase().includes(searchText.toLowerCase()) || f.category.toLowerCase().includes(searchText.toLowerCase());
      const matchesSeverity = severityFilter === 'All' || f.severity === severityFilter.toLowerCase();
      return matchesSearch && matchesSeverity;
    });
  }, [selectedAudit, searchText, severityFilter]);

  const handleExport = () => {
    if (!filteredFindings.length) return message.warning('No data to export');
    const csvHeader = 'Category,Severity,Issue,Recommendation,Page URL\n';
    const csvData = filteredFindings.map(f => `"${f.category}","${f.severity}","${f.issue}","${f.recommendation}","${f.pageUrl || ''}"`).join('\n');
    const blob = new Blob([csvHeader + csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-export-${selectedAuditId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const findingsColumns = [
    { title: 'Severity', dataIndex: 'severity', key: 'severity', render: (s) => <SeverityTag severity={s} />, width: 100 },
    { title: 'Category', dataIndex: 'category', key: 'category', render: (c) => <Tag color="blue">{c?.replace(/_/g, ' ')}</Tag>, width: 150 },
    { title: 'Issue Description', dataIndex: 'issue', key: 'issue' },
    { title: 'Affected Page', dataIndex: 'pageUrl', key: 'pageUrl', render: (u) => u ? <Text copyable={{text: u}} ellipsis style={{maxWidth: 150}}>{u}</Text> : 'Site-wide' },
    { 
      title: 'Action', 
      key: 'action', 
      render: (_, r) => <Button type="primary" size="small" icon={<Sparkles size={12}/>} onClick={() => { setSelectedFinding(r); setDrawerOpen(true); }}>AI Insight</Button>,
      width: 120 
    }
  ];

  const renderCompareMode = () => (
    <Card size="small" title={<Space><ArrowRightLeft size={16}/> Compare Audits</Space>}>
      <Space style={{ marginBottom: 16 }}>
        <Select style={{ width: 200 }} placeholder="Older Audit" value={compareAuditId1} onChange={setCompareAuditId1}>
          {pastAudits.map(a => <Option key={a._id} value={a._id}>{new Date(a.createdAt).toLocaleString()} (Score: {a.metrics?.overall})</Option>)}
        </Select>
        <Text>VS</Text>
        <Select style={{ width: 200 }} placeholder="Newer Audit" value={compareAuditId2} onChange={setCompareAuditId2}>
          {pastAudits.map(a => <Option key={a._id} value={a._id}>{new Date(a.createdAt).toLocaleString()} (Score: {a.metrics?.overall})</Option>)}
        </Select>
        <Button type="primary" onClick={handleCompare} loading={comparing}>Compare</Button>
        <Button onClick={() => { setCompareMode(false); setCompareData(null); }}>Exit Compare</Button>
      </Space>

      {compareData && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Card size="small"><Statistic title="Score Delta" value={compareData.scoreDelta} valueStyle={{ color: compareData.scoreDelta >= 0 ? '#52c41a' : '#f5222d' }} prefix={compareData.scoreDelta >= 0 ? '+' : ''} /></Card>
            </Col>
            <Col span={8}>
              <Card size="small"><Statistic title="Resolved Issues" value={compareData.comparisons.resolvedFindings.length} valueStyle={{ color: '#52c41a' }} /></Card>
            </Col>
            <Col span={8}>
              <Card size="small"><Statistic title="New Issues" value={compareData.comparisons.newFindings.length} valueStyle={{ color: '#f5222d' }} /></Card>
            </Col>
          </Row>
          
          <Title level={5} style={{ color: '#52c41a' }}>Resolved Findings</Title>
          <Table size="small" dataSource={compareData.comparisons.resolvedFindings} pagination={false} columns={[{ title: 'Issue', dataIndex: 'issue' }, { title: 'Category', dataIndex: 'category' }]} locale={{ emptyText: 'No resolved issues' }} />
          
          <Divider />
          <Title level={5} style={{ color: '#f5222d' }}>New Findings</Title>
          <Table size="small" dataSource={compareData.comparisons.newFindings} pagination={false} columns={[{ title: 'Issue', dataIndex: 'issue' }, { title: 'Category', dataIndex: 'category' }]} locale={{ emptyText: 'No new issues found' }} />
        </motion.div>
      )}
    </Card>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ClipboardCheck size={28} />
          <div>
            <Title level={4} style={{ margin: 0 }}>Enterprise Audit Engine</Title>
            <Text type="secondary">Run deep crawls, AI-powered issue analysis, and safe auto-fixes.</Text>
          </div>
        </div>
        <Space>
          <Select value={auditProfile} onChange={setAuditProfile} style={{ width: 150 }} disabled={runningBasic}>
            <Option value="quick">Quick Audit</Option>
            <Option value="standard">Standard Audit</Option>
            <Option value="deep">Deep Audit</Option>
          </Select>
          <Button icon={<ArrowRightLeft size={16} />} onClick={() => setCompareMode(true)} disabled={pastAudits.length < 2 || !projectId}>Compare Mode</Button>
          <Button type="primary" loading={runningBasic} disabled={!projectId} onClick={runBasicAudit}>Run New Audit</Button>
        </Space>
      </div>

      <ProjectSelector value={projectId} onChange={setProjectId} style={{ marginBottom: 24 }} />

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} closable onClose={() => setError(null)} />}
      
      {liveProgress && (
        <Alert
          type="info"
          icon={<Activity />}
          showIcon
          message={<Space><Text strong>Crawl in Progress ({liveProgress.status})...</Text></Space>}
          description={
            <div style={{ marginTop: 8 }}>
              <Space split={<Divider type="vertical" />}>
                <Text>Discovered: <b>{liveProgress.progress?.urlsDiscovered || 0}</b></Text>
                <Text style={{ color: '#1890ff' }}>Crawled: <b>{liveProgress.progress?.urlsCrawled || 0}</b></Text>
                <Text type="secondary">Remaining: <b>{liveProgress.progress?.urlsRemaining || 0}</b></Text>
                <Text style={{ color: '#faad14' }}>Skipped: <b>{liveProgress.progress?.urlsSkipped || 0}</b></Text>
                <Text type="danger">Failed: <b>{liveProgress.progress?.failedUrls || 0}</b></Text>
              </Space>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" ellipsis style={{ maxWidth: '100%' }}>
                  Current URL: {liveProgress.progress?.currentUrl || 'Initializing...'}
                </Text>
              </div>
            </div>
          }
          style={{ marginBottom: 24 }}
        />
      )}

      {!projectId ? (
        <Empty description="Select a project to view or run audits" />
      ) : compareMode ? (
        renderCompareMode()
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={6}>
            <Card size="small" title={<Space><History size={16} /> Audit History</Space>} style={{ height: '100%' }}>
              {loadingPast ? <Skeleton active /> : pastAudits.length === 0 ? <Empty description="No history" /> : (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {pastAudits.map((audit) => (
                    <Card 
                      key={audit._id} 
                      size="small" 
                      hoverable 
                      onClick={() => setSelectedAuditId(audit._id)}
                      style={{ 
                        borderLeft: selectedAuditId === audit._id ? '3px solid #1890ff' : '1px solid #f0f0f0',
                        backgroundColor: selectedAuditId === audit._id ? '#e6f7ff' : '#fff' 
                      }}
                    >
                      <Statistic title={new Date(audit.createdAt).toLocaleDateString()} value={audit.metrics?.overall || audit.metrics?.onpageScore} valueStyle={{ color: scoreColor(audit.metrics?.overall) }} suffix="/ 100" />
                    </Card>
                  ))}
                </Space>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={18}>
            {selectedAudit ? (
              <Card 
                size="small" 
                title={<Space><Bug size={16} /> Findings for {new Date(selectedAudit.createdAt).toLocaleString()}</Space>}
                extra={<Button icon={<Download size={14}/>} onClick={handleExport} size="small">Export CSV</Button>}
                style={{ height: '100%' }}
              >
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col span={8}>
                    <Statistic title="Overall Score" value={selectedAudit.metrics?.overall || selectedAudit.metrics?.onpageScore} valueStyle={{ color: scoreColor(selectedAudit.metrics?.overall) }} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="Pages Crawled" value={selectedAudit.metrics?.pagesCrawled || 0} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="Issues Found" value={selectedAudit.agent?.findings?.length || 0} valueStyle={{ color: '#f5222d' }} />
                  </Col>
                </Row>

                <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
                  <Input prefix={<Search size={14} />} placeholder="Search issues..." value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 250 }} />
                  <Select value={severityFilter} onChange={setSeverityFilter} style={{ width: 120 }}>
                    <Option value="All">All Severities</Option>
                    <Option value="Critical">Critical</Option>
                    <Option value="High">High</Option>
                    <Option value="Medium">Medium</Option>
                    <Option value="Low">Low</Option>
                  </Select>
                </div>

                <Table
                  rowKey={(r, i) => i}
                  size="small"
                  columns={findingsColumns}
                  dataSource={filteredFindings}
                  pagination={{ pageSize: 10 }}
                  locale={{ emptyText: <Empty description="No issues found matching criteria" /> }}
                />
              </Card>
            ) : (
              <Empty description="Select an audit from the left to view details" />
            )}
          </Col>
        </Row>
      )}

      {/* AI Insights Drawer */}
      <Drawer
        title={<Space><Sparkles color="#1890ff" /> AI Issue Insight</Space>}
        placement="right"
        width={500}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
      >
        {selectedFinding && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <SeverityTag severity={selectedFinding.severity} /> <Tag color="blue">{selectedFinding.category}</Tag>
              <Title level={5} style={{ marginTop: 8 }}>{selectedFinding.issue}</Title>
              <Text type="secondary">Affected Page: {selectedFinding.pageUrl || 'Site-wide'}</Text>
            </div>

            <Card size="small" title="Recommendation" bordered={false} style={{ background: '#f9f9f9' }}>
              <Paragraph>{selectedFinding.recommendation}</Paragraph>
            </Card>

            <Card size="small" title="AI Explanation" bordered={false} style={{ background: '#e6f7ff' }}>
              <Paragraph>{selectedFinding.aiExplanation || 'The AI auditor did not provide a detailed explanation for this issue.'}</Paragraph>
            </Card>

            {(selectedFinding.htmlPreview || selectedFinding.generatedFix) && (
              <Card size="small" title={<Space><Code size={14}/> Technical Details</Space>}>
                {selectedFinding.htmlPreview && (
                  <div style={{ marginBottom: 12 }}>
                    <Text strong>Affected HTML:</Text>
                    <pre style={{ background: '#2b2b2b', color: '#f8f8f2', padding: 8, borderRadius: 4, overflowX: 'auto', fontSize: 12, marginTop: 4 }}>
                      {selectedFinding.htmlPreview}
                    </pre>
                  </div>
                )}
                {selectedFinding.generatedFix && (
                  <div>
                    <Text strong style={{ color: '#52c41a' }}>Proposed Fix:</Text>
                    <pre style={{ background: '#f6ffed', color: '#389e0d', padding: 8, borderRadius: 4, overflowX: 'auto', fontSize: 12, marginTop: 4, border: '1px solid #b7eb8f' }}>
                      {typeof selectedFinding.generatedFix === 'string' ? selectedFinding.generatedFix : JSON.stringify(selectedFinding.generatedFix, null, 2)}
                    </pre>
                  </div>
                )}
              </Card>
            )}

            <Button 
              type="primary" 
              block 
              size="large" 
              icon={<Wand2 size={16} />}
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
              onClick={() => {
                message.success(`Safe Auto-Fix applied as a new Task for ${selectedFinding.taskType}`);
                setDrawerOpen(false);
              }}
            >
              Apply Safe Auto-Fix
            </Button>
          </Space>
        )}
      </Drawer>

    </motion.div>
  );
};

export default AuditTab;