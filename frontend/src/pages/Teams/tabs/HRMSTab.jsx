import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Button, Tag } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Download, CheckCircle2, Calendar, IndianRupee, Star, Briefcase, FileText, BarChart2 } from 'lucide-react';
import PeopleTab from './HRMS/PeopleTab';
import AttendanceTab from './HRMS/AttendanceTab';
import LeaveTab from './HRMS/LeaveTab';
import PayrollTab from './HRMS/PayrollTab';
import PerformanceTab from './HRMS/PerformanceTab';
import RecruitmentTab from './HRMS/RecruitmentTab';
import TrainingTab from './HRMS/TrainingTab';
import AssetTab from './HRMS/AssetTab';
import AnalyticsTab from './HRMS/AnalyticsTab';
import AddEmployeeModal from './HRMS/AddEmployeeModal';
import { hrmsService } from '../../../services/hrms.service';

const { Title, Text } = Typography;

const HRMSTab = () => {
  const [activeTab, setActiveTab] = useState('people');
  const [isAddEmployeeModalVisible, setIsAddEmployeeModalVisible] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await hrmsService.getDashboardStats();
        if (res.success) setStats(res.data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      }
    };
    fetchStats();
  }, [activeTab]); // Refetch when switching tabs to keep metrics fresh

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'people':
        return <PeopleTab />;
      case 'attendance':
        return <AttendanceTab />;
      case 'leave':
        return <LeaveTab />;
      case 'payroll':
        return <PayrollTab />;
      case 'performance':
        return <PerformanceTab />;
      case 'recruitment':
        return <RecruitmentTab />;
      case 'training':
        return <TrainingTab />;
      case 'assets':
        return <AssetTab />;
      case 'analytics':
        return <AnalyticsTab />;
      default:
        return null;
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>

          <Title level={2} style={{ margin: '4px 0 0 0', fontWeight: 800 }}>HRMS</Title>
          <Text type="secondary" style={{ fontWeight: 500 }}>People operations for M1 Labs — hire, manage, develop, retain.</Text>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Tag style={{ borderRadius: 16, padding: '8px 16px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontWeight: 600 }}>M1 Labs</Tag>
          <Button icon={<UserPlus size={16} />} onClick={() => setIsAddEmployeeModalVisible(true)} style={{ borderRadius: 8, fontWeight: 600, border: 'none', color: '#fff', background: 'var(--accent-warning)', height: 40, boxShadow: 'var(--shadow-sm)' }}>Add Employee</Button>
          <Button icon={<IndianRupee size={16} />} style={{ borderRadius: 8, fontWeight: 600, border: 'none', color: '#fff', background: 'var(--accent-primary)', height: 40, boxShadow: 'var(--shadow-sm)' }}>Run Payroll</Button>
          <Button icon={<Download size={16} />} style={{ borderRadius: 8, fontWeight: 600, borderColor: 'var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-secondary)', height: 40 }}>Export</Button>
        </div>
      </motion.div>

      {/* Summary Metrics */}
      <motion.div variants={itemVariants}>
        <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
          {[
            { label: 'TOTAL EMPLOYEES', val: stats?.totalEmployees || '0', sub: 'Active workforce', tag: null },
            { label: 'ON LEAVE TODAY', val: stats?.leavesToday || '0', sub: 'All team present ✓', tag: stats?.leavesToday === 0 ? { text: 'ALL IN', color: 'rgba(16, 185, 129, 0.15)', tc: 'var(--accent-primary)' } : null },
            { label: 'PENDING APPROVALS', val: stats?.pendingApprovals || '0', sub: 'Leave requests', tag: stats?.pendingApprovals > 0 ? { text: 'ACTION', color: 'rgba(245, 158, 11, 0.15)', tc: 'var(--accent-warning)' } : null },
            { label: 'PAYROLL THIS MONTH', val: `₹${stats?.totalPayroll?.toLocaleString() || 0}`, sub: 'Disbursed', tag: null },
            { label: 'AVG PERFORMANCE', val: `${stats?.avgPerformance || 0}/5`, sub: '★★★★☆', tag: null, isStars: true },
            { label: 'OPEN POSITIONS', val: stats?.openPositions || '0', sub: 'Recruitment pipeline', tag: stats?.openPositions > 0 ? { text: 'HIRING', color: 'rgba(245, 158, 11, 0.15)', tc: 'var(--accent-warning)' } : null },
          ].map((metric, i) => (
            <Col xs={24} sm={12} lg={4} key={i}>
              <Card className="glassmorphism hover-bg" style={{ borderRadius: 16, border: '1px solid var(--border-color)', height: '100%' }} bodyStyle={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>{metric.label}</Text>
                  {metric.tag && <Tag style={{ margin: 0, borderRadius: 12, border: 'none', background: metric.tag.color, color: metric.tag.tc, fontWeight: 800, fontSize: 10 }}>{metric.tag.text}</Tag>}
                </div>
                <Title level={2} style={{ margin: '0 0 8px 0', fontWeight: 800 }}>{metric.val}</Title>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Text style={{ color: metric.isStars ? 'var(--accent-warning)' : 'var(--text-secondary)', fontSize: 13, fontWeight: metric.isStars ? 800 : 500 }}>{metric.sub}</Text>
                  {metric.pos && <Text style={{ color: 'var(--accent-primary)', fontSize: 13, fontWeight: 700 }}>▲ {metric.pos}</Text>}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </motion.div>

      {/* Inner Tabs Navigation */}
      <motion.div variants={itemVariants} style={{ marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
        <div style={{ display: 'flex', gap: 32, borderBottom: '1px solid var(--border-color)', minWidth: 800 }}>
          {[
            { id: 'people', label: 'People', icon: <UserPlus size={16} /> },
            { id: 'attendance', label: 'Attendance', icon: <Calendar size={16} /> },
            { id: 'leave', label: 'Leave', icon: <CheckCircle2 size={16} /> },
            // { id: 'payroll', label: 'Payroll', icon: <IndianRupee size={16} /> },
            // { id: 'performance', label: 'Performance', icon: <Star size={16} /> },
            // { id: 'recruitment', label: 'Recruitment', icon: <Briefcase size={16} /> },
            // { id: 'training', label: 'Training', icon: <FileText size={16} /> },
            // { id: 'assets', label: 'Assets', icon: <BarChart2 size={16} /> }, // Can change icon later
            // { id: 'analytics', label: 'HR Analytics', icon: <BarChart2 size={16} /> },
          ].map(tab => {
            const isActive = tab.id === activeTab;
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 16, borderBottom: isActive ? '2px solid var(--accent-warning)' : '2px solid transparent', color: isActive ? 'var(--accent-warning)' : 'var(--text-secondary)', fontWeight: isActive ? 700 : 600, cursor: 'pointer' }}>
                <span style={{ color: isActive ? 'inherit' : 'var(--text-tertiary)' }}>{tab.icon}</span>
                {tab.label}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Tab Content Wrapper */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderActiveTabContent()}
        </motion.div>
      </AnimatePresence>

      <AddEmployeeModal
        visible={isAddEmployeeModalVisible}
        onCancel={() => setIsAddEmployeeModalVisible(false)}
        onSuccess={() => {
          setIsAddEmployeeModalVisible(false);
          // If active tab is people, it could auto-refresh if we lift state up, 
          // or we just handle it inside PeopleTab if we put the modal there.
          // Since we moved modal to PeopleTab as well, we might not need it here.
        }}
      />
    </motion.div>
  );
};

export default HRMSTab;
