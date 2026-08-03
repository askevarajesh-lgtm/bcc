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
      logger.error(TAG, `AI Workflow Generation failed: ${err.message}`);
      throw new Error(`AI Workflow Generation failed: ${err.message}`);
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
