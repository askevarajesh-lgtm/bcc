import React from 'react';
import { Typography, Row, Col, Button, Tag, Empty, Table } from 'antd';
import { motion } from 'framer-motion';
import { AlertTriangle, Calendar, CheckCircle2, FileText, Receipt } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import BubbleCard from '../../../components/BubbleCard';
import { useGetInvoicesQuery } from '../../../api/invoiceApi';
import TaskDetailDrawer from '../../Tasks/TaskDetailDrawer';
import TaskCompletionCelebrate from '../../Tasks/TaskCompletionCelebrate';
import { useGetTasksQuery } from '../../../api/taskApi';
import axios from '../../../services/api';
import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const DashboardTab = () => {
  const { role, user } = useAuth();
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const [auditScore, setAuditScore] = useState(null);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    axios.get('/seo-workspace/audits')
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

  const { data: tasksData } = useGetTasksQuery({ limit: 1000 });
  const allTasks = tasksData?.data?.data || tasksData?.data?.tasks || [];
  const actualDeliverables = allTasks
    .filter(t => {
      const s = t.status?.toLowerCase();
      return ['completed', 'complete', 'approved', 'validated', 'done', 'review', 'in_review', 'sent_for_client_review', 'workflow_sent'].includes(s);
    })
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
    .slice(0, 5);

  const { data: invoicesData } = useGetInvoicesQuery({});
  const allInvoices = Array.isArray(invoicesData) ? invoicesData : (invoicesData?.data || []);
  const sentInvoices = [...allInvoices]
    .filter(i => i.invoiceStatus !== 'Draft')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const latestInvoice = sentInvoices.filter(i => i.paymentStatus !== 'Paid')[0];

  const invoiceColumns = [
    { 
      title: 'Invoice #', 
      dataIndex: 'invoiceNumber', 
      key: 'invoiceNumber', 
      render: (val) => <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: 13 }}>{val}</span> 
    },
    { 
      title: 'Amount', 
      dataIndex: 'grandTotal', 
      key: 'grandTotal', 
      render: (val) => <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>₹{(val || 0).toLocaleString()}</span> 
    },
    { 
      title: 'Due Date', 
      dataIndex: 'dueDate', 
      key: 'dueDate', 
      render: (val, rec) => <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>{dayjs(val || rec.createdAt).format('D MMM YYYY')}</span> 
    },
    { 
      title: 'Status', 
      dataIndex: 'paymentStatus', 
      key: 'paymentStatus', 
      render: (val) => (
        <Tag style={{ 
          margin: 0, fontWeight: 800, borderRadius: 8, padding: '2px 10px', border: 'none',
          background: val === 'Paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          color: val === 'Paid' ? 'var(--accent-primary)' : 'var(--accent-warning)'
        }}>{val || 'Pending'}</Tag>
      ) 
    },
    {
      title: '',
      key: 'action',
      render: (_, rec) => (
        <Button 
          type="link" 
          size="small"
          style={{ fontWeight: 700, color: 'var(--accent-secondary)', padding: 0 }}
          onClick={() => navigate(`/client/workspace/invoices/${rec._id}/view`)}
        >
          View
        </Button>
      )
    }
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      
      <motion.div variants={itemVariants} style={{ marginBottom: 32 }}>
        <Text type="secondary" style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5 }}>{dayjs().format('MMMM YYYY').toUpperCase()}</Text>
        <Title level={2} style={{ margin: '4px 0 8px 0', fontWeight: 800 }}>
          Good {dayjs().hour() < 12 ? 'morning' : dayjs().hour() < 17 ? 'afternoon' : 'evening'}, {user?.name || (role.includes('brand') ? 'Brand Team' : 'Team')}.
        </Title>
        <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>
          Here's your marketing performance overview.
        </Text>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '24px 24px 24px 8px', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: 'var(--accent-warning)' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: 12, borderRadius: '50%' }}><AlertTriangle size={20} /></div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>You have 2 content pieces pending your approval</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, marginTop: 4 }}>Review before 5 PM today to keep this week's content calendar on track.</div>
            </div>
          </div>
          <Button style={{ color: 'var(--accent-warning)', border: '2px solid rgba(245, 158, 11, 0.4)', background: 'transparent', borderRadius: 12, fontWeight: 700, height: 40 }}>Review approvals</Button>
        </div>
      </motion.div>

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

      <motion.div variants={itemVariants}>
        <Row gutter={48}>
          <Col xs={24} lg={16}>
            <Title level={4} style={{ margin: '0 0 8px 0', fontWeight: 800 }}>Recent deliverables</Title>
            <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 24, fontWeight: 500 }}>Last 5 items from your account team</Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {actualDeliverables.length > 0 ? (
                actualDeliverables.map((item, idx) => (
                  <div key={idx} className="hover-bg" style={{ display: 'flex', alignItems: 'center', padding: '20px 24px', background: 'var(--bg-secondary)', borderRadius: '24px 24px 24px 8px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ background: 'var(--bg-tertiary)', padding: 12, borderRadius: 12, color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                      <FileText size={18}/>
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <Text style={{ fontWeight: 700, display: 'block', fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>{item.title}</Text>
                      <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>{dayjs(item.dueDate || item.createdAt).format('D MMM YYYY')} {item.serviceType && `• ${item.serviceType.toUpperCase()}`}</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24, minWidth: 150, justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-primary)' }}>{item.status?.replace(/_/g, ' ')?.toUpperCase() || 'COMPLETED'}</span>
                      <div style={{ width: 100, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button 
                          type="primary" 
                          size="small" 
                          onClick={() => setSelectedTaskDetails(item)}
                          style={{ borderRadius: 8 }}
                        >
                          View Task
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <Empty description="No recent deliverables found" />
              )}
            </div>
          </Col>
          <Col xs={24} lg={8} style={{ marginTop: { xs: 48, lg: 0 } }}>
            <Title level={4} style={{ margin: '0 0 8px 0', fontWeight: 800 }}>Upcoming</Title>
            <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 24, fontWeight: 500 }}>Key dates this quarter</Text>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <BubbleCard bodyStyle={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ color: 'var(--text-secondary)', marginTop: 4, background: 'var(--bg-tertiary)', padding: 12, borderRadius: 12, border: '1px solid var(--border-color)' }}><FileText size={20} /></div>
                    <div>
                      <Text style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', fontWeight: 600, marginBottom: 4 }}>Next Invoice</Text>
                      {latestInvoice ? (
                        <>
                          <Text style={{ fontSize: 18, fontWeight: 800, display: 'block', color: 'var(--text-primary)', marginBottom: 4 }}>₹{(latestInvoice.grandTotal || 0).toLocaleString()}</Text>
                          <Text style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500 }}>due {dayjs(latestInvoice.dueDate || latestInvoice.createdAt).format('D MMM YYYY')}</Text>
                        </>
                      ) : (
                        <Text style={{ fontSize: 14, color: 'var(--text-tertiary)', fontWeight: 500 }}>No pending invoices</Text>
                      )}
                    </div>
                  </div>
                  {latestInvoice && (
                    <Button type="link" style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-secondary)', padding: 0 }} onClick={() => navigate(`/client/workspace/invoices/${latestInvoice._id}/view`)}>View</Button>
                  )}
                </div>
              </BubbleCard>
              
              <BubbleCard bodyStyle={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ color: 'var(--accent-secondary)', marginTop: 4, background: 'rgba(13,148,136,0.1)', padding: 12, borderRadius: 12, border: '1px solid rgba(13,148,136,0.2)' }}><Receipt size={20} /></div>
                    <div>
                      <Text style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', fontWeight: 600, marginBottom: 4 }}>Total Invoices</Text>
                      <Text style={{ fontSize: 22, fontWeight: 800, display: 'block', color: 'var(--text-primary)', marginBottom: 4 }}>{sentInvoices.length}</Text>
                      <Text style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500, lineHeight: 1.6 }}>
                        {sentInvoices.filter(i => i.paymentStatus === 'Paid').length} paid · {sentInvoices.filter(i => i.paymentStatus !== 'Paid').length} pending
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

      {/* Invoices Section */}
      {sentInvoices.length > 0 && (
        <motion.div variants={itemVariants} style={{ marginBottom: 40 }}>
          <BubbleCard bodyStyle={{ padding: 0 }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Title level={4} style={{ margin: '0 0 4px 0', fontWeight: 800 }}>Invoices</Title>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Your billing history from BCC Martech</Text>
              </div>
              <Button type="link" style={{ fontWeight: 700, color: 'var(--accent-secondary)' }} onClick={() => navigate('/client/billing')}>View Billing →</Button>
            </div>
            <Table
              columns={invoiceColumns}
              dataSource={sentInvoices.slice(0, 5)}
              rowKey="_id"
              pagination={false}
              className="custom-table"
              locale={{ emptyText: 'No invoices received yet.' }}
            />
            {sentInvoices.length > 5 && (
              <div style={{ padding: '16px 32px', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
                <Button type="link" style={{ fontWeight: 700, color: 'var(--accent-secondary)' }} onClick={() => navigate('/client/billing')}>View all {sentInvoices.length} invoices →</Button>
              </div>
            )}
          </BubbleCard>
        </motion.div>
      )}

      <TaskDetailDrawer
        task={selectedTaskDetails}
        visible={!!selectedTaskDetails}
        onClose={() => setSelectedTaskDetails(null)}
        onTaskCompleted={() => setShowCelebration(true)}
      />

      <TaskCompletionCelebrate
        isActive={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />

    </motion.div>
  );
};

export default DashboardTab;
