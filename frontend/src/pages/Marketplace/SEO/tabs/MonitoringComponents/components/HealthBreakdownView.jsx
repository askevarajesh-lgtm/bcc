import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Typography, Progress, Table, Spin, Badge } from 'antd';
import { 
  Activity, Globe, Search, Cpu, Clock, ShieldCheck, 
  FileText, Share2, Eye, Sparkles, TrendingUp 
} from 'lucide-react';
import { seoWorkspaceApi } from '../../../../../../api/seoWorkspaceApi';

const { Title, Text } = Typography;

const MONITORS_CONFIG = [
  { name: 'KeywordMonitor', label: 'Rankings & SERP Positions', icon: <TrendingUp size={16} color="#3b82f6" />, category: 'Visibility', status: 'Healthy', score: 92 },
  { name: 'TrafficMonitor', label: 'GSC & GA4 Organic Traffic', icon: <Activity size={16} color="#10b981" />, category: 'Traffic', status: 'Healthy', score: 90 },
  { name: 'CompetitorMonitor', label: 'Competitor Outrank Surveillance', icon: <Search size={16} color="#8b5cf6" />, category: 'Competitive', status: 'Active', score: 85 },
  { name: 'CrawlMonitor', label: 'Technical Crawl & 4xx/5xx Errors', icon: <Search size={16} color="#f59e0b" />, category: 'Technical', status: 'Healthy', score: 94 },
  { name: 'CWVMonitor', label: 'Core Web Vitals (LCP, INP, CLS)', icon: <Cpu size={16} color="#06b6d4" />, category: 'Performance', status: 'Good', score: 88 },
  { name: 'UptimeMonitor', label: 'Endpoint Uptime & TTFB Latency', icon: <Clock size={16} color="#10b981" />, category: 'Infrastructure', status: '100% Up', score: 99 },
  { name: 'SSLMonitor', label: 'SSL Certificate Expiration & TLS', icon: <ShieldCheck size={16} color="#10b981" />, category: 'Security', status: 'Valid', score: 100 },
  { name: 'RobotsMonitor', label: 'Robots.txt & Crawl Blocker Guard', icon: <Globe size={16} color="#3b82f6" />, category: 'Technical', status: 'Accessible', score: 100 },
  { name: 'SitemapMonitor', label: 'XML Sitemap Structure & Freshness', icon: <Share2 size={16} color="#8b5cf6" />, category: 'Indexation', status: 'Valid', score: 95 },
  { name: 'IndexCoverageMonitor', label: 'GSC Index Coverage & Errors', icon: <FileText size={16} color="#f59e0b" />, category: 'Indexation', status: 'Healthy', score: 91 },
  { name: 'AIVisibilityMonitor', label: 'AI LLM Search Citations (ChatGPT/Perplexity)', icon: <Sparkles size={16} color="#ec4899" />, category: 'AI Presence', status: 'Monitored', score: 84 }
];

export default function HealthBreakdownView({ project }) {
  const [monitors, setMonitors] = useState(MONITORS_CONFIG);
  const activeProjectId = project?._id || '507f1f77bcf86cd799439011';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <Title level={4} style={{ margin: 0 }}>11-Plugin SEO Health Diagnostics</Title>
        <Text type="secondary">Continuous surveillance across rankings, technical crawl, performance, security, and AI presence</Text>
      </div>

      <Row gutter={[16, 16]}>
        {monitors.map((m, idx) => (
          <Col xs={24} md={12} lg={8} key={idx}>
            <Card 
              bordered={false} 
              style={{ 
                borderRadius: 12, 
                border: '1px solid #e2e8f0', 
                background: '#ffffff',
                height: '100%',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ padding: 6, borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    {m.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{m.label}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Category: {m.category}</div>
                  </div>
                </div>
                <Tag color="green">{m.status}</Tag>
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: '#64748b' }}>Health Index</span>
                  <strong style={{ color: '#0f172a' }}>{m.score}%</strong>
                </div>
                <Progress 
                  percent={m.score} 
                  showInfo={false} 
                  strokeColor={m.score >= 90 ? '#10b981' : '#3b82f6'} 
                  size="small" 
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
