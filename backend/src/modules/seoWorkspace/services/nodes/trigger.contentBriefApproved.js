module.exports = {
  id: 'trigger_content_brief_approved',
  metadata: () => ({
    id: 'trigger_content_brief_approved',
    name: 'Content Brief Approved',
    description: 'Triggers when an AI content brief or strategy is approved for drafting/publishing',
    category: 'triggers',
    icon: 'file-check',
    inputs: [],
    outputs: ['briefId', 'topic', 'targetKeyword', 'assignedTo', 'approvedBy', 'wordCountTarget']
  }),

  validate: () => true,

  match: () => true
};
