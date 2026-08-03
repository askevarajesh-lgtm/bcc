import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { 
  Zap, Play, Sliders, Split, Repeat, Sparkles, Clock, Layers, 
  Mail, Search, AlertCircle, CheckCircle2, MoreVertical, Copy, Trash2
} from 'lucide-react';
import { Dropdown, Tooltip, Tag } from 'antd';

const NODE_COLORS = {
  trigger: { border: '#8b5cf6', bg: '#f5f3ff', badge: '#7c3aed', icon: <Zap size={14} color="#7c3aed" /> },
  action: { border: '#3b82f6', bg: '#eff6ff', badge: '#2563eb', icon: <Play size={14} color="#2563eb" /> },
  condition: { border: '#f59e0b', bg: '#fffbeb', badge: '#d97706', icon: <Sliders size={14} color="#d97706" /> },
  switch: { border: '#ec4899', bg: '#fdf2f8', badge: '#db2777', icon: <Split size={14} color="#db2777" /> },
  loop: { border: '#10b981', bg: '#ecfdf5', badge: '#059669', icon: <Repeat size={14} color="#059669" /> },
  ai_agent: { border: '#6366f1', bg: '#eef2ff', badge: '#4f46e5', icon: <Sparkles size={14} color="#4f46e5" /> },
  delay: { border: '#64748b', bg: '#f8fafc', badge: '#475569', icon: <Clock size={14} color="#475569" /> },
  subworkflow: { border: '#0284c7', bg: '#f0f9ff', badge: '#0369a1', icon: <Layers size={14} color="#0369a1" /> }
};

export default function CustomNode({ id, data, isConnectable, selected }) {
  const nodeType = data.type || 'action';
  const styling = NODE_COLORS[nodeType] || NODE_COLORS.action;
  const isTrigger = nodeType === 'trigger';
  const isCondition = nodeType === 'condition';
  const isSwitch = nodeType === 'switch';

  const menuItems = [
    { key: 'copy', label: 'Duplicate Node', icon: <Copy size={14} /> },
    { key: 'delete', label: 'Delete Node', icon: <Trash2 size={14} />, danger: true }
  ];

  return (
    <div 
      style={{
        padding: '12px 16px',
        borderRadius: 10,
        background: '#ffffff',
        border: `2px solid ${selected ? '#2563eb' : styling.border}`,
        boxShadow: selected 
          ? '0 0 0 3px rgba(37, 99, 235, 0.25), 0 8px 16px -2px rgba(0, 0, 0, 0.1)' 
          : '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
        minWidth: 200,
        maxWidth: 260,
        cursor: 'pointer',
        transition: 'all 0.18s ease-in-out',
        position: 'relative'
      }}
    >
      {/* Target handle for incoming edges */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          style={{ background: '#64748b', width: 10, height: 10, borderRadius: 5 }}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ padding: 4, borderRadius: 6, background: styling.bg, display: 'flex', alignItems: 'center' }}>
            {styling.icon}
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: styling.badge, letterSpacing: 0.5 }}>
            {nodeType.replace('_', ' ')}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {data.status && (
            <Tag color={data.status === 'completed' ? 'success' : data.status === 'running' ? 'processing' : 'default'} style={{ margin: 0, fontSize: 10 }}>
              {data.status}
            </Tag>
          )}
        </div>
      </div>

      {/* Label & Description */}
      <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', marginBottom: 2, wordBreak: 'break-word' }}>
        {data.label || 'Unnamed Node'}
      </div>
      {data.subtitle && (
        <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {data.subtitle}
        </div>
      )}

      {/* Condition / Switch Branch Labels */}
      {isCondition ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 6, borderTop: '1px dashed #e2e8f0' }}>
          <div style={{ position: 'relative', fontSize: 10, fontWeight: 600, color: '#10b981' }}>
            True
            <Handle
              type="source"
              id="true"
              position={Position.Bottom}
              isConnectable={isConnectable}
              style={{ left: 10, bottom: -16, background: '#10b981', width: 9, height: 9 }}
            />
          </div>
          <div style={{ position: 'relative', fontSize: 10, fontWeight: 600, color: '#ef4444' }}>
            False
            <Handle
              type="source"
              id="false"
              position={Position.Bottom}
              isConnectable={isConnectable}
              style={{ left: 14, bottom: -16, background: '#ef4444', width: 9, height: 9 }}
            />
          </div>
        </div>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable}
          style={{ background: '#64748b', width: 10, height: 10, borderRadius: 5 }}
        />
      )}
    </div>
  );
}
