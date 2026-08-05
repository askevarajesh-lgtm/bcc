import React from 'react';
import { Typography, Card, Table, Alert } from 'antd';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const { Title, Text } = Typography;

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

const breakdownCols = [
  { title: 'Channel', dataIndex: 'channel', key: 'channel', render: t => <strong style={{ color: 'var(--text-primary)' }}>{t}</strong> },
  { title: 'Sessions', dataIndex: 'sessions', key: 'sessions', align: 'right', render: t => <Text style={{ fontWeight: 500 }}>{Number(t).toLocaleString()}</Text> },
  { title: 'Leads', dataIndex: 'leads', key: 'leads', align: 'right', render: t => <strong style={{ color: 'var(--text-primary)' }}>{Number(t).toLocaleString()}</strong> },
  { title: 'Session → Lead Rate', dataIndex: 'conversionRate', key: 'conversionRate', align: 'right', render: t => <Text style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{t}</Text> },
];

const AttributionTab = ({ data }) => {
  if (!data) return null;
  const breakdownData = data.channelBreakdown || [];
  const chartData = breakdownData.map(c => ({ channel: c.channel, sessions: c.sessions, leads: c.leads }));

  return (
    <>
      <motion.div variants={itemVariants} style={{ marginBottom: 24 }}>
        <Card className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: 24 }}>
          <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><Activity size={14} /> ATTRIBUTION MODEL</Text>
          <Title level={4} style={{ margin: '0 0 8px 0', fontWeight: 800, color: 'var(--text-primary)' }}>Channel-Level (Last Touch)</Title>
          <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
            Each channel's sessions come from Google Analytics 4, and its leads come from the CRM's recorded lead source — grouped onto the same channel taxonomy. This reflects
            last-touch volume per channel, not a multi-touch or cross-session customer journey. Full multi-touch attribution would require session-level touchpoint tracking
            that isn't collected yet.
          </Text>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} style={{ marginBottom: 32 }}>
        <Card
          title={<div style={{ paddingTop: 8 }}><Title level={5} style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Sessions vs Leads by Channel</Title><Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Selected date range</Text></div>}
          className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: 24 }}
        >
          <div style={{ height: 320 }}>
            {chartData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Text type="secondary">No channel data for this range yet.</Text></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="channel" stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} dy={10} />
                  <YAxis stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} dx={-10} />
                  <Tooltip cursor={{ fill: 'var(--bg-tertiary)' }} contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: 20, fontSize: 13, fontWeight: 500 }} />
                  <Bar dataKey="sessions" name="Sessions" fill="var(--accent-info)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="leads" name="Leads" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} style={{ marginBottom: 32 }}>
        <Card
          title={<div style={{ paddingTop: 8 }}><Title level={5} style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Channel Attribution Breakdown</Title><Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Sessions and leads per channel, selected date range</Text></div>}
          className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: 0 }}
        >
          <Table
            columns={breakdownCols}
            dataSource={breakdownData}
            pagination={false}
            size="middle"
            rowKey="channel"
            rowClassName={() => 'hover-bg'}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: 'No channel data for this range yet.' }}
          />
        </Card>
      </motion.div>

      <Alert
        type="info"
        showIcon
        style={{ borderRadius: 12 }}
        message="Multi-touch customer journey mapping isn't available yet"
        description="Sequenced, cross-session conversion paths (e.g. Organic → Blog → Form Submit) require session-level touchpoint tracking that this workspace doesn't currently collect. Showing a fabricated journey here would be misleading, so this view is limited to the real, channel-level data above."
      />
    </>
  );
};

export default AttributionTab;