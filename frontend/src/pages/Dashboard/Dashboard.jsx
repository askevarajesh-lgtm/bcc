import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Table, Tag, Progress, List, Button, Avatar, Spin, message } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, AlertCircle, CheckCircle2, Clock, Calendar, Download, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { commanderApi } from '../../api/commanderApi';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const Dashboard = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    activeClients: 0,
    avgMosScore: 0,
    slaCompliance: 100,
    openEscalations: 0,
    topClients: [],
    alertsData: [],
    executionActivityData: [],
    teamUtilisationData: [],
    teamCapacityData: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await commanderApi.getCommandCenterData();
        if (res && res.data) {
          setData(res.data.data || res.data);
        }
      } catch (error) {
        console.error('Failed to load command center data', error);
        message.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  const leaderboardCols = [
    { title: 'CLIENT', dataIndex: 'name', key: 'name', render: (text, record) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>{record.id}</Avatar>
        <strong style={{ color: 'var(--text-primary)' }}>{text}</strong>
      </div>
    )},
    { title: 'INDUSTRY', dataIndex: 'industry', key: 'industry', render: text => <Text type="secondary">{text}</Text> },
    { title: 'MOS SCORE', dataIndex: 'mos', key: 'mos', render: val => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <strong style={{ minWidth: 24, color: 'var(--text-primary)' }}>{val}</strong>
        <Progress percent={val} showInfo={false} size="small" strokeColor="var(--accent-secondary)" trailColor="var(--bg-tertiary)" style={{ width: 100 }} />
      </div>
    )},
    { title: 'STATUS', dataIndex: 'status', key: 'status', render: val => (
      <Tag style={{ borderRadius: 12, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', padding: '2px 8px' }}>
        <span style={{ color: 'var(--accent-secondary)', marginRight: 6, fontSize: '10px' }}>●</span> {val.toUpperCase()}
      </Tag>
    )}
  ];

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Header Section */}
      <motion.div variants={itemVariants} style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Text style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>Command Center</Text>
          <Title level={2} style={{ margin: '8px 0 4px 0', fontWeight: 800, fontSize: 36, letterSpacing: '-0.02em' }}>Platform Operations</Title>
          <Text type="secondary" style={{ fontSize: 15, fontWeight: 500 }}>Live platform operations and agency health.</Text>
        </div>
      </motion.div>

      {/* KPI Cards Row */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        {[
          { label: 'ACTIVE AGENCIES', val: data.activeClients, sub: 'Current total', type: 'up', gradient: 'linear-gradient(145deg, rgba(59, 130, 246, 0.1), transparent)' },
          { label: 'NEW AGENCIES', val: data.newAgencies || 0, sub: 'Last 30 days', type: 'up', gradient: 'linear-gradient(145deg, rgba(16, 185, 129, 0.1), transparent)' },
          { label: 'PENDING ONBOARDING', val: data.pendingOnboarding || 0, sub: 'Awaiting activation', type: 'alert', gradient: 'linear-gradient(145deg, rgba(245, 158, 11, 0.1), transparent)' },
          { label: 'AVG MOS SCORE', val: data.avgMosScore !== null ? data.avgMosScore : 'N/A', sub: 'Across portfolio', type: 'up', isProgress: data.avgMosScore !== null, gradient: 'linear-gradient(145deg, rgba(139, 92, 246, 0.1), transparent)' },
          { label: 'AT RISK AGENCIES', val: data.atRiskAgencies || 0, sub: 'MOS < 70', type: 'alert', gradient: 'linear-gradient(145deg, rgba(239, 68, 68, 0.1), transparent)' }
        ].map((kpi, i) => (
          <Col style={{ flex: '1 1 220px', minWidth: 220 }} key={i}>
            <motion.div variants={itemVariants} whileHover={{ y: -6, transition: { duration: 0.2 } }} style={{ height: '100%' }}>
              <div style={{ background: kpi.gradient || 'var(--bg-elevated)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '24px', borderRadius: 20, height: '100%', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.2, color: 'var(--text-tertiary)' }}>{kpi.label}</Text>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16 }}>
                  <Title level={2} style={{ margin: 0, fontSize: 38, fontWeight: 900, lineHeight: 1, color: 'var(--text-primary)' }}>{kpi.val}</Title>
                  {kpi.isProgress && <Progress type="circle" percent={kpi.val} size={54} strokeColor="var(--accent-info)" trailColor="var(--bg-tertiary)" format={() => ''} strokeWidth={8} />}
                </div>
                <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-tertiary)', padding: '6px 12px', borderRadius: 8, alignSelf: 'flex-start' }}>
                  {kpi.type === 'up' && <ArrowUpRight size={14} style={{ color: 'var(--accent-secondary)' }} />}
                  {kpi.type === 'down' && <ArrowDownRight size={14} style={{ color: 'var(--accent-warning)' }} />}
                  {kpi.type === 'alert' && <AlertCircle size={14} style={{ color: 'var(--accent-danger)' }} />}
                  <Text style={{ fontSize: 12, fontWeight: 700, color: kpi.type === 'alert' ? 'var(--accent-danger)' : kpi.type === 'down' ? 'var(--accent-warning)' : 'var(--text-secondary)' }}>{kpi.sub}</Text>
                </div>
              </div>
            </motion.div>
          </Col>
        ))}
      </Row>

      {/* Row 2: Action Center & Pipeline */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} xl={16}>
          <motion.div variants={itemVariants} style={{ height: '100%' }}>
            <div style={{ background: 'var(--bg-elevated)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '28px', borderRadius: 24, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <Title level={4} style={{ margin: 0, fontWeight: 800 }}>Action Center</Title>
                  <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>Active platform escalations & alerts</Text>
                </div>
                <Tag style={{ borderRadius: 12, padding: '4px 12px', fontWeight: 700, border: 'none', background: 'var(--accent-danger)', color: '#fff' }}>{data.openEscalations} Critical</Tag>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
                {data.alertsData && data.alertsData.length > 0 ? (
                  <List
                    itemLayout="horizontal"
                    dataSource={data.alertsData}
                    renderItem={item => (
                      <List.Item style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
                        <List.Item.Meta
                          avatar={
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                              {item.type === 'critical' ? <AlertCircle color="var(--accent-danger)" size={20} /> : 
                               item.type === 'warning' ? <AlertCircle color="var(--accent-warning)" size={20} /> : 
                               item.type === 'success' ? <CheckCircle2 color="var(--accent-secondary)" size={20} /> : 
                               <Clock color="var(--accent-primary)" size={20} />}
                            </div>
                          }
                          title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>{item.client}</strong>
                              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>{item.time}</span>
                            </div>
                          }
                          description={
                            <div>
                              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 8 }}>{item.desc}</div>
                              <Button size="small" type="text" onClick={() => navigate('/clients/sla')} style={{ padding: 0, color: 'var(--accent-primary)', fontWeight: 700, fontSize: 12, height: 'auto' }}>{item.action} →</Button>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                    No active escalations.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </Col>

        <Col xs={24} md={12} xl={8}>
          <motion.div variants={itemVariants} style={{ height: '100%' }}>
            <div style={{ background: 'var(--bg-elevated)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '28px', borderRadius: 24, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Title level={4} style={{ margin: 0, fontWeight: 800 }}>Onboarding Pipeline</Title>
              <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>Agency account statuses</Text>
              
              <div style={{ height: 220, minHeight: 220, flexShrink: 0, flexGrow: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
                {data.pipelineData && data.pipelineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: 'none', borderRadius: 12, boxShadow: 'var(--shadow-lg)', color: 'var(--text-primary)', fontWeight: 700 }} 
                        itemStyle={{ color: 'var(--text-primary)' }}
                      />
                      <Pie data={data.pipelineData} innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none" cornerRadius={4}>
                        {data.pipelineData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Text type="secondary">No pipeline data</Text>
                )}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', marginTop: 16 }}>
                {data.pipelineData && data.pipelineData.map(t => (
                  <div key={t.name} title={t.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', minWidth: 0 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: t.fill, flexShrink: 0 }}></span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{t.name} ({t.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </Col>
      </Row>

      {/* Row 3: Leaderboard, Activity */}
      <Row gutter={[24, 24]}>
        <Col xs={24} xl={16}>
          <motion.div variants={itemVariants} style={{ height: '100%' }}>
            <div style={{ background: 'var(--bg-elevated)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '28px', borderRadius: 24, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <Title level={4} style={{ margin: 0, fontWeight: 800 }}>Agency MOS Leaderboard</Title>
                  <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>Ranked by overall operational health</Text>
                </div>
              </div>
              <Table columns={leaderboardCols} dataSource={data.topClients} pagination={false} size="middle" rowKey="id" 
                rowClassName={() => 'glass-row'}
                locale={{ emptyText: 'No MOS data available' }}
                style={{ 
                  '--ant-table-header-bg': 'transparent', 
                  '--ant-table-header-color': 'var(--text-tertiary)',
                  '--ant-table-row-hover-bg': 'var(--bg-tertiary)'
                }} 
              />
            </div>
          </motion.div>
        </Col>
        
        <Col xs={24} md={12} xl={8}>
          <motion.div variants={itemVariants} style={{ height: '100%' }}>
            <div style={{ background: 'var(--bg-elevated)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '28px', borderRadius: 24, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)', height: '100%' }}>
              <Title level={4} style={{ margin: 0, fontWeight: 800 }}>Platform Activity</Title>
              <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>Aggregate operations (30 days)</Text>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 32 }}>
                {data.agencyActivity && data.agencyActivity.map((t, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Avatar size="large" style={{ background: 'var(--bg-secondary)', color: 'var(--accent-primary)', border: '1px solid var(--border-color)', fontWeight: 800, boxShadow: 'var(--shadow-sm)', flexShrink: 0 }}>
                      <Activity size={20} />
                    </Avatar>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Text style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{t.name}</Text>
                        <Text style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 800 }}>{t.count}</Text>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </Col>
      </Row>
    </motion.div>
  );


};

export default Dashboard;