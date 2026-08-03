const aiEngine = require('../../aiCore/aiEngine.service');
const { getTriggerRegistry } = require('./automationTriggerRegistry.service');
const { getActionRegistry } = require('./automationActionRegistry.service');
const logger = require('../../aiCore/logger.service');

const TAG = 'AutomationAiGenerator';

class AutomationAiGeneratorService {
  /**
   * Generates a complete DAG workflow from a natural language prompt
   */
  async generateFromPrompt(projectId, promptText, workspaceId = null) {
    logger.info(TAG, `Generating workflow DAG from prompt: "${promptText}"`);

    const triggerRegistry = getTriggerRegistry();
    const actionRegistry = getActionRegistry();

    const availableTriggers = triggerRegistry.listTriggers().map(t => ({ id: t.id, name: t.name, desc: t.description }));
    const availableActions = actionRegistry.listActions().map(a => ({ id: a.id, name: a.name, desc: a.description }));

    const systemPrompt = `You are an elite Enterprise SEO Automation Architect.
Given a user prompt describing an SEO automation or alert process, generate a valid React Flow DAG workflow specification.

Available Triggers: ${JSON.stringify(availableTriggers)}
Available Actions / Logic: ${JSON.stringify(availableActions)}

Requirements:
1. Every workflow MUST have exactly 1 starting trigger node with type "trigger".
2. Followed by appropriate action, condition, or logic nodes.
3. Every node must have: id, type ('trigger' | 'action' | 'condition'), position: { x: number, y: number }, data: { label: string, triggerId/actionId: string, config: object }.
4. Provide clean sequential/branching layout with x spaced by 250px and y spaced by 120px.
5. Provide valid edges connecting sources to targets.
6. Provide descriptive name, description, tags, and category ('Technical', 'Rankings', 'Backlinks', 'Content', 'Monitoring', 'Reporting').

Return STRICT JSON matching this schema:
{
  "name": "Descriptive Workflow Name",
  "description": "Clear multi-sentence workflow description",
  "category": "Technical",
  "tags": ["seo", "keyword", "slack"],
  "nodes": [
    {
      "id": "node-1",
      "type": "trigger",
      "position": { "x": 100, "y": 150 },
      "data": {
        "label": "Keyword Rank Drop Trigger",
        "triggerId": "trigger_keyword_rank_drop",
        "config": { "minDropPositions": 3 }
      }
    }
  ],
  "edges": [
    {
      "id": "e-1-2",
      "source": "node-1",
      "target": "node-2",
      "animated": true
    }
  ],
  "variables": {}
}`;

    try {
      const response = await aiEngine.complete({
        workspaceId: workspaceId || projectId,
        projectId,
        agentKey: 'automationAiGenerator',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `User Prompt: ${promptText}` }
        ],
        jsonMode: true,
        temperature: 0.2
      });

      const generated = JSON.parse(response);
      return {
        success: true,
        workflow: generated
      };
    } catch (err) {
      logger.warn(TAG, `AI Workflow Generation failed, generating heuristic graph: ${err.message}`);
      
      const lower = promptText.toLowerCase();
      let triggerSubtype = 'keyword_rank_dropped';
      let triggerLabel = 'SEO Event Trigger';
      let triggerSubtitle = 'Listen for search signals';

      if (lower.includes('cron') || lower.includes('monday') || lower.includes('daily') || lower.includes('weekly') || lower.includes('every')) {
        triggerSubtype = 'schedule_cron';
        triggerLabel = 'Scheduled Cron Trigger';
        triggerSubtitle = 'Every Monday at 09:00 UTC';
      } else if (lower.includes('cwv') || lower.includes('vitals') || lower.includes('speed') || lower.includes('lcp')) {
        triggerSubtype = 'cwv_failed';
        triggerLabel = 'Core Web Vitals Alert';
        triggerSubtitle = 'LCP or CLS degradation detected';
      } else if (lower.includes('robot') || lower.includes('404') || lower.includes('crawl') || lower.includes('sitemap')) {
        triggerSubtype = 'robots_txt_unreachable';
        triggerLabel = 'Technical SEO Anomaly';
        triggerSubtitle = 'Crawl or indexability alert';
      }

      const generated = {
        name: promptText.length > 50 ? promptText.slice(0, 47) + '...' : promptText,
        description: promptText,
        category: lower.includes('speed') ? 'Performance' : lower.includes('rank') ? 'Rankings' : 'Technical',
        tags: ['seo', 'automation', 'alerts'],
        nodes: [
          {
            id: 'node-1',
            type: 'custom',
            position: { x: 250, y: 50 },
            data: {
              label: triggerLabel,
              subtitle: triggerSubtitle,
              type: 'trigger',
              subtype: triggerSubtype,
              config: { threshold: 3 }
            }
          },
          {
            id: 'node-2',
            type: 'custom',
            position: { x: 250, y: 190 },
            data: {
              label: 'Severity Evaluation',
              subtitle: 'Evaluate event impact score',
              type: 'condition',
              subtype: 'if_else',
              config: { expression: "trigger.payload.severity === 'Critical'" }
            }
          },
          {
            id: 'node-3',
            type: 'custom',
            position: { x: 100, y: 340 },
            data: {
              label: 'Instant Slack Alert',
              subtitle: 'Post alert to #seo-ops channel',
              type: 'action',
              subtype: 'send_slack_message',
              config: { recipient: '#seo-ops', template: 'SEO Alert: Action required.' }
            }
          },
          {
            id: 'node-4',
            type: 'custom',
            position: { x: 400, y: 340 },
            data: {
              label: 'AI Diagnostic Agent',
              subtitle: 'Analyze SERP volatility & fixes',
              type: 'ai_agent',
              subtype: 'ai_root_cause_analysis',
              config: { agentKey: 'rootCauseDiagnostician' }
            }
          }
        ],
        edges: [
          { id: 'edge-1-2', source: 'node-1', target: 'node-2', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
          { id: 'edge-2-3', source: 'node-2', sourceHandle: 'true', target: 'node-3', label: 'True', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
          { id: 'edge-2-4', source: 'node-2', sourceHandle: 'false', target: 'node-4', label: 'False', animated: true, style: { stroke: '#ef4444', strokeWidth: 2 } }
        ],
        variables: {}
      };

      return {
        success: true,
        workflow: generated
      };
    }
  }

  /**
   * Optimizes an existing workflow for reliability, error resilience, and speed
   */
  async optimizeWorkflow(projectId, { nodes, edges, variables }) {
    logger.info(TAG, `Optimizing workflow DAG with ${nodes?.length || 0} nodes`);

    const prompt = `Analyze this SEO Automation Workflow DAG and recommend optimizations:
Nodes: ${JSON.stringify(nodes || [])}
Edges: ${JSON.stringify(edges || [])}

Identify:
1. Missing Error Boundaries or Rollbacks
2. Performance bottlenecks (e.g. unbounded loops, missing timeouts)
3. Unconnected or orphaned nodes
4. Improved prompt configurations for AI nodes

Return STRICT JSON:
{
  "score": 85,
  "recommendations": [
    {
      "type": "reliability | performance | security",
      "severity": "high | medium | low",
      "nodeId": "node-2",
      "issue": "Missing retry policy on external HTTP request",
      "suggestedFix": "Enable maxRetries: 3 with backoff"
    }
  ],
  "suggestedNodes": [],
  "suggestedEdges": []
}`;

    try {
      const response = await aiEngine.complete({
        workspaceId: projectId,
        projectId,
        agentKey: 'automationAiOptimizer',
        messages: [{ role: 'user', content: prompt }],
        jsonMode: true,
        temperature: 0.2
      });

      return JSON.parse(response);
    } catch (err) {
      return {
        score: 75,
        recommendations: [{ type: 'reliability', severity: 'medium', issue: 'Could not perform deep AI scan: ' + err.message, suggestedFix: 'Verify node inputs manually' }]
      };
    }
  }
}

module.exports = new AutomationAiGeneratorService();
