const AutomationTemplate = require('../models/automationTemplate.model');
const logger = require('../../aiCore/logger.service');

const TAG = 'AutomationTemplatesSeeder';

const ENTERPRISE_TEMPLATES = [
  {
    name: 'Keyword Rank Drop Alert & Remediation Brief',
    description: 'Triggers when a tracked target keyword drops > 3 positions, runs AI SERP analysis, creates an actionable workspace task, and notifies the SEO channel on Slack.',
    category: 'Rankings',
    tags: ['Rank Tracking', 'AI Brief', 'Slack', 'Task'],
    difficulty: 'Intermediate',
    icon: 'trending-down',
    nodes: [
      { id: 'node-1', type: 'trigger', position: { x: 100, y: 150 }, data: { label: 'Keyword Rank Drop', triggerId: 'trigger_keyword_rank_drop', config: { minDropPositions: 3 } } },
      { id: 'node-2', type: 'action', position: { x: 380, y: 150 }, data: { label: 'AI SERP Remediation', actionId: 'action_ai_recommend', config: { issueType: 'Rank Drop', url: '{{targetUrl}}' } } },
      { id: 'node-3', type: 'action', position: { x: 660, y: 150 }, data: { label: 'Create SEO Task', actionId: 'action_task_creator', config: { title: 'Fix Rank Drop on {{keyword}}', priority: 'High', category: 'Technical' } } },
      { id: 'node-4', type: 'action', position: { x: 940, y: 150 }, data: { label: 'Notify Slack', actionId: 'action_notification', config: { channel: 'slack', title: 'Rank Drop Alert: {{keyword}}', message: 'Keyword dropped to rank {{currentRank}}. Task created for remediation.' } } }
    ],
    edges: [
      { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true },
      { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true },
      { id: 'e3-4', source: 'node-3', target: 'node-4', animated: true }
    ],
    variables: {}
  },
  {
    name: 'Instant Google Indexing Submission on New URL',
    description: 'Listens for newly published or updated URLs and submits them directly to the Google Indexing API with Cloudflare edge cache purge.',
    category: 'Technical',
    tags: ['Indexing', 'Google', 'Cloudflare'],
    difficulty: 'Advanced',
    icon: 'upload-cloud',
    nodes: [
      { id: 'node-1', type: 'trigger', position: { x: 100, y: 150 }, data: { label: 'New URL Webhook', triggerId: 'trigger_webhook', config: {} } },
      { id: 'node-2', type: 'action', position: { x: 380, y: 150 }, data: { label: 'Submit Google Indexing', actionId: 'action_google_indexing_submit', config: { url: '{{body.url}}', type: 'URL_UPDATED' } } },
      { id: 'node-3', type: 'action', position: { x: 660, y: 150 }, data: { label: 'Purge Cloudflare Cache', actionId: 'action_cloudflare_purge_cache', config: { files: ['{{body.url}}'], zoneId: '{{variables.zoneId}}' } } }
    ],
    edges: [
      { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true },
      { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true }
    ],
    variables: { zoneId: '' }
  },
  {
    name: 'Critical Technical Crawl Health Alert to Jira',
    description: 'Evaluates completed technical site audits. If critical issues exceed 5, creates a prioritized bug in Jira and alerts the engineering team.',
    category: 'Technical',
    tags: ['Crawl', 'Jira', 'Audit', 'DevOps'],
    difficulty: 'Intermediate',
    icon: 'activity',
    nodes: [
      { id: 'node-1', type: 'trigger', position: { x: 100, y: 150 }, data: { label: 'Audit Completed', triggerId: 'trigger_technical_audit_completed', config: { minCriticalIssues: 5 } } },
      { id: 'node-2', type: 'condition', position: { x: 380, y: 150 }, data: { label: 'Check Critical Count', config: { rules: [{ field: 'criticalIssuesCount', operator: '>=', value: 5 }] } } },
      { id: 'node-3', type: 'action', position: { x: 660, y: 80 }, data: { label: 'Create Jira Bug', actionId: 'action_jira_create_issue', config: { projectKey: 'SEO', summary: 'Crawl Health Critical Issues Detected ({{criticalIssuesCount}})', issueType: 'Bug' } } },
      { id: 'node-4', type: 'action', position: { x: 660, y: 220 }, data: { label: 'Log Health Succeeded', actionId: 'action_end', config: { outputVariables: { status: 'Healthy' } } } }
    ],
    edges: [
      { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true },
      { id: 'e2-3', source: 'node-2', target: 'node-3', sourceHandle: 'true', label: 'true', animated: true },
      { id: 'e2-4', source: 'node-2', target: 'node-4', sourceHandle: 'false', label: 'false' }
    ],
    variables: {}
  },
  {
    name: 'Competitor Outrank Surveillance & Counter-Strategy',
    description: 'Detects when a key competitor overtakes your position on high-volume keywords, generates an AI competitor gap brief, and creates a task.',
    category: 'Competitors',
    tags: ['Competitors', 'AI Strategy', 'Surveillance'],
    difficulty: 'Advanced',
    icon: 'users',
    nodes: [
      { id: 'node-1', type: 'trigger', position: { x: 100, y: 150 }, data: { label: 'Competitor Overtake', triggerId: 'trigger_competitor_rank_change', config: { onlyWhenOvertakes: true } } },
      { id: 'node-2', type: 'action', position: { x: 380, y: 150 }, data: { label: 'Generate Counter-Brief', actionId: 'action_ai_generate', config: { prompt: 'Competitor {{competitorDomain}} overtook us on keyword {{keyword}} (Rank {{competitorRank}} vs {{ourRank}}). Draft a counter-content optimization brief.' } } },
      { id: 'node-3', type: 'action', position: { x: 660, y: 150 }, data: { label: 'Create Content Task', actionId: 'action_task_creator', config: { title: 'Counter-SEO for {{keyword}} vs {{competitorDomain}}', priority: 'High', category: 'Content' } } }
    ],
    edges: [
      { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true },
      { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true }
    ],
    variables: {}
  },
  {
    name: 'Core Web Vitals Regression Emergency Alert',
    description: 'Triggers immediately when LCP, INP, or CLS metrics fail Core Web Vitals thresholds on money pages.',
    category: 'Performance',
    tags: ['CWV', 'LCP', 'INP', 'Teams', 'Emergency'],
    difficulty: 'Beginner',
    icon: 'gauge',
    nodes: [
      { id: 'node-1', type: 'trigger', position: { x: 100, y: 150 }, data: { label: 'CWV Degraded', triggerId: 'trigger_cwv_degraded', config: {} } },
      { id: 'node-2', type: 'action', position: { x: 380, y: 150 }, data: { label: 'Notify Teams Channel', actionId: 'action_notification', config: { channel: 'teams', title: 'CWV Degradation on {{url}}', message: 'Metric {{metricName}} degraded from {{previousValue}} to {{currentValue}}.', severity: 'critical' } } }
    ],
    edges: [
      { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true }
    ],
    variables: {}
  },
  {
    name: 'Lost High-DA Backlink Recovery Pipeline',
    description: 'Alerts when a backlink from a high-domain-authority site (DA > 40) is lost or drops to 404, triggering an outreach recovery task.',
    category: 'Backlinks',
    tags: ['Backlinks', 'Outreach', 'Recovery'],
    difficulty: 'Intermediate',
    icon: 'unlink',
    nodes: [
      { id: 'node-1', type: 'trigger', position: { x: 100, y: 150 }, data: { label: 'Lost Backlink', triggerId: 'trigger_backlink_lost', config: { minDomainAuthority: 40 } } },
      { id: 'node-2', type: 'action', position: { x: 380, y: 150 }, data: { label: 'Draft Outreach Email', actionId: 'action_ai_generate', config: { prompt: 'Write a friendly backlink reclamation email to the webmaster of {{sourceUrl}} regarding lost link to {{targetUrl}}.' } } },
      { id: 'node-3', type: 'action', position: { x: 660, y: 150 }, data: { label: 'Create Outreach Task', actionId: 'action_task_creator', config: { title: 'Reclaim Backlink from {{sourceUrl}} (DA {{domainAuthority}})', priority: 'Medium', category: 'Outreach' } } }
    ],
    edges: [
      { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true },
      { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true }
    ],
    variables: {}
  },
  {
    name: 'Weekly Executive SEO Digest to Discord & Email',
    description: 'Schedules a recurring weekly executive summary of keyword movements, crawl audits, and organic traffic growth.',
    category: 'Reporting',
    tags: ['Digest', 'Cron', 'Discord', 'Executive'],
    difficulty: 'Beginner',
    icon: 'file-text',
    nodes: [
      { id: 'node-1', type: 'trigger', position: { x: 100, y: 150 }, data: { label: 'Weekly Schedule (Monday 9AM)', triggerId: 'trigger_schedule', config: { cron: '0 9 * * 1' } } },
      { id: 'node-2', type: 'action', position: { x: 380, y: 150 }, data: { label: 'Query Workspace Stats', actionId: 'action_database_query', config: { collectionName: 'keywords', limit: 20 } } },
      { id: 'node-3', type: 'action', position: { x: 660, y: 150 }, data: { label: 'AI Executive Summary', actionId: 'action_ai_summarize', config: { targetAudience: 'Executive Leadership' } } },
      { id: 'node-4', type: 'action', position: { x: 940, y: 150 }, data: { label: 'Dispatch Discord Broadcast', actionId: 'action_notification', config: { channel: 'discord', title: 'Weekly SEO Performance Digest', message: '{{summary}}' } } }
    ],
    edges: [
      { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true },
      { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true },
      { id: 'e3-4', source: 'node-3', target: 'node-4', animated: true }
    ],
    variables: {}
  },
  {
    name: 'Critical Site Downtime / 5xx Outage Escalation',
    description: 'Instant multi-channel emergency alert (PagerDuty/Slack/Telegram) when site uptime monitor detects endpoint downtime.',
    category: 'Monitoring',
    tags: ['Uptime', 'Outage', 'Slack', 'Telegram', 'P0'],
    difficulty: 'Intermediate',
    icon: 'power-off',
    nodes: [
      { id: 'node-1', type: 'trigger', position: { x: 100, y: 150 }, data: { label: 'Uptime Down Trigger', triggerId: 'trigger_uptime_down', config: {} } },
      { id: 'node-2', type: 'action', position: { x: 380, y: 150 }, data: { label: 'Slack Alert', actionId: 'action_notification', config: { channel: 'slack', title: '🚨 P0 OUTAGE: {{url}} is DOWN', message: 'HTTP Status: {{statusCode}} - Response: {{errorMessage}}', severity: 'critical' } } },
      { id: 'node-3', type: 'action', position: { x: 660, y: 150 }, data: { label: 'Telegram Alert', actionId: 'action_notification', config: { channel: 'telegram', title: '🚨 P0 OUTAGE: {{url}} is DOWN', message: 'HTTP Status: {{statusCode}}', severity: 'critical' } } }
    ],
    edges: [
      { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true },
      { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true }
    ],
    variables: {}
  }
];

async function seedEnterpriseTemplates() {
  try {
    for (const t of ENTERPRISE_TEMPLATES) {
      await AutomationTemplate.findOneAndUpdate(
        { name: t.name },
        { ...t, isPublic: true },
        { upsert: true, new: true }
      );
    }
    logger.info(TAG, `Successfully seeded ${ENTERPRISE_TEMPLATES.length} enterprise automation templates`);
  } catch (err) {
    logger.warn(TAG, `Failed to seed templates: ${err.message}`);
  }
}

module.exports = { seedEnterpriseTemplates, ENTERPRISE_TEMPLATES };
