import React, { useState, useEffect } from 'react';
import { Typography, Select, Button, Row, Col, Table, Tag, Skeleton, message, Drawer, Form, InputNumber } from 'antd';
import { motion } from 'framer-motion';
import { getDashboardData, getTableData, getIndustries, syncData } from '../../api/benchmarkApi';
import { useGetCompaniesDropdownQuery } from '../../api/companyApi';
import { useAuth } from '../../contexts/AuthContext';
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import api from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const Benchmarks = () => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [industries, setIndustries] = useState(['All Industries']);
  const [selectedIndustry, setSelectedIndustry] = useState('All Industries');
  const [selectedClient, setSelectedClient] = useState('all');
  const { user } = useAuth();
  const [adminClients, setAdminClients] = useState([]);

  const { data: companiesData, isLoading: isLoadingCompanies } = useGetCompaniesDropdownQuery({});
  
  useEffect(() => {
    const fetchAdminClients = async () => {
      if (['commander_admin', 'supreme_super_admin'].includes(user?.role)) {
        try {
          const [agenciesRes, brandsRes] = await Promise.all([
            api.get('/agencies'),
            api.get('/brands') // returns direct brands for admin
          ]);
          const agencies = (agenciesRes.data.data || []).map(a => ({ ...a, clientType: 'Agency' }));
          const brands = (brandsRes.data.data || []).map(b => ({ ...b, clientType: 'Direct Brand' }));
          setAdminClients([...agencies, ...brands]);
        } catch (error) {
          console.error("Failed to fetch admin clients", error);
        }
      }
    };
    fetchAdminClients();
  }, [user]);

  const clients = ['commander_admin', 'supreme_super_admin'].includes(user?.role) ? adminClients : (companiesData?.data?.companies || companiesData?.data || []);

  // Helper to map 0-100 score to radar chart coordinates
  const getRadarPoint = (score, angleDeg) => {
    // Max radius is 100
    const radius = Math.max(10, Math.min(100, score)); 
    const angleRad = (angleDeg - 90) * (Math.PI / 180);
    return `${radius * Math.cos(angleRad)},${radius * Math.sin(angleRad)}`;
  };

  const getIndustryPolygon = () => {
    if (!dashboardData?.industryData) return "0,-68 50,-28 65,30 0,68 -55,35 -50,-35";
    const d = dashboardData.industryData;
    return [
      getRadarPoint(d.avgSeo || 0, 0),
      getRadarPoint(d.avgSocial || 0, 60),
      getRadarPoint(d.avgAds || 0, 120),
      getRadarPoint(d.avgLeads || 0, 180),
      getRadarPoint(d.avgContent || 0, 240),
      getRadarPoint(d.avgCx || 0, 300),
    ].join(' ');
  };

  const getClientPolygon = () => {
    if (!dashboardData?.clientData?.metrics) return "";
    const m = dashboardData.clientData.metrics;
    return [
      getRadarPoint(m.seo || 0, 0),
      getRadarPoint(m.social || 0, 60),
      getRadarPoint(m.ads || 0, 120),
      getRadarPoint(m.leads || 0, 180),
      getRadarPoint(m.content || 0, 240),
      getRadarPoint(m.cx || 0, 300),
    ].join(' ');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const ReticleFrame = ({ children, style, bodyStyle }) => {
    const nodeStyle = {
      position: 'absolute',
      width: 6,
      height: 6,
      background: 'var(--text-tertiary)',
      zIndex: 2
    };
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
        <div style={{ ...nodeStyle, top: -3, left: -3 }} />
        <div style={{ ...nodeStyle, top: -3, right: -3 }} />
        <div style={{ ...nodeStyle, bottom: -3, left: -3 }} />
        <div style={{ ...nodeStyle, bottom: -3, right: -3 }} />
        <div style={{ 
          background: 'var(--bg-secondary)', 
          border: '1px solid var(--border-color)', 
          padding: '32px 40px',
          height: '100%',
          ...bodyStyle 
        }}>
          {children}
        </div>
      </div>
    );
  };

  useEffect(() => {
    fetchIndustries();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedIndustry, selectedClient]);

  const fetchIndustries = async () => {
    try {
      const res = await getIndustries();
      if (res.status === 'success') {
        setIndustries(['All Industries', ...res.data]);
      }
    } catch (error) {
      console.error('Failed to fetch industries', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, tableRes] = await Promise.all([
        getDashboardData(selectedClient, selectedIndustry),
        getTableData(selectedIndustry)
      ]);
      if (dashRes.status === 'success') setDashboardData(dashRes.data);
      if (tableRes.status === 'success') setTableData(tableRes.data);
    } catch (error) {
      message.error('Failed to load benchmark data');
    } finally {
      setLoading(false);
    }
  };


  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await syncData();
      if (res.status === 'success') {
        message.success(res.message || 'Benchmarks synced successfully');
        fetchData();
      } else {
        message.error('Failed to sync benchmarks');
      }
    } catch (error) {
      console.error(error);
      message.error('Error syncing benchmarks');
    } finally {
      setSyncing(false);
    }
  };

  const columns = [
    { title: 'Client', dataIndex: 'client', key: 'client', render: (text) => <Text style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{text}</Text> },
    { title: 'Industry', dataIndex: 'industry', key: 'industry', render: (text) => <Text type="secondary">{text}</Text> },
    { title: 'MOS Score', dataIndex: 'mos', key: 'mos', align: 'center', render: (text) => <Text style={{ fontWeight: 800, fontSize: 15 }}>{text}</Text> },
    { title: 'Industry Avg', dataIndex: 'avg', key: 'avg', align: 'center', render: (text) => <Text type="secondary" style={{ fontWeight: 600 }}>{text}</Text> },
    { 
      title: 'Difference', dataIndex: 'diff', key: 'diff', align: 'center',
      render: (val) => {
        const color = val > 0 ? 'var(--accent-primary)' : val < 0 ? 'var(--accent-danger)' : 'var(--accent-warning)';
        const Icon = val > 0 ? TrendingUp : val < 0 ? TrendingDown : Minus;
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color, fontWeight: 800 }}>
            <Icon size={14} /> {val > 0 ? `+${val}` : val}
          </div>
        );
      }
    },
    { title: 'SEO rank', dataIndex: 'seo', key: 'seo', align: 'center', render: (text) => <Text type="secondary">{text}</Text> },
    { title: 'Ads rank', dataIndex: 'ads', key: 'ads', align: 'center', render: (text) => <Text type="secondary">{text}</Text> },
    { title: 'Social rank', dataIndex: 'social', key: 'social', align: 'center', render: (text) => <Text type="secondary">{text}</Text> },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ paddingBottom: 64 }}>
      
      {/* Header */}
      <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, flexWrap: 'wrap', gap: 24 }}>
        <div>
          <Title level={2} style={{ margin: '0 0 8px 0', fontWeight: 800 }}>Benchmarking Engine</Title>
          <Text type="secondary" style={{ fontSize: 15, fontWeight: 500 }}>See how your clients perform vs industry standards and competitors.</Text>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <Select 
            value={selectedClient} 
            onChange={setSelectedClient} 
            style={{ width: 220, height: 40 }} 
            className="custom-select"
            loading={isLoadingCompanies}
          >
            <Option value="all">All Clients</Option>
            {clients.map(c => (
              <Option key={c._id} value={c._id}>
                {c.clientType ? `${c.clientType}: ${c.companyName || c.name}` : `${c.companyName || c.name}`}
              </Option>
            ))}
          </Select>

          <Button 
            icon={<RefreshCw size={16} />} 
            onClick={handleSync} 
            loading={syncing}
            style={{ borderRadius: 8, height: 40, fontWeight: 600, borderColor: 'var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-secondary)' }}
          >
            Sync Data
          </Button>
        </div>
      </motion.div>

      {/* Radar and Percentiles */}
      <motion.div variants={itemVariants}>
        <Row gutter={[32, 32]} style={{ marginBottom: 48 }}>
          <Col xs={24} lg={12}>
            <ReticleFrame>
              <Title level={4} style={{ margin: '0 0 4px 0', fontWeight: 800 }}>Industry Comparison</Title>
              <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 40 }}>
                {dashboardData?.clientData?.clientId?.companyName || 'Select a client'} vs {dashboardData?.industryData?.industryName || 'Industry'} average
              </Text>
              
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', height: 320 }}>
                {/* SVG Radar Chart */}
                <svg viewBox="0 0 300 300" style={{ width: '100%', height: '100%', maxWidth: 360 }}>
                  <g transform="translate(150, 150)">
                    {/* Background Grid */}
                    <polygon points="0,-100 86.6,-50 86.6,50 0,100 -86.6,50 -86.6,-50" fill="var(--bg-tertiary)" stroke="var(--border-color)" strokeWidth="1" />
                    <polygon points="0,-75 64.95,-37.5 64.95,37.5 0,75 -64.95,37.5 -64.95,-37.5" fill="none" stroke="var(--border-color)" strokeWidth="1" />
                    <polygon points="0,-50 43.3,-25 43.3,25 0,50 -43.3,25 -43.3,-25" fill="none" stroke="var(--border-color)" strokeWidth="1" />
                    <polygon points="0,-25 21.65,-12.5 21.65,12.5 0,25 -21.65,12.5 -21.65,-12.5" fill="none" stroke="var(--border-color)" strokeWidth="1" />
                    
                    {/* Axes */}
                    <line x1="0" y1="0" x2="0" y2="-100" stroke="var(--border-color)" />
                    <line x1="0" y1="0" x2="86.6" y2="-50" stroke="var(--border-color)" />
                    <line x1="0" y1="0" x2="86.6" y2="50" stroke="var(--border-color)" />
                    <line x1="0" y1="0" x2="0" y2="100" stroke="var(--border-color)" />
                    <line x1="0" y1="0" x2="-86.6" y2="50" stroke="var(--border-color)" />
                    <line x1="0" y1="0" x2="-86.6" y2="-50" stroke="var(--border-color)" />

                    {/* Labels */}
                    <text x="0" y="-115" textAnchor="middle" fill="var(--text-secondary)" fontSize="11" fontWeight="700">SEO</text>
                    <text x="100" y="-55" textAnchor="middle" fill="var(--text-secondary)" fontSize="11" fontWeight="700">Social</text>
                    <text x="100" y="60" textAnchor="middle" fill="var(--text-secondary)" fontSize="11" fontWeight="700">Ads</text>
                    <text x="0" y="120" textAnchor="middle" fill="var(--text-secondary)" fontSize="11" fontWeight="700">Leads</text>
                    <text x="-100" y="60" textAnchor="middle" fill="var(--text-secondary)" fontSize="11" fontWeight="700">Content</text>
                    <text x="-100" y="-55" textAnchor="middle" fill="var(--text-secondary)" fontSize="11" fontWeight="700">CX</text>

                    {/* Industry Avg Polygon (Dark) */}
                    <polygon points={getIndustryPolygon()} fill="var(--text-primary)" fillOpacity="0.8" stroke="var(--text-primary)" strokeWidth="2" />
                    
                    {/* Client Polygon (Cyan/Primary) */}
                    <polygon points={getClientPolygon()} fill="var(--accent-primary)" fillOpacity="0.4" stroke="var(--accent-primary)" strokeWidth="3" />
                  </g>
                </svg>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 12, height: 12, background: 'var(--text-primary)' }} />
                  <Text style={{ fontSize: 12, fontWeight: 700 }}>Industry Avg</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 12, height: 12, background: 'var(--accent-primary)', opacity: 0.8 }} />
                  <Text style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-primary)' }}>{dashboardData?.clientData?.clientId?.companyName || 'Select a client'}</Text>
                </div>
              </div>
            </ReticleFrame>
          </Col>

          <Col xs={24} lg={12}>
            <ReticleFrame>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                <div>
                  <Title level={4} style={{ margin: '0 0 4px 0', fontWeight: 800 }}>Percentile Rankings</Title>
                  <Text type="secondary" style={{ fontSize: 14 }}>
                    {dashboardData?.clientData?.clientId?.companyName || 'Client'} — where they stand in their industry
                  </Text>
                </div>
                <Tag style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-primary)', border: 'none', padding: '6px 12px', fontWeight: 800 }}>
                  {dashboardData?.clientData?.percentiles?.mos || 0}th percentile overall
                </Tag>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                {loading ? <Skeleton active /> : (
                  [
                    { label: 'SEO Performance', value: dashboardData?.clientData?.percentiles?.seo || 0, suffix: `Top ${100 - (dashboardData?.clientData?.percentiles?.seo || 0)}%` },
                    { label: 'Social Media', value: dashboardData?.clientData?.percentiles?.social || 0, suffix: `Top ${100 - (dashboardData?.clientData?.percentiles?.social || 0)}%` },
                    { label: 'Paid Advertising', value: dashboardData?.clientData?.percentiles?.ads || 0, suffix: `Top ${100 - (dashboardData?.clientData?.percentiles?.ads || 0)}%` },
                    { label: 'Lead Generation', value: dashboardData?.clientData?.percentiles?.leads || 0, suffix: `Top ${100 - (dashboardData?.clientData?.percentiles?.leads || 0)}%` },
                    { label: 'Content Marketing', value: dashboardData?.clientData?.percentiles?.content || 0, suffix: `Top ${100 - (dashboardData?.clientData?.percentiles?.content || 0)}%` },
                    { label: 'Overall MOS', value: dashboardData?.clientData?.percentiles?.mos || 0, suffix: `Top ${100 - (dashboardData?.clientData?.percentiles?.mos || 0)}%` },
                  ].map((p, idx) => (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{p.label}</Text>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>{p.value}th</span>
                          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>· {p.suffix}</span>
                        </div>
                      </div>
                      <div style={{ width: '100%', height: 6, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${p.value}%` }} 
                          transition={{ duration: 1, delay: idx * 0.1 }}
                          style={{ height: '100%', background: 'var(--accent-primary)' }} 
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ReticleFrame>
          </Col>
        </Row>
      </motion.div>

      {/* AI Recommendations */}
      <motion.div variants={itemVariants} style={{ marginBottom: 48 }}>
        <ReticleFrame>
          <div style={{ marginBottom: 24 }}>
            <Title level={4} style={{ margin: '0 0 4px 0', fontWeight: 800 }}>AI Recommendations & Insights</Title>
            <Text type="secondary" style={{ fontSize: 14 }}>Actionable strategies to improve current performance metrics.</Text>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(!dashboardData?.clientData?.percentiles) ? (
              <Text type="secondary">Select a client to view AI recommendations based on their percentile rankings.</Text>
            ) : (
              <>
                {(dashboardData.clientData.percentiles.seo || 0) < 50 && (
                  <div style={{ padding: 16, background: 'rgba(239, 68, 68, 0.05)', borderLeft: '4px solid #ef4444', borderRadius: 4 }}>
                    <Text strong style={{ color: '#ef4444', display: 'block', marginBottom: 4 }}>Improve SEO Performance</Text>
                    <Text>SEO ranking is below the industry average. We strongly recommend implementing an advanced SEO package, including technical audits, on-page optimization, and high-quality backlink generation to boost organic visibility.</Text>
                  </div>
                )}
                {(dashboardData.clientData.percentiles.social || 0) < 50 && (
                  <div style={{ padding: 16, background: 'rgba(245, 158, 11, 0.05)', borderLeft: '4px solid #f59e0b', borderRadius: 4 }}>
                    <Text strong style={{ color: '#f59e0b', display: 'block', marginBottom: 4 }}>Enhance Social Media Presence</Text>
                    <Text>Social Media presence is lagging. A targeted content calendar with engaging video content and active community management is needed to increase brand awareness.</Text>
                  </div>
                )}
                {(dashboardData.clientData.percentiles.ads || 0) < 50 && (
                  <div style={{ padding: 16, background: 'rgba(239, 68, 68, 0.05)', borderLeft: '4px solid #ef4444', borderRadius: 4 }}>
                    <Text strong style={{ color: '#ef4444', display: 'block', marginBottom: 4 }}>Optimize Paid Advertising</Text>
                    <Text>Paid Advertising efficiency is sub-optimal. We suggest restructuring the ad accounts, utilizing A/B testing on creatives, and refining audience targeting to improve ROAS.</Text>
                  </div>
                )}
                {(dashboardData.clientData.percentiles.leads || 0) < 50 && (
                  <div style={{ padding: 16, background: 'rgba(245, 158, 11, 0.05)', borderLeft: '4px solid #f59e0b', borderRadius: 4 }}>
                    <Text strong style={{ color: '#f59e0b', display: 'block', marginBottom: 4 }}>Boost Lead Generation</Text>
                    <Text>Lead Generation is underperforming. Implementing high-converting landing pages, lead magnets, and automated email nurturing sequences will help capture and convert more prospects.</Text>
                  </div>
                )}
                {(dashboardData.clientData.percentiles.content || 0) < 50 && (
                  <div style={{ padding: 16, background: 'rgba(59, 130, 246, 0.05)', borderLeft: '4px solid var(--accent-primary)', borderRadius: 4 }}>
                    <Text strong style={{ color: 'var(--accent-primary)', display: 'block', marginBottom: 4 }}>Expand Content Marketing</Text>
                    <Text>Content Marketing efforts need enhancement. Publishing authoritative, long-form content and distributing it across multiple channels will establish thought leadership and drive inbound traffic.</Text>
                  </div>
                )}
                {Object.values(dashboardData.clientData.percentiles).every(v => v >= 50) && (
                  <div style={{ padding: 16, background: 'rgba(16, 185, 129, 0.05)', borderLeft: '4px solid #10b981', borderRadius: 4 }}>
                    <Text strong style={{ color: '#10b981', display: 'block', marginBottom: 4 }}>Excellent Overall Performance</Text>
                    <Text>The client is performing above average across all major metrics. Maintain the current retainer strategy and explore new innovative campaigns to push beyond the 90th percentile.</Text>
                  </div>
                )}
              </>
            )}
          </div>
        </ReticleFrame>
      </motion.div>

      {/* Massive Matrix Table */}
      <motion.div variants={itemVariants} style={{ marginBottom: 48 }}>
        <ReticleFrame bodyStyle={{ padding: 0 }}>
          <div style={{ padding: '32px 40px', borderBottom: '1px solid var(--border-color)' }}>
            <Title level={4} style={{ margin: '0 0 4px 0', fontWeight: 800 }}>All Clients vs Industry Benchmark</Title>
            <Text type="secondary" style={{ fontSize: 14 }}>MOS scores compared with the average for each industry</Text>
          </div>
          <Table 
            dataSource={tableData} 
            columns={columns} 
            pagination={false} 
            rowClassName="hover-bg"
            style={{ padding: '0 16px 16px 16px' }}
            loading={loading}
            rowKey="id"
          />
        </ReticleFrame>
      </motion.div>




    </motion.div>
  );
};

export default Benchmarks;
