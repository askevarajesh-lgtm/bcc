import React from 'react';
import { Tag } from 'antd';

// Draft -> In Review -> Approved -> Published, with Rejected as a side-branch —
// mirrors ContentPiece.status on the backend (contentPiece.model.js).
const COLORS = {
  Draft: 'default',
  'In Review': 'gold',
  Approved: 'blue',
  Rejected: 'red',
  Published: 'green'
};

const WorkflowStatusBadge = ({ status }) => (
  <Tag color={COLORS[status] || 'default'}>{status}</Tag>
);

export default WorkflowStatusBadge;
