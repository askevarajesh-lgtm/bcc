import React, { useState } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import SuperAdminSidebar from './SuperAdminSidebar';
import Header from './Header';
import PageTransition from '../components/PageTransition';

const { Content } = Layout;

const SuperAdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout className="app-root-shell">
      <SuperAdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <Layout className="app-main-shell">
        <Header />
        <Content className="app-content">
          <div className="app-content__inner">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default SuperAdminLayout;
