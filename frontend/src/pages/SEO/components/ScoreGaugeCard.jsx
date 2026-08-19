import React from 'react';
import { Card, Typography, Tooltip, Progress } from 'antd';
import { ArrowUp, ArrowDown, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;

const ScoreGaugeCard = ({ title, score, previousScore, color, description, delay = 0, details = [] }) => {
  const diff = previousScore ? score - previousScore : 0;
  const isPositive = diff >= 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }} style={{ height: '100%' }}>
      <Card
        className="semrush-widget-card"
        style={{
          borderRadius: 16,
          height: '100%',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column'
        }}
        bodyStyle={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title level={5} style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            {title}
            {description && (
              <Tooltip title={description}>
                <Info size={14} color="var(--text-secondary)" style={{ cursor: 'pointer' }} />
              </Tooltip>
            )}
          </Title>
          {diff !== 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              color: isPositive ? 'var(--accent-primary)' : 'var(--accent-danger)',
              background: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600
            }}>
              {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              {Math.abs(diff)}%
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
          <Progress
            type="dashboard"
            percent={score !== null && score !== undefined ? score : 0}
            strokeColor={score !== null && score !== undefined ? (color || 'var(--accent-primary)') : 'var(--border-color)'}
            trailColor="var(--bg-tertiary)"
            size={140}
            strokeWidth={10}
            format={() => (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 10 }}>
                <Title level={2} style={{ margin: 0, fontSize: 32, fontWeight: 800, color: score !== null && score !== undefined ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1 }}>
                  {score !== null && score !== undefined ? score : 'N/A'}
                </Title>
                {score !== null && score !== undefined && <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>/100</Text>}
              </div>
            )}
          />
        </div>

        {details && details.length > 0 && (
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {details.map((item, idx) => {
              const isUnavailable = item.status === 'unavailable' || item.status === 'failed' || item.value === null || item.value === undefined;
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.label}
                      {item.sourceType === 'ai_derived' && (
                        <span style={{ marginLeft: 6, fontSize: 10, background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>AI-Derived</span>
                      )}
                    </Text>
                    <Text strong style={{ fontSize: 12, color: isUnavailable ? 'var(--text-secondary)' : 'var(--text-primary)', whiteSpace: 'nowrap', marginLeft: 8 }}>
                      {isUnavailable ? 'Unavailable' : `${item.value}/100`}
                    </Text>
                  </div>
                  <Progress
                    percent={isUnavailable ? 0 : item.value}
                    showInfo={false}
                    size="small"
                    strokeColor={isUnavailable ? 'var(--border-color)' : (item.color || color || 'var(--accent-primary)')}
                    trailColor="var(--bg-tertiary)"
                    style={{ margin: 0 }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default ScoreGaugeCard;
