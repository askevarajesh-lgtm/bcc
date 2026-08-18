import React from 'react';
import { Typography } from 'antd';
import { Inbox } from 'lucide-react';

const { Text } = Typography;

/** Consistent "nothing to show" block — used instead of silently rendering a chart/table full of zeros. */
const EmptyState = ({ icon: Icon = Inbox, message = 'No data for this range yet.', height = '100%' }) => (
  <div
    role="status"
    style={{
      height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 16, padding: '32px 16px', textAlign: 'center',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.03) 100%)',
      borderRadius: 16, border: '1px dashed var(--border-color)'
    }}
  >
    <div style={{
      width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-tertiary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-secondary)'
    }}>
      <Icon size={28} strokeWidth={1.5} />
    </div>
    <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', maxWidth: 250 }}>{message}</Text>
  </div>
);

export default EmptyState;
