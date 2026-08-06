import React from 'react';
import { Typography, Tag, Alert } from 'antd';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, TrendingDown, Lightbulb, Info, CheckCircle2 } from 'lucide-react';

import EmptyState from '../components/EmptyState';

const { Title, Text } = Typography;

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const SEVERITY_META = {
  critical: { color: 'red', barColor: 'var(--accent-danger)', icon: AlertTriangle, label: 'Critical' },
  warning: { color: 'orange', barColor: 'var(--accent-warning)', icon: AlertTriangle, label: 'Watch' },
  info: { color: 'blue', barColor: 'var(--accent-info)', icon: Info, label: 'Opportunity' },
  positive: { color: 'green', barColor: 'var(--accent-primary)', icon: CheckCircle2, label: 'Positive' }
};

const TYPE_ICON = {
  traffic_change: TrendingUp,
  ctr_change: TrendingUp,
  ranking_drop: TrendingDown,
  ranking_gain: TrendingUp,
  optimization_opportunity: Lightbulb
};

const InsightCard = React.memo(function InsightCard({ insight }) {
  const meta = SEVERITY_META[insight.severity] || SEVERITY_META.info;
  const Icon = TYPE_ICON[insight.type] || meta.icon;

  return (
    <motion.div variants={itemVariants}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderLeft: `4px solid ${meta.barColor}`,
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 12,
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <Icon size={20} style={{ marginTop: 2, flexShrink: 0 }} color={meta.barColor} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <Text strong style={{ fontSize: 14 }}>{insight.title}</Text>
            <Tag color={meta.color}>{meta.label}</Tag>
          </div>
          <Text type="secondary" style={{ fontSize: 13 }}>{insight.detail}</Text>
        </div>
      </div>
    </motion.div>
  );
});

const AiInsightsTab = ({ data }) => {
  const aiInsights = data?.aiInsights;
  const insights = aiInsights?.insights || [];

  return (
    <>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
        message="Calculated, not generated"
        description="Every insight below is a rule applied to real, already-computed numbers — traffic and CTR trends from GA4/Search Console, rank deltas from Rank Tracking, and open findings from Website Audit, Technical SEO, and Automation & Monitoring. Nothing here is written by a language model."
      />

      {insights.length === 0 ? (
        <EmptyState icon={Lightbulb} message="No thresholds were crossed for this range — nothing notable to flag right now." height={240} />
      ) : (
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
          <Title level={5} style={{ marginBottom: 16 }}>{insights.length} insight{insights.length === 1 ? '' : 's'} for this range</Title>
          {insights.map(insight => <InsightCard key={insight.id} insight={insight} />)}
        </motion.div>
      )}
    </>
  );
};

export default React.memo(AiInsightsTab);