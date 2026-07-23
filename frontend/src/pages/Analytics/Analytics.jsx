import React, { useState, useEffect } from 'react';
import { Typography, Select, Button, DatePicker, message, Tag } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Calendar as CalendarIcon, BarChart2, PieChart as PieChartIcon } from 'lucide-react';
import { analyticsApi } from '../../api/analyticsApi';
import { useGetClientsQuery } from '../../api/clientApi';
import dayjs from 'dayjs';

import AnalyticsTab from './tabs/AnalyticsTab';
import AttributionTab from './tabs/AttributionTab';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState('All Clients');
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'day'), dayjs()]);

  const { data: clientsData } = useGetClientsQuery({});
  const clients = clientsData?.data || [];

  useEffect(() => {
    // fetchAnalytics(); // Temporarily disabled while in "Coming Soon" state
  }, [selectedClient, dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const rangeParam = dateRange ? { start: dateRange[0].format('YYYY-MM-DD'), end: dateRange[1].format('YYYY-MM-DD') } : null;
      const res = await analyticsApi.getAnalytics(selectedClient, rangeParam);
      if (res.success) {
        setData(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!data) return message.warning('No data to export');
    
    try {
      const csvContent = "data:text/csv;charset=utf-8," 
        + "Metric,Value\n"
        + `Total Sessions,${data.metrics?.totalSessions || 0}\n`
        + `Total Leads,${data.metrics?.totalLeads || 0}\n`
        + `Ad Spend,${data.metrics?.totalAdSpend || '0'}\n`
        + `Organic Share,${data.metrics?.organicTrafficShare || '0%'}`;
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `analytics_export_${dayjs().format('YYYY-MM-DD')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('Export successful');
    } catch (error) {
      console.error('Export failed', error);
      message.error('Export failed');
    }
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

  // --- COMING SOON PLACEHOLDER ---
  // Temporarily returning this screen to block access to the unfinished module.
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh', textAlign: 'center' }}>
      <div style={{ background: 'var(--bg-secondary)', padding: '32px', borderRadius: '50%', marginBottom: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <BarChart2 size={48} style={{ color: 'var(--accent-secondary)' }} />
      </div>
      <Title level={2} style={{ margin: '0 0 12px 0', fontWeight: 800 }}>Analytics & Attribution</Title>
      <Tag color="processing" style={{ borderRadius: 16, padding: '4px 12px', fontSize: 14, fontWeight: 600, marginBottom: 24, background: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>Coming Soon</Tag>
      <Text type="secondary" style={{ maxWidth: 450, fontSize: 16, lineHeight: 1.6 }}>
        We are building a powerful new hub for your data. Unified performance metrics and attribution models will be available here shortly.
      </Text>
    </motion.div>
  );
  // -------------------------------

  const renderActiveTab = () => {
    if (loading || !data) return <div style={{ textAlign: 'center', padding: '100px 0' }}>Loading analytics...</div>;
    switch(activeTab) {
      case 'analytics': return <AnalyticsTab data={data} />;
      case 'attribution': return <AttributionTab data={data} />;
      default: return <AnalyticsTab data={data} />;
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: '4px 0 0 0', fontWeight: 800 }}>{activeTab === 'analytics' ? 'Analytics' : 'Attribution'}</Title>
          <Text type="secondary">
            {activeTab === 'analytics' ? 'Unified performance data across all channels and clients.' : 'Understand which channels and touchpoints drive conversions.'}
          </Text>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Select 
            value={selectedClient} 
            onChange={setSelectedClient}
            style={{ width: 180, fontWeight: 600 }} 
            size="large"
          >
            <Option value="All Clients">All Clients</Option>
            {clients.map(c => <Option key={c._id} value={c._id}>{c.name}</Option>)}
          </Select>
          <RangePicker 
            value={dateRange}
            onChange={setDateRange}
            style={{ borderRadius: 8, height: 40, borderColor: 'var(--border-color)', background: 'var(--bg-secondary)', fontWeight: 600 }}
          />
          {activeTab === 'analytics' && (
            <Button type="primary" icon={<Download size={16} />} onClick={handleExport} style={{ borderRadius: 8, height: 40, background: 'var(--accent-secondary)', color: '#fff', border: 'none', boxShadow: 'var(--shadow-md)', fontWeight: 600 }}>
              Export
            </Button>
          )}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} style={{ display: 'flex', gap: 32, borderBottom: '1px solid var(--border-color)', marginBottom: 32, overflowX: 'auto', paddingBottom: 2 }}>
        <div 
          onClick={() => setActiveTab('analytics')}
          style={{ 
            paddingBottom: 16, 
            borderBottom: activeTab === 'analytics' ? '3px solid var(--accent-secondary)' : '3px solid transparent', 
            fontWeight: activeTab === 'analytics' ? 700 : 600, 
            color: activeTab === 'analytics' ? 'var(--text-primary)' : 'var(--text-secondary)', 
            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' 
          }}
        >
          <BarChart2 size={18} color={activeTab === 'analytics' ? "var(--accent-secondary)" : "var(--text-secondary)"}/> Analytics
        </div>
        <div 
          onClick={() => setActiveTab('attribution')}
          style={{ 
            paddingBottom: 16, 
            borderBottom: activeTab === 'attribution' ? '3px solid var(--accent-secondary)' : '3px solid transparent', 
            fontWeight: activeTab === 'attribution' ? 700 : 600, 
            color: activeTab === 'attribution' ? 'var(--text-primary)' : 'var(--text-secondary)', 
            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' 
          }}
        >
          <PieChartIcon size={18} color={activeTab === 'attribution' ? "var(--accent-secondary)" : "var(--text-secondary)"}/> Attribution
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, y: -10 }}
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.2, staggerChildren: 0.05 } }
          }}
        >
          {renderActiveTab()}
        </motion.div>
      </AnimatePresence>

    </motion.div>
  );
};

export default Analytics;
