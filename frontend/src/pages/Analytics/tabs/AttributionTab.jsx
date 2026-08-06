import React, { useMemo, useState } from 'react';
import { Typography, Card, Segmented, Tag } from 'antd';
import { motion } from 'framer-motion';
import { Activity, GitBranch, Info } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend,
  Sankey, Rectangle, Layer
} from 'recharts';

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

const NODE_COLORS = {
  channel: 'var(--accent-info)',
  status: 'var(--accent-secondary)',
  revenue: 'var(--accent-primary)'
};

/** Custom Sankey node: colored by node type (channel / status / revenue), label alongside. */
const JourneyNode = ({ x, y, width, height, payload }) => {
  const color = NODE_COLORS[payload.type] || 'var(--text-tertiary)';
  return (
    <Layer>
      <Rectangle x={x} y={y} width={width} height={height} fill={color} fillOpacity={0.9} radius={2} />
      <text
        x={x + width + 6}
        y={y + height / 2}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={12}
        fontWeight={600}
        fill="var(--text-primary)"
      >
        {payload.label} · {payload.value.toLocaleString()}
      </text>
    </Layer>
  );
};

/** Maps our {id, label, type, value} / {source, target, value} shape into Recharts' index-based Sankey format. */
function toSankeyData(nodes, links) {
  const indexById = new Map(nodes.map((n, i) => [n.id, i]));
  return {
    nodes: nodes.map(n => ({ name: n.label, label: n.label, type: n.type, value: n.value })),
    links: links
      .map(l => ({ source: indexById.get(l.source), target: indexById.get(l.target), value: l.value }))
      .filter(l => l.source !== undefined && l.target !== undefined && l.value > 0)
  };
}

const AttributionTab = ({ data, searchTerm = '' }) => {
  const [drillDown, setDrillDown] = useState(null);
  const legend = useLegendToggle();

  const attribution = data.attribution;
  const journey = data.customerJourney;

  const modelOptions = useMemo(
    () => (attribution?.availableModels || []).map(m => ({ label: m.label, value: m.key })),
    [attribution]
  );

  const [selectedModel, setSelectedModel] = useState(attribution?.defaultModel || 'linear');
  const activeModel = attribution?.models?.[selectedModel] ? selectedModel : (attribution?.defaultModel || 'linear');
  const activeModelMeta = (attribution?.availableModels || []).find(m => m.key === activeModel);

  const channels = attribution?.models?.[activeModel]?.channels || [];
  const totals = attribution?.models?.[activeModel]?.totals;

  const chartData = useMemo(
    () => channels.map(c => ({ channel: c.channel, attributedLeads: c.attributedLeads, attributedRevenue: c.attributedRevenue })),
    [channels]
  );

  const breakdownCols = [
    { title: 'Channel', dataIndex: 'channel', key: 'channel', sorter: (a, b) => a.channel.localeCompare(b.channel), render: t => <strong style={{ color: 'var(--text-primary)' }}>{t}</strong> },
    { title: 'Attributed Leads', dataIndex: 'attributedLeads', key: 'attributedLeads', align: 'right', sorter: (a, b) => a.attributedLeads - b.attributedLeads, defaultSortOrder: 'descend', render: t => <Text style={{ fontWeight: 500 }}>{Number(t).toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text> },
    { title: 'Lead Share', dataIndex: 'leadShare', key: 'leadShare', align: 'right', render: t => <Text type="secondary">{t}</Text> },
    { title: 'Attributed Revenue', dataIndex: 'attributedRevenueFormatted', key: 'attributedRevenueFormatted', align: 'right', sorter: (a, b) => a.attributedRevenue - b.attributedRevenue, render: t => <strong style={{ color: 'var(--accent-primary)' }}>{t}</strong> },
    { title: 'Revenue Share', dataIndex: 'revenueShare', key: 'revenueShare', align: 'right', render: t => <Text style={{ fontWeight: 700 }}>{t}</Text> }
  ];

  const sankeyData = useMemo(() => {
    if (!journey?.nodes?.length) return null;
    return toSankeyData(journey.nodes, journey.links);
  }, [journey]);

  return (
    <>
      <motion.div variants={itemVariants} style={{ marginBottom: 24 }}>
        <Card className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: 24 }}>
          <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Activity size={14} aria-hidden="true" /> ATTRIBUTION ENGINE
          </Text>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <Title level={4} style={{ margin: '0 0 8px 0', fontWeight: 800, color: 'var(--text-primary)' }}>
                {activeModelMeta?.label || 'Attribution'}
                {attribution?.touchpointGranularity && (
                  <Tag style={{ marginLeft: 10, borderRadius: 6, fontWeight: 700, verticalAlign: 'middle' }} color={attribution.touchpointGranularity === 'multi-touch' ? 'green' : 'default'}>
                    {attribution.touchpointGranularity === 'multi-touch' ? 'Multi-touch data' : 'Single-touch data'}
                  </Tag>
                )}
              </Title>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 500, maxWidth: 720, display: 'block' }}>
                {activeModelMeta?.description} {attribution?.methodology}
              </Text>
            </div>
            {modelOptions.length > 0 && (
              <Segmented
                options={modelOptions}
                value={activeModel}
                onChange={setSelectedModel}
                style={{ fontWeight: 600 }}
              />
            )}
          </div>

          {totals && (
            <div style={{ display: 'flex', gap: 32, marginTop: 20, flexWrap: 'wrap' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>ATTRIBUTED LEADS</Text>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{totals.leads.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>ATTRIBUTED REVENUE</Text>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-primary)' }}>{totals.revenueFormatted}</div>
              </div>
              {totals.unattributedRevenue > 0 && (
                <div>
                  <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Info size={12} aria-hidden="true" /> UNATTRIBUTED REVENUE
                  </Text>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-tertiary)' }}>{totals.unattributedRevenueFormatted}</div>
                </div>
              )}
            </div>
          )}
        </Card>
      </motion.div>

      <div style={{ marginBottom: 32 }}>
        <ChartCard
          title="Attributed Leads & Revenue by Channel"
          subtitle={`${activeModelMeta?.label || ''} model · selected date range · click a legend entry to isolate a series`}
          height={320}
          isEmpty={chartData.length === 0}
          emptyState={<EmptyState icon={GitBranch} message="No attribution data for this range yet." />}
          exportFilename={`attribution-${activeModel}`}
          exportRows={chartData}
          exportHeaders={[{ key: 'channel', label: 'Channel' }, { key: 'attributedLeads', label: 'Attributed Leads' }, { key: 'attributedRevenue', label: 'Attributed Revenue' }]}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <XAxis dataKey="channel" stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} dy={10} />
              <YAxis stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} dx={-10} />
              <Tooltip cursor={{ fill: 'var(--bg-tertiary)' }} contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)' }} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: 20, fontSize: 13, fontWeight: 500 }} onClick={legend.onLegendClick} formatter={legend.legendFormatter} />
              <Bar dataKey="attributedLeads" name="Attributed Leads" fill="var(--accent-info)" radius={[4, 4, 0, 0]} maxBarSize={40} hide={legend.isHidden('attributedLeads')}
                onClick={(entry) => {
                  const point = entry?.payload ?? entry;
                  setDrillDown({ title: point.channel, subtitle: `${activeModelMeta?.label || ''} attribution`, fields: [{ label: 'Channel', value: point.channel }, { label: 'Attributed Leads', value: point.attributedLeads?.toLocaleString(undefined, { maximumFractionDigits: 2 }) }, { label: 'Attributed Revenue', value: point.attributedRevenue?.toLocaleString('en-IN') }] });
                }}
                style={{ cursor: 'pointer' }}
              />
              <Bar dataKey="attributedRevenue" name="Attributed Revenue (₹)" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} maxBarSize={40} hide={legend.isHidden('attributedRevenue')}
                onClick={(entry) => {
                  const point = entry?.payload ?? entry;
                  setDrillDown({ title: point.channel, subtitle: `${activeModelMeta?.label || ''} attribution`, fields: [{ label: 'Channel', value: point.channel }, { label: 'Attributed Leads', value: point.attributedLeads?.toLocaleString(undefined, { maximumFractionDigits: 2 }) }, { label: 'Attributed Revenue', value: point.attributedRevenue?.toLocaleString('en-IN') }] });
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
          subtitle={`${activeModelMeta?.label || ''} model · attributed leads and revenue per channel`}
          columns={breakdownCols}
          dataSource={channels}
          rowKey="channel"
          searchTerm={searchTerm}
          searchableFields={['channel']}
          exportFilename={`attribution-breakdown-${activeModel}`}
          emptyMessage="No attribution data for this range yet."
          onRowClick={(record) => setDrillDown({
            title: record.channel,
            subtitle: `${activeModelMeta?.label || ''} attribution`,
            fields: [
              { label: 'Channel', value: record.channel },
              { label: 'Attributed Leads', value: Number(record.attributedLeads).toLocaleString(undefined, { maximumFractionDigits: 2 }) },
              { label: 'Lead Share', value: record.leadShare },
              { label: 'Attributed Revenue', value: record.attributedRevenueFormatted },
              { label: 'Revenue Share', value: record.revenueShare }
            ]
          })}
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <ChartCard
          title="Customer Journey"
          subtitle="Real channels → real lead stages → real revenue, generated dynamically from this period's data"
          height={420}
          isEmpty={!sankeyData || sankeyData.nodes.length === 0}
          emptyState={<EmptyState icon={GitBranch} message="No leads in this range yet, so there's no journey to show." />}
        >
          {sankeyData && sankeyData.nodes.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <Sankey
                data={sankeyData}
                node={<JourneyNode />}
                link={{ stroke: 'var(--accent-secondary)', strokeOpacity: 0.25 }}
                nodePadding={24}
                nodeWidth={12}
                margin={{ top: 10, right: 120, bottom: 10, left: 120 }}
              >
                <Tooltip
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
              </Sankey>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
      {journey?.meta && (
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
          {journey.meta.totalLeads.toLocaleString()} leads in this range · {journey.meta.convertedLeads.toLocaleString()} converted
          {journey.meta.totalRevenue > 0 ? ` · ${journey.meta.totalRevenueFormatted} in invoiced revenue` : ''}.
          Nodes and flows above reflect exactly these leads — nothing is pre-set.
        </Text>
      )}

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