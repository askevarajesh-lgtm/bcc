import React from 'react';
import { Tag } from 'antd';

// Shared color mapping for the agent.approvalStatus enum that's identical
// across every agent-output model in seoWorkspace (audit / technical audit /
// competitor / content brief / schema markup / internal link / image seo).
const APPROVAL_COLORS = {
  'Not Requested': 'default',
  'Pending Approval': 'gold',
  'Approved': 'green',
  'Rejected': 'red'
};

export const ApprovalStatusTag = ({ status }) => (
  <Tag color={APPROVAL_COLORS[status] || 'default'}>{status || 'Not Requested'}</Tag>
);

// Shared severity enum used by every findings-based agent (audit / technical
// audit / blog-seo / store-seo / website-builder-seo).
const SEVERITY_COLORS = {
  critical: 'red',
  high: 'volcano',
  medium: 'gold',
  low: 'blue'
};

export const SeverityTag = ({ severity }) => (
  <Tag color={SEVERITY_COLORS[severity] || 'default'}>{(severity || 'unknown').toUpperCase()}</Tag>
);

const TASK_STATUS_COLORS = {
  Pending: 'gold',
  Approved: 'blue',
  Rejected: 'red',
  Implemented: 'green',
  Failed: 'red'
};

export const TaskStatusTag = ({ status }) => (
  <Tag color={TASK_STATUS_COLORS[status] || 'default'}>{status || 'Pending'}</Tag>
);
