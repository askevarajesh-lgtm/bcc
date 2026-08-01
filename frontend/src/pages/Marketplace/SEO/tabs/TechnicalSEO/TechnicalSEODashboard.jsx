import React, { useState, useEffect } from 'react';
import { Layout, Typography, Tabs, Spin, message } from 'antd';
import { Cpu, AlertTriangle, Activity, Settings, Clock } from 'lucide-react';
import OverviewCharts from './components/OverviewCharts';
import IssueList from './components/IssueList';
import { technicalSeoApi } from './services/technicalSeoApi';

const { Title, Text } = Typography;

const TechnicalSEODashboard = ({ projectId }) => {
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    if (projectId) {
      fetchDashboard();
    }
  }, [projectId]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const data = await technicalSeoApi.getDashboard(projectId);
      setDashboardData(data);
    } catch (error) {
      message.error('Failed to load Technical SEO dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (!projectId) {
    return <div style={{ padding: 20 }}>Please select a project to view Technical SEO data.</div>;
  }

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Cpu size={28} />
        <div>
          <Title level={4} style={{ margin: 0 }}>Enterprise Technical SEO</Title>
          <Text type="secondary">Comprehensive site health, Core Web Vitals, and AI-driven issue resolution.</Text>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>
      ) : (
        <Tabs
          defaultActiveKey="overview"
          items={[
            {
              label: <span><Activity size={16} style={{ marginRight: 8 }}/> Overview</span>,
              key: 'overview',
              children: <OverviewCharts data={dashboardData} />
            },
            {
              label: <span><AlertTriangle size={16} style={{ marginRight: 8 }}/> Issues & AI Fixes</span>,
              key: 'issues',
              children: <IssueList projectId={projectId} />
            },
            {
              label: <span><Clock size={16} style={{ marginRight: 8 }}/> History</span>,
              key: 'history',
              children: <div>Historical trends and comparison engine coming soon...</div>
            },
            {
              label: <span><Settings size={16} style={{ marginRight: 8 }}/> Settings</span>,
              key: 'settings',
              children: <div>Crawler profiles, limits, and authentication settings coming soon...</div>
            }
          ]}
        />
      )}
    </div>
  );
};

export default TechnicalSEODashboard;
