import React, { useState, useEffect } from 'react';
import { Tabs, Typography } from 'antd';
import { TrophyOutlined, HistoryOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import PerformanceScorecardPage from './PerformanceScorecardPage';
import PerformanceHistoryPage from './PerformanceHistoryPage';
import { useAuth } from '../../contexts/AuthContext';

const { Title } = Typography;

const PerformancePage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveTab = () => {
    if (location.pathname.includes('/history')) return 'history';
    return 'scorecard';
  };

  const [activeKey, setActiveKey] = useState(getActiveTab());

  useEffect(() => {
    setActiveKey(getActiveTab());
  }, [location.pathname]);

  const handleTabChange = (key) => {
    setActiveKey(key);
    const basePath = location.pathname.startsWith("/agency") ? "/agency/hrms/performance" : location.pathname.startsWith("/client") ? "/client/hrms/performance" : location.pathname.startsWith("/user") ? "/user/performance" : "/hrms/performance";
    if (key === 'scorecard') {
      navigate(basePath);
    } else {
      navigate(`${basePath}/${key}`);
    }
  };

  const items = [
    {
      key: 'scorecard',
      label: (
        <span>
          <TrophyOutlined />
          Scorecard
        </span>
      ),
      children: <PerformanceScorecardPage />,
    },
    {
      key: 'history',
      label: (
        <span>
          <HistoryOutlined />
          History
        </span>
      ),
      children: <PerformanceHistoryPage />,
    },
  ];

  return (
    <div className="performance-module-container">
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Performance</Title>
      </div>
      <Tabs
        activeKey={activeKey}
        onChange={handleTabChange}
        items={items}
        className="performance-tabs"
        size="large"
      />
    </div>
  );
};

export default PerformancePage;
