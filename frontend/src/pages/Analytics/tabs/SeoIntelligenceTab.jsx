import React from 'react';
import { Typography, Row, Col, Tag, Alert, Progress, Empty } from 'antd';
import { motion } from 'framer-motion';
import { FileSearch, Wrench, Sparkles, Globe2, Search, Link2, TrendingUp, ShieldAlert, Users } from 'lucide-react';

import KpiCard from '../components/KpiCard';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';

const { Title, Text } = Typography;

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const SEVERITY_COLOR = { critical: 'red', high: 'volcano', medium: 'orange', low: 'blue' };

function ScoreBlock({ label, score, auditsRun, icon: Icon }) {
  const hasScore = typeof score === 'number';
  return (
    <Col xs={24} sm={12} lg={6}>
      <motion.div variants={itemVariants} style={{ height: '100%' }}>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 20, height: '100%', display: 'flex', flexDirection: 'column', gap: 10, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon size={16} color="var(--accent-secondary)" />
            <Text type="secondary" style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>{label}</Text>
          </div>
          {hasScore ? (
            <>
              <Progress
                type="dashboard"
                size={90}
                percent={score}
                strokeColor={score >= 75 ? 'var(--accent-primary)' : score >= 50 ? 'var(--accent-warning)' : 'var(--accent-danger)'}
                format={(p) => <span style={{ fontWeight: 800, fontSize: 20 }}>{p}</span>}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>From {auditsRun} completed audit{auditsRun === 1 ? '' : 's'}</Text>
            </>
          ) : (
            <div style={{ padding: '20px 0' }}>
              <Text type="secondary" style={{ fontSize: 13 }}>No completed audit yet</Text>
            </div>
          )}
        </div>
      </motion.div>
    </Col>
  );
}

const SeoIntelligenceTab = ({ data, searchTerm }) => {
  const seo = data?.seoIntelligence;

  if (!seo || !seo.connected) {
    return (
      <Alert
        type="info"
        showIcon
        message="No SEO Workspace project connected"
        description={seo?.message || 'Set up a project in the SEO Workspace for this client to see Website Audit, Technical SEO, Keyword Intelligence, Rank Tracking, AEO, and GEO data here.'}
      />
    );
  }

  const { moduleScores, topKeywords, topOrganicPages, topReferrers, technicalIssueImpact, rankingImpact, organicTrafficContribution, competitorContext, monitoringAlerts } = seo;

  const keywordColumns = [
    { key: 'keyword', title: 'Keyword', dataIndex: 'keyword' },
    { key: 'currentRank', title: 'Rank', dataIndex: 'currentRank', render: (v) => v ?? '—', sorter: (a, b) => (a.currentRank ?? 999) - (b.currentRank ?? 999) },
    { key: 'rankChange', title: 'Change', dataIndex: 'rankChange', render: (v) => <Tag color={v > 0 ? 'green' : v < 0 ? 'red' : 'default'}>{v > 0 ? `+${v}` : v}</Tag> },
    { key: 'trend', title: 'Trend', dataIndex: 'trend' },
    { key: 'searchVolume', title: 'Search Vol.', dataIndex: 'searchVolume', render: (v) => v?.toLocaleString?.() ?? 0, sorter: (a, b) => a.searchVolume - b.searchVolume },
    { key: 'estimatedTraffic', title: 'Est. Traffic', dataIndex: 'estimatedTraffic', render: (v) => v?.toLocaleString?.() ?? 0, sorter: (a, b) => a.estimatedTraffic - b.estimatedTraffic }
  ];

  const organicPageColumns = [
    { key: 'path', title: 'Page', dataIndex: 'path' },
    { key: 'sessions', title: 'Organic Sessions', dataIndex: 'sessions', sorter: (a, b) => a.sessions - b.sessions },
    { key: 'bounceRate', title: 'Bounce Rate', dataIndex: 'bounceRate' },
    { key: 'engagementRate', title: 'Engagement', dataIndex: 'engagementRate' }
  ];

  const referrerColumns = [
    { key: 'referrer', title: 'Referrer', dataIndex: 'referrer' },
    { key: 'sessions', title: 'Sessions', dataIndex: 'sessions', sorter: (a, b) => a.sessions - b.sessions }
  ];

  const issueColumns = [
    { key: 'source', title: 'Module', dataIndex: 'source', render: (v) => <Tag>{v}</Tag> },
    { key: 'severity', title: 'Severity', dataIndex: 'severity', render: (v) => <Tag color={SEVERITY_COLOR[v] || 'default'}>{v}</Tag> },
    { key: 'issue', title: 'Issue', dataIndex: 'issue' },
    { key: 'affectedUrl', title: 'Affected URL', dataIndex: 'affectedUrl', render: (v) => v || '—' },
    { key: 'sessionsInRange', title: 'Sessions at Risk', dataIndex: 'sessionsInRange', render: (v) => v != null ? v.toLocaleString() : '—' }
  ];

  return (
    <>
      <motion.div variants={itemVariants} style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginBottom: 16 }}>Module Health</Title>
        <Row gutter={[16, 16]}>
          <ScoreBlock label="WEBSITE AUDIT" score={moduleScores.websiteAudit.averageScore} auditsRun={moduleScores.websiteAudit.auditsRun} icon={FileSearch} />
          <ScoreBlock label="AEO SCORE" score={moduleScores.aeo.averageScore} auditsRun={moduleScores.aeo.auditsRun} icon={Sparkles} />
          <ScoreBlock label="GEO SCORE" score={moduleScores.geo.averageScore} auditsRun={moduleScores.geo.auditsRun} icon={Globe2} />
          <Col xs={24} sm={12} lg={6}>
            <motion.div variants={itemVariants} style={{ height: '100%' }}>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 20, height: '100%', display: 'flex', flexDirection: 'column', gap: 10, boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Wrench size={16} color="var(--accent-secondary)" />
                  <Text type="secondary" style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>TECHNICAL SEO CRAWL</Text>
                </div>
                <Text style={{ fontSize: 13 }}>{moduleScores.technicalSeo.crawlSignals.pagesCrawled.toLocaleString()} pages crawled</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{moduleScores.technicalSeo.crawlSignals.clientErrors4xx} × 4xx · {moduleScores.technicalSeo.crawlSignals.serverErrors5xx} × 5xx · {moduleScores.technicalSeo.crawlSignals.canonicalMissing} missing canonical</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>From {moduleScores.technicalSeo.auditsRun} completed audit{moduleScores.technicalSeo.auditsRun === 1 ? '' : 's'}</Text>
              </div>
            </motion.div>
          </Col>
        </Row>
      </motion.div>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={6}>
          <KpiCard label="ORGANIC SESSIONS" value={organicTrafficContribution.sessions.toLocaleString()} trend={organicTrafficContribution.sessionShare} color="var(--accent-primary)" goodDirection="up" comparisonLabel="share of total sessions" description="Real GA4 sessions attributed to the Organic Search channel." />
        </Col>
        <Col xs={24} md={6}>
          <KpiCard label="ORGANIC LEADS" value={organicTrafficContribution.leads.toLocaleString()} trend={organicTrafficContribution.conversionRate} color="var(--accent-info)" goodDirection="up" comparisonLabel="conversion rate" description="Real CRM leads sourced from Organic Search in this range." />
        </Col>
        <Col xs={24} md={6}>
          <KpiCard label="ORGANIC REVENUE" value={organicTrafficContribution.attributedRevenueFormatted} trend={organicTrafficContribution.revenueShare} color="var(--accent-warning)" goodDirection="up" comparisonLabel={`share of attributed revenue (${organicTrafficContribution.attributionModelUsed} model)`} description="Real invoice revenue distributed to Organic Search by the Attribution engine." />
        </Col>
        <Col xs={24} md={6}>
          <KpiCard label="TRACKED KEYWORDS" value={String(topKeywords.trackedCount)} color="var(--accent-secondary)" description="Real keywords tracked in Keyword Intelligence for this scope." />
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <ChartCard title="Ranking Impact" subtitle={`${rankingImpact.keywordsWithSnapshots ?? 0} keywords with dated snapshots this period`} height="auto" isEmpty={!rankingImpact.keywordsWithSnapshots} emptyState={<EmptyState icon={TrendingUp} message="No rank-tracking snapshots in this date range yet." />}>
            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
              <Col span={6}><Tag color="green" style={{ width: '100%', textAlign: 'center', padding: '6px 0' }}>Improved {rankingImpact.improved}</Tag></Col>
              <Col span={6}><Tag color="red" style={{ width: '100%', textAlign: 'center', padding: '6px 0' }}>Declined {rankingImpact.declined}</Tag></Col>
              <Col span={6}><Tag color="blue" style={{ width: '100%', textAlign: 'center', padding: '6px 0' }}>New {rankingImpact.newlyRanked}</Tag></Col>
              <Col span={6}><Tag color="volcano" style={{ width: '100%', textAlign: 'center', padding: '6px 0' }}>Lost {rankingImpact.lost}</Tag></Col>
            </Row>
            <Text type="secondary" style={{ fontSize: 13 }}>Avg. rank change: <strong>{rankingImpact.avgRankChange > 0 ? `+${rankingImpact.avgRankChange}` : rankingImpact.avgRankChange}</strong> positions</Text>
            <Row gutter={[8, 8]} style={{ marginTop: 16 }}>
              {['top3', 'top10', 'top50', 'beyond'].map(k => (
                <Col span={6} key={k}>
                  <div style={{ textAlign: 'center', padding: '10px 4px', background: 'var(--bg-tertiary)', borderRadius: 10 }}>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>{rankingImpact.distribution?.[k] ?? 0}</div>
                    <Text type="secondary" style={{ fontSize: 11 }}>{k === 'top3' ? 'Top 3' : k === 'top10' ? 'Top 10' : k === 'top50' ? 'Top 50' : 'Beyond 50'}</Text>
                  </div>
                </Col>
              ))}
            </Row>
          </ChartCard>
        </Col>
        <Col xs={24} lg={12}>
          <ChartCard title="Automation & Monitoring" subtitle={`${monitoringAlerts.openCount} open alert${monitoringAlerts.openCount === 1 ? '' : 's'}`} height="auto" isEmpty={!monitoringAlerts.openCount} emptyState={<EmptyState icon={ShieldAlert} message="No open monitoring alerts." />}>
            <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
              {Object.entries(monitoringAlerts.bySeverity).map(([sev, count]) => (
                <Col span={6} key={sev}>
                  <div style={{ textAlign: 'center', padding: '10px 4px', background: 'var(--bg-tertiary)', borderRadius: 10 }}>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>{count}</div>
                    <Text type="secondary" style={{ fontSize: 11 }}>{sev}</Text>
                  </div>
                </Col>
              ))}
            </Row>
            {monitoringAlerts.recent.slice(0, 5).map((a, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 4 ? '1px solid var(--border-color)' : 'none' }}>
                <Text style={{ fontSize: 13 }}>{a.category} <Text type="secondary" style={{ fontSize: 12 }}>({a.entityType})</Text></Text>
                <Tag color={SEVERITY_COLOR[(a.severity || '').toLowerCase()] || 'default'}>{a.severity}</Tag>
              </div>
            ))}
          </ChartCard>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <DataTable
            title="Top Keywords"
            subtitle="Real tracked keywords with a live rank or traffic source (Keyword Intelligence + Rank Tracking)."
            columns={keywordColumns}
            dataSource={topKeywords.keywords}
            rowKey="keyword"
            searchTerm={searchTerm}
            searchableFields={['keyword']}
            exportFilename="seo-top-keywords"
            emptyMessage="No tracked keywords with a live rank/traffic source yet."
          />
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <DataTable
            title="Top Organic Pages"
            subtitle="Pages driving GA4 sessions specifically from the Organic Search channel."
            columns={organicPageColumns}
            dataSource={topOrganicPages}
            rowKey="path"
            searchTerm={searchTerm}
            searchableFields={['path']}
            exportFilename="seo-top-organic-pages"
            emptyMessage="No organic sessions in this range yet."
          />
        </Col>
        <Col xs={24} lg={10}>
          <DataTable
            title="Top Referrers"
            subtitle="Real GA4 referral sources for this scope."
            columns={referrerColumns}
            dataSource={topReferrers}
            rowKey="referrer"
            searchTerm={searchTerm}
            searchableFields={['referrer']}
            exportFilename="seo-top-referrers"
            emptyMessage="No referral sessions in this range yet."
          />
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <DataTable
            title="Technical Issue Impact"
            subtitle={`${technicalIssueImpact.totalIssues} open findings from the latest Website Audit + Technical SEO audit · ~${technicalIssueImpact.sessionsAtRisk.toLocaleString()} sessions on affected pages`}
            columns={issueColumns}
            dataSource={[...technicalIssueImpact.topIssuesBySessionImpact, ...technicalIssueImpact.otherOpenIssues]}
            rowKey={(r, i) => `${r.source}-${r.issue}-${i}`}
            searchTerm={searchTerm}
            searchableFields={['issue', 'affectedUrl', 'category']}
            exportFilename="seo-technical-issue-impact"
            emptyMessage="No open findings from the latest completed audits."
          />
        </Col>
      </Row>

      {competitorContext.trackedCompetitors > 0 && (
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <motion.div variants={itemVariants} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
              <Users size={20} color="var(--accent-secondary)" />
              <Text style={{ fontSize: 13 }}>
                Tracking <strong>{competitorContext.trackedCompetitors}</strong> approved competitor{competitorContext.trackedCompetitors === 1 ? '' : 's'} in Competitor Intelligence — average visibility score <strong>{competitorContext.avgCompetitorVisibility}</strong>, average domain rank <strong>{competitorContext.avgCompetitorDomainRank}</strong>.
              </Text>
            </motion.div>
          </Col>
        </Row>
      )}
    </>
  );
};

export default SeoIntelligenceTab;
