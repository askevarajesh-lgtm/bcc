import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Table, Button, Avatar, Spin, message, Tag, DatePicker, Select } from 'antd';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import { AlertTriangle, Calendar, ExternalLink, TrendingUp, CheckSquare, Briefcase, Activity, DollarSign } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import SlabCard from '../../../components/SlabCard';
import api from '../../../services/api';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const { Title, Text } = Typography;

const OverviewTab = () => {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedClient, setSelectedClient] = useState(null);
  const [allClients, setAllClients] = useState([]);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        const params = {
          month: selectedDate.month(),
          year: selectedDate.year()
        };
        if (selectedClient) {
          params.clientId = selectedClient;
        }
        const res = await api.get('/agency/overview', { params });
        setOverviewData(res.data.data);
        
        // Populate master client list only once if not filtered
        if (!selectedClient && res.data.data.clients) {
            setAllClients(res.data.data.clients);
        }
      } catch (error) {
        console.error('Failed to fetch agency overview:', error);
        message.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, [selectedDate, selectedClient]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const getCodeColor = (mos) => {
    if (mos >= 70) return 'var(--accent-primary)'; 
    if (mos >= 50) return 'var(--accent-warning)'; 
    return 'var(--accent-danger)'; 
  };

  const getStatusText = (mos) => {
    if (mos >= 70) return 'Healthy';
    if (mos >= 50) return 'At Risk';
    return 'Critical';
  };

  if (!overviewData && loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}><Spin size="large" /></div>;
  }

  if (!overviewData) return null;

  const { stats, revenueChartData, clients, team } = overviewData;
  const currentMonthName = selectedDate.format('MMMM YYYY');

  const kpis = [
    { label: 'ACTIVE CLIENTS', value: stats.activeClients, sub: 'Total Managed', color: 'var(--accent-primary)', icon: <Briefcase size={20} /> },
    { label: 'CURRENT MONTH REVENUE', value: `₹${(stats.currentMonthRevenue/100000).toFixed(1)}L`, sub: 'Collected this month', color: 'var(--accent-success)', icon: <DollarSign size={20} /> },
    { label: 'OUTSTANDING INVOICES', value: `₹${(stats.outstandingInvoicesAmount/100000).toFixed(1)}L`, sub: `${stats.outstandingInvoicesCount} pending payments`, color: 'var(--accent-danger)', icon: <AlertTriangle size={20} /> },
    { label: 'SLA COMPLIANCE', value: `${stats.slaCompliance}%`, sub: `${stats.breachedSlas} active breaches`, color: stats.slaCompliance >= 90 ? 'var(--accent-primary)' : 'var(--accent-warning)', icon: <Activity size={20} /> },
    { label: 'PROJECTS', value: stats.activeProjects, sub: `${stats.completedProjects} completed`, color: 'var(--accent-info)', icon: <CheckSquare size={20} /> },
    { label: 'TASKS COMPLETED', value: stats.completedTasksThisMonth, sub: `Out of ${stats.totalTasksThisMonth} total`, color: 'var(--accent-secondary)', icon: <TrendingUp size={20} /> },
  ];

  return (
    <Spin spinning={loading} tip="Updating dashboard...">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" >
      
      <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Command Center</Title>
          <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>Here's your agency performance — {currentMonthName}.</Text>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Select 
            allowClear
            placeholder="All Clients"
            value={selectedClient}
            onChange={(val) => setSelectedClient(val)}
            style={{ width: 200 }}
            size="large"
          >
            {allClients.map(c => (
              <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
            ))}
          </Select>
          <DatePicker 
            picker="month" 
            value={selectedDate} 
            onChange={(date) => { if(date) setSelectedDate(date); }} 
            size="large"
            style={{ borderRadius: 8, fontWeight: 600, width: 200 }}
            allowClear={false}
          />
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants}>
        <Row gutter={[24, 24]} style={{ marginBottom: 48 }}>
          {kpis.map((stat, idx) => (
            <Col xs={24} sm={12} lg={8} key={idx}>
              <div style={{
                background: 'var(--bg-tertiary)',
                borderRadius: 20,
                padding: 24,
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: 'var(--text-tertiary)' }}>{stat.label}</Text>
                  <div style={{ color: stat.color, background: `${stat.color}15`, padding: 8, borderRadius: 12 }}>
                    {stat.icon}
                  </div>
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>{stat.sub}</div>
                <div style={{ position: 'absolute', bottom: -20, right: -20, opacity: 0.05, transform: 'scale(3)' }}>
                  {stat.icon}
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={itemVariants} style={{ marginBottom: 48 }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={14}>
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 16, border: '1px solid var(--border-color)', padding: 24, height: '100%' }}>
              <Title level={5} style={{ margin: '0 0 24px 0', fontWeight: 800 }}>Month-wise Revenue (Collected vs Pending)</Title>
              <div style={{ height: 300, width: '100%' }}>
                <ResponsiveContainer>
                  <ComposedChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: 12, border: '1px solid var(--border-color)', boxShadow: '0 8px 24px rgba(0,0,0,0.05)', fontWeight: 600 }}
                      formatter={(value) => `₹${value.toLocaleString()}`}
                    />
                    <Legend />
                    <Bar dataKey="revenue" name="Collected Revenue" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} barSize={40} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Col>

          <Col xs={24} lg={10}>
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 16, border: '1px solid var(--border-color)', padding: 24, height: '100%', overflowY: 'auto', maxHeight: 400 }}>
              <Title level={5} style={{ margin: '0 0 24px 0', fontWeight: 800 }}>Employee Performance</Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {team.map((member, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar style={{ backgroundColor: 'var(--text-tertiary)', fontWeight: 700 }}>{member.initials}</Avatar>
                      <div>
                        <Text style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>{member.name}</Text>
                        <Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{member.tasksCompleted} / {member.tasksAssigned} tasks</Text>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Text style={{ display: 'block', fontWeight: 800, color: member.status === 'good' ? 'var(--accent-primary)' : 'var(--accent-warning)' }}>
                        {member.completionRate}%
                      </Text>
                      <Text style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }}>Completion</Text>
                    </div>
                  </div>
                ))}
                {team.length === 0 && <Text type="secondary">No team data available.</Text>}
              </div>
            </div>
          </Col>
        </Row>
      </motion.div>

      {/* Detailed Client List */}
      <motion.div variants={itemVariants} style={{ marginBottom: 64 }}>
        <Title level={3} style={{ margin: '0 0 8px 0', fontWeight: 800 }}>Client Health & Operations</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 32, fontSize: 14, fontWeight: 500 }}>All {clients.length} active clients - ranked by overall health</Text>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {clients.map(client => {
            const statusText = getStatusText(client.mos);
            const statusColor = getCodeColor(client.mos);
            
            return (
              <SlabCard key={client.id} shadowColor={statusColor} bodyStyle={{ padding: '24px 32px' }} style={{ borderLeft: `6px solid ${statusColor}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 200 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: statusColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 15 }}>{client.code}</div>
                    <div>
                      <Text style={{ fontWeight: 800, display: 'block', color: 'var(--text-primary)', fontSize: 16, marginBottom: 2 }}>{client.name}</Text>
                      <Tag style={{ margin: 0, background: 'transparent', border: `1px solid ${statusColor}40`, color: statusColor, fontWeight: 700 }}>MOS: {client.mos} ({statusText})</Tag>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>MONTHLY MRR</Text>
                      <Text style={{ fontWeight: 800, fontSize: 16 }}>₹{(client.mrr/100000).toFixed(1)}L</Text>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>ACTIVE PROJECTS</Text>
                      <Text style={{ fontWeight: 800, fontSize: 16 }}>{client.activeProjects}</Text>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {['seo', 'ads', 'leads', 'social', 'website', 'rev', 'cx'].map((key) => {
                      const val = client.signals[key] || 0;
                      return (
                        <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <span style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: 10, fontWeight: 700 }}>{key}</span>
                          <span style={{ color: getCodeColor(val), fontWeight: 800, fontSize: 13 }}>{Math.round(val)}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, justifyContent: 'flex-end' }}>
                    <Button type="text" icon={<ExternalLink size={18} />} style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>View Dashboard</Button>
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
    </Spin>
  );
};

export default OverviewTab;
