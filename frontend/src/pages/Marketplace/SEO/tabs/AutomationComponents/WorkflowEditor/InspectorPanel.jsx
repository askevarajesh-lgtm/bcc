import React, { useState, useEffect } from 'react';
import { Typography, Form, Input, Select, InputNumber, Switch, Button, Divider, Tabs, message, Space, Card } from 'antd';
import { Sliders, Key, ShieldCheck, Play, HelpCircle, Code, Plus, Copy } from 'lucide-react';
import { seoWorkspaceApi } from '../../../../../../api/seoWorkspaceApi';
import { useTheme } from '../../../../../../contexts/ThemeContext';

const { Title, Text } = Typography;
const { Option } = Select;

export default function InspectorPanel({ selectedNode, setNodes, projectId, onDeleteNode, onDuplicateNode }) {
  const [credentials, setCredentials] = useState([]);
  const [activeTab, setActiveTab] = useState('config');
  const [localJsonText, setLocalJsonText] = useState('{}');
  const { isDark } = useTheme();

  const panelBg    = isDark ? '#0f172a' : '#ffffff';
  const panelBdr   = isDark ? '1px solid #1e293b' : '1px solid #e2e8f0';
  const titleClr   = isDark ? '#f1f5f9' : '#1e293b';
  const subClr     = isDark ? '#64748b' : '#94a3b8';
  const monoChip   = isDark ? { background: '#1e293b', color: '#94a3b8' } : { background: '#f1f5f9', color: '#475569' };

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
      <div className="workflow-inspector" style={{ width: 340, background: panelBg, borderLeft: panelBdr, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: subClr }}>
        <Sliders size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
        <div style={{ fontWeight: 600, fontSize: 14, color: titleClr }}>No Node Selected</div>
        <div style={{ fontSize: 12, marginTop: 4, color: subClr }}>Click on any node on the canvas to configure its parameters, dynamic variables, and retry policies.</div>
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
    message.info(`Copied variable to clipboard: ${varText}`);
    navigator.clipboard?.writeText?.(varText);
  };

  const nodeData = selectedNode.data || {};
  const config = nodeData.config || {};
  const nodeType = nodeData.type || 'action';
  const subtype = (nodeData.subtype || nodeData.actionId || nodeData.triggerId || '').toLowerCase();

  return (
    <div className="workflow-inspector" style={{ width: 340, background: panelBg, borderLeft: panelBdr, padding: 16, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <Title level={5} style={{ margin: 0, fontSize: 15, fontWeight: 700, color: titleClr }}>Node Inspector</Title>
        <span style={{ fontSize: 10, fontFamily: 'monospace', padding: '2px 6px', borderRadius: 4, ...monoChip }}>
          {selectedNode.id}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
        <Text type="secondary" style={{ fontSize: 12, textTransform: 'capitalize' }}>
          Type: {nodeType} ({subtype || 'standard'})
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
          {(subtype === 'schedule_cron' || subtype === 'trigger_schedule_cron') && (
            <>
              <Form.Item label="Cron Expression">
                <Input 
                  value={config.cron || '0 19 * * *'} 
                  onChange={e => handleConfigUpdate('cron', e.target.value)}
                  placeholder="0 19 * * * (Every day 19:00)"
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
                  <Option value="Asia/Kolkata">Asia/Kolkata (IST)</Option>
                </Select>
              </Form.Item>
            </>
          )}

          {/* Site Audit Specific Fields */}
          {(subtype === 'run_site_audit' || subtype === 'trigger_site_audit') && (
            <>
              <Form.Item label="Target Domain / URL">
                <Input 
                  value={config.targetDomain || config.url || '{{project.domain}}'} 
                  onChange={e => handleConfigUpdate('targetDomain', e.target.value)}
                  placeholder="{{project.domain}} or https://askeva.io"
                />
              </Form.Item>
              <Form.Item label="Max Pages to Crawl">
                <InputNumber 
                  min={5} 
                  max={5000} 
                  step={50}
                  value={config.maxPages || 25} 
                  onChange={v => handleConfigUpdate('maxPages', v)}
                  style={{ width: '100%' }}
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
              <Form.Item label="Store Results to Workspace Database">
                <Switch 
                  checked={config.storeResults !== false} 
                  onChange={c => handleConfigUpdate('storeResults', c)} 
                />
              </Form.Item>
            </>
          )}

          {/* Technical SEO Fields */}
          {subtype === 'run_technical_seo' && (
            <>
              <Form.Item label="Auto-Generate Code Fixes">
                <Switch 
                  checked={config.autoGenerateFixes !== false} 
                  onChange={c => handleConfigUpdate('autoGenerateFixes', c)} 
                />
              </Form.Item>
              <Form.Item label="Severity Filter">
                <Select 
                  value={config.severityThreshold || 'medium'} 
                  onChange={v => handleConfigUpdate('severityThreshold', v)}
                >
                  <Option value="low">All Severities (Low, Med, High, Crit)</Option>
                  <Option value="medium">Medium & Above</Option>
                  <Option value="high">High & Critical Only</Option>
                  <Option value="critical">Critical Only</Option>
                </Select>
              </Form.Item>
            </>
          )}

          {/* Refresh Keywords Fields */}
          {subtype === 'refresh_keywords' && (
            <>
              <Form.Item label="Keyword Filter">
                <Select 
                  value={config.keywordFilter || 'all'} 
                  onChange={v => handleConfigUpdate('keywordFilter', v)}
                >
                  <Option value="all">All Tracked Keywords</Option>
                  <Option value="priority">Priority / Core Only</Option>
                  <Option value="drops">Keywords with Recent Drops</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Max Keywords to Track">
                <InputNumber 
                  min={1} 
                  max={500} 
                  value={config.maxKeywords || 50} 
                  onChange={v => handleConfigUpdate('maxKeywords', v)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </>
          )}

          {/* Competitor Analysis Fields */}
          {subtype === 'analyze_competitors' && (
            <>
              <Form.Item label="Max Competitors">
                <InputNumber 
                  min={1} 
                  max={20} 
                  value={config.maxCompetitors || 5} 
                  onChange={v => handleConfigUpdate('maxCompetitors', v)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="Detect Ranking Overtakes">
                <Switch 
                  checked={config.detectOvertakes !== false} 
                  onChange={c => handleConfigUpdate('detectOvertakes', c)} 
                />
              </Form.Item>
            </>
          )}

          {/* Content AI Brief Fields */}
          {subtype === 'content_ai_generate' && (
            <>
              <Form.Item label="Target Keyword">
                <Input 
                  value={config.targetKeyword || ''} 
                  onChange={e => handleConfigUpdate('targetKeyword', e.target.value)}
                  placeholder="e.g. enterprise seo automation"
                />
              </Form.Item>
              <Form.Item label="Content Type">
                <Select 
                  value={config.contentType || 'Article'} 
                  onChange={v => handleConfigUpdate('contentType', v)}
                >
                  <Option value="Article">Long-Form Article</Option>
                  <Option value="Pillar Page">Comprehensive Pillar Page</Option>
                  <Option value="Product Guide">Product Comparison Guide</Option>
                  <Option value="Landing Page">Landing Page</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Target Word Count">
                <InputNumber 
                  min={300} 
                  max={8000} 
                  value={config.targetWordCount || 1500} 
                  onChange={v => handleConfigUpdate('targetWordCount', v)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </>
          )}

          {/* AEO / LLM Citations */}
          {subtype === 'run_aeo_audit' && (
            <>
              <Form.Item label="Engines to Benchmark">
                <Select 
                  value={config.engines || 'all'} 
                  onChange={v => handleConfigUpdate('engines', v)}
                >
                  <Option value="all">All Engines (ChatGPT, Perplexity, Gemini, Claude)</Option>
                  <Option value="top_two">ChatGPT & Perplexity Only</Option>
                  <Option value="google_only">Google Gemini & SGE Only</Option>
                </Select>
              </Form.Item>
            </>
          )}

          {/* GEO / Knowledge Graph */}
          {subtype === 'run_geo_audit' && (
            <>
              <Form.Item label="Brand / Entity Name">
                <Input 
                  value={config.brandName || ''} 
                  onChange={e => handleConfigUpdate('brandName', e.target.value)}
                  placeholder="e.g. AskEva"
                />
              </Form.Item>
            </>
          )}

          {/* Schema Structured Data */}
          {subtype === 'generate_schema' && (
            <>
              <Form.Item label="Schema.org Type">
                <Select 
                  value={config.schemaType || 'Article'} 
                  onChange={v => handleConfigUpdate('schemaType', v)}
                >
                  <Option value="Article">Article / BlogPosting</Option>
                  <Option value="FAQPage">FAQPage</Option>
                  <Option value="Organization">Organization & Brand</Option>
                  <Option value="Product">Product & Offer</Option>
                  <Option value="BreadcrumbList">BreadcrumbList</Option>
                </Select>
              </Form.Item>
            </>
          )}

          {/* Internal Linking */}
          {subtype === 'generate_internal_links' && (
            <>
              <Form.Item label="Max Link Suggestions">
                <InputNumber 
                  min={1} 
                  max={50} 
                  value={config.maxSuggestions || 10} 
                  onChange={v => handleConfigUpdate('maxSuggestions', v)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="Fix Orphan Pages">
                <Switch 
                  checked={config.fixOrphanPages !== false} 
                  onChange={c => handleConfigUpdate('fixOrphanPages', c)} 
                />
              </Form.Item>
            </>
          )}

          {/* Generate Reports */}
          {subtype === 'generate_report' && (
            <>
              <Form.Item label="Report Template Type">
                <Select 
                  value={config.reportType || 'executive_summary'} 
                  onChange={v => handleConfigUpdate('reportType', v)}
                >
                  <Option value="executive_summary">Executive Leadership Summary</Option>
                  <Option value="monthly_digest">Monthly Client SEO Progress</Option>
                  <Option value="technical_audit">Technical Audit Report</Option>
                  <Option value="rank_tracking">Keyword Rankings & SERP Movement</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Export Format">
                <Select 
                  value={config.exportFormat || 'pdf'} 
                  onChange={v => handleConfigUpdate('exportFormat', v)}
                >
                  <Option value="pdf">Branded PDF</Option>
                  <Option value="csv">Structured CSV</Option>
                  <Option value="markdown">Markdown</Option>
                </Select>
              </Form.Item>
            </>
          )}

          {/* Notification Hub / Slack / Email */}
          {(subtype === 'send_notification' || subtype === 'send_email_digest' || subtype === 'send_slack_message') && (
            <>
              <Form.Item label="Channel">
                <Select 
                  value={config.channel || (subtype.includes('slack') ? 'slack' : 'email')} 
                  onChange={v => handleConfigUpdate('channel', v)}
                >
                  <Option value="email">Email Digest</Option>
                  <Option value="slack">Slack Webhook</Option>
                  <Option value="teams">Microsoft Teams</Option>
                  <Option value="discord">Discord Webhook</Option>
                  <Option value="telegram">Telegram Bot</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Subject / Title (Supports {{variables}})">
                <Input 
                  value={config.title || config.subject || 'SEO Digest: {{project.domain}} - {{date}}'} 
                  onChange={e => {
                    handleConfigUpdate('title', e.target.value);
                    handleConfigUpdate('subject', e.target.value);
                  }}
                />
              </Form.Item>
              <Form.Item label="Recipient Email / Channel">
                <Input 
                  value={config.recipient || ''} 
                  onChange={e => handleConfigUpdate('recipient', e.target.value)}
                  placeholder="seo-team@company.com or #seo-alerts"
                />
              </Form.Item>
              <Form.Item label="Message Body (Supports {{variables}})">
                <Input.TextArea 
                  rows={4}
                  value={config.message || config.template || ''} 
                  onChange={e => {
                    handleConfigUpdate('message', e.target.value);
                    handleConfigUpdate('template', e.target.value);
                  }}
                  placeholder="Site Audit Completed with score {{steps.run_site_audit.score}}/100. Download: {{steps.run_site_audit.reportPdfUrl}}"
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
                setLocalJsonText(e.target.value);
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleUpdate('config', parsed);
                } catch (err) {
                  // Wait for valid JSON
                }
              }}
              style={{ fontFamily: 'monospace', fontSize: 11 }}
            />
          </Form.Item>
        </Form>
      )}

      {activeTab === 'variables' && (
        <div style={{ marginTop: 12 }}>
          <Text style={{ fontSize: 12, color: subClr }}>
            Insert dynamic tokens into inputs to pass outputs between nodes:
          </Text>
          
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: titleClr, textTransform: 'uppercase' }}>Site Audit Outputs</div>
            <div onClick={() => insertVariable('{{steps.run_site_audit.score}}')} style={{ padding: '6px 8px', background: monoChip.background, color: monoChip.color, borderRadius: 4, cursor: 'pointer', fontSize: 11, fontFamily: 'monospace', display: 'flex', justifyContent: 'space-between' }}>
              <span>{"{{steps.run_site_audit.score}}"}</span>
              <Copy size={12} />
            </div>
            <div onClick={() => insertVariable('{{steps.run_site_audit.pagesCrawled}}')} style={{ padding: '6px 8px', background: monoChip.background, color: monoChip.color, borderRadius: 4, cursor: 'pointer', fontSize: 11, fontFamily: 'monospace', display: 'flex', justifyContent: 'space-between' }}>
              <span>{"{{steps.run_site_audit.pagesCrawled}}"}</span>
              <Copy size={12} />
            </div>
            <div onClick={() => insertVariable('{{steps.run_site_audit.findingsCount}}')} style={{ padding: '6px 8px', background: monoChip.background, color: monoChip.color, borderRadius: 4, cursor: 'pointer', fontSize: 11, fontFamily: 'monospace', display: 'flex', justifyContent: 'space-between' }}>
              <span>{"{{steps.run_site_audit.findingsCount}}"}</span>
              <Copy size={12} />
            </div>
            <div onClick={() => insertVariable('{{steps.run_site_audit.reportPdfUrl}}')} style={{ padding: '6px 8px', background: monoChip.background, color: monoChip.color, borderRadius: 4, cursor: 'pointer', fontSize: 11, fontFamily: 'monospace', display: 'flex', justifyContent: 'space-between' }}>
              <span>{"{{steps.run_site_audit.reportPdfUrl}}"}</span>
              <Copy size={12} />
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: titleClr, textTransform: 'uppercase', marginTop: 8 }}>Global Variables</div>
            <div onClick={() => insertVariable('{{project.name}}')} style={{ padding: '6px 8px', background: monoChip.background, color: monoChip.color, borderRadius: 4, cursor: 'pointer', fontSize: 11, fontFamily: 'monospace', display: 'flex', justifyContent: 'space-between' }}>
              <span>{"{{project.name}}"}</span>
              <Copy size={12} />
            </div>
            <div onClick={() => insertVariable('{{project.domain}}')} style={{ padding: '6px 8px', background: monoChip.background, color: monoChip.color, borderRadius: 4, cursor: 'pointer', fontSize: 11, fontFamily: 'monospace', display: 'flex', justifyContent: 'space-between' }}>
              <span>{"{{project.domain}}"}</span>
              <Copy size={12} />
            </div>
            <div onClick={() => insertVariable('{{date}}')} style={{ padding: '6px 8px', background: monoChip.background, color: monoChip.color, borderRadius: 4, cursor: 'pointer', fontSize: 11, fontFamily: 'monospace', display: 'flex', justifyContent: 'space-between' }}>
              <span>{"{{date}}"}</span>
              <Copy size={12} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'retry' && (
        <Form layout="vertical" size="small" style={{ marginTop: 12 }}>
          <Form.Item label="Max Retry Attempts">
            <InputNumber 
              min={1} 
              max={10} 
              value={nodeData.retryCount || 1} 
              onChange={v => handleUpdate('retryCount', v)}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="Continue Workflow on Failure">
            <Switch 
              checked={Boolean(nodeData.continueOnError)} 
              onChange={c => handleUpdate('continueOnError', c)}
            />
          </Form.Item>
          <Form.Item label="Execution Timeout (ms)">
            <InputNumber 
              min={1000} 
              max={300000} 
              step={1000}
              value={nodeData.timeoutMs || 30000} 
              onChange={v => handleUpdate('timeoutMs', v)}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      )}
    </div>
  );
}
