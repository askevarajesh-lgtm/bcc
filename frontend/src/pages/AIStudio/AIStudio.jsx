import React from 'react';
import { Typography, Tabs, Button, Modal, Input } from 'antd';
import { motion } from 'framer-motion';
import { Sparkles, Image as ImageIcon, Video, Library, Send, Key } from 'lucide-react';

import { AIStudioProvider, useAIStudio } from './context/AIStudioContext';
import DesignWorkTab from './tabs/DesignWorkTab';
// import VideoTab from './tabs/VideoTab';
import AssetLibraryTab from './tabs/AssetLibraryTab';
import DeliverablesTab from './tabs/DeliverablesTab';

const { Title, Text } = Typography;

const AIStudioContent = () => {
  const { 
    activeTab, 
    setActiveTab, 
    apiKey, 
    isApiKeyConfigured,
    saveApiKey, 
    isApiKeyModalVisible, 
    setIsApiKeyModalVisible 
  } = useAIStudio();
  const [tempKey, setTempKey] = React.useState('');

  // When the modal opens, reset the tempKey input. We don't want to show the masked key in the input field.
  React.useEffect(() => {
    if (isApiKeyModalVisible) {
      setTempKey('');
    }
  }, [isApiKeyModalVisible]);

  const tabItems = [
    {
      key: 'design',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ImageIcon size={16} /> Design Work
        </span>
      ),
      children: <DesignWorkTab />
    },
    /* {
      key: 'video',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Video size={16} /> Video
        </span>
      ),
      children: <VideoTab />
    }, */
    {
      key: 'assets',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Library size={16} /> Asset Library
        </span>
      ),
      children: <AssetLibraryTab />
    },
    {
      key: 'deliverables',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Send size={16} /> Deliverables
        </span>
      ),
      children: <DeliverablesTab />
    }
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} style={{ minHeight: 'calc(100vh - 120px)' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Sparkles color="var(--accent-primary)" /> AI Studio
          </Title>
          <Text type="secondary">Design, video, and visual assets — powered by generative AI.</Text>
        </div>
        <Button 
          icon={<Key size={16} />} 
          onClick={() => setIsApiKeyModalVisible(true)}
          style={{ borderRadius: 8, height: 40, fontWeight: 600 }}
          type={isApiKeyConfigured ? 'default' : 'primary'}
        >
          {isApiKeyConfigured ? 'Update API Key' : 'Connect AI Provider'}
        </Button>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={tabItems}
        size="large"
        className="custom-tabs"
      />

      <Modal
        title="Connect AI Provider"
        open={isApiKeyModalVisible}
        onCancel={() => setIsApiKeyModalVisible(false)}
        onOk={() => {
          if (tempKey.trim() !== '') {
            saveApiKey(tempKey);
          }
          setIsApiKeyModalVisible(false);
        }}
        okText="Save API Key"
      >
        <div style={{ marginBottom: 16 }}>
          <Text>Enter your OpenAI API Key to enable AI Generation features.</Text>
          {isApiKeyConfigured && (
            <div style={{ marginTop: 8, padding: '8px 12px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4 }}>
              <Text type="success">✓ API Key is currently configured ({apiKey})</Text>
            </div>
          )}
        </div>
        <Input.Password 
          placeholder="sk-..." 
          value={tempKey} 
          onChange={e => setTempKey(e.target.value)} 
        />
        <div style={{ marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Your key is encrypted securely in your workspace database. It is never stored in your browser.</Text>
        </div>
      </Modal>
    </motion.div>
  );
};

const AIStudio = () => (
  <AIStudioProvider>
    <AIStudioContent />
  </AIStudioProvider>
);

export default AIStudio;
