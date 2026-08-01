import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Button, Table, Avatar, Select, Spin, message, Tag } from 'antd';
import { motion } from 'framer-motion';
import { Calendar, Plus, Users, Clock, AlertTriangle, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { resourcesService } from '../../services/resources.service';

const { Title, Text } = Typography;

const Resources = () => {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({ totalCapacity: 0, allocated: 0, allocatedPercent: 0, available: 0, availablePercent: 0, overallocatedCount: 0, membersCount: 0 });
  const [utilBars, setUtilBars] = useState([]);
  const [teamAllocationData, setTeamAllocationData] = useState([]);
  const [allocationCols, setAllocationCols] = useState([]);
  const [calendarData, setCalendarData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString());

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await resourcesService.getDashboardData(selectedMonth);
      if (res.success) {
        setKpis(res.data.kpis);
        setUtilBars(res.data.teamUtilisation);
        setTeamAllocationData(res.data.clientAllocation.data);

        const dynamicCols = res.data.clientAllocation.columns.map(client => ({
          title: client,
          dataIndex: client,
          key: client,
          render: val => val ? <span style={{ fontWeight: 500 }}>{val}h</span> : <span style={{ color: 'var(--text-tertiary)' }}>—</span>
        }));

        setAllocationCols([
          { title: 'Team', dataIndex: 'name', key: 'name', render: text => <strong style={{ color: 'var(--text-primary)' }}>{text}</strong> },
          ...dynamicCols,
          { title: 'Total', dataIndex: 'total', key: 'total', render: val => <strong style={{ color: 'var(--text-primary)' }}>{val}h</strong> }
        ]);

        setCalendarData(res.data.availabilityCalendar);
      }
    } catch (error) {
      console.error('Failed to fetch resource data:', error);
      message.error('Failed to load resource data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // fetchData(); // Temporarily disabled while in "Coming Soon" state
  }, [selectedMonth]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const monthName = new Date(selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' });
  const firstDayIndex = new Date(new Date(selectedMonth).getFullYear(), new Date(selectedMonth).getMonth(), 1).getDay();
  const emptyDays = Array(firstDayIndex).fill(null);

  // --- COMING SOON PLACEHOLDER ---
  // Temporarily returning this screen to block access to the unfinished module.
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh', textAlign: 'center' }}>
      <div style={{ background: 'var(--bg-secondary)', padding: '32px', borderRadius: '50%', marginBottom: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <Users size={48} style={{ color: 'var(--accent-secondary)' }} />
      </div>
      <Title level={2} style={{ margin: '0 0 12px 0', fontWeight: 800 }}>Resource Management</Title>
      <Tag color="warning" style={{ borderRadius: 16, padding: '4px 12px', fontSize: 14, fontWeight: 600, marginBottom: 24, background: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>Upgrade Required</Tag>
      <Text type="secondary" style={{ maxWidth: 450, fontSize: 16, lineHeight: 1.6 }}>
        This module is available in this package. Purchase or upgrade your package to enable access.
      </Text>
    </motion.div>
  );
  // -------------------------------

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><Spin size="large" /></div>;
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>

          <Title level={2} style={{ margin: '4px 0 0 0', fontWeight: 800 }}>Resource Management</Title>
          <Text type="secondary" style={{ fontWeight: 500 }}>Capacity planning, workload balancing, and team availability.</Text>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button icon={<Calendar size={16} />} style={{ borderRadius: 8, fontWeight: 600, borderColor: 'var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-secondary)', height: 40 }}>{monthName}</Button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Row gutter={[24, 24]} style={{ marginBottom: 40 }}>
          {[
            { label: 'TOTAL CAPACITY', val: `${kpis.totalCapacity}h`, sub: `${kpis.membersCount} members × 160h/mo`, icon: <Users size={24} />, color: 'var(--text-primary)', bg: 'rgba(59, 130, 246, 0.15)', iconColor: 'var(--accent-primary)' },
            { label: 'ALLOCATED', val: `${kpis.allocated}h`, sub: `${kpis.allocatedPercent}%`, icon: <Clock size={24} />, color: 'var(--text-primary)', bg: 'rgba(139, 92, 246, 0.15)', iconColor: 'var(--accent-info)' },
            { label: 'AVAILABLE', val: `${kpis.available}h`, sub: `${kpis.availablePercent}%`, icon: <Clock size={24} />, color: 'var(--accent-primary)', bg: 'rgba(16, 185, 129, 0.15)', iconColor: 'var(--accent-primary)' },
            { label: 'OVERALLOCATED', val: `${kpis.overallocatedCount} members`, sub: kpis.overallocatedCount === 0 ? 'All within capacity' : 'Exceeding 160h', icon: <AlertTriangle size={24} />, color: kpis.overallocatedCount === 0 ? 'var(--accent-primary)' : 'var(--accent-danger)', bg: kpis.overallocatedCount === 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', iconColor: kpis.overallocatedCount === 0 ? 'var(--accent-primary)' : 'var(--accent-danger)' },
          ].map((kpi, i) => (
            <Col style={{ flex: '1 1 200px', minWidth: 200 }} key={i}>
              <motion.div whileHover={{ scale: 1.02, transition: { duration: 0.2 } }} style={{ height: '100%' }}>
                <Card
                  style={{
                    borderRadius: 16,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    boxShadow: 'var(--shadow-sm)',
                    height: '100%',
                    overflow: 'hidden'
                  }}
                  bodyStyle={{ padding: 0, display: 'flex', height: '100%' }}
                >
                  <div style={{ width: '35%', background: kpi.bg, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px 12px', borderRight: '1px solid var(--border-color)' }}>
                    <div style={{ color: kpi.iconColor, marginBottom: 8 }}>{kpi.icon}</div>
                    <Text style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, textAlign: 'center', color: kpi.iconColor, textTransform: 'uppercase' }}>{kpi.label}</Text>
                  </div>
                  <div style={{ width: '65%', padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Title level={2} style={{ margin: '0 0 4px 0', color: kpi.color, fontWeight: 800, lineHeight: 1.2 }}>{kpi.val}</Title>
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>{kpi.sub}</Text>
                  </div>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card
          title={<div style={{ paddingTop: 8 }}><Title level={5} style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>Team Utilisation</Title><Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Hours allocated this month — target 80%</Text></div>}
          extra={<div style={{ display: 'flex', gap: 16, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-primary)' }} /> Billable</span><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(13, 148, 136, 0.4)' }} /> Non-billable</span><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }} /> Available</span></div>}
          className="glassmorphism" style={{ borderRadius: 16, marginBottom: 32, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {utilBars.map((u, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}>
                  <div><strong style={{ color: 'var(--text-primary)' }}>{u.name}</strong> <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>{u.role}</Text></div>
                  <div><strong style={{ color: 'var(--text-primary)' }}>{u.util}%</strong> <span style={{ color: 'var(--text-secondary)' }}>utilised ·</span> <Text type="secondary" style={{ fontWeight: 600 }}>{u.bill + u.nonBill} / {u.cap}h</Text></div>
                </div>
                <div style={{ height: 28, display: 'flex', borderRadius: 8, overflow: 'hidden', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                  {u.bill > 0 && <div style={{ width: `${(u.bill / u.cap) * 100}%`, background: 'var(--accent-primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontSize: 11, fontWeight: 700, minWidth: 20 }}>{u.bill}h</div>}
                  {u.nonBill > 0 && <div style={{ width: `${(u.nonBill / u.cap) * 100}%`, background: 'rgba(13, 148, 136, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-primary)', fontSize: 11, fontWeight: 700, minWidth: 20 }}>{u.nonBill}h</div>}
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingRight: 12, color: 'var(--text-tertiary)', fontSize: 11, fontWeight: 600 }}>{u.free}h free</div>
                </div>
              </div>
            ))}
            {utilBars.length === 0 && <Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>No active team members found.</Text>}
          </div>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card
          title={<div style={{ paddingTop: 8 }}><Title level={5} style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>Client Allocation — {monthName}</Title><Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Hours each team member is committed to per client.</Text></div>}
          className="glassmorphism" style={{ borderRadius: 16, marginBottom: 32, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: 0 }}
        >
          <Table columns={allocationCols} dataSource={teamAllocationData} pagination={false} rowKey="id" size="middle" scroll={{ x: 1000 }} rowClassName={() => 'hover-bg'} />
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card
          title={<div style={{ paddingTop: 8 }}><Title level={5} style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>Availability Calendar — {monthName}</Title><Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Green = available · Amber = partial · Red = fully booked</Text></div>}
          extra={<div style={{ display: 'flex', gap: 12 }}><div style={{ display: 'flex', gap: 8 }}><Button size="middle" icon={<ChevronLeft size={16} />} style={{ borderRadius: 8 }} onClick={() => { const d = new Date(selectedMonth); d.setMonth(d.getMonth() - 1); setSelectedMonth(d.toISOString()); }} /><Button size="middle" icon={<ChevronRight size={16} />} style={{ borderRadius: 8 }} onClick={() => { const d = new Date(selectedMonth); d.setMonth(d.getMonth() + 1); setSelectedMonth(d.toISOString()); }} /></div></div>}
          className="glassmorphism" style={{ borderRadius: 16, marginBottom: 40, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 16 }}>
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => <div key={d} style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-tertiary)', letterSpacing: 1.5, marginBottom: 8 }}>{d}</div>)}

            {emptyDays.map((_, i) => <div key={`empty-${i}`} style={{ minHeight: 100, border: '1px solid transparent' }} />)}

            {calendarData.map((dayData, i) => (
              <div key={i} style={{ minHeight: 100, border: '1px solid var(--border-color)', borderRadius: 12, padding: 12, background: 'var(--bg-secondary)', position: 'relative', boxShadow: 'var(--shadow-sm)' }}>
                <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>{dayData.day}</strong>
                <div style={{ display: 'flex', gap: 6, position: 'absolute', bottom: 12, left: 12, flexWrap: 'wrap', width: 'calc(100% - 24px)' }}>
                  {dayData.users.map((u, j) => {
                    return <div key={j} style={{ width: 8, height: 8, borderRadius: '50%', background: u.status }} />
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

    </motion.div>
  );
};

export default Resources;
