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
      gap: 10, color: 'var(--text-tertiary)', padding: '24px 12px', textAlign: 'center'
    }}
  >
    <Icon size={28} strokeWidth={1.5} />
    <Text type="secondary" style={{ fontSize: 13 }}>{message}</Text>
  </div>
);

export default EmptyState;
