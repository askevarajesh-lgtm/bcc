import React, { useState, useEffect } from 'react';
import { Typography, Input, Collapse, Tag } from 'antd';
import { 
  Zap, Clock, Activity, AlertTriangle, ShieldCheck, Search, Sliders, 
  Split, Repeat, Sparkles, Mail, MessageSquare, Database, FileText, 
  Layers, CheckCircle2, Globe, Cpu, Share2, GitBranch, Image, BarChart3, Bot, Crosshair
} from 'lucide-react';
import { seoWorkspaceApi } from '../../../../../../api/seoWorkspaceApi';
import { useTheme } from '../../../../../../contexts/ThemeContext';

const { Title, Text } = Typography;
const { Panel } = Collapse;

export default function NodePalette({ onAddNode, projectId }) {
  const [search, setSearch] = useState('');
  const [dynamicActions, setDynamicActions] = useState([]);
  const [dynamicTriggers, setDynamicTriggers] = useState([]);
  const { isDark } = useTheme();

  const paletteBg   = isDark ? '#0f172a' : '#ffffff';
  const titleColor  = isDark ? '#f1f5f9' : '#1e293b';
  const subColor    = isDark ? '#64748b' : '#64748b';
  const cardBg      = isDark ? '#1e293b' : '#f8fafc';
  const cardBorder  = isDark ? '#334155' : '#e2e8f0';
  const cardColor   = isDark ? '#cbd5e1' : '#334155';
  const borderRight = isDark ? '1px solid #1e293b' : '1px solid #e2e8f0';

  useEffect(() => {
    if (projectId) {
      seoWorkspaceApi.getActions(projectId).then(res => {
        if (res?.data) setDynamicActions(res.data);
      }).catch(() => {});

      seoWorkspaceApi.getTriggers(projectId).then(res => {
        if (res?.data) setDynamicTriggers(res.data);
      }).catch(() => {});
    }
  }, [projectId]);

  const onDragStart = (event, nodeData) => {
    window.__draggedWorkflowNode = nodeData;
    const dataStr = JSON.stringify(nodeData);
    try {
      event.dataTransfer.setData('application/reactflow', dataStr);
      event.dataTransfer.setData('text/plain', dataStr);
      event.dataTransfer.effectAllowed = 'move';
    } catch (e) {
      console.warn('Drag dataTransfer error:', e);
    }
  };

  const getIconForType = (typeKey) => {
    const key = (typeKey || '').toLowerCase();
    if (key.includes('audit') || key.includes('search')) return <Search size={14} />;
    if (key.includes('tech') || key.includes('cpu')) return <Cpu size={14} />;
    if (key.includes('rank') || key.includes('keyword')) return <Activity size={14} />;
    if (key.includes('competitor')) return <Crosshair size={14} />;
    if (key.includes('content') || key.includes('file')) return <FileText size={14} />;
    if (key.includes('aeo') || key.includes('bot')) return <Bot size={14} />;
    if (key.includes('geo') || key.includes('globe')) return <Globe size={14} />;
    if (key.includes('schema') || key.includes('code')) return <Sliders size={14} />;
    if (key.includes('link')) return <GitBranch size={14} />;
    if (key.includes('image')) return <Image size={14} />;
    if (key.includes('monitor') || key.includes('shield')) return <ShieldCheck size={14} />;
    if (key.includes('report') || key.includes('chart')) return <BarChart3 size={14} />;
    if (key.includes('mail') || key.includes('email')) return <Mail size={14} />;
    if (key.includes('slack') || key.includes('chat')) return <MessageSquare size={14} />;
    if (key.includes('cron') || key.includes('schedule') || key.includes('clock')) return <Clock size={14} />;
    return <Zap size={14} />;
  };

  const builtInCategories = [
    {
      key: 'triggers',
      title: 'Event & Schedule Triggers',
      color: '#8b5cf6',
      nodes: [
        { type: 'trigger', subtype: 'schedule_cron', label: 'Cron / Schedule', subtitle: 'Timezone-aware recurring schedule', icon: <Clock size={14} /> },
        { type: 'trigger', subtype: 'keyword_rank_drop', label: 'Keyword Rank Drop', subtitle: 'Position drops beyond threshold', icon: <Activity size={14} /> },
        { type: 'trigger', subtype: 'technical_audit_completed', label: 'Technical Audit Done', subtitle: 'Triggers on completed audit', icon: <Cpu size={14} /> },
        { type: 'trigger', subtype: 'competitor_rank_change', label: 'Competitor Overtake', subtitle: 'Competitor outranks domain', icon: <AlertTriangle size={14} /> },
        { type: 'trigger', subtype: 'cwv_degraded', label: 'Core Web Vitals Failed', subtitle: 'LCP, INP, or CLS degraded', icon: <Cpu size={14} /> },
        { type: 'trigger', subtype: 'ssl_expiring', label: 'SSL Expiring Alert', subtitle: 'Certificate expiry countdown', icon: <ShieldCheck size={14} /> },
        { type: 'trigger', subtype: 'page_deindexed', label: 'Page De-indexed Alert', subtitle: 'GSC inspection dropped status', icon: <Globe size={14} /> },
        { type: 'trigger', subtype: 'webhook', label: 'Incoming Webhook', subtitle: 'Trigger on external POST payload', icon: <Zap size={14} /> }
      ]
    },
    {
      key: 'seo_modules',
      title: 'SEO Workspace Engines',
      color: '#3b82f6',
      nodes: [
        { type: 'action', subtype: 'run_site_audit', label: 'Run Website Audit', subtitle: 'Crawl pages, calculate scores & findings', icon: <Search size={14} /> },
        { type: 'action', subtype: 'run_technical_seo', label: 'Run Technical SEO', subtitle: 'Crawl infra, robots, & auto-fixes', icon: <Cpu size={14} /> },
        { type: 'action', subtype: 'refresh_keywords', label: 'Refresh Keyword Rankings', subtitle: 'Live SERP check & visibility index', icon: <Activity size={14} /> },
        { type: 'action', subtype: 'analyze_competitors', label: 'Analyze Competitors', subtitle: 'Detect overtakes & content gaps', icon: <Crosshair size={14} /> },
        { type: 'action', subtype: 'content_ai_generate', label: 'Generate Content AI Brief', subtitle: 'AI outlines, headings & FAQs', icon: <FileText size={14} /> },
        { type: 'action', subtype: 'run_aeo_audit', label: 'Run AEO / LLM Audit', subtitle: 'ChatGPT & Perplexity citations', icon: <Bot size={14} /> },
        { type: 'action', subtype: 'run_geo_audit', label: 'Run GEO / Entity Audit', subtitle: 'Generative search knowledge graph', icon: <Globe size={14} /> },
        { type: 'action', subtype: 'generate_schema', label: 'Generate Schema Markup', subtitle: 'JSON-LD rich snippets & validation', icon: <Sliders size={14} /> },
        { type: 'action', subtype: 'generate_internal_links', label: 'Generate Internal Links', subtitle: 'Link graph & orphan page fixes', icon: <GitBranch size={14} /> },
        { type: 'action', subtype: 'run_image_seo', label: 'Run Image SEO Optimizer', subtitle: 'Alt tags, sizes, & accessibility', icon: <Image size={14} /> },
        { type: 'action', subtype: 'run_monitoring_scan', label: 'Run Monitoring Scan', subtitle: 'Uptime, SSL, CWV & DNS health', icon: <ShieldCheck size={14} /> },
        { type: 'action', subtype: 'generate_report', label: 'Generate SEO Report', subtitle: 'Multi-page executive PDF/CSV', icon: <BarChart3 size={14} /> }
      ]
    },
    {
      key: 'communications',
      title: 'Multi-Channel Notifications',
      color: '#10b981',
      nodes: [
        { type: 'action', subtype: 'send_email_digest', label: 'Send Email Digest', subtitle: 'Executive summary report', icon: <Mail size={14} /> },
        { type: 'action', subtype: 'send_slack_message', label: 'Send Slack Notification', subtitle: 'Webhook channel payload', icon: <MessageSquare size={14} /> },
        { type: 'action', subtype: 'send_notification', label: 'Multi-Channel Alert Hub', subtitle: 'Teams, Discord, Telegram, Email', icon: <Zap size={14} /> },
        { type: 'action', subtype: 'task_creator', label: 'Create Workspace Task', subtitle: 'Assign prioritized action item', icon: <CheckCircle2 size={14} /> }
      ]
    },
    {
      key: 'logic',
      title: 'Logic & Flow Control',
      color: '#f59e0b',
      nodes: [
        { type: 'condition', subtype: 'if_else', label: 'If / Else Branch', subtitle: 'Conditional evaluation expression', icon: <Sliders size={14} /> },
        { type: 'switch', subtype: 'multi_switch', label: 'Multi-Way Switch', subtitle: 'Route by value match', icon: <Split size={14} /> },
        { type: 'loop', subtype: 'for_each', label: 'For-Each Loop', subtitle: 'Iterate list of keywords/URLs', icon: <Repeat size={14} /> },
        { type: 'delay', subtype: 'wait_delay', label: 'Delay / Wait Timer', subtitle: 'Pause execution for N minutes', icon: <Clock size={14} /> },
        { type: 'subworkflow', subtype: 'nested_dag', label: 'Sub-Workflow (DAG)', subtitle: 'Invoke nested workflow graph', icon: <Layers size={14} /> }
      ]
    }
  ];

  const filteredCategories = builtInCategories.map(cat => ({
    ...cat,
    nodes: cat.nodes.filter(n => 
      !search || 
      n.label.toLowerCase().includes(search.toLowerCase()) || 
      n.subtitle.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.nodes.length > 0);

  return (
    <div className="workflow-node-palette" style={{ width: 280, background: paletteBg, borderRight, padding: 12, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 12 }}>
        <Title level={5} style={{ margin: '0 0 4px 0', fontSize: 14, fontWeight: 700, color: titleColor }}>Node Palette</Title>
        <Text style={{ fontSize: 11, color: subColor }}>Drag nodes to canvas or click to add</Text>
        <div style={{ marginTop: 8 }}>
          <Input 
            prefix={<Search size={13} style={{ color: subColor }} />} 
            placeholder="Search triggers & actions..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            allowClear
            size="small"
            style={{ borderRadius: 6 }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
        <Collapse defaultActiveKey={['triggers', 'seo_modules', 'communications', 'logic']} ghost size="small" expandIconPosition="end">
          {filteredCategories.map(cat => (
            <Panel 
              key={cat.key} 
              header={
                <span style={{ fontSize: 12, fontWeight: 600, color: titleColor, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: cat.color }} />
                  {cat.title}
                </span>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {cat.nodes.map(node => (
                  <div
                    key={`${node.type}-${node.subtype}`}
                    draggable
                    onDragStart={(e) => onDragStart(e, node)}
                    onClick={() => onAddNode && onAddNode(node)}
                    style={{
                      padding: '8px 10px',
                      background: cardBg,
                      border: `1px solid ${cardBorder}`,
                      borderRadius: 6,
                      cursor: 'grab',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = cat.color;
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = cardBorder;
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ color: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {node.icon || getIconForType(node.subtype)}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: titleColor, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {node.label}
                      </div>
                      <div style={{ fontSize: 10, color: subColor, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {node.subtitle}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          ))}
        </Collapse>
      </div>
    </div>
  );
}
