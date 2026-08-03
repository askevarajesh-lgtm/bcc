import React, { useState, useEffect } from 'react';
import { Typography, Form, Input, Select, InputNumber, Switch, Button, Divider, Tabs, message, Tooltip, Space } from 'antd';
import { Sliders, Key, ShieldCheck, Play, HelpCircle, Code, Plus } from 'lucide-react';
import { seoWorkspaceApi } from '../../../../../../api/seoWorkspaceApi';

const { Title, Text } = Typography;
const { Option } = Select;

export default function InspectorPanel({ selectedNode, setNodes, projectId, onDeleteNode, onDuplicateNode }) {
  const [credentials, setCredentials] = useState([]);
  const [activeTab, setActiveTab] = useState('config');
  const [localJsonText, setLocalJsonText] = useState('{}');

  useEffect(() => {
    if (selectedNode) {
      const cfg = selectedNode.data?.config || {};
      setLocalJsonText(typeof cfg === 'object' ? JSON.stringify(cfg, null, 2) : String(cfg));
    }
  }, [selectedNode?.id]);

  useEffect(() => {
    if (projectId) {
      seoWorkspaceApi.getCredentials(projectId).then(res => {
        if (res?.data) setCredentials(res.data);
      }).catch(() => {});
    }
  }, [projectId]);

  if (!selectedNode) {
    return (
      <div className="workflow-inspector" style={{ width: 340, background: '#ffffff', borderLeft: '1px solid #e2e8f0', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#94a3b8' }}>
        <Sliders size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
        <div style={{ fontWeight: 600, fontSize: 14, color: '#64748b' }}>No Node Selected</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>Click on any node on the canvas to configure its settings, variables, and retry policies.</div>
      </div>
    );
  }

  const handleUpdate = (key, value) => {
    setNodes(nds => 
      nds.map(n => {
        if (n.id === selectedNode.id) {
          return {
            ...n,
            data: {
              ...n.data,
              [key]: value
            }
          };
        }
        return n;
      })
    );
  };

  const handleConfigUpdate = (configKey, configValue) => {
    setNodes(nds =>
      nds.map(n => {
        if (n.id === selectedNode.id) {
          const updatedConfig = {
            ...(n.data?.config || {}),
            [configKey]: configValue
          };
          setLocalJsonText(JSON.stringify(updatedConfig, null, 2));
          return {
            ...n,
            data: {
              ...n.data,
              config: updatedConfig
            }
          };
        }
        return n;
      })
    );
  };

  const insertVariable = (varText) => {
    message.info(`Copied variable: ${varText}`);
    navigator.clipboard?.writeText?.(varText);
  };

  const nodeData = selectedNode.data || {};
  const config = nodeData.config || {};
  const nodeType = nodeData.type || 'action';

  return (
    <div className="workflow-inspector" style={{ width: 340, background: '#ffffff', borderLeft: '1px solid #e2e8f0', padding: 16, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <Title level={5} style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Node Inspector</Title>
        <span style={{ fontSize: 10, fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, color: '#475569' }}>
          {selectedNode.id}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
        <Text type="secondary" style={{ fontSize: 12, textTransform: 'capitalize' }}>
          Type: {nodeType} ({nodeData.subtype || 'standard'})
        </Text>
        <Space size={4}>
          {onDuplicateNode && (
            <Button size="small" type="text" onClick={() => onDuplicateNode(selectedNode)} title="Duplicate Node">
              Copy
            </Button>
          )}
          {onDeleteNode && (
            <Button size="small" type="text" danger onClick={() => onDeleteNode(selectedNode.id)} title="Delete Node">
              Delete
            </Button>
          )}
        </Space>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab} 
        size="small"
        items={[
          { key: 'config', label: 'Configuration' },
          { key: 'variables', label: 'Variables' },
          { key: 'retry', label: 'Reliability' }
        ]}
      />

      {activeTab === 'config' && (
        <Form layout="vertical" size="small" style={{ marginTop: 12 }}>
          <Form.Item label="Node Title">
            <Input 
              value={nodeData.label || ''} 
              onChange={e => handleUpdate('label', e.target.value)} 
            />
          </Form.Item>

          <Form.Item label="Subtitle / Notes">
            <Input 
              value={nodeData.subtitle || ''} 
              onChange={e => handleUpdate('subtitle', e.target.value)} 
              placeholder="Brief step summary"
            />
          </Form.Item>

          {/* Condition / If-Else Fields */}
          {nodeType === 'condition' && (
            <Form.Item label="Condition Expression (Safe JS)">
              <Input.TextArea 
                rows={3}
                value={config.expression || ''} 
                onChange={e => handleConfigUpdate('expression', e.target.value)}
                placeholder="e.g. trigger.payload.severity === 'Critical' && payload.dropAmount > 5"
              />
            </Form.Item>
          )}

          {/* Switch Fields */}
          {nodeType === 'switch' && (
            <Form.Item label="Switch Field / Path">
              <Input 
                value={config.switchField || ''} 
                onChange={e => handleConfigUpdate('switchField', e.target.value)}
                placeholder="e.g. trigger.payload.severity"
              />
            </Form.Item>
          )}

          {/* Delay Fields */}
          {nodeType === 'delay' && (
            <Form.Item label="Delay Duration (Minutes)">
              <InputNumber 
                min={1} 
                max={1440} 
                value={config.delayMinutes || 15} 
                onChange={v => handleConfigUpdate('delayMinutes', v)}
                style={{ width: '100%' }}
              />
            </Form.Item>
          )}

          {/* Cron / Schedule Fields */}
          {nodeData.subtype === 'schedule_cron' && (
            <>
              <Form.Item label="Cron Expression">
                <Input 
                  value={config.cron || '0 9 * * 1'} 
                  onChange={e => handleConfigUpdate('cron', e.target.value)}
                  placeholder="0 9 * * 1 (Every Mon 9am)"
                />
              </Form.Item>
              <Form.Item label="Timezone">
                <Select 
                  value={config.timezone || 'UTC'} 
                  onChange={v => handleConfigUpdate('timezone', v)}
                >
                  <Option value="UTC">UTC</Option>
                  <Option value="America/New_York">America/New_York (EST)</Option>
                  <Option value="America/Los_Angeles">America/Los_Angeles (PST)</Option>
                  <Option value="Europe/London">Europe/London (GMT)</Option>
                  <Option value="Asia/Singapore">Asia/Singapore (SGT)</Option>
                </Select>
              </Form.Item>
            </>
          )}

          {/* Email Notification Fields */}
          {nodeData.subtype === 'send_email_digest' && (
            <>
              <Form.Item label="Subject Line">
                <Input 
                  value={config.subject || 'Site Audit Complete - {{project.name}} - {{date}}'} 
                  onChange={e => handleConfigUpdate('subject', e.target.value)}
                  placeholder="e.g. Site Audit Complete - {{project.name}} - {{date}}"
                />
              </Form.Item>
              <Form.Item label="Recipient Email(s)">
                <Input 
                  value={config.recipient || ''} 
                  onChange={e => handleConfigUpdate('recipient', e.target.value)}
                  placeholder="seo-team@company.com, client@example.com"
                />
              </Form.Item>
              <Form.Item label="Report Attachment / Payload URL">
                <Input 
                  value={config.payload || config.reportUrl || '{{steps.run_site_audit.reportPdfUrl}}'} 
                  onChange={e => handleConfigUpdate('payload', e.target.value)}
                  placeholder="{{steps.run_site_audit.reportPdfUrl}}"
                />
              </Form.Item>
              <Form.Item label="Message Template / Body">
                <Input.TextArea 
                  rows={3}
                  value={config.template || ''} 
                  onChange={e => handleConfigUpdate('template', e.target.value)}
                  placeholder="The latest SEO audit report is ready: {{steps.run_site_audit.reportPdfUrl}}"
                />
              </Form.Item>
            </>
          )}

          {/* Slack Notification Fields */}
          {nodeData.subtype === 'send_slack_message' && (
            <>
              <Form.Item label="Slack Channel / Webhook">
                <Input 
                  value={config.recipient || '#seo-alerts'} 
                  onChange={e => handleConfigUpdate('recipient', e.target.value)}
                  placeholder="#seo-alerts or webhook URL"
                />
              </Form.Item>
              <Form.Item label="Message Template / Body">
                <Input.TextArea 
                  rows={3}
                  value={config.template || 'Audit complete: {{steps.run_site_audit.reportPdfUrl}}'} 
                  onChange={e => handleConfigUpdate('template', e.target.value)}
                  placeholder="Alert: {{trigger.payload.details}}"
                />
              </Form.Item>
            </>
          )}

          {/* Update Workspace Data */}
          {(nodeData.subtype === 'update_workspace_db' || nodeData.subtype === 'update_workspace_data') && (
            <>
              <Form.Item label="Subject / Summary Note">
                <Input 
                  value={config.subject || 'Site Audit Complete - {{project.name}} - {{date}}'} 
                  onChange={e => handleConfigUpdate('subject', e.target.value)}
                  placeholder="Site Audit Complete - {{project.name}} - {{date}}"
                />
              </Form.Item>
              <Form.Item label="Target Field / Key">
                <Input 
                  value={config.field || 'latestAuditReport'} 
                  onChange={e => handleConfigUpdate('field', e.target.value)}
                  placeholder="latestAuditReport, status, score"
                />
              </Form.Item>
              <Form.Item label="Payload / Value Template">
                <Input 
                  value={config.payload || '{{steps.run_site_audit.reportPdfUrl}}'} 
                  onChange={e => handleConfigUpdate('payload', e.target.value)}
                  placeholder="{{steps.run_site_audit.reportPdfUrl}}"
                />
              </Form.Item>
            </>
          )}

          {/* Webhook Post Fields */}
          {nodeData.subtype === 'send_webhook_post' && (
            <>
              <Form.Item label="Webhook Endpoint URL">
                <Input 
                  value={config.url || ''} 
                  onChange={e => handleConfigUpdate('url', e.target.value)}
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                />
              </Form.Item>
              <Form.Item label="Secret Vault Credential (Optional)">
                <Select 
                  value={config.credentialId || ''} 
                  onChange={v => handleConfigUpdate('credentialId', v)}
                  allowClear
                  placeholder="Select secured API Key"
                >
                  {credentials.map(c => (
                    <Option key={c._id} value={c._id}>{c.name} ({c.provider})</Option>
                  ))}
                </Select>
              </Form.Item>
            </>
          )}

          {/* Site Audit Specific Fields */}
          {(nodeData.subtype === 'run_site_audit' || nodeData.subtype === 'trigger_site_audit') && (
            <>
              <Form.Item label="Target Domain / URL">
                <Input 
                  value={config.targetDomain || config.url || '{{project.domain}}'} 
                  onChange={e => handleConfigUpdate('targetDomain', e.target.value)}
                  placeholder="{{project.domain}} or https://example.com"
                />
              </Form.Item>
              <Form.Item label="Crawl Depth">
                <InputNumber 
                  min={1} 
                  max={10} 
                  value={config.crawlDepth || 3} 
                  onChange={v => handleConfigUpdate('crawlDepth', v)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="Max Pages to Crawl">
                <InputNumber 
                  min={5} 
                  max={5000} 
                  step={50}
                  value={config.maxPages || 100} 
                  onChange={v => handleConfigUpdate('maxPages', v)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="Include Core Web Vitals">
                <Switch 
                  checked={config.includeCoreWebVitals !== false} 
                  onChange={c => handleConfigUpdate('includeCoreWebVitals', c)} 
                />
              </Form.Item>
            </>
          )}

          {/* Track Keywords SERP */}
          {nodeData.subtype === 'track_keywords_now' && (
            <>
              <Form.Item label="Keywords to Track (Comma separated or 'all')">
                <Input 
                  value={config.keywords || 'all'} 
                  onChange={e => handleConfigUpdate('keywords', e.target.value)}
                  placeholder="e.g. enterprise seo, keyword tool, all"
                />
              </Form.Item>
              <Form.Item label="Search Engine">
                <Select 
                  value={config.engine || 'google'} 
                  onChange={v => handleConfigUpdate('engine', v)}
                >
                  <Option value="google">Google Search</Option>
                  <Option value="bing">Bing</Option>
                  <Option value="yahoo">Yahoo</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Country / Locale">
                <Input 
                  value={config.country || 'US'} 
                  onChange={e => handleConfigUpdate('country', e.target.value)}
                  placeholder="US, UK, IN, Global"
                />
              </Form.Item>
              <Form.Item label="Device Type">
                <Select 
                  value={config.device || 'desktop'} 
                  onChange={v => handleConfigUpdate('device', v)}
                >
                  <Option value="desktop">Desktop</Option>
                  <Option value="mobile">Mobile</Option>
                </Select>
              </Form.Item>
            </>
          )}

          {/* Generate Meta Tags */}
          {nodeData.subtype === 'generate_meta_tags' && (
            <>
              <Form.Item label="Target URL / Page">
                <Input 
                  value={config.pageUrl || '{{project.domain}}'} 
                  onChange={e => handleConfigUpdate('pageUrl', e.target.value)}
                  placeholder="https://example.com/blog/page-1"
                />
              </Form.Item>
              <Form.Item label="Focus Keyword">
                <Input 
                  value={config.focusKeyword || ''} 
                  onChange={e => handleConfigUpdate('focusKeyword', e.target.value)}
                  placeholder="e.g. b2b marketing software"
                />
              </Form.Item>
              <Form.Item label="Generation Tone">
                <Select 
                  value={config.tone || 'high_ctr'} 
                  onChange={v => handleConfigUpdate('tone', v)}
                >
                  <Option value="high_ctr">High Click-Through Rate (CTR)</Option>
                  <Option value="professional">Professional & Authoritative</Option>
                  <Option value="persuasive">Persuasive / Commercial</Option>
                </Select>
              </Form.Item>
            </>
          )}

          {/* GSC URL Inspect */}
          {nodeData.subtype === 'gsc_inspect_url' && (
            <>
              <Form.Item label="Page URL to Inspect">
                <Input 
                  value={config.url || '{{project.domain}}'} 
                  onChange={e => handleConfigUpdate('url', e.target.value)}
                  placeholder="https://example.com/pricing"
                />
              </Form.Item>
            </>
          )}

          {/* GSC Submit Sitemap */}
          {nodeData.subtype === 'gsc_submit_sitemap' && (
            <>
              <Form.Item label="Sitemap XML URL">
                <Input 
                  value={config.sitemapUrl || '{{project.domain}}/sitemap.xml'} 
                  onChange={e => handleConfigUpdate('sitemapUrl', e.target.value)}
                  placeholder="https://example.com/sitemap.xml"
                />
              </Form.Item>
            </>
          )}

          {/* Create Jira Ticket / Task */}
          {nodeData.subtype === 'create_jira_ticket' && (
            <>
              <Form.Item label="Project Key / Board">
                <Input 
                  value={config.projectKey || 'SEO'} 
                  onChange={e => handleConfigUpdate('projectKey', e.target.value)}
                  placeholder="SEO, DEV, PROD"
                />
              </Form.Item>
              <Form.Item label="Issue Title / Summary">
                <Input 
                  value={config.summary || 'SEO Issue Detected: {{trigger.payload.details}}'} 
                  onChange={e => handleConfigUpdate('summary', e.target.value)}
                  placeholder="Issue title"
                />
              </Form.Item>
              <Form.Item label="Priority">
                <Select 
                  value={config.priority || 'High'} 
                  onChange={v => handleConfigUpdate('priority', v)}
                >
                  <Option value="Highest">Highest / Blocker</Option>
                  <Option value="High">High</Option>
                  <Option value="Medium">Medium</Option>
                  <Option value="Low">Low</Option>
                </Select>
              </Form.Item>
            </>
          )}

          {/* Keyword Rank Drop Trigger */}
          {nodeData.subtype === 'keyword_rank_dropped' && (
            <>
              <Form.Item label="Rank Drop Threshold (Positions)">
                <InputNumber 
                  min={1} 
                  max={100} 
                  value={config.threshold || 3} 
                  onChange={v => handleConfigUpdate('threshold', v)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="Monitored Keyword Tag / Filter">
                <Input 
                  value={config.tag || 'all'} 
                  onChange={e => handleConfigUpdate('tag', e.target.value)}
                  placeholder="all, brand, priority"
                />
              </Form.Item>
            </>
          )}

          {/* Traffic Anomaly Trigger */}
          {nodeData.subtype === 'traffic_anomaly' && (
            <>
              <Form.Item label="Traffic Drop Threshold (%)">
                <InputNumber 
                  min={5} 
                  max={95} 
                  value={config.dropPercentage || 20} 
                  onChange={v => handleConfigUpdate('dropPercentage', v)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="Comparison Window (Days)">
                <Select 
                  value={config.windowDays || 7} 
                  onChange={v => handleConfigUpdate('windowDays', v)}
                >
                  <Option value={1}>Last 24 Hours</Option>
                  <Option value={7}>Last 7 Days vs Prior Period</Option>
                  <Option value={28}>Last 28 Days</Option>
                </Select>
              </Form.Item>
            </>
          )}

          {/* Core Web Vitals Degraded Trigger */}
          {nodeData.subtype === 'cwv_degraded' && (
            <>
              <Form.Item label="Degraded Metric">
                <Select 
                  value={config.metric || 'LCP'} 
                  onChange={v => handleConfigUpdate('metric', v)}
                >
                  <Option value="LCP">Largest Contentful Paint (LCP &gt; 2.5s)</Option>
                  <Option value="INP">Interaction to Next Paint (INP &gt; 200ms)</Option>
                  <Option value="CLS">Cumulative Layout Shift (CLS &gt; 0.1)</Option>
                </Select>
              </Form.Item>
            </>
          )}

          {/* Loop / For Each */}
          {nodeData.subtype === 'for_each' && (
            <>
              <Form.Item label="Array Expression to Iterate">
                <Input 
                  value={config.itemsExpression || '{{trigger.payload.items}}'} 
                  onChange={e => handleConfigUpdate('itemsExpression', e.target.value)}
                  placeholder="{{trigger.payload.keywords}}"
                />
              </Form.Item>
              <Form.Item label="Max Loop Iterations">
                <InputNumber 
                  min={1} 
                  max={500} 
                  value={config.maxIterations || 50} 
                  onChange={v => handleConfigUpdate('maxIterations', v)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </>
          )}

          {/* AI Intelligence Fields */}
          {(nodeType === 'ai_agent' || nodeData.subtype?.startsWith('ai_')) && (
            <>
              <Form.Item label="AI Model / Agent Persona">
                <Select 
                  value={config.agentKey || 'seoAuditor'} 
                  onChange={v => handleConfigUpdate('agentKey', v)}
                >
                  <Option value="seoAuditor">SEO Technical Auditor Agent</Option>
                  <Option value="contentWriter">Content SEO Strategist</Option>
                  <Option value="keywordAnalyst">Keyword & SERP Intelligence</Option>
                  <Option value="rootCauseDiagnostician">Root Cause Diagnostician</Option>
                </Select>
              </Form.Item>
              <Form.Item label="AI Custom Instructions / Prompt">
                <Input.TextArea 
                  rows={4}
                  value={config.prompt || ''} 
                  onChange={e => handleConfigUpdate('prompt', e.target.value)}
                  placeholder="Analyze the drop in rankings for {{trigger.payload.keyword}} and formulate a 3-step action plan."
                />
              </Form.Item>
            </>
          )}

          {/* Universal Custom Parameters Section */}
          <Divider style={{ margin: '14px 0 8px 0', fontSize: 11, color: '#94a3b8' }}>
            Advanced Custom Parameters (JSON)
          </Divider>
          <Form.Item label="Raw Node Config (JSON)">
            <Input.TextArea 
              rows={4}
              value={localJsonText}
              onChange={e => {
                const val = e.target.value;
                setLocalJsonText(val);
                try {
                  const parsed = JSON.parse(val);
                  handleUpdate('config', parsed);
                } catch (err) {
                  // Keep free typing state without error resets
                  handleUpdate('config', { ...(nodeData.config || {}), rawText: val });
                }
              }}
              placeholder='{\n  "subject": "Site Audit Complete - {{project.name}}",\n  "payload": "{{steps.run_site_audit.reportPdfUrl}}"\n}'
              style={{ fontFamily: 'monospace', fontSize: 11 }}
            />
          </Form.Item>
        </Form>
      )}

      {activeTab === 'variables' && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
            Click any variable below to copy it to your clipboard:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              '{{trigger.payload.keyword}}',
              '{{trigger.payload.severity}}',
              '{{trigger.payload.details}}',
              '{{project.name}}',
              '{{project.domain}}',
              '{{env.SITE_URL}}',
              '{{nodes.previous_step.output}}'
            ].map((v, i) => (
              <div 
                key={i} 
                onClick={() => insertVariable(v)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  background: '#f1f5f9',
                  fontFamily: 'monospace',
                  fontSize: 11,
                  color: '#2563eb',
                  cursor: 'pointer',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>{v}</span>
                <Code size={12} color="#64748b" />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'retry' && (
        <Form layout="vertical" size="small" style={{ marginTop: 12 }}>
          <Form.Item label="Max Retries on Failure">
            <InputNumber 
              min={0} 
              max={10} 
              value={nodeData.retryPolicy?.maxRetries ?? 3} 
              onChange={v => handleUpdate('retryPolicy', { ...(nodeData.retryPolicy || {}), maxRetries: v })}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="Retry Backoff (ms)">
            <InputNumber 
              min={100} 
              max={60000} 
              step={500} 
              value={nodeData.retryPolicy?.backoffMs ?? 1000} 
              onChange={v => handleUpdate('retryPolicy', { ...(nodeData.retryPolicy || {}), backoffMs: v })}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="Continue Workflow on Failure">
            <Switch 
              checked={nodeData.continueOnError ?? false} 
              onChange={c => handleUpdate('continueOnError', c)} 
            />
          </Form.Item>
        </Form>
      )}
    </div>
  );
}
