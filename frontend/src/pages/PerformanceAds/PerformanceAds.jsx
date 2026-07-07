import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Button, Select, Table, Tag, Progress, Spin, message, Modal, Form, Input } from 'antd';
import { ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, PieChart, Pie, Cell, BarChart as RechartsBarChart } from 'recharts';
import { motion } from 'framer-motion';
import { RefreshCw, Plus, ExternalLink, IndianRupee, Target, Users, Megaphone, Activity } from 'lucide-react';
import { performanceAdsApi } from '../../api/performanceAdsApi';
import { useGetClientsQuery } from '../../api/clientApi';

const { Title, Text } = Typography;
const { Option } = Select;

const PerformanceAds = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [form] = Form.useForm();

  // Fetch clients dynamically
  const { data: clientsData, isLoading: isLoadingClients } = useGetClientsQuery({});
  const clients = clientsData?.data || [];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (clients.length > 0 && !selectedClient) {
      setSelectedClient(clients[0]._id);
    }
  }, [clients, selectedClient]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await performanceAdsApi.getDashboardData();
      if (res.success) {
        setData(res.data);
      }
    } catch (error) {
      console.error('Error fetching performance ads data:', error);
      message.error('Failed to load performance ads data');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await performanceAdsApi.syncData();
      if (res.success) {
        setData(res.data);
        message.success('Performance data synchronized successfully!');
      }
    } catch (error) {
      console.error('Error syncing performance data:', error);
      message.error('Failed to sync performance data');
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateCampaign = async (values) => {
    try {
      setIsCreatingCampaign(true);
      const res = await performanceAdsApi.addCampaign(values);
      if (res.success) {
        setData(res.data);
        message.success('Campaign created successfully!');
        setIsCampaignModalOpen(false);
        form.resetFields();
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      message.error('Failed to create campaign');
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  if (loading || !data) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  const campaignCols = [
    { title: 'CAMPAIGN', dataIndex: 'campaign', key: 'campaign', render: text => <strong style={{ color: 'var(--text-primary)' }}>{text}</strong> },
    {
      title: 'PLATFORM',
      dataIndex: 'platform',
      key: 'platform',
      render: text => {
        let color = text === 'Meta' ? 'var(--accent-info)' : text === 'Google' ? 'var(--accent-primary)' : 'var(--accent-danger)';
        return <Tag style={{ color, borderColor: color, background: 'transparent', borderRadius: 12, fontWeight: 600 }}>{text}</Tag>;
      }
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      render: text => {
        const isActive = text === 'Active';
        return <Tag style={{ borderRadius: 12, background: isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: isActive ? 'var(--accent-primary)' : 'var(--accent-warning)', border: 'none', fontWeight: 600 }}>{text}</Tag>
      }
    },
    { title: 'BUDGET', dataIndex: 'budget', key: 'budget', render: text => <span style={{ color: 'var(--text-secondary)' }}>{text}</span> },
    {
      title: 'SPEND',
      dataIndex: 'spend',
      key: 'spend',
      render: (text, record) => (
        <div style={{ minWidth: 100 }}>
          <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{text}</strong>
          <Progress percent={record.progress} showInfo={false} size="small" strokeColor={record.progress > 85 ? 'var(--accent-danger)' : 'var(--accent-secondary)'} trailColor="var(--border-color)" />
        </div>
      )
    },
    { title: 'LEADS', dataIndex: 'leads', key: 'leads', render: text => <strong style={{ color: 'var(--text-primary)' }}>{text}</strong> },
    { title: 'CPL', dataIndex: 'cpl', key: 'cpl', render: text => <span style={{ color: 'var(--text-secondary)' }}>{text}</span> },
    { title: 'ROAS', dataIndex: 'roas', key: 'roas', render: text => <span style={{ color: text.includes('x') ? 'var(--accent-primary)' : 'var(--text-tertiary)', fontWeight: text.includes('x') ? 700 : 400 }}>{text}</span> },
    { title: 'CTR', dataIndex: 'ctr', key: 'ctr', render: text => <span style={{ color: 'var(--text-secondary)' }}>{text}</span> },
    { title: 'ACTIONS', key: 'actions', render: () => <Button type="link" style={{ color: 'var(--accent-secondary)', padding: 0, fontWeight: 600 }}>View</Button> }
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>

          <Title level={2} style={{ margin: '4px 0 0 0', fontWeight: 800 }}>Performance Ads</Title>
          <Text type="secondary">Paid media across Meta, Google & YouTube — unified attribution.</Text>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-secondary)', padding: '6px 16px', borderRadius: 12, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>Client:</Text>
            <Select
              value={selectedClient}
              onChange={setSelectedClient}
              bordered={false}
              style={{ width: 180, fontWeight: 600 }}
              dropdownStyle={{ borderRadius: 12, padding: 8 }}
              loading={isLoadingClients}
            >
              {clients.map(client => (
                <Select.Option key={client._id} value={client._id}>{client.name}</Select.Option>
              ))}
            </Select>
          </div>
          <Button loading={syncing} onClick={handleSync} icon={<RefreshCw size={16} />} style={{ borderRadius: 10, borderColor: 'var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-secondary)', height: 40, fontWeight: 500, boxShadow: 'var(--shadow-sm)' }}>
            Sync data <Text type="secondary" style={{ fontSize: 11, marginLeft: 8, opacity: 0.7 }}>just now</Text>
          </Button>
          <Button onClick={() => setIsCampaignModalOpen(true)} type="primary" icon={<Plus size={16} />} style={{ height: 40, borderRadius: 10, fontWeight: 600, padding: '0 20px', boxShadow: 'var(--shadow-md)' }}>
            New campaign
          </Button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 24 }}>
          <Tag style={{ borderRadius: 4, background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-primary)', border: 'none', fontWeight: 700, padding: '2px 8px' }}>PE</Tag>
          <Text type="secondary" style={{ fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', cursor: 'pointer' }} className="hover-link">Viewing {clients.find(c => c._id === selectedClient)?.name || 'Client'} <ExternalLink size={14} style={{ marginLeft: 6, color: 'var(--text-tertiary)' }} /></Text>
        </div>
      </motion.div>

      {/* NEW TWO-TONE SOLID HEADER CARDS */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { label: 'AD SPEND (MTD)', val: `₹${(data.metrics?.adSpendMTD / 100000).toFixed(2)}L`, isProgress: true, pct: data.metrics?.adSpendPercentage || 0, color: 'var(--accent-secondary)', icon: <IndianRupee size={16} /> },
          { label: 'TOTAL LEADS', val: data.metrics?.totalLeads || 0, sub: data.metrics?.leadsChange || '0%', subColor: 'var(--accent-primary)', desc: 'Across all platforms', color: 'var(--accent-primary)', icon: <Users size={16} /> },
          { label: 'COST PER LEAD', val: `₹${data.metrics?.costPerLead || 0}`, subColor: 'var(--accent-danger)', desc: 'Target ₹5,500', color: 'var(--accent-danger)', icon: <Target size={16} /> },
          { label: 'ROAS', val: `${data.metrics?.roas || 0}x`, sub: data.metrics?.roasChange || '0', subColor: 'var(--accent-primary)', desc: 'Target 3.5x', color: 'var(--accent-warning)', icon: <Activity size={16} /> },
          { label: 'IMPRESSIONS', val: `${((data.metrics?.impressions || 0) / 1000000).toFixed(1)}M`, sub: data.metrics?.impressionsChange || '0%', subColor: 'var(--accent-primary)', desc: 'Last 30 days', color: 'var(--accent-info)', icon: <Megaphone size={16} /> },
        ].map((kpi, i) => (
          <Col style={{ flex: '1 1 200px', minWidth: 200 }} key={i}>
            <motion.div variants={itemVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }} style={{ height: '100%' }}>
              <Card
                bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}
                style={{
                  borderRadius: 16,
                  height: '100%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                  overflow: 'hidden'
                }}
              >
                {/* Solid Header Portion */}
                <div style={{ background: kpi.color, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: 'var(--bg-primary)', textTransform: 'uppercase' }}>{kpi.label}</Text>
                  <div style={{ color: 'var(--bg-primary)', opacity: 0.9 }}>{kpi.icon}</div>
                </div>

                {/* Data Portion */}
                <div style={{ padding: '20px 20px 24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                    <Title level={2} style={{ margin: 0, color: 'var(--text-primary)', fontSize: 36, fontWeight: 800 }}>{kpi.val}</Title>
                    <Text style={{ fontSize: 13, fontWeight: 600, color: kpi.subColor || 'var(--text-secondary)' }}>{kpi.sub}</Text>
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: 16 }}>
                    {kpi.isProgress ? (
                      <div>
                        <Progress percent={kpi.pct} showInfo={false} size="small" strokeColor={kpi.color} trailColor="var(--border-color)" />
                        <Text type="secondary" style={{ fontSize: 12, fontWeight: 500, marginTop: 4, display: 'block' }}>{kpi.pct}% used</Text>
                      </div>
                    ) : (
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', fontWeight: 500 }}>{kpi.desc}</Text>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>

      <motion.div variants={itemVariants}>
        <Card
          title={<div style={{ paddingTop: 8 }}><Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Active campaigns</Title></div>}
          extra={<Button style={{ borderRadius: 8, borderColor: 'var(--border-color)', color: 'var(--text-primary)', fontWeight: 500 }}>All campaigns</Button>}
          className="glassmorphism" style={{ borderRadius: 16, marginBottom: 24, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: 0 }}
        >
          <Table columns={campaignCols} dataSource={data.activeCampaigns || []} pagination={false} rowKey="id" size="middle" scroll={{ x: 1000 }} rowClassName={() => 'hover-bg'} />
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card
          title={<div style={{ paddingTop: 8 }}><Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Daily performance</Title><Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Last 30 days - leads, spend & ROAS</Text></div>}
          className="glassmorphism" style={{ borderRadius: 16, marginBottom: 24, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: '24px 24px 12px' }}
        >
          <div style={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.dailyPerformance || []} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="day" stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} dy={10} />
                <YAxis yAxisId="left" stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} dx={-10} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} dx={10} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, boxShadow: 'var(--shadow-md)', fontWeight: 600 }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 20 }} />
                <Area yAxisId="left" type="monotone" dataKey="leads" fill="var(--accent-primary)" fillOpacity={0.15} stroke="var(--accent-primary)" strokeWidth={2} name="Leads" />
                <Line yAxisId="right" type="monotone" dataKey="spend" stroke="var(--accent-info)" strokeWidth={3} dot={false} name="Spend" activeDot={{ r: 6, strokeWidth: 0 }} />
                <Line yAxisId="left" type="monotone" dataKey="roas" stroke="var(--accent-danger)" strokeWidth={3} dot={false} name="ROAS" activeDot={{ r: 6, strokeWidth: 0 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <motion.div variants={itemVariants} style={{ height: '100%' }}>
            <Card
              title={<div style={{ paddingTop: 8 }}><Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Spend by platform</Title><Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Distribution this month</Text></div>}
              className="glassmorphism" style={{ borderRadius: 16, height: '100%', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: 24 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', height: 280, flexWrap: 'wrap' }}>
                <ResponsiveContainer width="50%" height="100%" minWidth={200}>
                  <PieChart>
                    <Pie data={data.spendByPlatform || []} innerRadius={70} outerRadius={100} paddingAngle={6} dataKey="value" stroke="none">
                      {(data.spendByPlatform || []).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, boxShadow: 'var(--shadow-md)', fontWeight: 600 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, minWidth: 200 }}>
                  {(data.spendByPlatform || []).map((entry) => (
                    <div key={entry.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, color: 'var(--text-primary)' }}><div style={{ width: 12, height: 12, borderRadius: '50%', background: entry.fill }} /> {entry.name}</span>
                      <Text type="secondary" style={{ fontWeight: 500 }}>{entry.formattedValue}</Text>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        </Col>

        <Col xs={24} lg={12}>
          <motion.div variants={itemVariants} style={{ height: '100%' }}>
            <Card
              title={<div style={{ paddingTop: 8 }}><Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>CPL by platform</Title><Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Target ₹5,500</Text></div>}
              className="glassmorphism" style={{ borderRadius: 16, height: '100%', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} bodyStyle={{ padding: 24 }}
            >
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={data.cplByPlatform || []} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="name" stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} dy={10} />
                    <YAxis stroke="var(--text-tertiary)" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} dx={-10} />
                    <Tooltip cursor={{ fill: 'var(--bg-tertiary)', opacity: 0.5 }} contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, boxShadow: 'var(--shadow-md)', fontWeight: 600 }} />
                    <Bar dataKey="cpl" radius={[6, 6, 0, 0]} maxBarSize={70}>
                      {(data.cplByPlatform || []).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
              <Text style={{ fontSize: 13, display: 'block', textAlign: 'center', color: 'var(--accent-secondary)', fontWeight: 600, marginTop: 16 }}>Meta is most efficient</Text>
            </Card>
          </motion.div>
        </Col>
      </Row>

      <Modal
        title="Create New Campaign"
        open={isCampaignModalOpen}
        onCancel={() => setIsCampaignModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={isCreatingCampaign}
        okText="Create Campaign"
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateCampaign} style={{ marginTop: 24 }}>
          <Form.Item name="campaign" label="Campaign Name" rules={[{ required: true, message: 'Please enter a campaign name' }]}>
            <Input placeholder="e.g. Lead Gen — Bangalore" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="platform" label="Platform" rules={[{ required: true, message: 'Required' }]}>
                <Select placeholder="Select Platform">
                  <Select.Option value="Meta">Meta</Select.Option>
                  <Select.Option value="Google">Google</Select.Option>
                  <Select.Option value="YouTube">YouTube</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Required' }]} initialValue="Active">
                <Select>
                  <Select.Option value="Active">Active</Select.Option>
                  <Select.Option value="Paused">Paused</Select.Option>
                  <Select.Option value="Completed">Completed</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="budget" label="Budget" rules={[{ required: true, message: 'Please enter a budget' }]}>
            <Input placeholder="e.g. ₹5.00L" />
          </Form.Item>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default PerformanceAds;
