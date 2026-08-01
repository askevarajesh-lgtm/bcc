import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Button, Tag, Spin } from 'antd';
import { motion } from 'framer-motion';
import { AlertTriangle, Activity, Calendar, DollarSign, ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import SlabCard from '../../../components/SlabCard';
import api from '../../../services/api';

const { Title, Text } = Typography;

const OverviewTab = () => {
  const { user, role } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [globalMos, setGlobalMos] = useState(0);
  const [matrix, setMatrix] = useState({ healthy: 0, atRisk: 0, critical: 0 });
  const [slaStats, setSlaStats] = useState({ compliance: 100, activeBreaches: 0, atRiskCount: 0 });
  
  // New States
  const [projectStats, setProjectStats] = useState(null);
  const [taskStats, setTaskStats] = useState(null);
  const [plSummary, setPlSummary] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [mosRes, slaRes, projRes, taskRes, plRes] = await Promise.all([
          api.get('/mos/dashboard').catch(() => ({ data: {} })),
          api.get('/sla-success/dashboard-stats').catch(() => ({ data: {} })),
          api.get('/projects/summary-stats').catch(() => ({ data: {} })),
          api.get('/tasks/today-stats').catch(() => ({ data: {} })),
          api.get('/pl/summary').catch(() => ({ data: {} }))
        ]);
        
        const clientsData = mosRes.data?.data?.clients || [];
        setClients(clientsData);

        if (clientsData.length > 0) {
          const totalMos = clientsData.reduce((sum, c) => sum + (c.overall || 0), 0);
          setGlobalMos(Math.round(totalMos / clientsData.length));
          
          let healthy = 0;
          let atRisk = 0;
          let critical = 0;
          clientsData.forEach(c => {
            if (c.overall >= 70) healthy++;
            else if (c.overall >= 50) atRisk++;
            else critical++;
          });
          setMatrix({ healthy, atRisk, critical });
        }
        
        if (slaRes.data?.data) {
          setSlaStats(slaRes.data.data);
        }

        if (projRes.data?.data?.summary) {
          setProjectStats(projRes.data.data.summary);
        }
        
        if (taskRes.data?.data) {
          setTaskStats(taskRes.data.data);
        }
        
        if (plRes.data?.data?.summary) {
          setPlSummary(plRes.data.data.summary);
        }
        
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const getCodeColor = (mos) => {
    if (mos >= 70) return 'var(--accent-primary)'; // Healthy
    if (mos >= 50) return 'var(--accent-warning)'; // At Risk
    return 'var(--accent-danger)'; // Critical
  };

  const getStatusText = (mos) => {
    if (mos >= 70) return 'Healthy';
    if (mos >= 50) return 'At Risk';
    return 'Critical';
  };

  const stats = [
    { label: 'ACTIVE CLIENTS', value: clients.length, sub: 'Current total', color: 'var(--accent-primary)', trend: 'neutral', icon: <DollarSign size={16} /> },
    { label: 'SLA COMPLIANCE', value: `${slaStats.compliance}%`, sub: `${slaStats.activeBreaches} breaches`, color: slaStats.compliance >= 90 ? 'var(--accent-primary)' : 'var(--accent-danger)', trend: slaStats.compliance >= 90 ? 'up' : 'down' },
    { label: 'OPEN ESCALATIONS', value: slaStats.activeBreaches + slaStats.atRiskCount, sub: 'Needs attention', color: 'var(--accent-warning)', trend: 'neutral' },
    { label: 'PROJECTS ACTIVE', value: projectStats?.activeProjects || 0, sub: `${projectStats?.completedProjects || 0} completed`, color: 'var(--accent-primary)', trend: 'neutral' },
    { label: 'TASKS TODAY', value: taskStats?.dueToday || taskStats?.total || 0, sub: `${taskStats?.completedToday || 0} done today`, color: 'var(--accent-warning)', trend: 'neutral' },
    ...(role === 'agency_manager' ? [
        { label: 'REVENUE (YTD)', value: `₹${((plSummary?.totalRevenue || 0)/100000).toFixed(1)}L`, sub: 'P&L Analytics', color: 'var(--accent-primary)', trend: 'up' },
    ] : [
        { label: 'REVENUE (YTD)', value: `₹${((plSummary?.totalRevenue || 0)/100000).toFixed(1)}L`, sub: 'P&L Analytics', color: 'var(--accent-primary)', trend: 'up' },
        { label: 'COLLECTION RATE', value: '89.7%', sub: 'Avg collected', color: 'var(--accent-primary)', trend: 'neutral' }
    ])
  ];

  const upcoming = [
    { icon: <Calendar size={20} color="var(--accent-secondary)" />, title: 'Quarterly Reviews Scheduled', desc: 'Ensure all MOS drop reviews are conducted this week.', btn: 'Prepare', btnColor: 'var(--accent-secondary)' },
    { icon: <Activity size={20} color="var(--accent-warning)" />, title: 'Resolve Open Escalations', desc: `There are ${slaStats.activeBreaches} active SLA breaches.`, btn: 'View Escalations', btnColor: 'var(--accent-warning)' },
  ];

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}><Spin size="large" /></div>;
  }

  const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" >
      
      <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Good morning, {user?.name?.split(' ')[0] || 'User'}.</Title>
          <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>Here's {user?.companyName || 'your agency'} at a glance — {currentMonthName}.</Text>
        </div>
        <Tag style={{ borderRadius: 8, padding: '6px 16px', background: 'var(--bg-tertiary)', border: '2px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 700, fontSize: 13, boxShadow: '2px 2px 0 var(--border-color)' }}>{currentMonthName}</Tag>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Row gutter={[24, 24]} style={{ marginBottom: 48 }}>
          {stats.map((stat, idx) => (
            <Col xs={24} sm={12} lg={8} xl={8} xxl={8} key={idx}>
              <SlabCard style={{ height: '100%' }} bodyStyle={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Text type="secondary" style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, display: 'block', marginBottom: 12, color: 'var(--text-tertiary)' }}>{stat.label}</Text>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  {stat.trend === 'up' && <ArrowUpRight size={16} color={stat.color} />}
                  {stat.trend === 'down' && <ArrowDownRight size={16} color={stat.color} />}
                  {stat.trend === 'neutral' && <AlertTriangle size={16} color={stat.color} />}
                  <span style={{ color: stat.color, fontWeight: 700 }}>{stat.sub}</span>
                </div>
              </SlabCard>
            </Col>
          ))}
        </Row>
      </motion.div>

      {/* Massive Client List */}
      <motion.div variants={itemVariants} style={{ marginBottom: 64 }}>
        <Title level={3} style={{ margin: '0 0 8px 0', fontWeight: 800 }}>Your Clients — {currentMonthName}</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 32, fontSize: 14, fontWeight: 500 }}>All {clients.length} active clients - ranked by MOS score</Text>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {clients.sort((a,b) => (b.overall || 0) - (a.overall || 0)).map(client => {
            const statusText = getStatusText(client.overall);
            const statusColor = getCodeColor(client.overall);
            const code = (client.client || 'NA').substring(0, 2).toUpperCase();

            return (
              <SlabCard key={client.clientId} shadowColor={statusColor} bodyStyle={{ padding: '24px 32px' }} style={{ borderLeft: `6px solid ${statusColor}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 220 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: statusColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 15, boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.2)' }}>{code}</div>
                    <div>
                      <Text style={{ fontWeight: 800, display: 'block', color: 'var(--text-primary)', fontSize: 16, marginBottom: 4 }}>{client.client}</Text>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Tag style={{ background: 'var(--bg-tertiary)', color: statusColor, border: `1px solid ${statusColor}40`, borderRadius: 8, fontWeight: 800, padding: '6px 16px', fontSize: 14 }}>
                      {client.overall || 0} • {statusText}
                    </Tag>
                  </div>

                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {['seo', 'ads', 'leads', 'social', 'website', 'rev', 'cx'].map((key) => {
                      const val = client[key] || 0;
                      return (
                        <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'var(--bg-tertiary)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                          <span style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>{key}</span>
                          <span style={{ color: getCodeColor(val), fontWeight: 800, fontSize: 14 }}>{val}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, minWidth: 120, justifyContent: 'flex-end' }}>
                    <Button type="text" icon={<ExternalLink size={18} />} style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>View</Button>
                  </div>

                </div>

                {client.weakestSignals && client.weakestSignals.length > 0 && (
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', gap: 12, color: 'var(--accent-warning)', fontSize: 14, fontWeight: 600 }}>
                    <AlertTriangle size={18} /> Needs Improvement in: {client.weakestSignals.join(', ')}
                  </div>
                )}
              </SlabCard>
            );
          })}
          {clients.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              No clients found.
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OverviewTab;

