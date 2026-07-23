import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Progress, Table, Tag, Button, List, Spin, message, Modal, Form, Input, InputNumber, Select, DatePicker } from 'antd';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Target, CheckCircle2, AlertTriangle, Filter, Plus, FileText, AlertCircle, Sparkles, Crosshair, BarChart2, Activity, Banknote } from 'lucide-react';
import { strategyApi } from '../../api/strategyApi';

const { Title, Text } = Typography;

const Strategy = () => {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [data, setData] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [form] = Form.useForm();

  const [isInitiativeModalOpen, setIsInitiativeModalOpen] = useState(false);
  const [isCreatingInitiative, setIsCreatingInitiative] = useState(false);
  const [initiativeForm] = Form.useForm();

  useEffect(() => {
    // fetchStrategy(); // Temporarily disabled while in "Coming Soon" state
  }, []);

  const fetchStrategy = async () => {
    try {
      setLoading(true);
      const res = await strategyApi.getStrategy();
      if (res.success) {
        setData(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch strategy', error);
      message.error('Failed to load strategy data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const res = await strategyApi.generateStrategy();
      if (res.success) {
        setData(res.data);
        message.success('Strategy generated successfully from module data!');
      }
    } catch (error) {
      console.error('Failed to generate strategy', error);
      message.error('Failed to generate strategy');
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateObjective = async (values) => {
    try {
      setIsCreating(true);
      const objectiveData = {
        title: values.title,
        client: values.client,
        owner: values.owner,
        progress: values.progress || 0,
        status: values.status || 'ON TRACK',
        quarter: 'Q3 FY26',
        keyResults: []
      };
      const res = await strategyApi.addObjective(objectiveData);
      if (res.success) {
        setData(res.data);
        message.success('Objective created successfully!');
        setIsModalOpen(false);
        form.resetFields();
      }
    } catch (error) {
      console.error('Failed to create objective', error);
      message.error('Failed to create objective');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateInitiative = async (values) => {
    try {
      setIsCreatingInitiative(true);

      let timelineString = 'TBD';
      if (values.timeline && Array.isArray(values.timeline) && values.timeline.length === 2) {
        timelineString = `${values.timeline[0].format('MMM DD')} - ${values.timeline[1].format('MMM DD')}`;
      } else if (typeof values.timeline === 'string') {
        timelineString = values.timeline;
      }

      const initiativeData = {
        initiative: values.initiative,
        client: values.client,
        channel: values.channel || 'SEO',
        owner: values.owner,
        phase: values.phase || 'Plan',
        timeline: timelineString,
        deps: values.deps || 0,
        status: values.status || 'PLANNING'
      };
      const res = await strategyApi.addInitiative(initiativeData);
      if (res.success) {
        setData(res.data);
        message.success('Initiative created successfully!');
        setIsInitiativeModalOpen(false);
        initiativeForm.resetFields();
      }
    } catch (error) {
      console.error('Failed to create initiative', error);
      message.error('Failed to create initiative');
    } finally {
      setIsCreatingInitiative(false);
    }
  };

  // --- COMING SOON PLACEHOLDER ---
  // Temporarily returning this screen to block access to the unfinished module.
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh', textAlign: 'center' }}>
      <div style={{ background: 'var(--bg-secondary)', padding: '32px', borderRadius: '50%', marginBottom: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <Target size={48} style={{ color: 'var(--accent-secondary)' }} />
      </div>
      <Title level={2} style={{ margin: '0 0 12px 0', fontWeight: 800 }}>Strategy & Planning</Title>
      <Tag color="warning" style={{ borderRadius: 16, padding: '4px 12px', fontSize: 14, fontWeight: 600, marginBottom: 24, background: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>Upgrade Required</Tag>
      <Text type="secondary" style={{ maxWidth: 450, fontSize: 16, lineHeight: 1.6 }}>
        This module is available in this package. Purchase or upgrade your package to enable access.
      </Text>
    </motion.div>
  );
  // -------------------------------

  if (loading || !data) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const roadmapCols = [
    { title: 'INITIATIVE', dataIndex: 'initiative', key: 'initiative', render: text => <strong style={{ color: 'var(--text-primary)' }}>{text}</strong> },
    { title: 'CLIENT', dataIndex: 'client', key: 'client', render: text => <Text type="secondary">{text}</Text> },
    { title: 'CHANNEL', dataIndex: 'channel', key: 'channel', render: text => <Tag style={{ borderRadius: 12, fontSize: 10, background: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>{text}</Tag> },
    { title: 'OWNER', dataIndex: 'owner', key: 'owner', render: text => <span style={{ color: 'var(--text-primary)' }}>{text}</span> },
    { title: 'PHASE', dataIndex: 'phase', key: 'phase', render: text => <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)', fontWeight: 500 }}><span style={{ color: text === 'Build' ? 'var(--accent-primary)' : text === 'Launch' ? 'var(--accent-secondary)' : 'var(--accent-warning)', fontSize: 10 }}>●</span> {text}</div> },
    { title: 'TIMELINE', dataIndex: 'timeline', key: 'timeline', render: text => <Text type="secondary">{text}</Text> },
    { title: 'DEPS', dataIndex: 'deps', key: 'deps', render: text => <span style={{ color: 'var(--text-primary)' }}>{text}</span> },
    { title: 'STATUS', dataIndex: 'status', key: 'status', render: text => <Tag color={text === 'IN PROGRESS' ? 'processing' : text === 'AT RISK' ? 'error' : 'default'} style={{ borderRadius: 12, fontWeight: 600, padding: '2px 8px' }}>{text}</Tag> }
  ];

  const radarData = [
    { subject: 'SEO', A: data.channelMaturity?.seo || 0, B: 20 },
    { subject: 'Paid', A: data.channelMaturity?.paid || 0, B: 0 },
    { subject: 'Content', A: data.channelMaturity?.content || 0, B: 0 },
    { subject: 'Social', A: data.channelMaturity?.social || 0, B: 0 },
    { subject: 'CRM', A: data.channelMaturity?.crm || 0, B: 0 },
    { subject: 'Website', A: data.channelMaturity?.website || 0, B: 0 },
    { subject: 'SLA', A: data.channelMaturity?.sla || 0, B: 0 }
  ];

  const formatSpend = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val}`;
  };

  const getRiskColors = (level) => {
    if (level === 'HIGH RISK') return { color: 'var(--accent-danger)', bgColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' };
    if (level === 'MED RISK') return { color: 'var(--accent-warning)', bgColor: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.2)' };
    return { color: 'var(--accent-secondary)', bgColor: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' };
  };

  const getBriefColor = (status) => {
    if (status === 'APPROVED') return 'success';
    if (status === 'IN REVIEW') return 'warning';
    return 'default';
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>

          <Title level={2} style={{ margin: '4px 0 0 0', fontWeight: 800 }}>Strategy & Planning</Title>
          <Text type="secondary">Roadmaps, OKRs and briefs across every account — the brain that drives every campaign.</Text>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button loading={generating} onClick={handleGenerate} icon={<Target size={16} />} style={{ borderRadius: 8, borderColor: 'var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-secondary)' }}>Generate strategy</Button>
          <Button type="primary" onClick={() => setIsModalOpen(true)} icon={<Plus size={16} />} style={{ borderRadius: 8, background: 'var(--accent-secondary)', border: 'none', boxShadow: 'var(--shadow-md)' }}>New objective</Button>
        </div>
      </motion.div>

      {/* KPI CARDS */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { label: 'ACTIVE OBJECTIVES', val: data.metrics?.activeObjectives || 0, sub: '+0', icon: <Crosshair size={22} />, color: 'var(--accent-primary)' },
          { label: 'KEY RESULTS TRACKED', val: data.metrics?.keyResultsTracked || 0, sub: '+0', icon: <BarChart2 size={22} />, color: 'var(--accent-secondary)' },
          { label: 'ON-TRACK', val: data.metrics?.onTrack || 0, sub: `${data.metrics?.onTrackPercent || 0}% of objectives`, icon: <CheckCircle2 size={22} />, color: 'var(--accent-secondary)' },
          { label: 'AT RISK / BEHIND', val: data.metrics?.atRisk || 0, sub: `${data.metrics?.atRisk || 0} need attention`, icon: <AlertTriangle size={22} />, color: 'var(--accent-danger)', isAlert: true },
          { label: 'PLANNED SPEND', val: formatSpend(data.metrics?.plannedSpend || 0), sub: 'monthly forecast', icon: <Banknote size={22} />, color: 'var(--text-primary)', accentColor: 'var(--text-tertiary)', flex: 1.5 }
        ].map((kpi, i) => (
          <Col style={{ flex: '1 1 200px', minWidth: 200 }} key={i}>
            <motion.div variants={itemVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }} style={{ height: '100%' }}>
              <Card
                bodyStyle={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', height: '100%' }}
                style={{
                  borderRadius: 16, height: '100%', background: 'var(--glass-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-color)', borderLeft: `5px solid ${kpi.accentColor || kpi.color}`, position: 'relative', overflow: 'hidden'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>{kpi.label}</Text>
                  <div style={{ color: kpi.accentColor || kpi.color, opacity: 0.8 }}>
                    {kpi.icon}
                  </div>
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <Title level={2} style={{ margin: 0, color: kpi.isAlert ? 'var(--accent-danger)' : 'var(--text-primary)', fontSize: 32, fontWeight: 800, whiteSpace: 'nowrap' }}>{kpi.val}</Title>
                  {kpi.sub && <Text style={{ color: kpi.isAlert ? 'var(--accent-danger)' : 'var(--accent-secondary)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{kpi.sub}</Text>}
                </div>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} xl={16}>
          <motion.div variants={itemVariants} style={{ height: '100%' }}>
            <Card
              title={<div style={{ paddingTop: 8 }}><Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Objectives & key results</Title><Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Quarterly OKRs by account</Text></div>}
              extra={
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  <Button size="small" type="primary" style={{ background: 'var(--text-primary)', borderRadius: 16, padding: '0 16px', fontWeight: 600 }}>All</Button>
                  <Button size="small" style={{ borderRadius: 16, padding: '0 16px', fontWeight: 600, color: 'var(--text-secondary)', borderColor: 'var(--border-color)', background: 'var(--bg-tertiary)' }}>On Track</Button>
                  <Button size="small" style={{ borderRadius: 16, padding: '0 16px', fontWeight: 600, color: 'var(--text-secondary)', borderColor: 'var(--border-color)', background: 'var(--bg-tertiary)' }}>At Risk</Button>
                </div>
              }
              className="glassmorphism" style={{ borderRadius: 16, height: '100%', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {(data.objectives || []).map((okr, index) => (
                  <div key={index} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
                      <div>
                        <Tag color={okr.status === 'ON TRACK' || okr.status === 'COMPLETED' ? 'success' : 'error'} style={{ borderRadius: 12, marginBottom: 12, padding: '2px 10px', fontWeight: 700, background: okr.status === 'ON TRACK' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderColor: okr.status === 'ON TRACK' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: okr.status === 'ON TRACK' ? 'var(--accent-secondary)' : 'var(--accent-danger)' }}>
                          {okr.status} <Text type="secondary" style={{ fontSize: 10, marginLeft: 8, color: 'inherit', opacity: 0.8 }}>{okr.quarter}</Text>
                        </Tag>
                        <Title level={5} style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{okr.title}</Title>
                        <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>{okr.client} - owned by {okr.owner}</Text>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <Title level={3} style={{ margin: 0, fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>{okr.progress}%</Title>
                        <Text type="secondary" style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 700 }}>PROGRESS</Text>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {okr.keyResults.map(kr => (
                        <div key={kr.title} style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'nowrap' }}>
                          <Text style={{ width: 250, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, flexShrink: 0 }}>{kr.title}</Text>
                          <Text strong style={{ width: 100, fontSize: 13, textAlign: 'right', color: 'var(--text-primary)', flexShrink: 0 }}>{kr.current} / {kr.target}</Text>
                          <Progress percent={Math.round((kr.current / kr.target) * 100)} showInfo={false} strokeColor={okr.status === 'ON TRACK' ? 'var(--accent-secondary)' : 'var(--accent-warning)'} trailColor="var(--bg-tertiary)" style={{ flex: 1, minWidth: 100 }} size="small" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </Col>

        <Col xs={24} xl={8}>
          <motion.div variants={itemVariants} style={{ height: '100%' }}>
            <Card
              title={<div style={{ paddingTop: 8 }}><Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Channel maturity</Title><Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Agency Benchmarks</Text></div>}
              className="glassmorphism" style={{ borderRadius: 16, height: '100%', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
            >
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="var(--border-color)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Current Maturity" dataKey="A" stroke="var(--accent-secondary)" fill="var(--accent-secondary)" fillOpacity={0.4} strokeWidth={2} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, boxShadow: 'var(--shadow-md)', color: 'var(--text-primary)' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', padding: 16, borderRadius: 12, marginTop: 16, display: 'flex', gap: 12, alignItems: 'flex-start', boxShadow: 'var(--shadow-sm)' }}>
                <Sparkles size={18} color="var(--accent-secondary)" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <Text strong style={{ fontSize: 14, display: 'block', color: 'var(--accent-secondary)', marginBottom: 4 }}>System Insight</Text>
                  <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.5 }}>{data.insights?.bestOpportunity || 'Data analyzing...'}</Text>
                </div>
              </div>
            </Card>
          </motion.div>
        </Col>
      </Row>

      <motion.div variants={itemVariants}>
        <Card
          title={<div style={{ paddingTop: 8 }}><Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Initiative roadmap</Title><Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>What's planned, in-flight and at risk this quarter</Text></div>}
          extra={
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button type="primary" onClick={() => setIsInitiativeModalOpen(true)} icon={<Plus size={16} />} size="small" style={{ borderRadius: 8, fontWeight: 600, background: 'var(--accent-secondary)', border: 'none', boxShadow: 'var(--shadow-sm)' }}>Add Initiative</Button>
              <Button icon={<Filter size={16} />} size="small" style={{ borderRadius: 8, fontWeight: 600, color: 'var(--text-secondary)', borderColor: 'var(--border-color)', background: 'var(--bg-tertiary)' }}>Filters</Button>
            </div>
          }
          className="glassmorphism" style={{ borderRadius: 16, marginBottom: 24, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: 0 }}
        >
          <div style={{ overflowX: 'auto' }}>
            <Table columns={roadmapCols} dataSource={data.roadmap || []} pagination={false} rowKey="initiative" size="middle" scroll={{ x: 1000 }} style={{ minWidth: 1000 }} />
          </div>
        </Card>
      </motion.div>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={16}>
          <motion.div variants={itemVariants} style={{ height: '100%' }}>
            <Card
              title={<div style={{ paddingTop: 8 }}><Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Planned investment by channel</Title><Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Q3 FY26 forecast</Text></div>}
              className="glassmorphism" style={{ borderRadius: 16, height: '100%', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
            >
              <div style={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.investment || []} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="month" stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                    <YAxis stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                    <Tooltip cursor={{ fill: 'var(--bg-tertiary)' }} contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, boxShadow: 'var(--shadow-md)', color: 'var(--text-primary)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 13, paddingTop: 20, fontWeight: 500, color: 'var(--text-primary)' }} />
                    <Bar dataKey="seo" name="SEO" stackId="a" fill="var(--accent-secondary)" />
                    <Bar dataKey="paid" name="Paid Ads" stackId="a" fill="var(--accent-warning)" />
                    <Bar dataKey="content" name="Content" stackId="a" fill="var(--accent-primary)" />
                    <Bar dataKey="social" name="Social" stackId="a" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        </Col>

        <Col xs={24} xl={8}>
          <motion.div variants={itemVariants} style={{ height: '100%' }}>
            <Card
              title={<div style={{ paddingTop: 8 }}><Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Strategy briefs</Title><Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Living docs powering every campaign</Text></div>}
              className="glassmorphism" style={{ borderRadius: 16, height: '100%', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(data.briefs || []).map((b, i) => (
                  <motion.div key={i} whileHover={{ y: -3, transition: { duration: 0.2 } }}>
                    <div style={{ border: '1px solid var(--border-color)', padding: '16px', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ padding: 8, background: 'var(--bg-tertiary)', borderRadius: 8, color: 'var(--text-secondary)' }}>
                          <FileText size={18} />
                        </div>
                        <div>
                          <strong style={{ display: 'block', fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>{b.title}</strong>
                          <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>{b.client} · {b.owner} · {b.updatedAt || 'Recently'}</Text>
                        </div>
                      </div>
                      <Tag color={getBriefColor(b.status)} style={{ borderRadius: 12, fontWeight: 600, padding: '2px 10px' }}>{b.status}</Tag>
                    </div>
                  </motion.div>
                ))}
                {(!data.briefs || data.briefs.length === 0) && <Text type="secondary">No briefs generated yet.</Text>}
                <Button type="dashed" block style={{ marginTop: 12, borderRadius: 12, height: 44, fontWeight: 600, borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }} icon={<Sparkles size={16} />}>Draft new brief with AI</Button>
              </div>
            </Card>
          </motion.div>
        </Col>
      </Row>

      <motion.div variants={itemVariants} style={{ marginTop: 32, marginBottom: 16 }}>
        <Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Strategic risk register</Title>
        <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>What could derail this quarter, and who owns mitigation</Text>
      </motion.div>

      <Row gutter={[16, 16]}>
        {(data.risks || []).map((r, i) => {
          const colors = getRiskColors(r.level);
          return (
            <Col xs={24} xl={8} lg={8} key={i}>
              <motion.div variants={itemVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }} style={{ height: '100%' }}>
                <Card
                  bodyStyle={{ padding: 24, display: 'flex', flexDirection: 'column', height: '100%' }}
                  style={{
                    borderRadius: 16,
                    background: colors.bgColor,
                    border: `1px solid ${colors.borderColor}`,
                    boxShadow: 'var(--shadow-sm)',
                    height: '100%'
                  }}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: colors.color, fontSize: 12, fontWeight: 700, marginBottom: 12, letterSpacing: 1 }}>
                    <AlertTriangle size={16} /> {r.level}
                  </div>
                  <strong style={{ fontSize: 16, display: 'block', marginBottom: 24, color: 'var(--text-primary)', lineHeight: 1.4 }}>{r.title}</strong>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 16, borderTop: `1px solid ${colors.borderColor}` }}>
                    <Text style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Owner: <span style={{ color: 'var(--text-primary)' }}>{r.owner}</span></Text>
                    <Text style={{ fontSize: 13, color: colors.color, fontWeight: 600 }}>Impact: {r.impact}</Text>
                  </div>
                </Card>
              </motion.div>
            </Col>
          );
        })}
        {(!data.risks || data.risks.length === 0) && (
          <Col span={24}>
            <Card style={{ borderRadius: 16, textAlign: 'center', background: 'var(--bg-tertiary)', border: '1px dashed var(--border-color)' }}>
              <CheckCircle2 size={32} style={{ color: 'var(--accent-secondary)', margin: '0 auto 16px' }} />
              <Title level={5}>No strategic risks detected</Title>
              <Text type="secondary">All module metrics are within safe operational thresholds.</Text>
            </Card>
          </Col>
        )}
      </Row>

      <Modal
        title="Create New Objective"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={isCreating}
        okText="Create"
      >
        <Form form={form} layout="vertical" onFinish={handleCreateObjective}>
          <Form.Item name="title" label="Objective Title" rules={[{ required: true, message: 'Please enter a title' }]}>
            <Input placeholder="e.g. Become #1 organic brand" />
          </Form.Item>
          <Form.Item name="client" label="Client / Account" rules={[{ required: true, message: 'Please enter client name' }]}>
            <Input placeholder="e.g. Prestige Estates" />
          </Form.Item>
          <Form.Item name="owner" label="Owner">
            <Input placeholder="e.g. Agency Manager" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="progress" label="Initial Progress (%)" initialValue={0}>
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Status" initialValue="ON TRACK">
                <Select>
                  <Select.Option value="ON TRACK">On Track</Select.Option>
                  <Select.Option value="AT RISK">At Risk</Select.Option>
                  <Select.Option value="BEHIND">Behind</Select.Option>
                  <Select.Option value="COMPLETED">Completed</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="Add New Initiative"
        open={isInitiativeModalOpen}
        onCancel={() => setIsInitiativeModalOpen(false)}
        onOk={() => initiativeForm.submit()}
        confirmLoading={isCreatingInitiative}
        okText="Add Initiative"
        width={600}
      >
        <Form form={initiativeForm} layout="vertical" onFinish={handleCreateInitiative}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="initiative" label="Initiative Title" rules={[{ required: true, message: 'Required' }]}>
                <Input placeholder="e.g. Meta CAPi Implementation" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="client" label="Client / Account" rules={[{ required: true, message: 'Required' }]}>
                <Input placeholder="e.g. Lenskart" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="channel" label="Channel" initialValue="SEO">
                <Select>
                  <Select.Option value="SEO">SEO</Select.Option>
                  <Select.Option value="PAID">Paid Ads</Select.Option>
                  <Select.Option value="CONTENT">Content</Select.Option>
                  <Select.Option value="SOCIAL">Social</Select.Option>
                  <Select.Option value="CRM">CRM</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="owner" label="Owner">
                <Input placeholder="Name" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="deps" label="Dependencies" initialValue={0}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="phase" label="Phase" initialValue="Plan">
                <Select>
                  <Select.Option value="Plan">Plan</Select.Option>
                  <Select.Option value="Build">Build</Select.Option>
                  <Select.Option value="Launch">Launch</Select.Option>
                  <Select.Option value="Scale">Scale</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="timeline" label="Timeline">
                <DatePicker.RangePicker format="MMM DD" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="Status" initialValue="PLANNING">
                <Select>
                  <Select.Option value="PLANNING">Planning</Select.Option>
                  <Select.Option value="IN PROGRESS">In Progress</Select.Option>
                  <Select.Option value="AT RISK">At Risk</Select.Option>
                  <Select.Option value="COMPLETED">Completed</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

    </motion.div>
  );
};

export default Strategy;
