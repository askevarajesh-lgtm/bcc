import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  CheckSquare, LayoutDashboard, Settings, FileText, Palette, GitMerge, 
  Target, Search, BarChart2, Globe, LineChart, MessageCircle, TrendingUp, Briefcase, Users, Activity
} from 'lucide-react';
import PortalSidebar from './PortalSidebar';
import { useAuth } from '../contexts/AuthContext';

const UserSidebar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useAuth();
  const permissions = user?.permissions || {};

  const getIcon = (IconCmp) => <IconCmp size={18} strokeWidth={2} />;

  const hasPerm = (key) => permissions[key]?.Read;

  const taskManagementChildren = [
    { key: '/user/tasks', label: 'Tasks' },
  ];

  if (hasPerm('Workspace-Task Analytics')) {
    taskManagementChildren.push({ key: '/user/workspace/tasks/analytics', label: 'Task Analytics' });
  }
  if (hasPerm('Workspace-Coordinator Tasks')) {
    taskManagementChildren.push({ key: '/user/workspace/tasks/coordinator', label: 'Coordinator Tasks' });
  }

  let menuItems = [
    { key: '/user/dashboard', icon: getIcon(LayoutDashboard), label: 'Dashboard' },
  ];

  if (hasPerm('Workspace-Task Management') || taskManagementChildren.length > 0) {
    menuItems.push({
      key: 'task_management',
      label: 'Task Management',
      icon: getIcon(CheckSquare),
      children: taskManagementChildren
    });
  }

  if (hasPerm('Workspace-Strategy')) menuItems.push({ key: '/user/workspace/strategy', icon: getIcon(Target), label: 'Strategy' });
  if (hasPerm('Workspace-SEO / AEO / GEO')) menuItems.push({ key: '/user/workspace/seo', icon: getIcon(Search), label: 'SEO' });
  if (hasPerm('Workspace-Content')) menuItems.push({ key: '/user/workspace/content', icon: getIcon(FileText), label: 'Content' });
  if (hasPerm('Workspace-AI Studio')) menuItems.push({ key: '/user/workspace/aistudio', icon: getIcon(Palette), label: 'AI Studio' });
  if (hasPerm('Workspace-Social Media')) menuItems.push({ key: '/user/workspace/social', icon: getIcon(GitMerge), label: 'Social Media' });
  if (hasPerm('Workspace-Performance Ads')) menuItems.push({ key: '/user/workspace/ads', icon: getIcon(BarChart2), label: 'Performance Ads' });
  if (hasPerm('Workspace-CRM & Leads')) menuItems.push({ key: '/user/workspace/crm', icon: getIcon(LineChart), label: 'CRM & Leads' });
  if (hasPerm('Workspace-Automation')) menuItems.push({ key: '/user/workspace/automation', icon: getIcon(Settings), label: 'Automation' });
  if (hasPerm('Workspace-Proposals')) menuItems.push({ key: '/user/workspace/proposals', icon: getIcon(FileText), label: 'Proposals' });
  if (hasPerm('Workspace-Invoices')) menuItems.push({ key: '/user/workspace/invoices', icon: getIcon(FileText), label: 'Invoices' });
  if (hasPerm('Workspace-Projects')) menuItems.push({ key: '/user/workspace/projects', icon: getIcon(Target), label: 'Projects' });
  if (hasPerm('General-Master Item') || hasPerm('Workspace-Master Item')) menuItems.push({ key: '/user/workspace/master-items', icon: getIcon(Settings), label: 'Master Item' });
  if (hasPerm('Workspace-Websites')) menuItems.push({ key: '/user/workspace/website', icon: getIcon(Globe), label: 'Websites' });
  if (hasPerm('Agency Ops-Meetings') || hasPerm('Workspace-Meetings')) menuItems.push({ key: '/user/workspace/meetings', icon: getIcon(MessageCircle), label: 'Meetings' });
  if (hasPerm('Agency Ops-Calendar') || hasPerm('Workspace-Calendar')) menuItems.push({ key: '/user/workspace/calendar', icon: getIcon(CheckSquare), label: 'Calendar' });
  if (hasPerm('Agency Ops-Deliverables') || hasPerm('Workspace-Deliverables')) menuItems.push({ key: '/user/workspace/deliverables', icon: getIcon(CheckSquare), label: 'Deliverables' });
  if (hasPerm('Agency Ops-Sales Pipeline')) menuItems.push({ key: '/user/workspace/salespipeline', icon: getIcon(Briefcase), label: 'Sales Pipeline' });

  const clientsChildren = [];
  if (hasPerm('Clients-Accounts')) {
    clientsChildren.push({ key: '/user/clients', icon: getIcon(Users), label: 'Accounts' });
  }
  if (hasPerm('Clients-SLA & Success')) {
    clientsChildren.push({ key: '/user/sla', icon: getIcon(Activity), label: 'SLA & Success' });
  }

  if (clientsChildren.length > 0) {
    menuItems.push({
      key: 'clients',
      label: 'Clients',
      icon: getIcon(Users),
      children: clientsChildren
    });
  }

  const hrmsChildren = [];
  // Performance is currently granted for all employees as per original logic, but we can respect permission if present,
  // or default to true since it was previously hardcoded. Let's keep it hardcoded for employees or check permission.
  // Actually, to match AgencySidebar logic, we can just check hasPerm. But wait, previously it was forced for all.
  // Let's add it if hasPerm('HRMS-Performance') OR just add it anyway. The previous code didn't check permission.
  // Let's keep the existing behaviour for Performance.
  hrmsChildren.push({ key: '/user/hrms/performance', icon: getIcon(Target), label: 'Performance' });

  if (hasPerm('HRMS-Daily Reports')) {
    hrmsChildren.push({ key: '/user/hrms/daily-reports', icon: getIcon(FileText), label: 'Daily Reports' });
  }
  
  if (hasPerm('HRMS-SEO Panel')) {
    hrmsChildren.push({ key: '/user/hrms/seo-panel', icon: getIcon(Search), label: 'SEO Panel' });
  }

  if (hrmsChildren.length > 0) {
    menuItems.push({
      key: 'hrms',
      label: 'HRMS',
      icon: getIcon(Target),
      children: hrmsChildren
    });
  }

  if (hasPerm('Intelligence-Analytics & Attribution')) menuItems.push({ key: '/user/intelligence/analytics', icon: getIcon(TrendingUp), label: 'Analytics' });
  if (hasPerm('Intelligence-MOS Score')) menuItems.push({ key: '/user/intelligence/mos', icon: getIcon(BarChart2), label: 'MOS Score' });
  if (hasPerm('Intelligence-ChatGPT')) menuItems.push({ key: '/user/intelligence/chatgpt', icon: getIcon(MessageCircle), label: 'ChatGPT' });
  if (hasPerm('Intelligence-Canva')) menuItems.push({ key: '/user/intelligence/canva', icon: getIcon(Palette), label: 'Canva' });
  if (hasPerm('Intelligence-AI Agent')) menuItems.push({ key: '/user/intelligence/agents', icon: getIcon(Target), label: 'AI Agent' });
  if (hasPerm('Intelligence-Benchmarks')) menuItems.push({ key: '/user/intelligence/benchmarks', icon: getIcon(TrendingUp), label: 'Benchmarks' });
  if (hasPerm('Intelligence-Reports')) menuItems.push({ key: '/user/intelligence/reports', icon: getIcon(FileText), label: 'Reports' });
  // if (hasPerm('Intelligence-SEO Intelligence')) menuItems.push({ key: '/user/intelligence/seointelligence', icon: getIcon(Search), label: 'SEO Intelligence' });

  menuItems.push({ key: '/user/settings', icon: getIcon(Settings), label: 'Settings' });

  const getSelectedKey = () => {
    return menuItems.find((item) => location.pathname.startsWith(item.key))?.key || '/user/dashboard';
  };

  return (
    <PortalSidebar
      collapsed={collapsed}
      setCollapsed={setCollapsed}
      width={260}
      brandInitials="U"
      brandLogo={user?.logo}
      brandTitle={user?.companyName || "Employee Panel"}
      brandSubtitle={user?.roleName || "M1 Platform"}
      accent="var(--accent-primary)"
      accentSoft="rgba(139, 92, 246, 0.12)"
      menuItems={menuItems}
      selectedKeys={[getSelectedKey()]}
      onNavigate={navigate}
      partner={{
        initials: user?.name ? user.name.substring(0, 2).toUpperCase() : 'U',
        label: user?.roleName || 'Employee',
        name: user?.name || 'User',
        title: user?.brandName || user?.agencyName || user?.companyName || 'Workspace',
      }}
    />
  );
};

export default UserSidebar;
