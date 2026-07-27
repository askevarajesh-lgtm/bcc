import React from 'react';
import { Cpu } from 'lucide-react';
import SeoComingSoon from '../components/SeoComingSoon';

const TechnicalSEOTab = () => (
  <SeoComingSoon
    title="Technical SEO"
    description="Crawlability, indexation, Core Web Vitals, and schema health."
    icon={Cpu}
  />
);

export default TechnicalSEOTab;
