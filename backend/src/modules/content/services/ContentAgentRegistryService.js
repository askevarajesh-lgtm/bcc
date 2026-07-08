class ContentAgentRegistryService {
  constructor() {
    this.registry = {
      'content-intake': {
        agent: 'contentIntake',
        model: 'gpt-4o',
        humanize: false
      },
      'content-researcher': {
        agent: 'contentResearcher',
        model: 'gpt-4o',
        humanize: false
      },
      'content-calendar-planner': {
        agent: 'contentCalendarPlanner',
        model: 'gpt-4o',
        humanize: false
      },
      'blog-writer': {
        agent: 'blogWriter',
        model: 'gpt-4o',
        humanize: true
      },
      'social-caption-writer': {
        agent: 'socialCaptionWriter',
        model: 'gpt-4o',
        humanize: true
      },
      'reel-scriptwriter': {
        agent: 'reelScriptwriter',
        model: 'gpt-4o',
        humanize: true
      },
      'creative-brief-writer': {
        agent: 'creativeBriefWriter',
        model: 'gpt-4o',
        humanize: false
      },
      'content-humanizer': {
        agent: 'contentHumanizer',
        model: 'gpt-4o',
        humanize: false
      },
      'content-qa-compliance': {
        agent: 'contentQACompliance',
        model: 'gpt-4o',
        humanize: false
      }
    };
  }

  resolve(contentType) {
    return this.registry[contentType] || this.registry['social-caption-writer']; // default fallback
  }
}

module.exports = new ContentAgentRegistryService();
