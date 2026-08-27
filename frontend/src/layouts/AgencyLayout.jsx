import React, { useState, useEffect } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import AgencySidebar from './AgencySidebar';
import Header from './Header';
import PageTransition from '../components/PageTransition';
import { useClientContext } from '../contexts/ClientContext';

const { Content } = Layout;

const AgencyLayout = () => {
  const [collapsed, setCollapsed] = useState(window.innerWidth < 1300);
  const { selectedClient } = useClientContext();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1300) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Layout className="app-root-shell">
      <AgencySidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <Layout className="app-main-shell">
        <Header collapsed={collapsed} setCollapsed={setCollapsed} />
        <Content key={selectedClient?._id || 'all'} className="app-content">
          <div className="app-content__inner">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AgencyLayout;
