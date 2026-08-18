import React from 'react';
import { Drawer, Descriptions, Typography } from 'antd';

const { Text } = Typography;

/**
 * Generic drill-down surface: opens with the fields already fetched for a
 * table row or chart segment, presented at full detail. Doesn't invent any
 * data the dashboard doesn't already have — it's a focused view of the
 * same real numbers, not a deeper dataset that doesn't exist.
 */
const DrillDownDrawer = ({ open, onClose, title, subtitle, fields }) => (
  <Drawer
    title={title}
    open={open}
    onClose={onClose}
    width={420}
    styles={{ body: { paddingTop: 16 } }}
  >
    {subtitle && <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>{subtitle}</Text>}
    <Descriptions column={1} bordered size="middle">
      {(fields || []).map(f => (
        <Descriptions.Item key={f.label} label={f.label}>{f.value}</Descriptions.Item>
      ))}
    </Descriptions>
  </Drawer>
);

export default DrillDownDrawer;
