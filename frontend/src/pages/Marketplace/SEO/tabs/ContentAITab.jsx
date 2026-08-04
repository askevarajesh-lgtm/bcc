import React from 'react';
import { Tabs, Typography, Space } from 'antd';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import GeneratePanel from '../components/ContentAI/GeneratePanel';
import LibraryPanel from '../components/ContentAI/LibraryPanel';
import BrandVoicePanel from '../components/ContentAI/BrandVoicePanel';

const { Title, Text } = Typography;

const ContentAITab = () => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
    <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: 'linear-gradient(135deg, #fa8c16 0%, #faad14 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <Sparkles size={24} color="#fff" />
      </div>
      <div>
        <Title level={4} style={{ margin: 0, fontWeight: 900 }}>Content AI</Title>
        <Text type="secondary" style={{ fontSize: 13 }}>Generate, review, and publish landing page, blog, product, and category content — with brand voice, templates, version history, and quality scoring.</Text>
      </div>
    </div>

    <Tabs
      defaultActiveKey="generate"
      items={[
        { key: 'generate', label: 'Generate', children: <GeneratePanel /> },
        { key: 'library', label: 'Library / Review Queue', children: <LibraryPanel /> },
        { key: 'brand-voice', label: 'Brand Voice', children: <BrandVoicePanel /> }
      ]}
    />
  </motion.div>
);

export default ContentAITab;

