import React, { useState } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import UserSidebar from './UserSidebar';
import Header from './Header';
import PageTransition from '../components/PageTransition';

const { Content } = Layout;

const UserLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout className="app-root-shell">
      <UserSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
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

export default UserLayout;
