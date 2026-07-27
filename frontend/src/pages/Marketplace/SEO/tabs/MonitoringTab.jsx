import React from 'react';
import { Activity } from 'lucide-react';
import SeoComingSoon from '../components/SeoComingSoon';

const MonitoringTab = () => (
  <SeoComingSoon
    title="Monitoring"
    description="Rank tracking, alerts, and uptime/health monitoring."
    icon={Activity}
  />
);

export default MonitoringTab;
