import React, { useState } from 'react';
import { Typography, Input, Button, Card, Spin, message, Space, Select } from 'antd';
import { Send, Image as ImageIcon, Save, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../../services/api';
import { useAIStudio } from '../context/AIStudioContext';

const { Title, Text } = Typography;
const { TextArea } = Input;

const DesignWorkTab = () => {
  const { saveAsset, isApiKeyConfigured, setIsApiKeyModalVisible } = useAIStudio();
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('GPT-5.5');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);

  const handleGenerate = async () => {
    if (!isApiKeyConfigured) {
      setIsApiKeyModalVisible(true);
      return message.warning('Image Generation requires an OpenAI API Key. Please connect one.');
    }
    if (!prompt.trim()) return message.error('Please enter a prompt');
    
    setLoading(true);
    try {
      const response = await api.post('/ai-studio/generate/image', { prompt, model: selectedModel });

      if (response.data.success) {
        setGeneratedImage(response.data.data.url);
        message.success('Image generated successfully');
      }
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || 'Failed to generate image');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generatedImage) return;
    const success = await saveAsset('image', prompt, generatedImage);
    if (success) {
      setGeneratedImage(null);
      setPrompt('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card bordered={false} className="glassmorphism" style={{ borderRadius: 12 }}>
        <Title level={4} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Sparkles size={20} color="var(--accent-primary)" /> AI Image Generator
        </Title>
        <Text type="secondary">Describe what you want to see, and AI will generate a high-quality image for you.</Text>
        
        <div style={{ marginTop: 24, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Select 
              value={selectedModel} 
              onChange={setSelectedModel} 
              style={{ width: 280 }}
              size="large"
              options={[
                { value: 'GPT-5.5', label: 'GPT-5.5 (Highest Quality)' },
                { value: 'GPT-5.4', label: 'GPT-5.4 (Fast & Efficient)' },
                { value: 'GPT-5.4 mini', label: 'GPT-5.4 mini (Instant & Free)' }
              ]}
            />
            <TextArea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., A futuristic city skyline at sunset, cyberpunk style, highly detailed..."
              autoSize={{ minRows: 3, maxRows: 6 }}
              style={{ borderRadius: 8 }}
            />
          </div>
          <Button 
            type="primary" 
            icon={<Send size={16} />} 
            onClick={handleGenerate} 
            loading={loading}
            style={{ height: 'auto', padding: '16px 24px', borderRadius: 8 }}
          >
            Generate
          </Button>
        </div>
      </Card>

      {(loading || generatedImage) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card bordered={false} className="glassmorphism" style={{ borderRadius: 12, textAlign: 'center' }}>
            {loading ? (
              <div style={{ padding: '60px 0' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}><Text type="secondary">Generating your masterpiece...</Text></div>
              </div>
            ) : (
              <div>
                <img 
                  src={generatedImage} 
                  alt="Generated AI Art" 
                  style={{ maxWidth: '100%', maxHeight: '500px', borderRadius: 8, objectFit: 'contain' }} 
                />
                <div style={{ marginTop: 24 }}>
                  <Space>
                    <Button type="primary" icon={<Save size={16} />} onClick={handleSave}>
                      Save to Asset Library
                    </Button>
                    <Button onClick={() => setGeneratedImage(null)}>
                      Discard
                    </Button>
                  </Space>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default DesignWorkTab;
