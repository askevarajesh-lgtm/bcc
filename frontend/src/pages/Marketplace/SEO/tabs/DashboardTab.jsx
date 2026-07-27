import React from 'react';
import { LayoutGrid } from 'lucide-react';
import SeoComingSoon from '../components/SeoComingSoon';

const DashboardTab = () => (
  <SeoComingSoon
    title="Dashboard"
    description="High-level overview of every SEO project, score trends, and recent activity."
    icon={LayoutGrid}
  />
);

export default DashboardTab;
