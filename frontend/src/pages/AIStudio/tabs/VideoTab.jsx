import React, { useState } from 'react';
import { Typography, Input, Button, Card, Spin, message, Space } from 'antd';
import { Send, Video as VideoIcon, Save, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../../services/api';
import { useAIStudio } from '../context/AIStudioContext';

const { Title, Text } = Typography;
const { TextArea } = Input;

const VideoTab = () => {
  const { saveAsset, apiKey, setIsApiKeyModalVisible } = useAIStudio();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState(null);

  const handleGenerate = async () => {
    if (!apiKey) {
      setIsApiKeyModalVisible(true);
      return message.warning('Please connect an API key first');
    }
    if (!prompt.trim()) return message.error('Please enter a prompt');
    
    setLoading(true);
    try {
      const response = await api.post('/ai-studio/generate/video', { prompt }, {
        headers: { 'x-ai-api-key': apiKey }
      });
      if (response.data.success) {
        setGeneratedVideo(response.data.data.url);
        message.success('Video generated successfully');
      }
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || 'Failed to generate video');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generatedVideo) return;
    const success = await saveAsset('video', prompt, generatedVideo);
    if (success) {
      setGeneratedVideo(null);
      setPrompt('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card bordered={false} className="glassmorphism" style={{ borderRadius: 12 }}>
        <Title level={4} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Sparkles size={20} color="var(--accent-primary)" /> AI Video Generator
        </Title>
        <Text type="secondary">Describe your scene in detail to generate a short AI video.</Text>
        
        <div style={{ marginTop: 24, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <TextArea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., A cinematic drone shot flying over a lush green valley with a river running through..."
            autoSize={{ minRows: 3, maxRows: 6 }}
            style={{ borderRadius: 8 }}
          />
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

      {(loading || generatedVideo) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card bordered={false} className="glassmorphism" style={{ borderRadius: 12, textAlign: 'center' }}>
            {loading ? (
              <div style={{ padding: '60px 0' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}><Text type="secondary">Rendering your video scene...</Text></div>
              </div>
            ) : (
              <div>
                <video 
                  controls 
                  src={generatedVideo} 
                  style={{ maxWidth: '100%', maxHeight: '500px', borderRadius: 8, background: '#000' }} 
                />
                <div style={{ marginTop: 24 }}>
                  <Space>
                    <Button type="primary" icon={<Save size={16} />} onClick={handleSave}>
                      Save to Asset Library
                    </Button>
                    <Button onClick={() => setGeneratedVideo(null)}>
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

export default VideoTab;
