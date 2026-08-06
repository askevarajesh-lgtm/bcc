import React, { useMemo, useState } from 'react';
import { Typography, Card, Alert } from 'antd';
import { motion } from 'framer-motion';
import { Activity, GitBranch } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';

import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import DrillDownDrawer from '../components/DrillDownDrawer';
import { useLegendToggle } from '../hooks/useLegendToggle';

const { Title, Text } = Typography;

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const AttributionTab = ({ data, searchTerm = '' }) => {
  const [drillDown, setDrillDown] = useState(null);
  const legend = useLegendToggle();

  const breakdownData = data.channelBreakdown || [];
  const chartData = useMemo(() => breakdownData.map(c => ({ channel: c.channel, sessions: c.sessions, leads: c.leads })), [breakdownData]);

  const breakdownCols = [
    { title: 'Channel', dataIndex: 'channel', key: 'channel', sorter: (a, b) => a.channel.localeCompare(b.channel), render: t => <strong style={{ color: 'var(--text-primary)' }}>{t}</strong> },
    { title: 'Sessions', dataIndex: 'sessions', key: 'sessions', align: 'right', sorter: (a, b) => a.sessions - b.sessions, defaultSortOrder: 'descend', render: t => <Text style={{ fontWeight: 500 }}>{Number(t).toLocaleString()}</Text> },
    { title: 'Leads', dataIndex: 'leads', key: 'leads', align: 'right', sorter: (a, b) => a.leads - b.leads, render: t => <strong style={{ color: 'var(--text-primary)' }}>{Number(t).toLocaleString()}</strong> },
    { title: 'Session → Lead Rate', dataIndex: 'conversionRate', key: 'conversionRate', align: 'right', render: t => <Text style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{t}</Text> }
  ];

  return (
    <>
      <motion.div variants={itemVariants} style={{ marginBottom: 24 }}>
        <Card className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: 24 }}>
          <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><Activity size={14} aria-hidden="true" /> ATTRIBUTION MODEL</Text>
          <Title level={4} style={{ margin: '0 0 8px 0', fontWeight: 800, color: 'var(--text-primary)' }}>Channel-Level (Last Touch)</Title>
          <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
            Each channel's sessions come from Google Analytics 4, and its leads come from the CRM's recorded lead source — grouped onto the same channel taxonomy. This reflects
            last-touch volume per channel, not a multi-touch or cross-session customer journey. Full multi-touch attribution would require session-level touchpoint tracking
            that isn't collected yet.
          </Text>
        </Card>
      </motion.div>

      <div style={{ marginBottom: 32 }}>
        <ChartCard
          title="Sessions vs Leads by Channel"
          subtitle="Selected date range · click a legend entry to isolate a series"
          height={320}
          isEmpty={chartData.length === 0}
          emptyState={<EmptyState icon={GitBranch} message="No channel data for this range yet." />}
          exportFilename="channel-attribution"
          exportRows={chartData}
          exportHeaders={[{ key: 'channel', label: 'Channel' }, { key: 'sessions', label: 'Sessions' }, { key: 'leads', label: 'Leads' }]}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <XAxis dataKey="channel" stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} dy={10} />
              <YAxis stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} dx={-10} />
              <Tooltip cursor={{ fill: 'var(--bg-tertiary)' }} contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)' }} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: 20, fontSize: 13, fontWeight: 500 }} onClick={legend.onLegendClick} formatter={legend.legendFormatter} />
              <Bar dataKey="sessions" name="Sessions" fill="var(--accent-info)" radius={[4, 4, 0, 0]} maxBarSize={40} hide={legend.isHidden('sessions')}
                onClick={(entry) => {
                  const point = entry?.payload ?? entry;
                  setDrillDown({ title: point.channel, subtitle: 'Channel drill-down', fields: [{ label: 'Channel', value: point.channel }, { label: 'Sessions', value: point.sessions?.toLocaleString() }, { label: 'Leads', value: point.leads?.toLocaleString() }] });
                }}
                style={{ cursor: 'pointer' }}
              />
              <Bar dataKey="leads" name="Leads" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} maxBarSize={40} hide={legend.isHidden('leads')}
                onClick={(entry) => {
                  const point = entry?.payload ?? entry;
                  setDrillDown({ title: point.channel, subtitle: 'Channel drill-down', fields: [{ label: 'Channel', value: point.channel }, { label: 'Sessions', value: point.sessions?.toLocaleString() }, { label: 'Leads', value: point.leads?.toLocaleString() }] });
                }}
                style={{ cursor: 'pointer' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div style={{ marginBottom: 32 }}>
        <DataTable
          title="Channel Attribution Breakdown"
          subtitle="Sessions and leads per channel, selected date range"
          columns={breakdownCols}
          dataSource={breakdownData}
          rowKey="channel"
          searchTerm={searchTerm}
          searchableFields={['channel']}
          exportFilename="channel-attribution-breakdown"
          emptyMessage="No channel data for this range yet."
          onRowClick={(record) => setDrillDown({
            title: record.channel,
            subtitle: 'Channel drill-down',
            fields: [
              { label: 'Channel', value: record.channel },
              { label: 'Sessions', value: record.sessions?.toLocaleString() },
              { label: 'Leads', value: record.leads?.toLocaleString() },
              { label: 'Session → Lead Rate', value: record.conversionRate }
            ]
          })}
        />
      </div>

      <Alert
        type="info"
        showIcon
        style={{ borderRadius: 12 }}
        message="Multi-touch customer journey mapping isn't available yet"
        description="Sequenced, cross-session conversion paths (e.g. Organic → Blog → Form Submit) require session-level touchpoint tracking that this workspace doesn't currently collect. Showing a fabricated journey here would be misleading, so this view is limited to the real, channel-level data above."
      />

      <DrillDownDrawer
        open={!!drillDown}
        onClose={() => setDrillDown(null)}
        title={drillDown?.title}
        subtitle={drillDown?.subtitle}
        fields={drillDown?.fields}
      />
    </>
  );
};

export default React.memo(AttributionTab);