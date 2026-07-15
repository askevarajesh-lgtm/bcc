import React from 'react';
import { Card, Typography } from 'antd';

const { Title, Text } = Typography;

// Small metric tile used by the Audit modal, Analytics panel, and Dashboard.
// `suffix` is typically '/100' for score-style metrics, omit for raw counts.
const ScoreCard = ({ title, value, suffix = '', icon = null }) => (
  <Card size="small" title={title} className="seo-metric-card" bordered={false}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {icon}
      <Title level={3} className="seo-metric-value" style={{ margin: 0 }}>
        {value ?? 0}{suffix}
      </Title>
    </div>
  </Card>
);

export default ScoreCard;
