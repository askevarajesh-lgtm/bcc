import React from 'react';
import { Settings } from 'lucide-react';
import SeoComingSoon from '../components/SeoComingSoon';

const SettingsTab = () => (
  <SeoComingSoon
    title="Settings"
    description="Project credentials, integrations, and workspace preferences."
    icon={Settings}
  />
);

export default SettingsTab;
