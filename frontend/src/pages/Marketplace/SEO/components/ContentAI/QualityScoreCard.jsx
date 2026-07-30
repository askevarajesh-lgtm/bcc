import React from 'react';
import { Card, Progress, Row, Col, Typography, Empty } from 'antd';

const { Text } = Typography;

const AXES = [
  { key: 'seo', label: 'SEO' },
  { key: 'readability', label: 'Readability' },
  { key: 'grammar', label: 'Grammar' },
  { key: 'conversion', label: 'Conversion' },
  { key: 'aiConfidence', label: 'AI Confidence' }
];

const colorFor = (score) => {
  if (score === null || score === undefined) return '#d9d9d9';
  if (score >= 80) return '#52c41a';
  if (score >= 50) return '#faad14';
  return '#f5222d';
};

// Renders the 5-axis Content Quality Score (SEO / Readability / Grammar /
// Conversion / AI Confidence) — content-ai-platform-architecture.md §9.
// Axes a given generator doesn't apply to simply have a null score, shown
// as "n/a" rather than a misleading 0.
const QualityScoreCard = ({ score }) => {
  if (!score) {
    return (
      <Card size="small" title="Content Quality Score">
        <Empty description="No score yet — generate a version first." image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }

  return (
    <Card size="small" title="Content Quality Score">
      <Row gutter={[16, 16]} style={{ marginBottom: 8 }}>
        <Col span={24}>
          <Text strong>Overall: </Text>
          <Text>{score.overall === null || score.overall === undefined ? 'n/a' : `${score.overall}/100`}</Text>
        </Col>
      </Row>
      <Row gutter={[16, 16]}>
        {AXES.map(({ key, label }) => {
          const axis = score[key] || {};
          const value = typeof axis.score === 'number' ? axis.score : null;
          return (
            <Col span={12} key={key}>
              <Text style={{ fontSize: 12 }}>{label}</Text>
              {value === null ? (
                <div><Text type="secondary">n/a</Text></div>
              ) : (
                <Progress percent={value} size="small" strokeColor={colorFor(value)} />
              )}
            </Col>
          );
        })}
      </Row>
    </Card>
  );
};

export default QualityScoreCard;
