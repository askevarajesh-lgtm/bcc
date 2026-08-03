const EventEmitter = require('events');

class ContentEventEmitter extends EventEmitter {}

const contentEvents = new ContentEventEmitter();

// Define Event Constants
contentEvents.EVENTS = {
  CONTENT_GENERATED: 'ContentGenerated',
  CONTENT_UPDATED: 'ContentUpdated',
  VERSION_CREATED: 'VersionCreated',
  CONTENT_APPROVED: 'ContentApproved',
  CONTENT_PUBLISHED: 'ContentPublished',
  SEO_SCORE_UPDATED: 'SEOScoreUpdated',
  KEYWORD_UPDATED: 'KeywordUpdated',
  COMPETITOR_ANALYSIS_COMPLETED: 'CompetitorAnalysisCompleted'
};

module.exports = contentEvents;
