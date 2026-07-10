import React, { useState } from 'react';
import { Typography, Row, Col, Card, Table, Tag, Button, Progress } from 'antd';
import { ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import { motion } from 'framer-motion';
import { Sparkles, X, BrainCircuit, MessageCircle, Bot } from 'lucide-react';

const { Title, Text } = Typography;

const GEOTab = ({ itemVariants, project, analytics, audits, strategies }) => {
  const [showInfo, setShowInfo] = useState(true);

  const geoScoreHistory = analytics?.geoScoreHistory || [];
  const citationLog = analytics?.citationLog || [];
  const citationShare = analytics?.citationShare || [];
  const citedContent = analytics?.citedContent || [];
  
  const geoVisibilityScore = analytics?.geoVisibilityScore || 0;
  const aiOverviewCitations = analytics?.aiOverviewCitations || 0;
  const perplexityCitations = analytics?.perplexityCitations || 0;
  const chatgptCitations = analytics?.chatgptCitations || 0;
  const isEntityAuthorityStrong = analytics?.entityAuthorityStrong ?? false;
  const geoActionPlan = analytics?.geoActionPlan || [];

  const citationCols = [
    { title: 'QUERY', dataIndex: 'query', key: 'query', render: text => <strong style={{ color: 'var(--text-primary)' }}>{text}</strong> },
    { 
      title: 'ENGINE', 
      dataIndex: 'engine', 
      key: 'engine', 
      render: val => {
        let color, icon;
        if (val === 'Google AI') { color = 'processing'; icon = <Sparkles size={12} style={{marginRight:4, verticalAlign:'middle'}}/>; }
        else if (val === 'Perplexity') { color = 'purple'; icon = <BrainCircuit size={12} style={{marginRight:4, verticalAlign:'middle'}}/>; }
        else if (val === 'ChatGPT') { color = 'success'; icon = <MessageCircle size={12} style={{marginRight:4, verticalAlign:'middle'}}/>; }
        else { color = 'warning'; icon = <Bot size={12} style={{marginRight:4, verticalAlign:'middle'}}/>; }
        return <Tag color={color} style={{ borderRadius: 12, fontWeight: 600 }}>{icon}{val}</Tag>;
      } 
    },
    { 
      title: 'TYPE', 
      dataIndex: 'type', 
      key: 'type', 
      render: val => <Tag style={{ borderRadius: 12, fontWeight: 600, color: 'var(--accent-secondary)', background: 'rgba(16, 185, 129, 0.1)', border: 'none' }}>• {val}</Tag> 
    },
    { title: 'SOURCE', dataIndex: 'source', key: 'source', render: text => <Text type="secondary">{text}</Text> },
    { title: 'TIME', dataIndex: 'time', key: 'time', render: text => <Text type="secondary">{text}</Text> },
    { title: 'VISITS', dataIndex: 'visits', key: 'visits', render: text => <strong style={{ color: 'var(--accent-info)' }}>{text} visits</strong> }
  ];

  return (
    <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}>
      
      {showInfo && (
        <motion.div variants={itemVariants} style={{ marginBottom: 24 }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: 12, padding: '16px 24px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <Sparkles size={24} style={{ color: 'var(--accent-info)', marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Title level={5} style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 700 }}>What is GEO — and why it matters now</Title>
                <Button type="text" icon={<X size={16} />} onClick={() => setShowInfo(false)} style={{ color: 'var(--text-secondary)' }} />
              </div>
              <Text style={{ color: 'var(--accent-info)', fontSize: 13, display: 'block' }}>
                Generative Engine Optimisation (GEO) tracks how often your brand is cited as a trusted source inside AI-generated answers on Google AI Overviews, Perplexity, ChatGPT, and Gemini. By 2026, over 50% of searches trigger AI-generated responses. If your brand isn't being cited, you're invisible to half your audience.
              </Text>
            </div>
          </div>
        </motion.div>
      )}

      {/* 5 Small Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'GEO VISIBILITY SCORE', val: `${geoVisibilityScore}/100`, sub: '', text: 'Based on AI citations', color: 'var(--accent-info)' },
          { label: 'GOOGLE AI OVERVIEW', val: aiOverviewCitations.toString(), sub: '', text: 'queries cited this month', color: 'var(--accent-primary)' },
          { label: 'PERPLEXITY CITATIONS', val: perplexityCitations.toString(), sub: '', text: 'direct citations', color: 'var(--accent-info)' },
          { label: 'CHATGPT / GEMINI', val: chatgptCitations.toString(), sub: '', text: 'brand mentions', color: 'var(--accent-secondary)' },
          { label: 'ENTITY AUTHORITY', val: isEntityAuthorityStrong ? 'STRONG ✓' : 'WEAK', sub: '', text: 'Wikipedia - Wikidata - GSG', color: isEntityAuthorityStrong ? 'var(--accent-secondary)' : 'var(--accent-danger)', isTag: true, tagColor: isEntityAuthorityStrong ? 'success' : 'error' },
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
              {kpi.isTag && <Tag style={{ borderRadius: 12, fontWeight: 600, marginTop: 8 }}>Strong</Tag>}
              {!kpi.isTag && <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4, fontWeight: 500 }}>{kpi.text}</Text>}
            </Card>
          </motion.div>
        ))}
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} xl={10}>
          <motion.div variants={itemVariants} style={{ height: '100%' }}>
            <Card className="glassmorphism" style={{ borderRadius: 16, height: '100%', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ height: 220, width: '100%', display: 'flex', justifyContent: 'center', position: 'relative', marginBottom: 24 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{ value: geoVisibilityScore || 1, fill: 'var(--accent-info)' }, { value: 100 - (geoVisibilityScore || 0), fill: 'var(--bg-tertiary)' }]} innerRadius={80} outerRadius={110} dataKey="value" startAngle={90} endAngle={-270} stroke="none" />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <Title level={1} style={{ margin: 0, fontSize: 48, fontWeight: 800, color: 'var(--text-primary)' }}>{geoVisibilityScore}</Title>
                  <Text type="secondary" style={{ fontSize: 14, fontWeight: 600 }}>/100</Text>
                </div>
              </div>
              <Title level={5} style={{ margin: '0 0 8px 0', fontWeight: 700, color: 'var(--text-primary)' }}>GEO Visibility Score</Title>
              <Text type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>How often your brand appears in AI-generated answers</Text>
              <Tag color={geoVisibilityScore > 70 ? 'purple' : geoVisibilityScore > 40 ? 'warning' : 'error'} style={{ borderRadius: 12, fontWeight: 600, padding: '4px 12px', fontSize: 14, marginBottom: 32 }}>{geoVisibilityScore > 70 ? 'Good' : geoVisibilityScore > 40 ? 'Fair' : 'Needs Work'}</Tag>

              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    <Text type="secondary">Google AI Overviews</Text>
                    <Text style={{ color: 'var(--text-primary)' }}>{analytics?.geoEngineScores?.google || 0}/100</Text>
                  </div>
                  <Progress percent={analytics?.geoEngineScores?.google || 0} showInfo={false} strokeColor="var(--accent-primary)" trailColor="var(--bg-tertiary)" size="small" />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    <Text type="secondary">Perplexity.ai</Text>
                    <Text style={{ color: 'var(--text-primary)' }}>{analytics?.geoEngineScores?.perplexity || 0}/100</Text>
                  </div>
                  <Progress percent={analytics?.geoEngineScores?.perplexity || 0} showInfo={false} strokeColor="var(--accent-info)" trailColor="var(--bg-tertiary)" size="small" />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    <Text type="secondary">ChatGPT</Text>
                    <Text style={{ color: 'var(--text-primary)' }}>{analytics?.geoEngineScores?.chatgpt || 0}/100</Text>
                  </div>
                  <Progress percent={analytics?.geoEngineScores?.chatgpt || 0} showInfo={false} strokeColor="var(--accent-secondary)" trailColor="var(--bg-tertiary)" size="small" />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    <Text type="secondary">Gemini</Text>
                    <Text style={{ color: 'var(--text-primary)' }}>{analytics?.geoEngineScores?.gemini || 0}/100</Text>
                  </div>
                  <Progress percent={analytics?.geoEngineScores?.gemini || 0} showInfo={false} strokeColor="var(--accent-warning)" trailColor="var(--bg-tertiary)" size="small" />
                </div>
              </div>
            </Card>
          </motion.div>
        </Col>

        <Col xs={24} xl={14}>
          <motion.div variants={itemVariants} style={{ height: '100%' }}>
            <Card title={<Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Generative Engine Optimisation Growth</Title>} className="glassmorphism" style={{ borderRadius: 16, height: '100%', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: 24 }}>
              {geoScoreHistory.length > 0 ? (
                <div style={{ height: 350, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={geoScoreHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="geoScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-info)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--accent-info)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                      <Area type="monotone" dataKey="val" stroke="var(--accent-info)" strokeWidth={3} fillOpacity={1} fill="url(#geoScore)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>No GEO score history available.</div>
              )}
            </Card>
          </motion.div>
        </Col>
      </Row>

      <motion.div variants={itemVariants} style={{ marginBottom: 24 }}>
        <Card 
          title={<div style={{ paddingTop: 8 }}><Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>AI Citation Log</Title><Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Every time an AI engine cited {project?.name || 'your'} content — last 30 days</Text></div>} 
          extra={
            <div style={{ display: 'flex', gap: 12 }}>
              <Button size="small" style={{ borderRadius: 16, fontWeight: 600 }}>All Engines ▾</Button>
              <Button size="small" style={{ borderRadius: 16, fontWeight: 600 }}>Last 30 days ▾</Button>
            </div>
          }
          className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: '24px 0' }}
        >
          <div style={{ overflowX: 'auto', padding: '0 24px' }}>
            {citationLog.length > 0 ? (
              <Table columns={citationCols} dataSource={citationLog} pagination={false} rowKey="id" size="middle" scroll={{ x: 800 }} style={{ minWidth: 800 }} />
            ) : (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>No citation logs available for this project.</div>
            )}
          </div>
        </Card>
      </motion.div>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} xl={12}>
          <motion.div variants={itemVariants} style={{ height: '100%' }}>
            <Card title={<Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Citation Share by AI Engine</Title>} className="glassmorphism" style={{ borderRadius: 16, height: '100%', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                {citationShare.length > 0 ? (
                  <div style={{ width: '100%', height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={citationShare} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" hide />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                          {citationShare.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>No citation share data.</div>
                )}
            </Card>
          </motion.div>
        </Col>

        <Col xs={24} xl={12}>
          <motion.div variants={itemVariants} style={{ height: '100%' }}>
            <Card title={<Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>What Content Gets Cited Most</Title>} className="glassmorphism" style={{ borderRadius: 16, height: '100%', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={citedContent} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} width={100} />
                    <Tooltip cursor={{ fill: 'var(--bg-tertiary)' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: 'var(--shadow-md)', background: 'var(--bg-primary)' }} />
                    <Bar dataKey="val" radius={[0, 4, 4, 0]} barSize={24}>
                      {citedContent.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        </Col>
      </Row>

      <motion.div variants={itemVariants}>
        <Card title={<div style={{ paddingTop: 8 }}><Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>GEO Action Plan — Improve Your Score</Title><Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Prioritised actions to increase AI engine visibility</Text></div>} className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: 24 }}>
          
          {geoActionPlan.length > 0 ? (
            <Row gutter={[24, 24]}>
              {geoActionPlan.map((plan, i) => (
                <Col xs={24} xl={12} key={i}>
                  <div style={{ padding: 24, borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <Tag color={plan.priority?.includes('HIGH') ? 'error' : 'warning'} style={{ borderRadius: 12, fontWeight: 700, margin: 0 }}>{plan.priority}</Tag>
                      <Tag color="purple" style={{ borderRadius: 12, fontWeight: 700, margin: 0 }}>{plan.points}</Tag>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
                      <Card style={{ padding: 12, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }} bodyStyle={{ padding: 0 }}>
                        <Sparkles size={24} style={{ color: 'var(--accent-info)' }} />
                      </Card>
                      <div>
                        <strong style={{ display: 'block', fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>{plan.title}</strong>
                        <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.5, display: 'block' }}>{plan.desc}</Text>
                      </div>
                    </div>
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                        <Text type="secondary">⏱ {plan.time}</Text>
                        <Text type="secondary">👤 {plan.owner}</Text>
                      </div>
                      <Button type="primary" style={{ background: 'var(--accent-info)', borderRadius: 8, fontWeight: 600 }}>{plan.btn}</Button>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>No GEO Action Plan available for this project.</div>
          )}

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 20, background: 'rgba(139, 92, 246, 0.05)', borderRadius: 12, border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <Text style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Total estimated GEO improvement: <strong style={{ color: 'var(--accent-info)' }}>+{geoActionPlan.reduce((acc, p) => acc + parseInt(p.points || 0), 0)} pts</strong> <span style={{ fontWeight: 400 }}>(from {geoVisibilityScore} → {Math.min(100, geoVisibilityScore + geoActionPlan.reduce((acc, p) => acc + parseInt(p.points || 0), 0))})</span></Text>
            <Button type="primary" style={{ background: 'var(--accent-info)', borderRadius: 8, fontWeight: 600 }}>Generate Full GEO Report</Button>
          </div>
        </Card>
      </motion.div>

    </motion.div>
  );
};

export default GEOTab;
