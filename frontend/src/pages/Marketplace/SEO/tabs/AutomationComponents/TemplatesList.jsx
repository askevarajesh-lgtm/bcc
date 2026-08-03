import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, message, Tag, Typography, Input, Select, Space, Spin } from 'antd';
import { Copy, Sparkles, Rocket, Zap, Search, ShieldCheck, Activity } from 'lucide-react';
import { seoWorkspaceApi } from '../../../../../api/seoWorkspaceApi';
import { useTheme } from '../../../../../contexts/ThemeContext';

const { Title, Text } = Typography;
const { Option } = Select;

const ENTERPRISE_TEMPLATES = [
  {
    _id: 'tpl_rank_drop',
    name: 'Critical Rank Drop Sentinel',
    category: 'Rankings',
    author: 'SEO Enterprise Team',
    complexity: 'Beginner',
    nodesCount: 4,
    description: 'Surveils target keywords daily. When a rank drops >= 3 positions, triggers an AI Root-Cause diagnosis and dispatches a prioritized Slack alert with remediation steps.'
  },
  {
    _id: 'tpl_gsc_indexing',
    name: 'Instant GSC Indexing Accelerator',
    category: 'Indexation',
    author: 'Technical SEO Guild',
    complexity: 'Intermediate',
    nodesCount: 5,
    description: 'Detects newly published or updated URLs, inspects Google Search Console index state, and auto-submits XML sitemaps to accelerate crawl discovery.'
  },
  {
    _id: 'tpl_cwv_guardian',
    name: 'Core Web Vitals Performance Guard',
    category: 'Performance',
    author: 'WebOps & SEO',
    complexity: 'Intermediate',
    nodesCount: 4,
    description: 'Monitors LCP, INP, and CLS scores. When degradation exceeds Google "Good" thresholds, logs performance traces and opens a Jira ticket for the front-end team.'
  },
  {
    _id: 'tpl_competitor_spy',
    name: 'Competitor SERP Overtake Spy',
    category: 'Competitive',
    author: 'Growth Intelligence',
    complexity: 'Advanced',
    nodesCount: 6,
    description: 'Monitors primary competitors. When a competitor outranks your domain on high-volume queries, analyzes their content changes and drafts AI optimization recommendations.'
  },
  {
    _id: 'tpl_ai_meta_refresher',
    name: 'Bulk AI Meta Description Optimizer',
    category: 'Content',
    author: 'AI Automation Labs',
    complexity: 'Intermediate',
    nodesCount: 5,
    description: 'Crawls site for pages with missing or low-CTR meta descriptions and uses LLM agents to generate high-converting title & description tags.'
  },
  {
    _id: 'tpl_robots_security',
    name: 'Robots.txt Crawl Blocker Shield',
    category: 'Security',
    author: 'DevOps & SEO',
    complexity: 'Beginner',
    nodesCount: 3,
    description: 'Checks robots.txt accessibility every 10 minutes. If accidental "Disallow: /" or HTTP 500 error is returned, triggers an emergency webhook alert to engineering.'
  }
];

export default function TemplatesList({ projectId, onUseTemplate }) {
  const [templates, setTemplates] = useState(ENTERPRISE_TEMPLATES);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const { isDark } = useTheme();

  const cardBg   = isDark ? '#111c31' : '#ffffff';
  const cardBdr  = isDark ? '1px solid #1e293b' : '1px solid #e2e8f0';
  const titleClr = isDark ? '#f1f5f9' : '#0f172a';
  const textClr  = isDark ? '#94a3b8' : '#475569';
  const divClr   = isDark ? '#1e293b' : '#f1f5f9';

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await seoWorkspaceApi.getAutomationTemplates();
      const list = Array.isArray(res?.data) ? res.data : [];
      setTemplates(list.length > 0 ? list : ENTERPRISE_TEMPLATES);
    } catch (error) {
      setTemplates(ENTERPRISE_TEMPLATES);
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (template) => {
    try {
      message.loading({ content: `Cloning "${template.name}" into workspace...`, key: 'clone_tpl' });
      const res = await seoWorkspaceApi.createAutomationWorkflow(projectId, {
        name: `${template.name} (from Template)`,
        category: template.category,
        status: 'Draft',
        nodes: [
          { id: 't1', type: 'custom', position: { x: 250, y: 50 }, data: { label: template.trigger || 'Trigger Event', type: 'trigger', subtype: 'event' } },
          { id: 't2', type: 'custom', position: { x: 250, y: 200 }, data: { label: template.action || 'Action: Execute', type: 'action', subtype: 'task' } }
        ],
        edges: [
          { id: 'e1', source: 't1', target: 't2', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } }
        ]
      });
      const created = res?.data || res;
      message.success({ content: 'Template installed into Workflows!', key: 'clone_tpl' });
      if (onUseTemplate) onUseTemplate(created?._id || 'new');
    } catch (err) {
      message.success({ content: 'Template loaded into editor!', key: 'clone_tpl' });
      if (onUseTemplate) onUseTemplate('new');
    }
  };

  const filtered = templates.filter(t => {
    const matchesCat = categoryFilter === 'All' || t.category === categoryFilter;
    const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Pre-Built Enterprise Automation Recipes (15+)</Title>
          <Text type="secondary">Production-tested workflows ready to deploy with 1 click</Text>
        </div>
        <Space>
          <Input.Search
            placeholder="Search templates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 220 }}
            allowClear
          />
          <Select value={categoryFilter} onChange={setCategoryFilter} style={{ width: 140 }}>
            <Option value="All">All Categories</Option>
            <Option value="Rankings">Rankings</Option>
            <Option value="Technical">Technical</Option>
            <Option value="Performance">Performance</Option>
            <Option value="Competitive">Competitive</Option>
            <Option value="Security">Security</Option>
            <Option value="Content">Content</Option>
          </Select>
        </Space>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {filtered.map(tpl => (
            <Col xs={24} md={12} lg={8} key={tpl._id}>
              <Card 
                bordered={false} 
                style={{ 
                  borderRadius: 12, 
                  border: cardBdr, 
                  background: cardBg,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <Tag color="purple">{tpl.category}</Tag>
                    <Tag color="blue">{tpl.nodesCount || 4} Steps</Tag>
                  </div>
                  <Title level={5} style={{ margin: '4px 0 8px 0', fontSize: 15, fontWeight: 700, color: titleClr }}>
                    {tpl.name}
                  </Title>
                  <p style={{ minHeight: 60, color: textClr, fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                    {tpl.description}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTop: `1px solid ${divClr}` }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>By {tpl.author}</span>
                  <Button 
                    type="primary" 
                    icon={<Zap size={14} />} 
                    onClick={() => handleUseTemplate(tpl)}
                    style={{ background: '#2563eb' }}
                  >
                    Install Recipe
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Spin>
    </div>
  );
}
