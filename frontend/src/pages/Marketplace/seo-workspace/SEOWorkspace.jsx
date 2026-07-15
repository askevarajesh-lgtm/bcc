import React, { useState } from 'react';
import { Spin } from 'antd';
import { useAuth } from '../../../contexts/AuthContext';
import { useActionPermissions } from '../../../hooks/useActionPermissions';
import useWorkspaceProjects from './hooks/useWorkspaceProjects';
import CreateProjectModal from './components/CreateProjectModal';
import GlobalSearchBar from './GlobalSearchBar';
import DashboardPanel from './DashboardPanel';
import ProjectsPanel from './ProjectsPanel';
import AuditsPanel from './AuditsPanel';
import KeywordsPanel from './KeywordsPanel';
import StrategiesPanel from './StrategiesPanel';
import ApprovalsQueuePanel from './ApprovalsQueuePanel';
import ReportsPanel from './ReportsPanel';
import AnalyticsPanel from './AnalyticsPanel';
import SettingsPanel from './SettingsPanel';
import './SEOWorkspace.css';

const VIEW_ONLY_ROLES = ['agency_client', 'client', 'brand_manager', 'brand_super_admin', 'brand_team_user'];

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'projects', label: 'Projects' },
  { key: 'audits', label: 'Audits' },
  { key: 'keywords', label: 'Keywords' },
  { key: 'content', label: 'Content Strategy' },
  { key: 'approvals', label: 'Approvals Queue' },
  { key: 'reports', label: 'Reports' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'settings', label: 'Settings' }
];

const SEOWorkspace = () => {
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState({ isLoading: false, message: '' });

  const { role } = useAuth();
  const isViewOnly = VIEW_ONLY_ROLES.includes(role);
  const { canAdd, canEdit } = useActionPermissions('/seo');

  const { projects, loading: loadingProjects, refetch: refetchProjects, createProject, updateSettings } = useWorkspaceProjects();

  const renderPanel = () => {
    switch (activeSubTab) {
      case 'overview':
        return <DashboardPanel isViewOnly={isViewOnly} onCreateProject={() => setIsCreateModalVisible(true)} />;
      case 'projects':
        return (
          <ProjectsPanel
            projects={projects}
            loading={loadingProjects}
            refetchProjects={refetchProjects}
            isViewOnly={isViewOnly}
            canAdd={canAdd}
            onCreateProject={() => setIsCreateModalVisible(true)}
            setActionLoading={setActionLoading}
          />
        );
      case 'audits':
        return <AuditsPanel />;
      case 'keywords':
        return <KeywordsPanel projects={projects} />;
      case 'content':
        return <StrategiesPanel isViewOnly={isViewOnly} canEdit={canEdit} setActionLoading={setActionLoading} />;
      case 'approvals':
        return <ApprovalsQueuePanel projects={projects} isViewOnly={isViewOnly} canEdit={canEdit} />;
      case 'reports':
        return <ReportsPanel projects={projects} isViewOnly={isViewOnly} canAdd={canAdd} />;
      case 'analytics':
        return <AnalyticsPanel projects={projects} />;
      case 'settings':
        return <SettingsPanel projects={projects} updateSettings={updateSettings} canEdit={canEdit} />;
      default:
        return null;
    }
  };

  return (
    <div className="seo-workspace-container">
      <Spin fullscreen spinning={actionLoading.isLoading} tip={actionLoading.message} size="large" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="seo-tabs-container" style={{ marginBottom: 0 }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`seo-tab-btn ${activeSubTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveSubTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <GlobalSearchBar
          onSelectProject={() => setActiveSubTab('projects')}
          onSelectStrategy={() => setActiveSubTab('content')}
          onSelectTask={() => setActiveSubTab('approvals')}
        />
      </div>

      {renderPanel()}

      <CreateProjectModal
        open={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onCreate={createProject}
        isViewOnly={isViewOnly}
      />
    </div>
  );
};

export default SEOWorkspace;