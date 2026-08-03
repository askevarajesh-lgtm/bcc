module.exports = {
  id: 'action_error_boundary',
  
  metadata: () => ({
    id: 'action_error_boundary',
    name: 'Error Boundary (Try / Catch)',
    description: 'Catches downstream failures and routes to error handler branch without failing entire workflow',
    category: 'logic',
    icon: 'shield',
    inputs: ['continueOnError', 'errorFallbackValue'],
    outputs: ['hasError', 'errorMessage', 'errorStack']
  }),

  validate: () => true,

  execute: async (config, context) => {
    return {
      success: true,
      hasError: Boolean(context.error),
      errorMessage: context.error?.message || null,
      errorStack: context.error?.stack || null
    };
  }
};
