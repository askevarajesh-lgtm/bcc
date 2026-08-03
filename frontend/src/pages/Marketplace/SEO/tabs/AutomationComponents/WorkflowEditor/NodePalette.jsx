import React, { useState } from 'react';
import { Typography, Input, Collapse } from 'antd';
import { 
  Zap, Clock, Activity, AlertTriangle, ShieldCheck, Search, Sliders, 
  Split, Repeat, Sparkles, Mail, MessageSquare, Database, FileText, 
  Layers, CheckCircle2, Globe, Cpu, Share2
} from 'lucide-react';

const { Title } = Typography;
const { Panel } = Collapse;

export default function NodePalette() {
  const [search, setSearch] = useState('');

  const onDragStart = (event, nodeData) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
  };

  const categories = [
    {
      key: 'triggers',
      title: 'Triggers (24+)',
      color: '#8b5cf6',
      nodes: [
        { type: 'trigger', subtype: 'schedule_cron', label: 'Cron / Schedule', subtitle: 'Timezone-aware recurring schedule', icon: <Clock size={14} /> },
        { type: 'trigger', subtype: 'webhook_incoming', label: 'Incoming Webhook', subtitle: 'Trigger on external POST payload', icon: <Zap size={14} /> },
        { type: 'trigger', subtype: 'keyword_rank_dropped', label: 'Keyword Rank Drop', subtitle: 'Position drops beyond threshold', icon: <Activity size={14} /> },
        { type: 'trigger', subtype: 'traffic_anomaly', label: 'Traffic Anomaly', subtitle: 'Sudden GSC / GA4 click drop', icon: <Activity size={14} /> },
        { type: 'trigger', subtype: 'competitor_overtake', label: 'Competitor Overtake', subtitle: 'Competitor outranks domain', icon: <AlertTriangle size={14} /> },
        { type: 'trigger', subtype: 'cwv_degraded', label: 'Core Web Vitals Failed', subtitle: 'LCP, INP, or CLS degraded', icon: <Cpu size={14} /> },
        { type: 'trigger', subtype: 'ssl_expiring', label: 'SSL Expiring / Invalid', subtitle: 'Certificate expiry countdown', icon: <ShieldCheck size={14} /> },
        { type: 'trigger', subtype: 'robots_blocked', label: 'Robots.txt Crawl Block', subtitle: 'Disallow: / detected', icon: <Globe size={14} /> },
        { type: 'trigger', subtype: 'ai_visibility_drop', label: 'AI Citation Lost', subtitle: 'ChatGPT / Perplexity loss', icon: <Sparkles size={14} /> }
      ]
    },
    {
      key: 'actions',
      title: 'SEO & Marketing Actions (25+)',
      color: '#3b82f6',
      nodes: [
        { type: 'action', subtype: 'run_site_audit', label: 'Trigger Site Audit', subtitle: 'Crawl project pages for errors', icon: <Search size={14} /> },
        { type: 'action', subtype: 'track_keywords_now', label: 'Track SERP Positions', subtitle: 'Live DataForSEO / Google check', icon: <Activity size={14} /> },
        { type: 'action', subtype: 'generate_meta_tags', label: 'Generate AI Meta Tags', subtitle: 'AI Title & Description optimizer', icon: <Sparkles size={14} /> },
        { type: 'action', subtype: 'gsc_inspect_url', label: 'GSC URL Inspection', subtitle: 'Google live index check', icon: <Globe size={14} /> },
        { type: 'action', subtype: 'gsc_submit_sitemap', label: 'GSC Submit Sitemap', subtitle: 'Ping Google index queue', icon: <Share2 size={14} /> },
        { type: 'action', subtype: 'send_email_digest', label: 'Send Email Alert', subtitle: 'Multi-recipient HTML email', icon: <Mail size={14} /> },
        { type: 'action', subtype: 'send_slack_message', label: 'Send Slack Notification', subtitle: 'Webhook channel payload', icon: <MessageSquare size={14} /> },
        { type: 'action', subtype: 'send_webhook_post', label: 'External Webhook POST', subtitle: 'Forward payload to Zapier/Make', icon: <Zap size={14} /> },
        { type: 'action', subtype: 'create_jira_ticket', label: 'Create Jira / Task', subtitle: 'Auto-assign SEO issue ticket', icon: <CheckCircle2 size={14} /> },
        { type: 'action', subtype: 'update_workspace_db', label: 'Update Workspace Data', subtitle: 'Mutate tags, score, or metadata', icon: <Database size={14} /> }
      ]
    },
    {
      key: 'logic',
      title: 'Logic & Control Flow',
      color: '#f59e0b',
      nodes: [
        { type: 'condition', subtype: 'if_else', label: 'If / Else Branch', subtitle: 'Conditional evaluation expression', icon: <Sliders size={14} /> },
        { type: 'switch', subtype: 'multi_switch', label: 'Multi-Way Switch', subtitle: 'Route by value match (A/B/C)', icon: <Split size={14} /> },
        { type: 'loop', subtype: 'for_each', label: 'For-Each Loop', subtitle: 'Iterate list of keywords/URLs', icon: <Repeat size={14} /> },
        { type: 'delay', subtype: 'wait_delay', label: 'Delay / Wait Timer', subtitle: 'Pause execution for N minutes', icon: <Clock size={14} /> },
        { type: 'subworkflow', subtype: 'nested_dag', label: 'Sub-Workflow (DAG)', subtitle: 'Invoke nested workflow graph', icon: <Layers size={14} /> }
      ]
    },
    {
      key: 'ai',
      title: 'AI Intelligence Nodes',
      color: '#6366f1',
      nodes: [
        { type: 'ai_agent', subtype: 'seo_root_cause', label: 'AI Root Cause Diagnosis', subtitle: 'Analyze drop & recommend fix', icon: <Sparkles size={14} /> },
        { type: 'ai_agent', subtype: 'content_brief_generator', label: 'AI Content Outline', subtitle: 'Generate SEO content brief', icon: <FileText size={14} /> },
        { type: 'ai_agent', subtype: 'competitor_gap_analyst', label: 'AI Competitor Gap', subtitle: 'Surface keyword opportunities', icon: <Search size={14} /> }
      ]
    }
  ];

  const filteredCategories = categories.map(cat => ({
    ...cat,
    nodes: cat.nodes.filter(n => 
      !search || 
      n.label.toLowerCase().includes(search.toLowerCase()) || 
      n.subtitle.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.nodes.length > 0);

  return (
    <div className="workflow-palette" style={{ width: 280, background: '#ffffff', borderRight: '1px solid #e2e8f0', padding: 16, height: '100%', overflowY: 'auto' }}>
      <div style={{ marginBottom: 12 }}>
        <Title level={5} style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Node Library</Title>
        <p style={{ margin: '2px 0 10px 0', fontSize: 12, color: '#64748b' }}>Drag and drop nodes onto the canvas</p>
        <Input.Search 
          placeholder="Search 50+ nodes..." 
          size="small" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          allowClear 
        />
      </div>

      <Collapse defaultActiveKey={['triggers', 'actions', 'logic', 'ai']} ghost expandIconPosition="end">
        {filteredCategories.map(cat => (
          <Panel 
            key={cat.key} 
            header={
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: cat.color, letterSpacing: 0.5 }}>
                {cat.title}
              </span>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {cat.nodes.map((n, idx) => (
                <div
                  key={idx}
                  draggable
                  onDragStart={e => onDragStart(e, n)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    cursor: 'grab',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    transition: 'all 0.15s ease'
                  }}
                  className="palette-node-item"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 12, color: '#1e293b' }}>
                    <div style={{ color: cat.color }}>{n.icon}</div>
                    <span>{n.label}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', paddingLeft: 20 }}>
                    {n.subtitle}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </Collapse>
    </div>
  );
}
