import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import SuperAdminSidebar from './SuperAdminSidebar';
import Header from './Header';
import PageTransition from '../components/PageTransition';

const { Content } = Layout;

const SuperAdminLayout = () => {
  return (
    <Layout className="app-root-shell">
      <SuperAdminSidebar />
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

export default SuperAdminLayout;
