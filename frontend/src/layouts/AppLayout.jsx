import React, { useState } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import PageTransition from '../components/PageTransition';

const { Content } = Layout;

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout className="app-root-shell">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <Layout className="app-main-shell">
        <Header />
        <Content className="app-content">
          <div className="app-content__inner">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
