import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Button, Input, Tag, Slider, Checkbox, message, Spin } from 'antd';
import { motion } from 'framer-motion';
import { FileText, Smartphone, Megaphone, Mail, Monitor, Edit3, Video, MessageCircle, Sparkles, Copy, Save, RefreshCw, CheckCircle2 } from 'lucide-react';
import { contentApi } from '../../../api/contentApi';
import { useContentModule } from '../ContentModuleContext';

const { Title, Text } = Typography;
const { TextArea } = Input;

const contentTypes = [
  { id: 'blog-writer', title: 'Blog Writer', desc: 'Long-form, SEO-optimised articles', icon: <FileText size={20} color="var(--accent-warning)" /> },
  { id: 'social-caption-writer', title: 'Social Caption Writer', desc: 'Instagram / LinkedIn / Twitter captions', icon: <Smartphone size={20} color="var(--accent-secondary)" /> },
  { id: 'reel-scriptwriter', title: 'Reel Scriptwriter', desc: 'YouTube / Instagram Reel scripts', icon: <Video size={20} color="#ec4899" /> },
  { id: 'creative-brief-writer', title: 'Creative Brief Writer', desc: 'Briefs for your design team', icon: <Edit3 size={20} color="var(--text-secondary)" /> }
];

const AIStudioTab = ({ itemVariants }) => {
  const { refreshContent, refreshToken } = useContentModule();
  const [activeType, setActiveType] = useState('social-caption-writer');
  
  // Form State
  const [platform, setPlatform] = useState('Instagram');
  const [topic, setTopic] = useState('New project launch — Prestige Whitefield');
  const [tone, setTone] = useState('Professional');
  const [brandVoice, setBrandVoice] = useState('Premium, aspirational, trustworthy');
  const [keyMessage, setKeyMessage] = useState('');
  const [includeOptions, setIncludeOptions] = useState(['Hashtags', 'CTA']);
  const [characterLimit, setCharacterLimit] = useState(280);
  const [variations, setVariations] = useState('1');

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);

  // Recent Items
  const [recentItems, setRecentItems] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  useEffect(() => {
    const fetchRecent = async () => {
      setLoadingRecent(true);
      try {
        const res = await contentApi.getItems();
        if (res.success && res.data.items) {
          const sorted = [...res.data.items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setRecentItems(sorted.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load recent items');
      } finally {
        setLoadingRecent(false);
      }
    };
    fetchRecent();
  }, [refreshToken]);

  const handleGenerate = async (isRegenerate = false) => {
    if (!topic) return message.error('Topic is required');
    
    setIsGenerating(true);
    try {
      const payload = {
        contentType: activeType,
        platform,
        topic,
        tone,
        brandVoice,
        keyMessage,
        includeOptions,
        characterLimit,
        variations: parseInt(variations)
      };

      const response = isRegenerate 
        ? await contentApi.regenerateContent({ ...payload, regenerateOf: generatedContent?._id })
        : await contentApi.generateContent(payload);
        
      if (response.success) {
        setGeneratedContent(response.data);
        message.success('Content generated successfully');
        refreshContent(); // signal List and Calendar views to update
      } else {
        message.error(response.message || 'Generation failed');
      }
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.message || 'An error occurred during generation');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (generatedContent?.body) {
      navigator.clipboard.writeText(generatedContent.body);
      message.success('Copied to clipboard');
    }
  };

  const handleSave = async () => {
    if (generatedContent?._id) {
      try {
        const res = await contentApi.updateItem(generatedContent._id, { status: 'Draft' });
        if (res.success) {
          message.success('Draft saved');
          refreshContent();
        }
      } catch (e) {
        message.error('Failed to save draft');
      }
    }
  };

  const timeAgo = (dateStr) => {
    const diff = new Date() - new Date(dateStr);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} xl={14}>
          <motion.div variants={itemVariants} style={{ height: '100%' }}>
            <Card className="glassmorphism" style={{ borderRadius: 16, height: '100%', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: 24 }}>
              <Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>What do you want to create?</Title>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Sparkles size={14} color="var(--accent-secondary)"/> Routed through OpenAI (GPT-4o). Using your secure Workspace API Key.
              </Text>
              
              <Row gutter={[12, 12]} style={{ marginTop: 20, marginBottom: 24 }}>
                {contentTypes.map(type => (
                  <Col xs={12} sm={8} lg={6} key={type.id}>
                    <motion.div 
                      whileHover={{ scale: activeType === type.id ? 1 : 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveType(type.id)}
                      style={{ 
                        border: activeType === type.id ? '2px solid var(--accent-secondary)' : '1px solid var(--border-color)', 
                        background: activeType === type.id ? 'var(--bg-secondary)' : 'var(--bg-primary)', 
                        padding: 16, 
                        borderRadius: 12, 
                        cursor: 'pointer',
                        height: '100%',
                        position: 'relative',
                        boxShadow: activeType === type.id ? '0 0 15px rgba(13, 148, 136, 0.15)' : 'var(--shadow-sm)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {activeType === type.id && (
                        <div style={{ position: 'absolute', top: 8, right: 8, color: 'var(--accent-secondary)' }}>
                          <CheckCircle2 size={16} fill="var(--accent-secondary)" color="var(--bg-primary)" />
                        </div>
                      )}
                      <div style={{ marginBottom: 12 }}>{type.icon}</div>
                      <strong style={{ display: 'block', fontSize: 13, marginBottom: 4, color: activeType === type.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{type.title}</strong>
                      <Text type="secondary" style={{ fontSize: 11 }}>{type.desc}</Text>
                    </motion.div>
                  </Col>
                ))}
              </Row>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, background: 'var(--bg-secondary)', padding: 24, borderRadius: 12, border: '1px solid var(--border-color)' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, display: 'block', marginBottom: 8 }}>PLATFORM</Text>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['Instagram', 'LinkedIn', 'Twitter/X', 'Facebook'].map(p => (
                      <Tag key={p} onClick={() => setPlatform(p)} style={{ padding: '6px 16px', borderRadius: 20, cursor: 'pointer', background: p === platform ? 'var(--accent-secondary)' : 'var(--bg-primary)', color: p === platform ? 'var(--bg-primary)' : 'var(--text-secondary)', border: `1px solid ${p === platform ? 'var(--accent-secondary)' : 'var(--border-color)'}`, fontWeight: 600, fontSize: 13 }}>{p}</Tag>
                    ))}
                  </div>
                </div>

                <div>
                  <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, display: 'block', marginBottom: 8 }}>TOPIC</Text>
                  <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="New project launch — Prestige Whitefield" style={{ borderRadius: 8, padding: '8px 12px', fontSize: 14 }} />
                </div>

                <div>
                  <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, display: 'block', marginBottom: 8 }}>TONE</Text>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['Professional', 'Casual', 'Excited', 'Inspiring'].map(p => (
                      <Tag key={p} onClick={() => setTone(p)} style={{ padding: '6px 16px', borderRadius: 20, cursor: 'pointer', background: p === tone ? 'var(--accent-secondary)' : 'var(--bg-primary)', color: p === tone ? 'var(--bg-primary)' : 'var(--text-secondary)', border: `1px solid ${p === tone ? 'var(--accent-secondary)' : 'var(--border-color)'}`, fontWeight: 600, fontSize: 13 }}>{p}</Tag>
                    ))}
                  </div>
                </div>

                <div>
                  <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, display: 'block', marginBottom: 8 }}>BRAND VOICE</Text>
                  <Input value={brandVoice} onChange={e => setBrandVoice(e.target.value)} placeholder="Premium, aspirational, trustworthy" style={{ borderRadius: 8, padding: '8px 12px', fontSize: 14 }} />
                </div>

                <div>
                  <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, display: 'block', marginBottom: 8 }}>KEY MESSAGE</Text>
                  <TextArea value={keyMessage} onChange={e => setKeyMessage(e.target.value)} rows={3} placeholder="The one thing readers should take away" style={{ borderRadius: 8, padding: '8px 12px', fontSize: 14 }} />
                </div>

                <div>
                  <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, display: 'block', marginBottom: 12 }}>INCLUDE</Text>
                  <Checkbox.Group value={includeOptions} onChange={setIncludeOptions} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                      {['Hashtags', 'CTA', 'Emojis', 'Mention @brand'].map(opt => (
                        <Checkbox key={opt} value={opt} style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{opt}</Checkbox>
                      ))}
                    </div>
                  </Checkbox.Group>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5 }}>CHARACTER LIMIT</Text>
                    <Text strong style={{ color: 'var(--accent-secondary)' }}>{characterLimit}</Text>
                  </div>
                  <Slider value={characterLimit} onChange={setCharacterLimit} max={2200} trackStyle={{ background: 'var(--accent-secondary)' }} handleStyle={{ borderColor: 'var(--accent-secondary)' }} />
                </div>

                <div>
                  <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, display: 'block', marginBottom: 8 }}>VARIATIONS</Text>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['1', '2', '3'].map(p => (
                      <Tag key={p} onClick={() => setVariations(p)} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', cursor: 'pointer', background: p === variations ? 'var(--accent-secondary)' : 'var(--bg-primary)', color: p === variations ? 'var(--bg-primary)' : 'var(--text-secondary)', border: `1px solid ${p === variations ? 'var(--accent-secondary)' : 'var(--border-color)'}`, fontWeight: 700, fontSize: 14, margin: 0 }}>{p}</Tag>
                    ))}
                  </div>
                </div>

                <Button loading={isGenerating} onClick={() => handleGenerate(false)} type="primary" size="large" icon={!isGenerating && <Sparkles size={18} />} style={{ background: 'var(--accent-secondary)', width: '100%', marginTop: 12, height: 50, borderRadius: 12, fontSize: 16, fontWeight: 600, border: 'none', boxShadow: '0 4px 14px rgba(13, 148, 136, 0.4)' }}>
                  {isGenerating ? 'Generating...' : 'Generate Content'}
                </Button>
              </div>
            </Card>
          </motion.div>
        </Col>

        <Col xs={24} xl={10}>
          <motion.div variants={itemVariants} style={{ height: '100%' }}>
            <Card className="glassmorphism" style={{ borderRadius: 16, height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                <strong style={{ fontSize: 15, color: 'var(--text-primary)' }}>Generated Content</strong>
                <div style={{ display: 'flex', gap: 16 }}>
                  <a onClick={handleCopy} style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}><Copy size={14}/> Copy All</a>
                  <a onClick={handleSave} style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}><Save size={14}/> Save</a>
                  <a onClick={() => handleGenerate(true)} style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}><RefreshCw size={14}/> Regenerate</a>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', minHeight: 400 }}>
                {isGenerating ? (
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                     <Spin size="large" />
                  </div>
                ) : generatedContent ? (
                  <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)', fontSize: 15, lineHeight: 1.6 }}>
                    {generatedContent.title && <Title level={4}>{generatedContent.title}</Title>}
                    {generatedContent.body}
                    {generatedContent.hashtags && generatedContent.hashtags.length > 0 && (
                      <div style={{ marginTop: 16 }}>
                        {generatedContent.hashtags.map(h => <Text key={h} style={{ color: 'var(--accent-secondary)', marginRight: 8 }}>#{h.replace('#', '')}</Text>)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-tertiary)', padding: 40 }}>
                    <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 3 }}>
                      <Sparkles size={48} style={{ marginBottom: 20, color: 'var(--accent-secondary)', opacity: 0.5 }} />
                    </motion.div>
                    <Text type="secondary" style={{ fontSize: 15 }}>Fill in the brief and hit <strong style={{ color: 'var(--text-primary)' }}>Generate</strong> to see real AI output here.</Text>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </Col>
      </Row>

      <motion.div variants={itemVariants} style={{ marginTop: 40, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Recently Generated</Title>
          <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Content created with AI Studio — last 30 days</Text>
        </div>
        <Button type="link" style={{ color: 'var(--accent-secondary)', fontSize: 14, fontWeight: 600, padding: 0 }}>View All in Content →</Button>
      </motion.div>
      
      <Spin spinning={loadingRecent}>
        <Row gutter={[16, 16]}>
          {recentItems.length === 0 && !loadingRecent && (
            <Col span={24}>
              <Text type="secondary">No recently generated content.</Text>
            </Col>
          )}
          {recentItems.map((item, i) => (
            <Col xs={24} lg={8} key={i}>
              <motion.div variants={itemVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
                <Card 
                  bodyStyle={{ padding: '20px' }} 
                  style={{ 
                    borderRadius: 16, 
                    border: '1px solid var(--border-color)', 
                    background: 'var(--bg-secondary)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <strong style={{ display: 'block', marginBottom: 16, fontSize: 15, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</strong>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                    {[item.type, item.platform, timeAgo(item.createdAt)].filter(Boolean).map(t => (
                      <Tag key={t} style={{ borderRadius: 12, border: 'none', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontSize: 12, padding: '2px 10px', fontWeight: 500, margin: 0, textTransform: 'capitalize' }}>{t}</Tag>
                    ))}
                  </div>
                  <Button 
                    block 
                    style={{ height: 40, borderRadius: 8, fontWeight: 600, color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} 
                    icon={<CheckCircle2 size={16} />}
                    onClick={() => {
                      setGeneratedContent(item);
                      setActiveType(item.type);
                    }}
                  >
                    View Draft
                  </Button>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      </Spin>

    </motion.div>
  );
};

export default AIStudioTab;
