import React from 'react';
import { Typography, Card } from 'antd';
import { AlertCircle } from 'lucide-react';

const { Title, Text } = Typography;

const GscNotConnected = () => (
  <Card 
    bordered={false} 
    style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center', padding: '40px 20px' }}
  >
    <div style={{ background: 'rgba(239, 68, 68, 0.1)', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
      <AlertCircle size={32} style={{ color: 'var(--accent-danger)' }} />
    </div>
    <Title level={4} style={{ marginTop: 0, marginBottom: 12 }}>Google Search Console Not Connected</Title>
    <Text type="secondary" style={{ display: 'block', maxWidth: 500, margin: '0 auto 24px', fontSize: 16 }}>
      We couldn't fetch data for this property from Google Search Console. Please make sure that you have added the service account to your Google Search Console property with appropriate permissions.
    </Text>
    <Text style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 8, display: 'inline-block', fontFamily: 'monospace' }}>
      content-marketing-research@deep-geography-489307-e4.iam.gserviceaccount.com
    </Text>
  </Card>
);

export default GscNotConnected;
