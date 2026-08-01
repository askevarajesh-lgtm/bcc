import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function CustomNode({ data, isConnectable }) {
  const isTrigger = data.type === 'trigger';
  
  return (
    <div style={{
      padding: '10px 15px',
      borderRadius: '8px',
      background: 'var(--bg-primary)',
      border: `2px solid ${isTrigger ? '#722ed1' : 'var(--primary-color)'}`,
      minWidth: 150,
      textAlign: 'center',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          style={{ background: '#555' }}
        />
      )}
      
      <div style={{ fontWeight: 600, fontSize: 14 }}>
        {data.label}
      </div>
      
      {data.type === 'condition' && (
        <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
          {data.expression || 'No condition'}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        style={{ background: '#555' }}
      />
    </div>
  );
}
