import React from 'react';
import { Row, Col, Card, Skeleton } from 'antd';

const SkeletonKpiCard = () => (
  <Col style={{ flex: '1 1 200px', minWidth: 200 }}>
    <Card bodyStyle={{ padding: '24px 20px' }} style={{ borderRadius: 0, background: 'var(--bg-secondary)', border: 'none', boxShadow: 'var(--shadow-sm)' }}>
      <Skeleton active paragraph={false} title={{ width: '60%' }} />
      <Skeleton.Button active size="large" style={{ width: '70%', height: 32, marginTop: 12 }} />
      <Skeleton.Button active size="small" style={{ width: '40%', height: 20, marginTop: 12 }} />
    </Card>
  </Col>
);

/**
 * Mirrors the real dashboard's layout (two KPI rows, a wide chart, a
 * two-column chart row, a table) so there's no layout shift when the real
 * data streams in — a skeleton that doesn't match the eventual shape just
 * trades one bad loading experience for another.
 */
const DashboardSkeleton = () => (
  <div aria-busy="true" aria-live="polite" role="status">
    <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Loading analytics dashboard…</span>

    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      {Array.from({ length: 5 }).map((_, i) => <SkeletonKpiCard key={`kpi-a-${i}`} />)}
    </Row>
    <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
      {Array.from({ length: 7 }).map((_, i) => <SkeletonKpiCard key={`kpi-b-${i}`} />)}
    </Row>

    <Card style={{ borderRadius: 16, marginBottom: 32, border: '1px solid var(--border-color)' }} bodyStyle={{ padding: 24 }}>
      <Skeleton active paragraph={false} title={{ width: 220 }} />
      <Skeleton.Node active style={{ width: '100%', height: 300, marginTop: 16 }}>
        <div />
      </Skeleton.Node>
    </Card>

    <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
      <Col xs={24} lg={10}>
        <Card style={{ borderRadius: 16, height: '100%', border: '1px solid var(--border-color)' }} bodyStyle={{ padding: 24 }}>
          <Skeleton active paragraph={false} title={{ width: 180 }} />
          <Skeleton.Node active style={{ width: '100%', height: 220, marginTop: 16 }}><div /></Skeleton.Node>
        </Card>
      </Col>
      <Col xs={24} lg={14}>
        <Card style={{ borderRadius: 16, height: '100%', border: '1px solid var(--border-color)' }} bodyStyle={{ padding: 24 }}>
          <Skeleton active paragraph={false} title={{ width: 180 }} />
          <Skeleton.Node active style={{ width: '100%', height: 220, marginTop: 16 }}><div /></Skeleton.Node>
        </Card>
      </Col>
    </Row>

    <Card style={{ borderRadius: 16, border: '1px solid var(--border-color)' }} bodyStyle={{ padding: 24 }}>
      <Skeleton active paragraph={false} title={{ width: 200 }} />
      <Skeleton active paragraph={{ rows: 5 }} title={false} style={{ marginTop: 16 }} />
    </Card>
  </div>
);

export default DashboardSkeleton;
