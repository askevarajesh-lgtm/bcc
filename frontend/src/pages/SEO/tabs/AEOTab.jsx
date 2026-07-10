import React, { useState } from 'react';
import { Typography, Row, Col, Card, Table, Tag, Button, Progress, Avatar } from 'antd';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, MessageSquare, Info, X, ChevronRight, Edit } from 'lucide-react';

const { Title, Text } = Typography;

const AEOTab = ({ itemVariants, project, analytics, audits, keywords, strategies }) => {
  const [showInfo, setShowInfo] = useState(true);
  
  const snippetData = (keywords || []).filter(k => k.ranking?.isFeaturedSnippet).map((k, idx) => ({
    id: k._id || idx,
    query: k.keyword,
    type: k.ranking?.snippetType || 'Paragraph',
    pos: `#${k.ranking?.currentRank}`,
    volume: k.metrics?.searchVolume || '-',
    preview: k.ranking?.snippetPreview || 'View snippet...',
    risk: k.metrics?.keywordDifficulty > 60 ? 'High' : (k.metrics?.keywordDifficulty > 30 ? 'Medium' : 'Low')
  }));

  const paaQueries = []; // Derive from strategy/audit if available in the future
  
  const latestAudit = audits && audits.length > 0 ? audits[0] : null;
  const schemaList = (latestAudit?.details?.schema || []).map((s, idx) => ({
    name: s.name || s,
    status: s.status || 'check',
    action: s.action || null
  }));

  const snippetsOwned = snippetData.length;
  const snippetsOpportunities = (keywords || []).length;
  const paaCount = paaQueries.length;
  const isKnowledgePanelActive = analytics?.knowledgePanelActive ?? true;
  const voiceSearchCoverage = analytics?.voiceSearchCoverage ?? '0%';
  const faqImpressions = analytics?.faqImpressions ?? '0';

  const snippetCols = [
    { title: 'QUERY', dataIndex: 'query', key: 'query', render: text => <strong style={{ color: 'var(--text-primary)' }}>{text}</strong> },
    { 
      title: 'TYPE', 
      dataIndex: 'type', 
      key: 'type', 
      render: val => <Tag color="processing" style={{ borderRadius: 12, fontWeight: 600 }}><MessageSquare size={12} style={{ marginRight: 4, display: 'inline-block', verticalAlign: 'middle' }}/>{val}</Tag> 
    },
    { title: 'POS', dataIndex: 'pos', key: 'pos', render: val => <strong style={{ color: 'var(--accent-primary)', fontSize: 14 }}>{val}</strong> },
    { title: 'VOLUME', dataIndex: 'volume', key: 'volume', render: text => <span style={{ color: 'var(--text-primary)' }}>{text}</span> },
    { title: 'PREVIEW', dataIndex: 'preview', key: 'preview', render: text => <Text type="secondary">{text}</Text> },
    { 
      title: 'RISK', 
      dataIndex: 'risk', 
      key: 'risk', 
      render: val => {
        let color = val === 'Low' ? 'success' : val === 'Medium' ? 'warning' : 'error';
        return <Tag color={color} style={{ borderRadius: 12, fontWeight: 600 }}>{val === 'Low' ? '✓ ' : '⚠️ '}{val}</Tag>;
      } 
    },
    { title: '', key: 'action', render: () => <Button type="link" size="small" style={{ fontWeight: 600 }}>Edit</Button> }
  ];

  return (
    <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}>
      
      {showInfo && (
        <motion.div variants={itemVariants} style={{ marginBottom: 24 }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 12, padding: '16px 24px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <MessageSquare size={24} style={{ color: 'var(--accent-primary)', marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Title level={5} style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 700 }}>What is AEO?</Title>
                <Button type="text" icon={<X size={16} />} onClick={() => setShowInfo(false)} style={{ color: 'var(--text-secondary)' }} />
              </div>
              <Text style={{ color: 'var(--accent-primary)', fontSize: 13, display: 'block' }}>
                Answer Engine Optimisation ensures your content appears as the direct answer in Google's featured snippets, People Also Ask boxes, Knowledge Panels, and voice search results. Owning these positions means your brand answers the question — before users even click.
              </Text>
            </div>
          </div>
        </motion.div>
      )}

      {/* 5 Small Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'FEATURED SNIPPETS OWNED', val: snippetsOwned.toString(), sub: '', text: `of ${snippetsOpportunities} opportunities`, color: 'var(--accent-primary)' },
          { label: 'PEOPLE ALSO ASK', val: paaCount.toString(), sub: '', text: 'PAA box appearances', color: 'var(--accent-info)' },
          { label: 'KNOWLEDGE PANEL', val: isKnowledgePanelActive ? 'ACTIVE ✓' : 'MISSING', sub: '', text: 'Google Business + entity', color: isKnowledgePanelActive ? 'var(--accent-secondary)' : 'var(--accent-danger)', isTag: true, tagColor: isKnowledgePanelActive ? 'success' : 'error' },
          { label: 'VOICE SEARCH COVERAGE', val: voiceSearchCoverage, sub: '', text: 'of conversational queries', color: 'var(--accent-warning)' },
          { label: 'FAQ IMPRESSIONS', val: faqImpressions, sub: '', text: 'FAQ schema triggers/mo', color: 'var(--accent-info)' },
        ].map((kpi, i) => (
          <motion.div variants={itemVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }} key={i} style={{ height: '100%' }}>
            <Card 
              bodyStyle={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }} 
              style={{ 
                borderRadius: 12, 
                height: '100%',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderTop: `4px solid ${kpi.color}`,
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>{kpi.label}</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 'auto' }}>
                {kpi.isTag ? (
                  <Tag color={kpi.tagColor} style={{ fontSize: 16, padding: '4px 12px', borderRadius: 16, fontWeight: 700, margin: '8px 0' }}>{kpi.val}</Tag>
                ) : (
                  <Title level={2} style={{ margin: 0, color: 'var(--text-primary)', fontSize: 28, fontWeight: 800, whiteSpace: 'nowrap' }}>{kpi.val}</Title>
                )}
                {kpi.sub && <Text style={{ color: 'var(--accent-secondary)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{kpi.sub}</Text>}
              </div>
              {kpi.isTag && <Tag style={{ borderRadius: 12, fontWeight: 600, marginTop: 8 }}>Verified</Tag>}
              {!kpi.isTag && <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4, fontWeight: 500 }}>{kpi.text}</Text>}
            </Card>
          </motion.div>
        ))}
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={16}>
          <motion.div variants={itemVariants} style={{ height: '100%' }}>
            <Card 
              title={<div style={{ paddingTop: 8 }}><Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Featured Snippet Positions</Title><Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Queries where Prestige Estates appears as the direct answer</Text></div>} 
              extra={<Button type="default" style={{ borderRadius: 8, borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)', fontWeight: 600 }}>Find Opportunities</Button>}
              className="glassmorphism" style={{ borderRadius: 16, marginBottom: 24, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: '24px 0' }}
            >
              <div style={{ overflowX: 'auto', padding: '0 24px' }}>
                <Table columns={snippetCols} dataSource={snippetData} pagination={false} rowKey="id" size="middle" scroll={{ x: 800 }} style={{ minWidth: 800 }} />
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card 
              title={<div style={{ paddingTop: 8 }}><Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>People Also Ask — Top Queries</Title><Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Questions where your content appears in PAA boxes</Text></div>} 
              className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: 24 }}
            >
              {paaQueries.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No PAA data available for this project.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {paaQueries.map((item, i) => (
                    <div key={i} style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <ChevronRight size={16} />
                          <strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>{item.q}</strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {item.color === 'success' ? <CheckCircle2 size={14} color="var(--accent-secondary)"/> : item.color === 'warning' ? <AlertTriangle size={14} color="var(--accent-warning)"/> : <X size={14} color="var(--accent-danger)"/>}
                          <Text style={{ color: `var(--accent-${item.color === 'success' ? 'secondary' : item.color === 'warning' ? 'warning' : 'danger'})`, fontWeight: 600, fontSize: 12 }}>{item.status}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>— {item.triggers}</Text>
                        </div>
                      </div>
                      {item.btn && <Button size="small" style={{ borderRadius: 8, fontWeight: 600 }}>{item.btn}</Button>}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        </Col>

        <Col xs={24} xl={8}>
          <motion.div variants={itemVariants}>
            <Card title={<Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Schema Markup</Title>} className="glassmorphism" style={{ borderRadius: 16, marginBottom: 24, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: 16 }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 12 }}>Structured data implementation</Text>
              
              {schemaList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)' }}>No schema data found in latest audit.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  {schemaList.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                        {item.status === 'check' ? <CheckCircle2 size={16} color="var(--accent-secondary)"/> : item.status === 'warning' ? <AlertTriangle size={16} color="var(--accent-warning)"/> : <X size={16} color="var(--accent-danger)"/>}
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.name}</span>
                      </div>
                      {item.action && <a style={{ color: item.status === 'warning' ? 'var(--accent-warning)' : 'var(--accent-danger)', fontWeight: 600, fontSize: 12 }}>{item.action}</a>}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12, fontWeight: 600 }}>
                  <Text type="secondary">Schema Health</Text>
                  <Text style={{ color: 'var(--text-primary)' }}>75%</Text>
                </div>
                <Progress percent={75} showInfo={false} strokeColor="var(--accent-warning)" trailColor="var(--border-color)" />
              </div>
              <Button block style={{ borderRadius: 8, borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)', fontWeight: 600 }}>Run Schema Validator</Button>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card title={<Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Knowledge Panel</Title>} extra={<Tag color={analytics?.knowledgePanel ? 'success' : 'error'} style={{ borderRadius: 12, fontWeight: 600 }}>{analytics?.knowledgePanel ? 'Active & Verified' : 'Missing'}</Tag>} className="glassmorphism" style={{ borderRadius: 16, marginBottom: 24, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: 20 }}>
              {!analytics?.knowledgePanel ? (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)' }}>No Knowledge Panel data available for this project.</div>
              ) : (
                <>
                  <strong style={{ fontSize: 16, display: 'block', color: 'var(--text-primary)' }}>{analytics.knowledgePanel.name || project?.name || 'Project Name'}</strong>
                  <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>{analytics.knowledgePanel.type || 'Business'}</Text>
                  <Text style={{ fontSize: 13, display: 'block', marginBottom: 16, color: 'var(--text-primary)' }}>{analytics.knowledgePanel.description || ''}</Text>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 12 }}>
                    <Text type="secondary">Founded: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{analytics.knowledgePanel.founded || '-'}</span></Text>
                    <Text type="secondary">HQ: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{analytics.knowledgePanel.hq || '-'}</span></Text>
                  </div>
                  {analytics.knowledgePanel.rating && (
                    <Text style={{ color: 'var(--accent-warning)', fontSize: 13, display: 'block', marginBottom: 20, fontWeight: 600 }}>★★★★☆ {analytics.knowledgePanel.rating}</Text>
                  )}
                  
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <Text type="secondary">Entity Authority</Text>
                      <Tag color="success" style={{ borderRadius: 12, fontWeight: 600, margin: 0 }}>✓ {analytics.knowledgePanel.entityAuthority || 'Strong'}</Tag>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <Text type="secondary">Wikipedia</Text>
                      <strong style={{ color: 'var(--accent-secondary)' }}>{analytics.knowledgePanel.wikipedia ? '✓ Exists' : '✗ Missing'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <Text type="secondary">Google Business</Text>
                      <strong style={{ color: 'var(--accent-secondary)' }}>{analytics.knowledgePanel.googleBusiness ? '✓ Verified' : '✗ Unverified'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <Text type="secondary">Wikidata ID</Text>
                      <strong style={{ color: 'var(--accent-secondary)' }}>{analytics.knowledgePanel.wikidata ? '✓ Linked' : '✗ Missing'}</strong>
                    </div>
                    <Button block style={{ borderRadius: 8, fontWeight: 600, marginTop: 12 }}>Edit Entity Data</Button>
                  </div>
                </>
              )}
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card title={<Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Voice Search Readiness</Title>} className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              {!analytics?.voiceScore && !analytics?.voiceMetrics ? (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)' }}>No Voice Search Readiness data available.</div>
              ) : (
                <>
                  <div style={{ height: 160, display: 'flex', justifyContent: 'center', position: 'relative', marginBottom: 20 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={[{ value: analytics?.voiceScore || 0, fill: 'var(--accent-primary)' }, { value: 100 - (analytics?.voiceScore || 0), fill: 'var(--bg-tertiary)' }]} innerRadius={50} outerRadius={70} dataKey="value" startAngle={90} endAngle={-270} stroke="none" />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                      <Title level={1} style={{ margin: 0, fontSize: 32, fontWeight: 800, color: 'var(--text-primary)' }}>{analytics?.voiceScore || 0}</Title>
                      <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>/100</Text>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, marginBottom: 20 }}>
                    {(analytics?.voiceMetrics || []).map((metric, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {metric.status === 'success' ? <CheckCircle2 size={14} color="var(--accent-secondary)"/> : metric.status === 'warning' ? <AlertTriangle size={14} color="var(--accent-warning)"/> : <X size={14} color="var(--accent-danger)"/>}
                        <Text type="secondary">{metric.text}</Text>
                      </div>
                    ))}
                  </div>

                  <Button type="primary" block icon={<MessageSquare size={16} />} style={{ borderRadius: 8, background: 'var(--accent-primary)', fontWeight: 600 }}>Improve Voice Score</Button>
                </>
              )}
            </Card>
          </motion.div>
        </Col>
      </Row>
    </motion.div>
  );
};

export default AEOTab;
