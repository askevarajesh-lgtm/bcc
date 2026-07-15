import React from 'react';
import { Tag } from 'antd';

// Centralizes the Pending/Approved/Rejected/Implemented/Published color
// mapping that used to be repeated inline in each panel.
const STATUS_COLORS = {
  'Pending': 'gold',
  'Pending Approval': 'gold',
  'Approved': 'green',
  'Published': 'green',
  'Implemented': 'green',
  'Rejected': 'red',
  'Failed': 'red',
  'Draft': 'default'
};

const StatusTag = ({ status, className }) => (
  <Tag color={STATUS_COLORS[status] || 'default'} className={className}>{status}</Tag>
);

export default StatusTag;
