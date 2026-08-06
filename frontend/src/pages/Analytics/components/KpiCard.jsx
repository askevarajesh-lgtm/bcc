import React from 'react';
import { Typography, Card, Tooltip } from 'antd';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const { Title, Text } = Typography;

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

function trendDirection(trend) {
  if (!trend) return 'flat';
  if (trend.startsWith('-')) return 'down';
  if (trend === '0%') return 'flat';
  return 'up';
}

/**
 * `goodDirection` tells the card which arrow direction is actually "good"
 * for this metric — e.g. a falling Bounce Rate or Avg. Position is an
 * improvement, so it should render green even though the trend is negative.
 */
const KpiCard = React.memo(function KpiCard({ label, value, trend, color, goodDirection = 'up', comparisonLabel, description }) {
  const direction = trendDirection(trend);
  const isGood = direction === 'flat' ? null : direction === goodDirection;
  const TrendIcon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;
  const trendColor = isGood === null ? 'var(--text-tertiary)' : isGood ? 'var(--accent-primary)' : 'var(--accent-danger)';
  const trendBg = isGood === null ? 'var(--bg-tertiary)' : isGood ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';

  return (
    <motion.div variants={itemVariants} whileHover={{ scale: 1.02, transition: { duration: 0.2 } }} style={{ height: '100%' }}>
      <Card
        bodyStyle={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}
        style={{ borderRadius: 0, height: '100%', background: 'var(--bg-secondary)', border: 'none', boxShadow: 'var(--shadow-sm)' }}
        role="group"
        aria-label={`${label}: ${value}${trend ? `, ${trend} versus previous period` : ''}`}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, width: 16, height: 16, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} aria-hidden="true" />
        <div style={{ position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` }} aria-hidden="true" />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: 16, height: 16, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} aria-hidden="true" />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` }} aria-hidden="true" />

        <Tooltip title={description}>
          <Text type="secondary" style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textAlign: 'center', marginBottom: 16, cursor: description ? 'help' : 'default' }}>
            {label}
          </Text>
        </Tooltip>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <Title level={2} style={{ margin: '0 0 8px', color: 'var(--text-primary)', fontWeight: 800, fontSize: 32 }}>{value}</Title>
          {trend && (
            <Tooltip title={comparisonLabel || 'vs previous period'}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 12, background: trendBg, color: trendColor, fontWeight: 700, padding: '2px 10px', fontSize: 12 }}>
                <TrendIcon size={13} aria-hidden="true" />
                {trend}
              </span>
            </Tooltip>
          )}
        </div>
      </Card>
    </motion.div>
  );
});

export default KpiCard;
