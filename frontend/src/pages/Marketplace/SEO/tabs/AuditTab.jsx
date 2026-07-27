import React from 'react';
import { ClipboardCheck } from 'lucide-react';
import SeoComingSoon from '../components/SeoComingSoon';

const AuditTab = () => (
  <SeoComingSoon
    title="Audit"
    description="Technical, on-page, and site health audits for every connected property."
    icon={ClipboardCheck}
  />
);

export default AuditTab;
