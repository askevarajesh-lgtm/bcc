const crypto = require('crypto');
const logger = require('../../../aiCore/logger.service');

module.exports = {
  id: 'action_human_approval',
  
  metadata: () => ({
    id: 'action_human_approval',
    name: 'Human Approval Gate',
    description: 'Pauses workflow until a human reviewer approves or rejects via email, Slack, or dashboard',
    category: 'logic',
    icon: 'user-check',
    inputs: ['approvalPrompt', 'approverRoles', 'timeoutHours', 'defaultOnTimeout'],
    outputs: ['approvalStatus', 'approvedBy', 'approvalComments', 'approvedAt']
  }),

  validate: () => true,

  execute: async (config, context) => {
    if (context.isSimulation) {
      return {
        success: true,
        approvalStatus: 'Approved',
        approvedBy: 'SimulatedReviewer',
        approvedAt: new Date(),
        approvalComments: 'Auto-approved in simulation'
      };
    }

    const approvalToken = crypto.randomBytes(24).toString('hex');
    logger.info('Action:HumanApproval', `Created human approval gate token=${approvalToken} for run ${context.runId}`);

    // In sync engine execution, if already approved via context resume
    if (context.approvalPayload) {
      return {
        success: context.approvalPayload.status === 'Approved',
        approvalStatus: context.approvalPayload.status,
        approvedBy: context.approvalPayload.userId || 'Reviewer',
        approvedAt: new Date(),
        approvalComments: context.approvalPayload.comments || ''
      };
    }

    return {
      success: true,
      approvalStatus: 'Pending',
      approvalToken,
      isPausedForApproval: true
    };
  }
};
