import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Button, Tag, Empty, Table, Spin, DatePicker, Avatar } from 'antd';
import { motion } from 'framer-motion';
import { AlertTriangle, Calendar, CheckCircle2, FileText, Receipt, CheckSquare, TrendingUp, DollarSign } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import BubbleCard from '../../../components/BubbleCard';
import TaskDetailDrawer from '../../Tasks/TaskDetailDrawer';
import TaskCompletionCelebrate from '../../Tasks/TaskCompletionCelebrate';
import api from '../../../services/api';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const DashboardTab = () => {
  const { role, user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState(null);
  const [auditScore, setAuditScore] = useState(null);
  
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedTaskDetails, setSelectedTaskDetails] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    fetchOverview();
  }, [selectedDate]);

  useEffect(() => {
    // Fetch Audit score separately since it depends on the SEO module
    api.get('/seo-workspace/audits')
      .then(res => {
        const audits = res.data;
        if (audits && audits.length > 0) {
          audits.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          const latestAudit = audits[audits.length - 1];
          setAuditScore(latestAudit.metrics?.performance || 0);
        }
      })
      .catch(err => console.error('Failed to fetch audits:', err));
  }, []);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const params = {
        month: selectedDate.month(),
        year: selectedDate.year()
      };
      const res = await api.get('/client/overview', { params });
      if (res.data && res.data.success) {
        setOverviewData(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load client overview', error);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  if (!overviewData && loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}><Spin size="large" /></div>;
  }

  if (!overviewData) return null;

  const renderExecutiveDashboard = () => {
    const { stats, upcomingInvoice, pendingApprovals, recentInvoices } = overviewData;
    const currentMonthName = selectedDate.format('MMMM YYYY');

    const kpis = [
      { label: 'ACTIVE PROJECTS', value: stats.activeProjects, sub: `${stats.completedProjects} total completed`, color: 'var(--accent-primary)', icon: <CheckSquare size={20} /> },
      { label: 'PENDING APPROVALS', value: pendingApprovals?.length || 0, sub: 'Awaiting your review', color: 'var(--accent-info)', icon: <CheckCircle2 size={20} /> },
      { label: 'MONTHLY SPEND', value: `₹${(stats.paidAmountThisMonth/100000).toFixed(1)}L`, sub: 'Paid this month', color: 'var(--accent-success)', icon: <DollarSign size={20} /> },
      { label: 'OUTSTANDING AMOUNT', value: `₹${(stats.outstandingAmount/100000).toFixed(1)}L`, sub: `${stats.pendingInvoicesCount} pending invoices`, color: stats.outstandingAmount > 0 ? 'var(--accent-danger)' : 'var(--accent-success)', icon: <AlertTriangle size={20} /> },
    ];

    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        {/* Header Section */}
        <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={2} style={{ margin: '4px 0 8px 0', fontWeight: 800 }}>
              Good {dayjs().hour() < 12 ? 'morning' : dayjs().hour() < 17 ? 'afternoon' : 'evening'}, {user?.name || 'Brand Team'}.
            </Title>
            <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>
              Here's your executive overview for {currentMonthName}.
            </Text>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <DatePicker 
              picker="month" 
              value={selectedDate} 
              onChange={(date) => date && setSelectedDate(date)} 
              size="large"
              allowClear={false}
            />
          </div>
        </motion.div>

        {/* KPI Cards */}
        <motion.div variants={itemVariants} style={{ marginBottom: 32 }}>
          <Row gutter={[16, 16]}>
            {kpis.map((kpi, idx) => (
              <Col xs={24} sm={12} lg={6} key={idx}>
                <div style={{
                  background: 'var(--bg-tertiary)',
                  borderRadius: 20,
                  padding: 24,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                  border: '1px solid var(--border-color)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ position: 'absolute', top: -10, right: -10, width: 80, height: 80, borderRadius: '50%', background: kpi.color, opacity: 0.05 }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color }}>
                      {kpi.icon}
                    </div>
                  </div>
                  <Title level={3} style={{ margin: '0 0 4px 0', fontWeight: 800 }}>{kpi.value}</Title>
                  <Text style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>
                    {kpi.label}
                  </Text>
                  <Text style={{ color: 'var(--text-tertiary)', fontSize: 11, fontWeight: 500 }}>
                    {kpi.sub}
                  </Text>
                </div>
              </Col>
            ))}
          </Row>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Row gutter={48}>
            <Col xs={24} lg={12}>
              <Title level={4} style={{ margin: '0 0 8px 0', fontWeight: 800 }}>Pending Approvals</Title>
              <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 24, fontWeight: 500 }}>Tasks awaiting your review</Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {pendingApprovals && pendingApprovals.length > 0 ? (
                  pendingApprovals.map((item, idx) => (
                    <div key={idx} className="hover-bg" style={{ display: 'flex', alignItems: 'center', padding: '20px 24px', background: 'var(--bg-secondary)', borderRadius: '24px 24px 24px 8px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', flexWrap: 'wrap', gap: 16 }}>
                      <div style={{ background: 'var(--bg-tertiary)', padding: 12, borderRadius: 12, color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                        <FileText size={18}/>
                      </div>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <Text style={{ fontWeight: 700, display: 'block', fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>{item.title}</Text>
                        <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>{dayjs(item.dueDate || item.createdAt).format('D MMM YYYY')}</Text>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 24, minWidth: 150, justifyContent: 'flex-end' }}>
                        <Button type="primary" size="small" onClick={() => setSelectedTaskDetails(item)} style={{ borderRadius: 8 }}>
                          Review Task
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <Empty description="No tasks pending approval" />
                )}
              </div>
            </Col>

            <Col xs={24} lg={12} style={{ marginTop: { xs: 48, lg: 0 } }}>
              <Title level={4} style={{ margin: '0 0 8px 0', fontWeight: 800 }}>Financial Overview</Title>
              <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 24, fontWeight: 500 }}>Billing & Spend</Text>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <BubbleCard bodyStyle={{ padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div style={{ color: 'var(--text-secondary)', marginTop: 4, background: 'var(--bg-tertiary)', padding: 12, borderRadius: 12, border: '1px solid var(--border-color)' }}><FileText size={20} /></div>
                      <div>
                        <Text style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', fontWeight: 600, marginBottom: 4 }}>Next Invoice</Text>
                        {upcomingInvoice ? (
                          <>
                            <Text style={{ fontSize: 18, fontWeight: 800, display: 'block', color: 'var(--text-primary)', marginBottom: 4 }}>₹{(upcomingInvoice.grandTotal || 0).toLocaleString()}</Text>
                            <Text style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500 }}>due {dayjs(upcomingInvoice.dueDate || upcomingInvoice.createdAt).format('D MMM YYYY')}</Text>
                          </>
                        ) : (
                          <Text style={{ fontSize: 14, color: 'var(--text-tertiary)', fontWeight: 500 }}>No pending invoices</Text>
                        )}
                      </div>
                    </div>
                    {upcomingInvoice && (
                      <Button type="link" style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-secondary)', padding: 0 }} onClick={() => navigate(`/client/workspace/invoices/${upcomingInvoice._id}/view`)}>View</Button>
                    )}
                  </div>
                </BubbleCard>
                
                <BubbleCard bodyStyle={{ padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div style={{ color: 'var(--accent-secondary)', marginTop: 4, background: 'rgba(13,148,136,0.1)', padding: 12, borderRadius: 12, border: '1px solid rgba(13,148,136,0.2)' }}><Receipt size={20} /></div>
                      <div>
                        <Text style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', fontWeight: 600, marginBottom: 4 }}>Total Invoices</Text>
                        <Text style={{ fontSize: 22, fontWeight: 800, display: 'block', color: 'var(--text-primary)', marginBottom: 4 }}>{stats.totalInvoicesCount}</Text>
                        <Text style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500, lineHeight: 1.6 }}>
                          {stats.totalInvoicesCount - stats.pendingInvoicesCount} paid · {stats.pendingInvoicesCount} pending
                        </Text>
                      </div>
                    </div>
                    <Button type="link" style={{ padding: 0, fontWeight: 700, color: 'var(--accent-secondary)', fontSize: 13 }} onClick={() => navigate('/client/billing')}>View All</Button>
                  </div>
                </BubbleCard>
              </div>
            </Col>
          </Row>
        </motion.div>
      </motion.div>
    );
  };

  const renderOperationsDashboard = () => {
    const { stats, recentDeliverables, actionItems } = overviewData;
    const currentMonthName = selectedDate.format('MMMM YYYY');

    const kpis = [
      { label: 'TASKS COMPLETED', value: stats.completedTasksThisMonth, sub: `Out of ${stats.totalTasksThisMonth} this month`, color: 'var(--accent-secondary)', icon: <TrendingUp size={20} /> },
      { label: 'OPEN TASKS', value: stats.openTasksCount, sub: `In progress`, color: 'var(--accent-primary)', icon: <CheckSquare size={20} /> },
      { label: 'OVERDUE TASKS', value: stats.overdueTasksCount, sub: `Requires action`, color: stats.overdueTasksCount > 0 ? 'var(--accent-danger)' : 'var(--accent-success)', icon: <AlertTriangle size={20} /> },
      { label: 'DELIVERABLES IN QUEUE', value: stats.pendingDeliverables, sub: `In pipeline`, color: 'var(--accent-info)', icon: <FileText size={20} /> },
    ];

    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        {/* Header Section */}
        <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={2} style={{ margin: '4px 0 8px 0', fontWeight: 800 }}>
              Good {dayjs().hour() < 12 ? 'morning' : dayjs().hour() < 17 ? 'afternoon' : 'evening'}, {user?.name || 'Brand Team'}.
            </Title>
            <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>
              Here's your operations and execution overview for {currentMonthName}.
            </Text>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <DatePicker 
              picker="month" 
              value={selectedDate} 
              onChange={(date) => date && setSelectedDate(date)} 
              size="large"
              allowClear={false}
            />
          </div>
        </motion.div>

        {/* KPI Cards */}
        <motion.div variants={itemVariants} style={{ marginBottom: 32 }}>
          <Row gutter={[16, 16]}>
            {kpis.map((kpi, idx) => (
              <Col xs={24} sm={12} lg={6} key={idx}>
                <div style={{
                  background: 'var(--bg-tertiary)',
                  borderRadius: 20,
                  padding: 24,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                  border: '1px solid var(--border-color)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ position: 'absolute', top: -10, right: -10, width: 80, height: 80, borderRadius: '50%', background: kpi.color, opacity: 0.05 }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color }}>
                      {kpi.icon}
                    </div>
                  </div>
                  <Title level={3} style={{ margin: '0 0 4px 0', fontWeight: 800 }}>{kpi.value}</Title>
                  <Text style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>
                    {kpi.label}
                  </Text>
                  <Text style={{ color: 'var(--text-tertiary)', fontSize: 11, fontWeight: 500 }}>
                    {kpi.sub}
                  </Text>
                </div>
              </Col>
            ))}
          </Row>
        </motion.div>

        {/* Marketing Health Score */}
        <motion.div variants={itemVariants}>
          <BubbleCard large style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 8px rgba(13,148,136,0.2))' }}>
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--border-color)" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--accent-secondary)" strokeWidth="3" strokeDasharray={`${auditScore || 0}, 100`} strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: auditScore ? 44 : 24, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{auditScore ? auditScore : 'N/A'}</span>
                  {auditScore ? <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700, marginTop: 4 }}>OF 100</span> : null}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 300 }}>
                <Text style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 800, letterSpacing: 1.5, display: 'block', marginBottom: 8 }}>MARKETING OPERATING SCORE</Text>
                <Title level={2} style={{ margin: '0 0 12px 0', fontWeight: 800 }}>Marketing Health Score</Title>
                {auditScore ? (
                  <>
                    <Tag style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 12, fontWeight: 700, padding: '4px 16px', marginBottom: 16, fontSize: 14 }}>
                      <CheckCircle2 size={16} style={{ marginRight: 6, verticalAlign: '-3px' }} /> Score Generated
                    </Tag>
                    <Text type="secondary" style={{ display: 'block', maxWidth: 600, fontSize: 15, fontWeight: 500, lineHeight: 1.6 }}>Your latest SEO audit score is <strong style={{color: 'var(--text-primary)'}}>{auditScore}</strong>. Keep optimizing to improve your performance.</Text>
                  </>
                ) : (
                  <Text type="secondary" style={{ display: 'block', maxWidth: 600, fontSize: 15, fontWeight: 500, lineHeight: 1.6 }}>An SEO audit has not been generated yet for your account. Once your agency runs an audit, the score will appear here.</Text>
                )}
              </div>
            </div>
          </BubbleCard>
        </motion.div>

        {/* Deliverables and Upcoming Row */}
        <motion.div variants={itemVariants}>
          <Row gutter={48}>
            <Col xs={24} lg={12}>
              <Title level={4} style={{ margin: '0 0 8px 0', fontWeight: 800 }}>Recent deliverables</Title>
              <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 24, fontWeight: 500 }}>Latest updates from your account team</Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {recentDeliverables && recentDeliverables.length > 0 ? (
                  recentDeliverables.map((item, idx) => (
                    <div key={idx} className="hover-bg" style={{ display: 'flex', alignItems: 'center', padding: '20px 24px', background: 'var(--bg-secondary)', borderRadius: '24px 24px 24px 8px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', flexWrap: 'wrap', gap: 16 }}>
                      <div style={{ background: 'var(--bg-tertiary)', padding: 12, borderRadius: 12, color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                        <FileText size={18}/>
                      </div>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <Text style={{ fontWeight: 700, display: 'block', fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>{item.title}</Text>
                        <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>{dayjs(item.dueDate || item.createdAt).format('D MMM YYYY')}</Text>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 24, minWidth: 150, justifyContent: 'flex-end' }}>
                        <Button type="primary" size="small" onClick={() => setSelectedTaskDetails(item)} style={{ borderRadius: 8 }}>
                          View Task
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <Empty description="No recent deliverables found" />
                )}
              </div>
            </Col>

            <Col xs={24} lg={12} style={{ marginTop: { xs: 48, lg: 0 } }}>
              <Title level={4} style={{ margin: '0 0 8px 0', fontWeight: 800 }}>Action Items</Title>
              <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 24, fontWeight: 500 }}>Tasks requiring attention</Text>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {actionItems && actionItems.length > 0 ? (
                  actionItems.map((item, idx) => (
                    <div key={idx} className="hover-bg" style={{ display: 'flex', alignItems: 'center', padding: '20px 24px', background: 'var(--bg-secondary)', borderRadius: '24px 24px 24px 8px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', flexWrap: 'wrap', gap: 16 }}>
                      <div style={{ background: 'var(--bg-tertiary)', padding: 12, borderRadius: 12, color: 'var(--accent-danger)', border: '1px solid var(--border-color)' }}>
                        <AlertTriangle size={18}/>
                      </div>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <Text style={{ fontWeight: 700, display: 'block', fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>{item.title}</Text>
                        <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Due: {dayjs(item.dueDate || item.createdAt).format('D MMM YYYY')}</Text>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 24, minWidth: 150, justifyContent: 'flex-end' }}>
                        <Button type="primary" size="small" onClick={() => setSelectedTaskDetails(item)} style={{ borderRadius: 8 }}>
                          Resolve
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <Empty description="No action items found" />
                )}
              </div>
            </Col>
          </Row>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <Spin spinning={loading} tip="Updating dashboard...">
      {role === 'brand_super_admin' ? renderExecutiveDashboard() : renderOperationsDashboard()}

      <TaskDetailDrawer
        task={selectedTaskDetails}
        visible={!!selectedTaskDetails}
        onClose={() => setSelectedTaskDetails(null)}
        onTaskCompleted={() => {
          setShowCelebration(true);
          fetchOverview();
        }}
      />

      <TaskCompletionCelebrate
        isActive={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />
    </Spin>
  );
};

export default DashboardTab;
