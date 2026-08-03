module.exports = {
  id: 'action_delay',
  
  metadata: () => ({
    id: 'action_delay',
    name: 'Delay / Wait Until',
    description: 'Pauses workflow execution for a fixed duration (seconds/minutes) or until a specific timestamp',
    category: 'logic',
    icon: 'clock',
    inputs: ['durationSeconds', 'waitUntilTimestamp'],
    outputs: ['resumedAt', 'waitedSeconds']
  }),

  validate: () => true,

  execute: async (config, context) => {
    if (context.isSimulation) {
      return { success: true, resumedAt: new Date(), waitedSeconds: 0 };
    }

    const waitSeconds = Math.min(Number(config.durationSeconds) || 1, 300); // max 5 min in sync execution
    await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));

    return {
      success: true,
      resumedAt: new Date(),
      waitedSeconds: waitSeconds
    };
  }
};
