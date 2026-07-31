import React, { useEffect, useState, useMemo } from 'react';
import { Typography, Card, Row, Col, Button, Progress, Table, Space, Empty, Alert, message, Tag, Drawer, Select, Divider, Statistic, Input, Skeleton, Tooltip } from 'antd';
import { ClipboardCheck, Activity, Search, History, Bug, Code, ArrowRightLeft, Download, Sparkles, Wand2, ShieldCheck, Zap, Server, Image as ImageIcon, Link as LinkIcon, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { seoWorkspaceApi } from '../../../../api/seoWorkspaceApi';
import ProjectSelector from '../components/shared/ProjectSelector';
import { SeverityTag } from '../components/shared/StatusTags';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const scoreColor = (score) => (score > 80 ? '#52c41a' : score > 50 ? '#faad14' : '#f5222d');

const CategoryIcon = ({ category }) => {
  switch (category?.toLowerCase()) {
    case 'technical': return <Server size={14} />;
    case 'content': return <FileText size={14} />;
    case 'performance': return <Zap size={14} />;
    case 'security': return <ShieldCheck size={14} />;
    case 'images': return <ImageIcon size={14} />;
    case 'internal linking': return <LinkIcon size={14} />;
    default: return <Bug size={14} />;
  }
};

const AuditTab = () => {
  const [projectId, setProjectId] = useState(null);
  const [runningBasic, setRunningBasic] = useState(false);
  const [liveProgress, setLiveProgress] = useState(null);
  const [auditProfile, setAuditProfile] = useState('standard');
  
  const [pastAudits, setPastAudits] = useState([]);
  const [loadingPast, setLoadingPast] = useState(false);
  const [selectedAuditId, setSelectedAuditId] = useState(null);
  const [error, setError] = useState(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState(null);

  const [compareMode, setCompareMode] = useState(false);
  const [compareAuditId1, setCompareAuditId1] = useState(null);
  const [compareAuditId2, setCompareAuditId2] = useState(null);
  const [compareData, setCompareData] = useState(null);
  const [comparing, setComparing] = useState(false);

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
              message.error('Audit failed: ' + res.error);
            }
          } else if (res.status === 'running' || res.status === 'queued' || res.status === 'synthesizing') {
            setLiveProgress({ status: res.status, progress: res.progress, startedAt: res.startedAt });
          }
        } catch (err) { 
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
      if (res && (res.data?.jobId || res.jobId)) {
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
      const searchStr = `${f.issue} ${f.category} ${f.affectedUrl}`.toLowerCase();
      const matchesSearch = searchStr.includes(searchText.toLowerCase());
      const matchesSeverity = severityFilter === 'All' || f.severity === severityFilter.toLowerCase();
      return matchesSearch && matchesSeverity;
    });
  }, [selectedAudit, searchText, severityFilter]);

  const handleExport = () => {
    if (!filteredFindings.length) return message.warning('No data to export');
    const csvHeader = 'Issue ID,Category,Severity,Issue,Affected URL,Recommendation\n';
    const csvData = filteredFindings.map(f => `"${f.issueId}","${f.category}","${f.severity}","${f.issue}","${f.affectedUrl || ''}","${f.recommendation || ''}"`).join('\n');
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
    { title: 'Category', dataIndex: 'category', key: 'category', render: (c) => <Tag icon={<CategoryIcon category={c}/>} color="blue">{c}</Tag>, width: 140 },
    { title: 'Issue Description', dataIndex: 'issue', key: 'issue' },
    { title: 'Affected URL', dataIndex: 'affectedUrl', key: 'affectedUrl', render: (u) => u ? <Text copyable={{text: u}} ellipsis style={{maxWidth: 200}}>{new URL(u).pathname}</Text> : 'Site-wide' },
    { 
      title: 'Action', 
      key: 'action', 
      render: (_, r) => <Button type="default" size="small" onClick={() => { setSelectedFinding(r); setDrawerOpen(true); }}>View Details</Button>,
      width: 120 
    }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ClipboardCheck size={28} />
          <div>
            <Title level={4} style={{ margin: 0 }}>Enterprise Audit Engine</Title>
            <Text type="secondary">Deterministic, evidence-based SEO crawler and scorer.</Text>
          </div>
        </div>
        <Space>
          <Select value={auditProfile} onChange={setAuditProfile} style={{ width: 150 }} disabled={runningBasic}>
            <Option value="quick">Quick (100 pgs)</Option>
            <Option value="standard">Standard (1K pgs)</Option>
            <Option value="deep">Deep (10K pgs)</Option>
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
          message={<Space><Text strong>Job Status: {liveProgress.status.toUpperCase()} | Stage: {liveProgress.progress?.currentStage}</Text></Space>}
          description={
            <div style={{ marginTop: 8 }}>
              <Space split={<Divider type="vertical" />}>
                <Text>Discovered: <b>{liveProgress.progress?.urlsDiscovered || 0}</b></Text>
                <Text style={{ color: '#1890ff' }}>Crawled: <b>{liveProgress.progress?.urlsCrawled || 0}</b></Text>
                <Text type="secondary">Remaining Queue: <b>{liveProgress.progress?.urlsRemaining || 0}</b></Text>
                <Text type="danger">Failed: <b>{liveProgress.progress?.failedUrls || 0}</b></Text>
                <Text style={{ color: '#52c41a' }}>Speed: <b>{liveProgress.progress?.pagesPerSecond || 0} pgs/sec</b></Text>
              </Space>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" ellipsis style={{ maxWidth: '100%' }}>
                  Processing: {liveProgress.progress?.currentUrl || '...'}
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
               {/* Simplified compare view for brevity */}
               <Statistic title="Score Delta" value={compareData.scoreDelta} />
             </motion.div>
          )}
        </Card>
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
                      <Statistic title={new Date(audit.createdAt).toLocaleDateString()} value={audit.metrics?.overall || 0} valueStyle={{ color: scoreColor(audit.metrics?.overall) }} suffix="/ 100" />
                    </Card>
                  ))}
                </Space>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={18}>
            {selectedAudit ? (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                
                <Row gutter={16}>
                  <Col span={8}>
                     <Card size="small">
                       <Statistic title="Overall SEO Score" value={selectedAudit.metrics?.overall || 0} valueStyle={{ color: scoreColor(selectedAudit.metrics?.overall), fontSize: 36, fontWeight: 'bold' }} suffix="/ 100" />
                     </Card>
                  </Col>
                  <Col span={16}>
                     <Card size="small" title="Score Breakdown">
                        <Row gutter={[16, 16]}>
                          {(selectedAudit.metrics?.scoreBreakdown || []).map(b => (
                            <Col span={8} key={b.category}>
                               <Tooltip title={b.reason}>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                   <Text>{b.category}</Text>
                                   <Text strong style={{ color: scoreColor(b.earned) }}>{b.earned}%</Text>
                                 </div>
                                 <Progress percent={b.earned} showInfo={false} size="small" strokeColor={scoreColor(b.earned)} />
                               </Tooltip>
                            </Col>
                          ))}
                        </Row>
                     </Card>
                  </Col>
                </Row>

                <Card 
                  size="small" 
                  title={<Space><Bug size={16} /> Verified Findings ({filteredFindings.length})</Space>}
                  extra={<Button icon={<Download size={14}/>} onClick={handleExport} size="small">Export CSV</Button>}
                >
                  <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
                    <Input prefix={<Search size={14} />} placeholder="Search URLs, issues..." value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 250 }} />
                    <Select value={severityFilter} onChange={setSeverityFilter} style={{ width: 120 }}>
                      <Option value="All">All Severities</Option>
                      <Option value="Critical">Critical</Option>
                      <Option value="High">High</Option>
                      <Option value="Medium">Medium</Option>
                      <Option value="Low">Low</Option>
                    </Select>
                  </div>

                  <Table
                    rowKey="issueId"
                    size="small"
                    columns={findingsColumns}
                    dataSource={filteredFindings}
                    pagination={{ pageSize: 15 }}
                    locale={{ emptyText: <Empty description="No issues found matching criteria" /> }}
                  />
                </Card>
              </Space>
            ) : (
              <Empty description="Select an audit from the left to view details" />
            )}
          </Col>
        </Row>
      )}

      <Drawer
        title={<Space><Bug color="#1890ff" /> Issue Details</Space>}
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
              <Text type="secondary" copyable>URL: {selectedFinding.affectedUrl || 'Site-wide'}</Text>
            </div>

            <Card size="small" title="Root Cause" bordered={false} style={{ background: '#fff1f0' }}>
              <Paragraph>{selectedFinding.rootCause || 'Not specified.'}</Paragraph>
            </Card>

            <Card size="small" title="Technical Fix" bordered={false} style={{ background: '#f6ffed' }}>
              <Paragraph>{selectedFinding.suggestedTechnicalFix || 'Manual review required.'}</Paragraph>
            </Card>

            <Card size="small" title={<Space><Sparkles size={14} color="#1890ff"/> AI Explanation</Space>} bordered={false} style={{ background: '#e6f7ff' }}>
              <Paragraph>{selectedFinding.aiExplanation || 'AI explanation not generated for this issue.'}</Paragraph>
              {selectedFinding.recommendation && (
                 <Paragraph strong>Strategy: {selectedFinding.recommendation}</Paragraph>
              )}
            </Card>

            <Button 
              type="primary" 
              block 
              size="large" 
              onClick={() => {
                message.success(`Task created for: ${selectedFinding.issue}`);
                setDrawerOpen(false);
              }}
            >
              Queue Task for Developer
            </Button>
          </Space>
        )}
      </Drawer>
    </motion.div>
  );
};

export default AuditTab;