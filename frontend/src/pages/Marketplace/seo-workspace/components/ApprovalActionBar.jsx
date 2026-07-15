import React from 'react';
import { Button, Space } from 'antd';

// Shared by StrategiesPanel (Strategy review modal) and ApprovalsQueuePanel
// (unified Strategy+Task queue) instead of each writing its own Approve/Reject
// buttons.
const ApprovalActionBar = ({
  onApprove,
  onReject,
  approveLabel = 'Approve',
  rejectLabel = 'Reject',
  disabled = false,
  vertical = false
}) => (
  <Space direction={vertical ? 'vertical' : 'horizontal'} style={vertical ? { width: '100%' } : undefined}>
    <Button
      type="primary"
      onClick={onApprove}
      disabled={disabled}
      className="seo-glow-btn"
      style={{ background: 'var(--accent-success)' }}
      block={vertical}
    >
      {approveLabel}
    </Button>
    <Button danger onClick={onReject} disabled={disabled} block={vertical}>
      {rejectLabel}
    </Button>
  </Space>
);

export default ApprovalActionBar;