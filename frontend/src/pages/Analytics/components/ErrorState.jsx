import React from 'react';
import { Typography, Button } from 'antd';
import { AlertTriangle, RotateCw } from 'lucide-react';

const { Title, Text } = Typography;

const ErrorState = ({ message, onRetry, retrying }) => (
  <div
    role="alert"
    style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: '80px 24px', background: 'var(--bg-secondary)', borderRadius: 16,
      border: '1px solid var(--border-color)'
    }}
  >
    <div style={{ background: 'rgba(239, 68, 68, 0.12)', padding: 20, borderRadius: '50%', marginBottom: 20 }}>
      <AlertTriangle size={32} style={{ color: 'var(--accent-danger)' }} />
    </div>
    <Title level={4} style={{ margin: '0 0 8px 0' }}>Couldn't load analytics</Title>
    <Text type="secondary" style={{ maxWidth: 420, marginBottom: 20 }}>
      {message || 'Something went wrong while fetching your analytics data. Please try again.'}
    </Text>
    <Button
      type="primary"
      icon={<RotateCw size={16} className={retrying ? 'spin-icon' : ''} />}
      loading={retrying}
      onClick={onRetry}
      aria-label="Retry loading analytics"
      style={{ borderRadius: 8, height: 40, fontWeight: 600 }}
    >
      {retrying ? 'Retrying…' : 'Retry'}
    </Button>
  </div>
);

export default ErrorState;
