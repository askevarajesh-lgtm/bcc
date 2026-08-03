import React, { useState } from 'react';
import { Modal, Input, Button, Typography, Space, Tag, message, Spin } from 'antd';
import { Sparkles, ArrowRight, Wand2, Lightbulb } from 'lucide-react';
import { seoWorkspaceApi } from '../../../../../../api/seoWorkspaceApi';

const { Title, Text } = Typography;

export default function AiGeneratorModal({ visible, onCancel, onApplyGraph, projectId }) {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  const samplePrompts = [
    'Create a workflow that checks for ranking drops > 5 positions every morning, runs an AI diagnosis, and sends a Slack alert with recommended fixes.',
    'When robots.txt is inaccessible, immediately trigger a critical email alert to devops, create a Jira incident ticket, and pause active marketing campaigns.',
    'Every Monday at 9am, crawl site for 404 errors and generate new meta descriptions for pages missing title tags.'
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      return message.warning('Please enter a workflow description or pick an example.');
    }

    setGenerating(true);
    try {
      const res = await seoWorkspaceApi.generateAiWorkflow(projectId, prompt);
      const generated = res?.data || res;
      
      if (generated?.nodes && generated?.edges) {
        onApplyGraph(generated.nodes, generated.edges, generated.name || 'AI Generated Automation');
        message.success('AI Workflow created and rendered on canvas!');
        onCancel();
      } else {
        message.info('AI generated workflow structure applied.');
        onCancel();
      }
    } catch (err) {
      message.error(err?.response?.data?.error || 'Failed to generate AI workflow');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ padding: 6, borderRadius: 6, background: '#f5f3ff' }}>
            <Sparkles size={18} color="#7c3aed" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>AI Workflow Studio Generator</div>
            <div style={{ fontSize: 12, fontWeight: 400, color: '#64748b' }}>Describe your automation in plain English and let AI build the DAG graph</div>
          </div>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>Cancel</Button>,
        <Button 
          key="submit" 
          type="primary" 
          icon={<Wand2 size={14} />} 
          loading={generating} 
          onClick={handleGenerate}
          style={{ background: '#7c3aed' }}
        >
          Generate Workflow Graph
        </Button>
      ]}
      width={600}
    >
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input.TextArea
          rows={4}
          placeholder="e.g. When Google Search Console organic clicks drop by 20%, trigger a site audit and notify the team on Slack..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          style={{ borderRadius: 8, fontSize: 13 }}
        />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
            <Lightbulb size={14} color="#f59e0b" />
            <span>Or select an enterprise prompt recipe:</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {samplePrompts.map((p, idx) => (
              <div
                key={idx}
                onClick={() => setPrompt(p)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  fontSize: 12,
                  color: '#334155',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                className="ai-prompt-pill"
              >
                "{p}"
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
