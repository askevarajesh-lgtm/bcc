import React from 'react';
import { Typography, Divider } from 'antd';
import { Zap, Activity, Clock, Sliders, Database, Mail } from 'lucide-react';

const { Title } = Typography;

export default function NodePalette() {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const categories = [
    {
      title: 'Triggers',
      nodes: [
        { type: 'trigger', label: 'Schedule', icon: <Clock size={14} /> },
        { type: 'trigger', label: 'Rank Drop', icon: <Activity size={14} /> },
        { type: 'trigger', label: 'Webhook', icon: <Zap size={14} /> }
      ]
    },
    {
      title: 'Logic',
      nodes: [
        { type: 'condition', label: 'If / Else', icon: <Sliders size={14} /> }
      ]
    },
    {
      title: 'Actions',
      nodes: [
        { type: 'action', label: 'Send Email', icon: <Mail size={14} /> },
        { type: 'action', label: 'Update DB', icon: <Database size={14} /> }
      ]
    }
  ];

  return (
    <div className="workflow-palette">
      <Title level={5} style={{ margin: 0 }}>Nodes</Title>
      <Divider style={{ margin: '12px 0' }} />
      
      {categories.map((cat, i) => (
        <div key={i} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>
            {cat.title}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cat.nodes.map((n, j) => (
              <div 
                key={j} 
                className="palette-item"
                onDragStart={(event) => onDragStart(event, n.type)}
                draggable
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {n.icon} <span>{n.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
