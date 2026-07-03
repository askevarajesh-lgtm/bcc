import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Button, Spin, message } from 'antd';
import { motion } from 'framer-motion';
import { Download, Calendar, TrendingUp, Users, ShieldCheck, Activity, RefreshCcw, Link as LinkIcon, ChevronDown } from 'lucide-react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { businessIntelService } from '../../services/businessIntel.service';
import { cohortData as mockCohortData } from '../../data/mock'; // Temporarily keep cohort UI structure if data not fully dynamic yet, but we will make it dynamic

const { Title, Text } = Typography;

const BusinessIntel = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    kpis: { mrr: 0, arr: 0, mrrGrowthRate: 0, arpu: 0, ltv: 0, activeClients: 0 },
    mrrGrowthData: [],
    forecastData: [],
    pieData: [],
    churnData: { rate: 0, revenueAtRisk: 0, avgContractLength: 0, reasons: [] },
    ratios: { grossMargin: 0, nrr: 0, ltvCac: '0x', payback: '0 mo' }
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await businessIntelService.getDashboardData();
      if (res.success) {
        setData(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch business intelligence data:', error);
      message.error('Failed to load business intelligence data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  const formatCurrency = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    return `₹${val.toLocaleString()}`;
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><Spin size="large" /></div>;
  }

  const { kpis, mrrGrowthData, forecastData, pieData, churnData, ratios } = data;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5 }}>AGENCY OPS</Text>
          <Title level={2} style={{ margin: '4px 0 0 0', fontWeight: 800 }}>Business Intelligence</Title>
          <Text type="secondary" style={{ fontWeight: 500 }}>Agency-level growth metrics, forecasting, and strategic insights.</Text>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button icon={<Calendar size={16} />} style={{ borderRadius: 8, fontWeight: 600, borderColor: 'var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-secondary)', height: 40 }}>Last 12 months <ChevronDown size={14} style={{marginLeft: 4}}/></Button>
          <Button type="primary" icon={<Download size={16} />} style={{ borderRadius: 8, background: 'var(--accent-secondary)', height: 40, fontWeight: 700, border: 'none', boxShadow: 'var(--shadow-md)' }}>Export Board</Button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Row gutter={[16, 24]} style={{ marginBottom: 40 }}>
          {[
            { label: 'MRR', val: formatCurrency(kpis.mrr), sub: `${kpis.mrrGrowthRate >= 0 ? '+' : ''}${kpis.mrrGrowthRate}% MoM`, pos: kpis.mrrGrowthRate >= 0, icon: <LinkIcon size={20}/>, color: 'var(--text-primary)' },
            { label: 'ARR', val: formatCurrency(kpis.arr), sub: 'Annualised run rate', icon: <TrendingUp size={20}/>, color: 'var(--text-primary)' },
            { label: 'MRR GROWTH RATE', val: `${kpis.mrrGrowthRate >= 0 ? '+' : ''}${kpis.mrrGrowthRate}%`, sub: 'Recent avg', color: kpis.mrrGrowthRate >= 0 ? 'var(--accent-primary)' : 'var(--accent-danger)', icon: <Activity size={20}/> },
            { label: 'ARPU', val: formatCurrency(kpis.arpu), sub: `${kpis.activeClients} active clients`, icon: <Users size={20}/>, color: 'var(--text-primary)' },
            { label: 'CLIENT LTV (AVG)', val: formatCurrency(kpis.ltv), sub: `${churnData.avgContractLength} months avg tenure`, icon: <ShieldCheck size={20}/>, color: 'var(--text-primary)' },
          ].map((kpi, i) => (
            <Col style={{ flex: '1 1 200px', minWidth: 200 }} key={i}>
              <motion.div whileHover={{ y: -2, transition: { duration: 0.2 } }} style={{ height: '100%' }}>
                <Card 
                  bodyStyle={{ padding: '24px 20px' }} 
                  style={{ 
                    borderRadius: '32px 6px 32px 6px',
                    height: '100%',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    boxShadow: '4px 4px 0 rgba(13, 148, 136, 0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: 'var(--text-tertiary)' }}>{kpi.label}</Text>
                    <div style={{ color: 'var(--accent-secondary)' }}>{kpi.icon}</div>
                  </div>
                  <Title level={2} style={{ margin: '0 0 8px', color: kpi.color, fontWeight: 800 }}>{kpi.val}</Title>
                  <Text style={{ fontSize: 12, fontWeight: 600, color: kpi.pos ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>{kpi.pos && '↑'} {kpi.sub}</Text>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card 
          title={<div style={{ paddingTop: 8 }}><Title level={5} style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>MRR Growth — Last 12 Months</Title><Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>In ₹ Lakhs</Text></div>} 
          className="glassmorphism" style={{ borderRadius: 16, marginBottom: 40, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div style={{ height: 420 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={mrrGrowthData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-secondary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-secondary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="month" stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 500 }} />
                <YAxis yAxisId="left" stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 500 }} domain={[0, 'auto']} tickFormatter={val => `${val}L`} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 500 }} domain={[-10, 'auto']} tickFormatter={val => `${val}%`} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }} />
                <Area yAxisId="left" type="monotone" dataKey="actual" name="MRR (Lakhs)" stroke="var(--accent-secondary)" strokeWidth={3} fillOpacity={1} fill="url(#colorAct)" />
                <Line yAxisId="right" type="monotone" dataKey="growth" name="Growth %" stroke="var(--accent-warning)" strokeWidth={3} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Row gutter={[32, 32]} style={{ marginBottom: 40 }}>
          <Col xs={24} lg={24} xl={24} xxl={16}>
            <Card 
              title={<div style={{ paddingTop: 8 }}><Title level={5} style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>Client Retention by Cohort</Title><Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>% of cohort still active each month after onboarding</Text></div>} 
              className="glassmorphism" style={{ borderRadius: 16, height: '100%', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowX: 'auto', paddingBottom: 16 }}>
                <div style={{ display: 'flex', minWidth: 600, fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', padding: '0 8px 12px', letterSpacing: 1 }}>
                  <div style={{ width: 90 }}>COHORT</div>
                  <div style={{ flex: 1, textAlign: 'center' }}>M0</div>
                  <div style={{ flex: 1, textAlign: 'center' }}>M1</div>
                  <div style={{ flex: 1, textAlign: 'center' }}>M2</div>
                  <div style={{ flex: 1, textAlign: 'center' }}>M3</div>
                  <div style={{ flex: 1, textAlign: 'center' }}>M4</div>
                  <div style={{ flex: 1, textAlign: 'center' }}>M5</div>
                </div>
                {mockCohortData.map((c, i) => (
                  <div key={i} style={{ display: 'flex', minWidth: 600, alignItems: 'center', padding: '6px 8px', fontSize: 13 }}>
                    <div style={{ width: 90, fontWeight: 700, color: 'var(--text-primary)' }}>{c.cohort}</div>
                    {['m0', 'm1', 'm2', 'm3', 'm4', 'm5'].map(m => {
                      const val = c[m];
                      let bg = 'transparent';
                      let color = 'var(--text-tertiary)';
                      if (val) {
                        if (val >= 95) { bg = 'var(--accent-primary)'; color = '#fff'; }
                        else if (val >= 85) { bg = 'rgba(16, 185, 129, 0.2)'; color = 'var(--accent-primary)'; }
                        else { bg = 'rgba(245, 158, 11, 0.2)'; color = 'var(--accent-warning)'; }
                      }
                      return (
                        <div key={m} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                          {val ? <div style={{ background: bg, color: color, padding: '8px 0', width: '90%', textAlign: 'center', borderRadius: 6, fontWeight: 700 }}>{val}%</div> : <div style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>—</div>}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 24, fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginTop: 24, paddingLeft: 8 }}>
                <span style={{ letterSpacing: 1.5, color: 'var(--text-tertiary)' }}>SCALE:</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 16, height: 12, background: 'rgba(245, 158, 11, 0.2)', borderRadius: 4 }}/> {'<85%'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 16, height: 12, background: 'rgba(16, 185, 129, 0.2)', borderRadius: 4 }}/> 85-94%</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 16, height: 12, background: 'var(--accent-primary)', borderRadius: 4 }}/> 95%+</span>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={24} xl={24} xxl={8}>
            <Card 
              title={<div style={{ paddingTop: 8 }}><Title level={5} style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>Revenue by Client Age</Title><Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Contribution to MRR by tenure</Text></div>} 
              className="glassmorphism" style={{ borderRadius: 16, height: '100%', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', height: 280 }}>
                <div style={{ width: '50%', height: '100%' }}>
                  {pieData.reduce((acc, curr) => acc + curr.value, 0) > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none">
                          {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Text type="secondary">No active clients</Text>
                    </div>
                  )}
                </div>
                <div style={{ width: '50%', paddingLeft: 24 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {pieData.map((d, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }}/> <Text type="secondary" style={{ fontWeight: 600 }}>{d.name}</Text></span>
                        <strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>{d.value}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card 
          title={<div style={{ paddingTop: 8 }}><Title level={5} style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>Churn Analysis</Title><Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Health of the existing client book</Text></div>} 
          className="glassmorphism" style={{ borderRadius: 16, marginBottom: 40, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
        >
          <Row gutter={48}>
            <Col xs={24} lg={24} xl={24} xxl={8} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: 16, padding: 24, background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}>
                  <Text type="secondary" style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: 'var(--text-tertiary)' }}>MONTHLY CHURN RATE</Text>
                  <Title level={2} style={{ margin: '12px 0 8px', color: churnData.rate > 3 ? 'var(--accent-danger)' : 'var(--accent-primary)', fontWeight: 800 }}>{churnData.rate}%</Title>
                  <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>{churnData.rate > 3 ? 'Above' : 'Below'} 3% target</Text>
                </div>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: 16, padding: 24, background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}>
                  <Text type="secondary" style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: 'var(--text-tertiary)' }}>REVENUE AT CHURN RISK</Text>
                  <Title level={2} style={{ margin: '12px 0 8px', color: 'var(--accent-warning)', fontWeight: 800 }}>{formatCurrency(churnData.revenueAtRisk)}</Title>
                  <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Based on suspended accounts</Text>
                </div>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: 16, padding: 24, background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}>
                  <Text type="secondary" style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: 'var(--text-tertiary)' }}>AVG CONTRACT LENGTH</Text>
                  <Title level={2} style={{ margin: '12px 0 8px', color: 'var(--text-primary)', fontWeight: 800 }}>{churnData.avgContractLength} mo</Title>
                  <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Across active clients</Text>
                </div>
              </div>
            </Col>
            <Col xs={24} lg={24} xl={24} xxl={16}>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 24, marginTop: 8 }}>Churn reasons</Text>
              <div style={{ height: 420 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={churnData.reasons} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                    <XAxis type="number" stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 500 }} />
                    <YAxis dataKey="reason" type="category" stroke="var(--text-secondary)" axisLine={false} tickLine={false} width={120} tick={{ fontSize: 13, fontWeight: 600 }} />
                    <Tooltip cursor={{ fill: 'var(--bg-tertiary)' }} contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                    <Bar dataKey="val" fill="var(--accent-danger)" radius={[0, 6, 6, 0]} barSize={40}>
                      {churnData.reasons.map((entry, index) => {
                        const colors = ['var(--accent-danger)', 'var(--accent-warning)', 'var(--accent-secondary)', 'var(--text-tertiary)'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Col>
          </Row>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card 
          title={<div style={{ paddingTop: 8 }}><Title level={5} style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>90-Day Revenue Forecast</Title><Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Three scenarios extending current MRR through upcoming months</Text></div>} 
          className="glassmorphism" style={{ borderRadius: 16, marginBottom: 40, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
        >
          <Row gutter={[24, 24]} style={{ marginBottom: 40 }}>
            <Col xs={24} lg={24} xl={8} xxl={8}>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 16, padding: 24, background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}>
                <Text type="secondary" style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: 'var(--text-tertiary)' }}>CONSERVATIVE</Text>
                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 12, color: 'var(--text-primary)' }}>₹{forecastData.length > 3 ? forecastData[3].cons : 0}L / mo</div>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Assumes 2% churn rate</Text>
              </div>
            </Col>
            <Col xs={24} lg={24} xl={8} xxl={8}>
              <div style={{ border: '2px solid var(--accent-primary)', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow-md)' }}>
                <Text type="secondary" style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: 'var(--accent-primary)' }}>BASE</Text>
                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 12, color: 'var(--text-primary)' }}>₹{forecastData.length > 3 ? forecastData[3].base : 0}L / mo</div>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Assumes sent pipeline wins</Text>
              </div>
            </Col>
            <Col xs={24} lg={24} xl={8} xxl={8}>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 16, padding: 24, background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}>
                <Text type="secondary" style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: 'var(--text-tertiary)' }}>OPTIMISTIC</Text>
                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 12, color: 'var(--text-primary)' }}>₹{forecastData.length > 3 ? forecastData[3].opt : 0}L / mo</div>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Assumes draft + sent pipeline wins</Text>
              </div>
            </Col>
          </Row>

          <div style={{ height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={forecastData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="month" stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 500 }} />
                <YAxis stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 500 }} domain={[0, 'auto']} tickFormatter={val => `${val}L`} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }} />
                <Line type="monotone" dataKey="act" name="Actual" stroke="var(--accent-secondary)" strokeWidth={3} />
                <Line type="monotone" dataKey="cons" name="Conservative" stroke="var(--text-tertiary)" strokeWidth={3} strokeDasharray="6 6" />
                <Line type="monotone" dataKey="base" name="Base" stroke="var(--accent-primary)" strokeWidth={3} strokeDasharray="6 6" />
                <Line type="monotone" dataKey="opt" name="Optimistic" stroke="var(--accent-info)" strokeWidth={3} strokeDasharray="6 6" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      <div style={{ marginBottom: 24, marginTop: 40 }}>
        <Title level={5} style={{ margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>Key Ratios</Title>
        <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Unit economics & operating health</Text>
      </div>

      <motion.div variants={itemVariants}>
        <Row gutter={[16, 24]} style={{ paddingBottom: 40 }}>
          {[
            { label: 'LTV : CAC RATIO', val: ratios.ltvCac, sub: 'Healthy - target ≥ 3x', icon: <ShieldCheck size={20}/>, color: 'var(--text-primary)' },
            { label: 'PAYBACK PERIOD', val: ratios.payback, sub: 'CAC recovered in <6 mo', icon: <RefreshCcw size={20}/>, color: 'var(--text-primary)' },
            { label: 'NET REVENUE RETENTION', val: `${ratios.nrr}%`, sub: '↗ Expansion > churn', color: 'var(--accent-primary)', icon: <TrendingUp size={20}/> },
            { label: 'AGENCY GROSS MARGIN', val: `${ratios.grossMargin}%`, sub: 'Service-business benchmark', icon: <LinkIcon size={20}/>, color: 'var(--text-primary)' },
          ].map((kpi, i) => (
            <Col style={{ flex: '1 1 200px', minWidth: 200 }} key={i}>
              <motion.div whileHover={{ y: -2, transition: { duration: 0.2 } }} style={{ height: '100%' }}>
                <Card 
                  bodyStyle={{ padding: '24px 20px' }} 
                  style={{ 
                    borderRadius: '6px 32px 6px 32px',
                    height: '100%',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    boxShadow: '4px 4px 0 rgba(13, 148, 136, 0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: 'var(--text-tertiary)' }}>{kpi.label}</Text>
                    <div style={{ color: 'var(--accent-secondary)' }}>{kpi.icon}</div>
                  </div>
                  <Title level={2} style={{ margin: '0 0 8px', color: kpi.color, fontWeight: 800 }}>{kpi.val}</Title>
                  <Text style={{ fontSize: 12, fontWeight: 600, color: kpi.pos ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>{kpi.pos && '↑'} {kpi.sub}</Text>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      </motion.div>

    </motion.div>
  );
};

export default BusinessIntel;
