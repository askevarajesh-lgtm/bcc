module.exports = {
  id: 'trigger_email_inbound',
  metadata: () => ({
    id: 'trigger_email_inbound',
    name: 'Inbound Email',
    description: 'Triggers when an email is received on a dedicated project inbound mailbox',
    category: 'triggers',
    icon: 'mail',
    inputs: [],
    outputs: ['from', 'to', 'subject', 'bodyText', 'bodyHtml', 'attachments']
  }),

  validate: () => true,

  match: (config, eventPayload) => {
    if (!config) return true;
    if (config.fromPattern && eventPayload.from && !eventPayload.from.includes(config.fromPattern)) return false;
    if (config.subjectPattern && eventPayload.subject && !eventPayload.subject.includes(config.subjectPattern)) return false;
    return true;
  }
};
