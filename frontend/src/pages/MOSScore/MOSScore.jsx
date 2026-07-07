import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Button, Table, Tag, Progress, Select, Spin, message, Drawer, Form, InputNumber } from 'antd';
import { motion } from 'framer-motion';
import { Download, SlidersHorizontal, ArrowUpRight, ArrowDownRight, Zap, Activity, ChevronDown, AlertTriangle, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { mosApi } from '../../api/mosApi';

const { Title, Text } = Typography;
const { Option } = Select;

const MOSScore = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({ clients: [], trend: [], config: {} });
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [form] = Form.useForm();
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await mosApi.getMosDashboard();
      if (res.success) {
        setDashboardData(res.data);
      }
    } catch (error) {
      message.error('Failed to load MOS data');
    }
    setLoading(false);
  };

  const handleUpdateWeights = async (values) => {
    const total = Object.values(values).reduce((acc, curr) => acc + (curr || 0), 0);
    if (total !== 100) {
      return message.error(`Weights must total 100%. Current total: ${total}%`);
    }

    try {
      const res = await mosApi.updateMosWeights(values);
      if (res.success) {
        message.success('Weights updated successfully. Recalculating scores...');
        setDrawerVisible(false);
        fetchData();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update weights');
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await mosApi.triggerRecalculation();
      message.success('Recalculation complete');
      fetchData();
    } catch (error) {
      message.error('Failed to recalculate');
    }
    setRecalculating(false);
  };

  const handleExport = () => {
    if (!dashboardData.clients || dashboardData.clients.length === 0) return;
    
    const headers = ['Client', 'Overall MOS', 'Website', 'SEO/GEO', 'Social', 'Ads', 'Leads', 'Revenue', 'CX'];
    const csvRows = [headers.join(',')];

    dashboardData.clients.forEach(client => {
      const row = [
        `"${client.client}"`,
        client.overall,
        client.website,
        client.seo,
        client.social,
        client.ads,
        client.leads,
        client.rev,
        client.cx
      ];
      csvRows.push(row.join(','));
    });

    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MOS_Scores_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

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

  const signalCols = [
    { title: 'Client', dataIndex: 'client', key: 'client', render: text => <strong style={{ color: 'var(--text-primary)' }}>{text}</strong> },
    { title: 'Overall', dataIndex: 'overall', key: 'overall', render: val => <Tag style={{ borderRadius: 12, border: '1px solid', color: val >= 70 ? 'var(--accent-primary)' : val >= 50 ? 'var(--accent-warning)' : 'var(--accent-danger)', background: 'transparent' }}>{val}</Tag> },
    { title: 'Website', dataIndex: 'website', key: 'website', render: val => <span style={{ color: val >= 70 ? 'var(--accent-primary)' : val >= 50 ? 'var(--accent-warning)' : 'var(--accent-danger)', fontWeight: 600 }}>{val}</span> },
    { title: 'SEO/GEO', dataIndex: 'seo', key: 'seo', render: val => <span style={{ color: val >= 70 ? 'var(--accent-primary)' : val >= 50 ? 'var(--accent-warning)' : 'var(--accent-danger)', fontWeight: 600 }}>{val}</span> },
    { title: 'Social', dataIndex: 'social', key: 'social', render: val => <span style={{ color: val >= 70 ? 'var(--accent-primary)' : val >= 50 ? 'var(--accent-warning)' : 'var(--accent-danger)', fontWeight: 600 }}>{val}</span> },
    { title: 'Ads', dataIndex: 'ads', key: 'ads', render: val => <span style={{ color: val >= 70 ? 'var(--accent-primary)' : val >= 50 ? 'var(--accent-warning)' : 'var(--accent-danger)', fontWeight: 600 }}>{val}</span> },
    { title: 'Leads', dataIndex: 'leads', key: 'leads', render: val => <span style={{ color: val >= 70 ? 'var(--accent-primary)' : val >= 50 ? 'var(--accent-warning)' : 'var(--accent-danger)', fontWeight: 600 }}>{val}</span> },
    { title: 'Revenue', dataIndex: 'rev', key: 'rev', render: val => <span style={{ color: val >= 70 ? 'var(--accent-primary)' : val >= 50 ? 'var(--accent-warning)' : 'var(--accent-danger)', fontWeight: 600 }}>{val}</span> },
    { title: 'CX', dataIndex: 'cx', key: 'cx', render: val => <span style={{ color: val >= 70 ? 'var(--accent-primary)' : val >= 50 ? 'var(--accent-warning)' : 'var(--accent-danger)', fontWeight: 600 }}>{val}</span> },
    { title: 'MoM', dataIndex: 'mom', key: 'mom', render: val => <span style={{ color: val.includes('+') ? 'var(--accent-primary)' : val.includes('-') ? 'var(--accent-danger)' : 'var(--text-tertiary)', display: 'flex', alignItems: 'center', fontWeight: 700 }}>{val.includes('+') ? <ArrowUpRight size={14}/> : val.includes('-') ? <ArrowDownRight size={14}/> : '—'} {val.replace('+', '').replace('-', '')}</span> },
    { title: 'Action', key: 'action', render: () => <a style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>View <ArrowUpRight size={14}/></a> },
  ];

  const configCols = [
    { title: 'Signal', dataIndex: 'signal', key: 'signal', render: text => <strong style={{ color: 'var(--text-primary)' }}>{text}</strong> },
    { title: 'Weight', dataIndex: 'weight', key: 'weight', render: text => <Tag style={{ borderRadius: 12, border: 'none', margin: 0, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-primary)', fontWeight: 700 }}>{text}%</Tag> },
    { title: 'Description', dataIndex: 'desc', key: 'desc', render: text => <Text type="secondary" style={{ fontWeight: 500 }}>{text}</Text> },
    { title: 'Data Source', dataIndex: 'source', key: 'source', render: text => <Text type="secondary" style={{ fontWeight: 500 }}>{text}</Text> },
  ];

  const configDataList = [
    { key: 'website', signal: 'Website Health', desc: 'Core web vitals, SEO tech health, uptime', source: 'Google Search Console' },
    { key: 'seo', signal: 'SEO Performance', desc: 'Rankings, organic traffic, backlinks', source: 'GSC + SEMrush' },
    { key: 'geo', signal: 'GEO Visibility', desc: 'AI engine citations, brand entity', source: 'Proprietary' },
    { key: 'social', signal: 'Social Media', desc: 'Reach, engagement, follower growth', source: 'Meta + LinkedIn API' },
    { key: 'ads', signal: 'Performance Ads', desc: 'ROAS, CPL, spend efficiency', source: 'Google + Meta Ads' },
    { key: 'leads', signal: 'Lead Generation', desc: 'Total leads, quality score, conversion', source: 'CRM + Ads' },
    { key: 'revenue', signal: 'Revenue Impact', desc: 'Revenue attributed to marketing', source: 'CRM' },
    { key: 'cx', signal: 'Client Experience', desc: 'NPS, response time, satisfaction', source: 'Internal' },
  ].map(item => ({
    ...item,
    weight: dashboardData.config[item.key] || 0
  }));

  const totalClients = dashboardData.clients?.length || 0;
  const healthyCount = dashboardData.clients?.filter(c => c.overall >= 70).length || 0;
  const atRiskCount = dashboardData.clients?.filter(c => c.overall >= 50 && c.overall < 70).length || 0;
  const criticalCount = dashboardData.clients?.filter(c => c.overall < 50).length || 0;
  const avgMos = totalClients ? Math.round(dashboardData.clients.reduce((acc, curr) => acc + curr.overall, 0) / totalClients) : 0;
  
  const clientsBelowTarget = dashboardData.clients?.filter(c => c.overall < 70).sort((a, b) => a.overall - b.overall) || [];

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: '4px 0 0 0', fontWeight: 800 }}>Marketing Operating Score</Title>
          <Text type="secondary" style={{ fontWeight: 500 }}>Composite health index — the single number that tells you everything.</Text>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button icon={<RefreshCw size={16} />} loading={recalculating} onClick={handleRecalculate} style={{ borderRadius: 8, fontWeight: 600, borderColor: 'var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-secondary)' }}>Recalculate</Button>
          <Button icon={<SlidersHorizontal size={16} />} onClick={() => { form.setFieldsValue(dashboardData.config); setDrawerVisible(true); }} style={{ borderRadius: 8, fontWeight: 600, borderColor: 'var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-secondary)' }}>Configure Weights</Button>
          <Button type="primary" icon={<Download size={16} />} onClick={handleExport} style={{ borderRadius: 8, background: 'var(--accent-secondary)', fontWeight: 600, border: 'none', boxShadow: 'var(--shadow-md)' }}>Export All Scores</Button>
        </div>
      </motion.div>

      {/* Hero Card Overhaul */}
      <motion.div variants={itemVariants}>
        <Card 
          className="glassmorphism"
          style={{ borderRadius: 16, marginBottom: 32, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }} 
          bodyStyle={{ padding: 32 }}
        >
          <Row gutter={[48, 48]}>
            <Col xs={24} lg={8}>
              <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 240, height: 120, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ width: 240, height: 240, borderRadius: '50%', border: '24px solid var(--bg-tertiary)', position: 'absolute', top: 0, left: 0 }} />
                  <div style={{ width: 240, height: 240, borderRadius: '50%', border: '24px solid var(--accent-secondary)', borderBottomColor: 'transparent', borderRightColor: 'transparent', transform: 'rotate(45deg)', position: 'absolute', top: 0, left: 0, filter: 'drop-shadow(0 0 8px var(--accent-secondary))' }} />
                </div>
                <div style={{ position: 'absolute', top: 50, textAlign: 'center' }}>
                  <span style={{ fontSize: 48, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{avgMos}</span><span style={{ fontSize: 24, color: 'var(--text-tertiary)', fontWeight: 600 }}>/100</span>
                </div>
                
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <strong style={{ fontSize: 16, display: 'block', color: 'var(--text-primary)' }}>Agency Average MOS</strong>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Across {totalClients} active clients</span>
                </div>

                <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
                  <div style={{ textAlign: 'center' }}><strong style={{ color: 'var(--accent-primary)', fontSize: 18, display: 'block' }}>{healthyCount}</strong><span style={{ fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: 1, fontWeight: 700 }}>HEALTHY ≥70</span></div>
                  <div style={{ textAlign: 'center' }}><strong style={{ color: 'var(--accent-warning)', fontSize: 18, display: 'block' }}>{atRiskCount}</strong><span style={{ fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: 1, fontWeight: 700 }}>AT RISK 50-69</span></div>
                  <div style={{ textAlign: 'center' }}><strong style={{ color: 'var(--accent-danger)', fontSize: 18, display: 'block' }}>{criticalCount}</strong><span style={{ fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: 1, fontWeight: 700 }}>CRITICAL {"<50"}</span></div>
                </div>
              </div>
            </Col>
            
            <Col xs={24} lg={16}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <strong style={{ fontSize: 16, display: 'block', color: 'var(--text-primary)' }}>12-Month Agency MOS Trend</strong>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Smoothed monthly average · target 70</span>
                </div>
              </div>
              
              <div style={{ height: 200, marginTop: 20 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboardData.trend} margin={{ top: 10, right: 0, left: -30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="month" stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} />
                    <YAxis stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} domain={[40, 80]} />
                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                    <Area type="monotone" dataKey="val" stroke="var(--accent-secondary)" strokeWidth={3} fillOpacity={0.15} fill="var(--accent-secondary)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Col>
          </Row>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card 
          title={<div style={{ paddingTop: 8 }}><Title level={5} style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>All Clients — Signal Breakdown</Title><Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>8 weighted signals roll into the composite MOS score.</Text></div>} 
          extra={<Tag style={{ borderRadius: 12, fontWeight: 600, border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{totalClients} clients</Tag>}
          className="glassmorphism" style={{ borderRadius: 16, marginBottom: 32, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: 0 }}
        >
          <Table columns={signalCols} dataSource={dashboardData.clients} pagination={false} rowKey="clientId" size="middle" scroll={{ x: 'max-content' }} rowClassName={() => 'hover-bg'} />
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card 
          title={<div style={{ paddingTop: 8 }}><Title level={5} style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>MOS Signal Configuration</Title><Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>8 weighted inputs - totals 100%</Text></div>} 
          extra={<ChevronDown size={20} color="var(--text-tertiary)" />}
          className="glassmorphism" style={{ borderRadius: 16, marginBottom: 32, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: 0 }}
        >
          <Table columns={configCols} dataSource={configDataList} pagination={false} rowKey="key" size="middle" scroll={{ x: 'max-content' }} rowClassName={() => 'hover-bg'} />
          <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 1, minWidth: 300 }}>
              <strong style={{ width: 150, color: 'var(--text-primary)' }}>TOTAL</strong>
              <Progress percent={100} showInfo={false} strokeColor="var(--accent-primary)" style={{ flex: 1 }} />
              <strong style={{ color: 'var(--text-primary)' }}>100%</strong>
            </div>
            <Button onClick={() => { form.setFieldsValue(dashboardData.config); setDrawerVisible(true); }} style={{ borderRadius: 8, fontWeight: 600, borderColor: 'var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Request Custom Weights</Button>
          </div>
        </Card>
      </motion.div>

      {clientsBelowTarget.length > 0 && (
        <motion.div variants={itemVariants}>
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <Title level={4} style={{ margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>Improvement Plans — Clients Below Target</Title>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>{clientsBelowTarget.length} clients under MOS 70 - ranked by urgency</Text>
            </div>
            <Tag style={{ borderRadius: 12, border: 'none', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-warning)', fontWeight: 700, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={14}/> Action required</Tag>
          </div>

          <Row gutter={[24, 24]}>
            {clientsBelowTarget.map((c, i) => (
              <Col xs={24} md={12} lg={8} key={c.clientId}>
                <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }} style={{ height: '100%' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      background: 'var(--bg-secondary)', 
                      clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)',
                      display: 'flex',
                      flexDirection: 'column',
                      filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))',
                      border: '1px solid var(--border-color)', 
                      padding: 24,
                      position: 'relative'
                    }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 16, width: 32, height: 4, background: c.overall < 50 ? 'var(--accent-danger)' : 'var(--accent-warning)' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                      <strong style={{ fontSize: 18, color: 'var(--text-primary)' }}>{c.client}</strong>
                      <Activity size={16} color="var(--text-tertiary)" />
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                      <span style={{ fontSize: 32, fontWeight: 800, color: c.overall < 50 ? 'var(--accent-danger)' : 'var(--accent-warning)', lineHeight: 1 }}>{c.overall}</span>
                      <Tag style={{ margin: 0, borderRadius: 8, border: 'none', background: c.mom.includes('+') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: c.mom.includes('+') ? 'var(--accent-primary)' : 'var(--accent-danger)', fontWeight: 700, padding: '2px 8px' }}>
                        {c.mom.includes('+') ? <ArrowUpRight size={14} style={{ verticalAlign: 'middle', marginRight: 2 }}/> : <ArrowDownRight size={14} style={{ verticalAlign: 'middle', marginRight: 2 }}/>} 
                        {c.mom}
                      </Tag>
                    </div>

                    <Text type="secondary" style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, display: 'block', marginBottom: 12 }}>WEAKEST SIGNALS</Text>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                      {c.weakestSignals?.map((s, idx) => (
                        <Tag key={idx} style={{ margin: 0, borderRadius: 12, border: `1px solid ${s.score < 50 ? 'var(--accent-danger)' : 'var(--accent-warning)'}`, color: s.score < 50 ? 'var(--accent-danger)' : 'var(--accent-warning)', background: 'transparent', fontWeight: 600 }}>{s.signalName} {s.score}</Tag>
                      ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, marginBottom: 32 }}>
                      {c.weakestSignals?.map((ws, j) => (
                        <div key={j} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, border: '1px solid var(--border-color)' }}>{j+1}</div>
                          <Text type="secondary" style={{ fontSize: 13, flex: 1, fontWeight: 500, lineHeight: 1.5 }}>{ws.actions?.[0] || 'Analyze signal performance'}</Text>
                          <Tag style={{ margin: 0, borderRadius: 12, border: 'none', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-primary)', fontSize: 11, fontWeight: 700 }}>{ws.points?.[0] || '+5 pts'}</Tag>
                        </div>
                      ))}
                    </div>

                    <Button type="primary" icon={<Zap size={16} />} style={{ width: '100%', borderRadius: 8, background: 'var(--accent-secondary)', fontWeight: 700, border: 'none', height: 44, fontSize: 14 }}>Start Action Plan</Button>
                  </div>
                </motion.div>
              </Col>
            ))}
          </Row>
        </motion.div>
      )}

      {/* Configuration Drawer */}
      <Drawer
        title="Configure MOS Weights"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={400}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdateWeights}>
          {configDataList.map(item => (
            <Form.Item 
              key={item.key} 
              name={item.key} 
              label={`${item.signal} (%)`}
              rules={[{ required: true, message: 'Please enter weight' }]}
            >
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
          ))}
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%', background: 'var(--accent-secondary)', border: 'none' }}>
              Save Configuration
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </motion.div>
  );
};

export default MOSScore;
