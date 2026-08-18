import React, { useCallback, useMemo, useState } from 'react';
import { Typography, message } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, PieChart as PieChartIcon, Sparkles, Lightbulb } from 'lucide-react';
import dayjs from 'dayjs';

import { useGetClientsQuery } from '../../api/clientApi';
import { useAnalyticsData } from './hooks/useAnalyticsData';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { exportRowsAsCsv } from './utils/csvExport';

import DashboardFilters from './components/DashboardFilters';
import DashboardSkeleton from './components/DashboardSkeleton';
import ErrorState from './components/ErrorState';
import AnalyticsTab from './tabs/AnalyticsTab';
import AttributionTab from './tabs/AttributionTab';
import SeoIntelligenceTab from './tabs/SeoIntelligenceTab';
import AiInsightsTab from './tabs/AiInsightsTab';

const { Title, Text } = Typography;

const TABS = [
  { key: 'analytics', label: 'Analytics', icon: BarChart2, title: 'Analytics', description: 'Unified performance data across all channels and clients.' },
  { key: 'attribution', label: 'Attribution', icon: PieChartIcon, title: 'Attribution', description: 'Understand which channels and touchpoints drive conversions.' },
  { key: 'seo-intelligence', label: 'SEO Intelligence', icon: Sparkles, title: 'SEO Intelligence', description: 'Real metrics from Website Audit, Technical SEO, Keyword Intelligence, Rank Tracking, AEO, GEO, Competitor Intelligence, and Automation & Monitoring.' },
  { key: 'ai-insights', label: 'AI Insights', icon: Lightbulb, title: 'AI Insights', description: 'Rule-based insights calculated from real traffic, ranking, and technical data — not model-generated summaries.' }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [selectedClient, setSelectedClient] = useState('All Clients');
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'day'), dayjs()]);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 250);

  const { data: clientsData } = useGetClientsQuery({});
  const clients = useMemo(() => clientsData?.data || [], [clientsData]);

  const { data, loading, refreshing, error, lastUpdatedAt, refresh, retry } = useAnalyticsData({
    clientId: selectedClient,
    dateRange
  });

  const handleExport = useCallback(() => {
    if (!data) return message.warning('No data to export');
    try {
      exportRowsAsCsv({
        filename: `analytics_summary_${dayjs().format('YYYY-MM-DD')}`,
        headers: [{ key: 'metric', label: 'Metric' }, { key: 'value', label: 'Value' }, { key: 'trend', label: 'Trend vs previous period' }],
        rows: [
          { metric: 'Sessions', value: data.metrics?.sessions ?? 0, trend: data.metrics?.sessionsTrend },
          { metric: 'Users', value: data.metrics?.users ?? 0, trend: data.metrics?.usersTrend },
          { metric: 'New Users', value: data.metrics?.newUsers ?? 0, trend: data.metrics?.newUsersTrend },
          { metric: 'Returning Users', value: data.metrics?.returningUsers ?? 0, trend: data.metrics?.returningUsersTrend },
          { metric: 'Organic Sessions', value: data.metrics?.organicSessions ?? 0, trend: data.metrics?.organicTrafficShare },
          { metric: 'Clicks', value: data.metrics?.clicks ?? 0, trend: data.metrics?.clicksTrend },
          { metric: 'Impressions', value: data.metrics?.impressions ?? 0, trend: data.metrics?.impressionsTrend },
          { metric: 'CTR', value: data.metrics?.ctr ?? '0%', trend: data.metrics?.ctrTrend },
          { metric: 'Average Position', value: data.metrics?.averagePosition ?? 0, trend: data.metrics?.averagePositionTrend },
          { metric: 'Bounce Rate', value: data.metrics?.bounceRate ?? '0%', trend: data.metrics?.bounceRateTrend },
          { metric: 'Engagement Rate', value: data.metrics?.engagementRate ?? '0%', trend: data.metrics?.engagementRateTrend },
          { metric: 'Conversions', value: data.metrics?.conversions ?? 0, trend: data.metrics?.conversionsTrend },
          { metric: 'Leads', value: data.metrics?.leads ?? 0, trend: data.metrics?.leadsTrend },
          { metric: 'Revenue', value: data.metrics?.revenueFormatted ?? '₹0L', trend: data.metrics?.revenueTrend },
          { metric: 'Conversion Rate', value: data.metrics?.conversionRate ?? '0%', trend: data.metrics?.conversionRateTrend },
          { metric: 'Ad Spend', value: data.metrics?.totalAdSpend ?? '₹0L', trend: '' },
          { metric: 'Blended ROAS', value: data.metrics?.blendedRoas ?? '0x', trend: '' }
        ]
      });
      message.success('Export successful');
    } catch {
      message.error('Export failed');
    }
  }, [data]);

  const activeTabMeta = TABS.find(t => t.key === activeTab);

  const renderBody = () => {
    if (error) return <ErrorState message={error} onRetry={retry} retrying={loading} />;
    if (loading) return <DashboardSkeleton />;
    if (!data) return <ErrorState message="No analytics data was returned." onRetry={retry} retrying={loading} />;

    if (activeTab === 'analytics') return <AnalyticsTab data={data} searchTerm={debouncedSearch} />;
    if (activeTab === 'attribution') return <AttributionTab data={data} searchTerm={debouncedSearch} />;
    if (activeTab === 'seo-intelligence') return <SeoIntelligenceTab data={data} searchTerm={debouncedSearch} />;
    return <AiInsightsTab data={data} />;
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: '4px 0 0 0', fontWeight: 800 }}>{activeTabMeta.title}</Title>
          <Text type="secondary">{activeTabMeta.description}</Text>
          {lastUpdatedAt && !loading && (
            <div><Text type="secondary" style={{ fontSize: 12 }}>Last updated {dayjs(lastUpdatedAt).format('HH:mm:ss')}{data?.meta?.cache?.hit ? ' · cached' : ''}</Text></div>
          )}
        </div>

        <DashboardFilters
          clients={clients}
          selectedClient={selectedClient}
          onClientChange={setSelectedClient}
          dateRange={dateRange}
          onDateRangeChange={(val) => val && setDateRange(val)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onRefresh={refresh}
          refreshing={refreshing}
          onExport={handleExport}
          showExport={activeTab === 'analytics'}
          previousDateRange={data?.meta?.previousDateRange}
        />
      </motion.div>

      <motion.div
        variants={itemVariants}
        role="tablist"
        aria-label="Analytics dashboard sections"
        style={{ display: 'flex', gap: 32, borderBottom: '1px solid var(--border-color)', marginBottom: 32, overflowX: 'auto', paddingBottom: 2 }}
      >
        {TABS.map(({ key, label, icon: Icon }) => (
          <div
            key={key}
            role="tab"
            tabIndex={0}
            aria-selected={activeTab === key}
            onClick={() => setActiveTab(key)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab(key); } }}
            style={{
              paddingBottom: 16,
              borderBottom: activeTab === key ? '3px solid var(--accent-secondary)' : '3px solid transparent',
              fontWeight: activeTab === key ? 700 : 600,
              color: activeTab === key ? 'var(--text-primary)' : 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s'
            }}
          >
            <Icon size={18} color={activeTab === key ? 'var(--accent-secondary)' : 'var(--text-secondary)'} aria-hidden="true" /> {label}
          </div>
        ))}
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
          role="tabpanel"
        >
          {renderBody()}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default Analytics;