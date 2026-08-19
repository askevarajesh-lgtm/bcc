import React, { useState, useEffect } from 'react';
import { Typography, Table, Tag, Tooltip, Progress, Space, Button, message } from 'antd';
import { semrushApi } from '../../../api/semrushApi';
import { InfoCircleOutlined, InfoOutlined, ReloadOutlined } from '@ant-design/icons';
import { ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, BarChart, Bar } from 'recharts';
import { useOutletContext, useNavigate } from 'react-router-dom';
import './DomainOverview.css'; 

const { Title, Text } = Typography;

const DomainOverviewTab = () => {
  const { project, projectData, fetchProjectData } = useOutletContext();
  const navigate = useNavigate();
  const domain = project?.domain || 'unknown.com';
  
  const [localData, setLocalData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const data = localData || projectData?.overview || {};
  const backlinksData = projectData?.backlinksOverview || {};

  const handleRefresh = async () => {
    if (!project?._id) return;
    setRefreshing(true);
    try {
      const res = await semrushApi.getDomainOverview(project._id, true);
      if (res.data.success && res.data.data) {
        const raw = res.data.data;
        // Map it the same way getProjectById does so localData matches projectData.overview
        setLocalData({
          'Organic Traffic': raw.organicTraffic?.value,
          'Organic Keywords': raw.organicKeywords?.value,
          Rank: raw.authorityScore?.value || data?.Rank, // Keep existing authority score if not in this response
          visibility_index: raw.semrushRank?.value,
          paidTraffic: raw.paidTraffic?.value,
          competitors: raw.competitors || [],
          trend: raw.trend || [],
          topKeywords: raw.topKeywords || [],
          positionDistribution: raw.positionDistribution || null,
          intentDistribution: raw.intentDistribution || [],
          organicKeywordsData: raw.organicKeywordsData || [],
          serpFeatures: raw.serpFeatures || null
        });
        message.success('Domain Overview updated successfully');
        if (fetchProjectData) fetchProjectData();
      } else {
        message.error(res.data.errorCode || 'Failed to refresh Domain Overview');
      }
    } catch (err) {
      message.error('An error occurred during refresh');
    } finally {
      setRefreshing(false);
    }
  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Number(num).toLocaleString();
  };

  const intentDistribution = data.intentDistribution || [];
  const serpFeatures = data.serpFeatures || {};
  const positionDistribution = data.positionDistribution || {};

  const serpPieData = [
    { name: 'Organic', value: serpFeatures.organic ?? null, color: '#5b61f4' },
    { name: 'AI Overviews', value: serpFeatures.aiOverviews ?? null, color: '#f772e3' },
    { name: 'Other SERP Features', value: serpFeatures.otherFeatures ?? null, color: '#38cb89' }
  ].filter(d => d.value !== null);

  const posDistData = Object.entries(positionDistribution).map(([key, val]) => ({
    name: key,
    value: val
  }));

  const competitorsScatterData = (data.competitors || []).map((c, i) => ({
    domain: c.domain,
    x: c.organicKeywords,
    y: c.organicTraffic,
    z: c.seKeywords || 1,
    color: ['#5b61f4', '#38cb89', '#b961f4', '#ffbc3b', '#ff6b6b'][i % 5]
  }));

  return (
    <div className="so-overview-container">
      {/* 1. SEO Top Cards Section (AI Search Removed for Real Data) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button 
          type="primary" 
          icon={<ReloadOutlined spin={refreshing} />} 
          onClick={handleRefresh} 
          loading={refreshing}
          style={{ borderRadius: 8, fontWeight: 600, background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>

      <div className="so-card">
        <div className="so-card-header" style={{ marginBottom: 12 }}>
          <div className="so-badge" style={{ background: '#e6f7ff', color: 'var(--accent-primary)', fontWeight: 600 }}>SEO</div>
        </div>
        <div className="so-seo-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          <div className="so-metric-block">
            <span className="so-metric-title">Authority Score <InfoCircleOutlined /></span>
            <span className="so-metric-value">{backlinksData?.score || data?.Rank || '-'}</span>
          </div>
          <div className="so-metric-block">
            <span className="so-metric-title">Organic Traffic <InfoCircleOutlined /></span>
            <span className="so-metric-value">{formatNumber(data?.['Organic Traffic'])}</span>
          </div>
          <div className="so-metric-block">
            <span className="so-metric-title">Paid Traffic <InfoCircleOutlined /></span>
            <span className="so-metric-value">0</span>
          </div>
          <div className="so-metric-block">
            <span className="so-metric-title">Organic Keywords <InfoCircleOutlined /></span>
            <span className="so-metric-value">{formatNumber(data?.['Organic Keywords'])}</span>
          </div>
          <div className="so-metric-block">
            <span className="so-metric-title">Ref. Domains <InfoCircleOutlined /></span>
            <span className="so-metric-value">{formatNumber(backlinksData?.domains_num)}</span>
          </div>
        </div>
      </div>

      {/* 2. Traffic Chart (Country Dist removed for real API constraints) */}
      <div className="so-card">
        <div className="so-card-header">
          <h3 className="so-card-title">Traffic</h3>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, fontWeight: 500, color: '#595959' }}>
              <span style={{ color: '#5b61f4' }}>1M</span>
              <span>6M</span>
              <span>1Y</span>
              <span style={{ borderBottom: '2px solid #5b61f4', color: '#2b2b2b' }}>2Y</span>
              <span>All time</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, marginBottom: 16, fontSize: 13, color: '#595959' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 14, height: 14, background: '#5b61f4', borderRadius: 4 }}></div> Organic Traffic</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 14, height: 14, background: '#38cb89', borderRadius: 4 }}></div> Paid Traffic</span>
        </div>
        <div style={{ height: 260 }}>
          {data?.trend && data.trend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8c8c8c' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8c8c8c' }} tickFormatter={formatNumber} />
                <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Area type="step" dataKey="traffic" stroke="#5b61f4" strokeWidth={2} fill="url(#colorTraffic)" fillOpacity={1} />
                <defs>
                  <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5b61f4" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#5b61f4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bfbfbf' }}>No trend data available</div>
          )}
        </div>
      </div>

      {/* 3. SERP Distribution */}
      <div className="so-card" style={{ paddingBottom: 0 }}>
        <h3 className="so-card-title" style={{ marginBottom: 24 }}>Google SERP Positions Distribution</h3>
        <div className="so-serp-features-grid">
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
             <ResponsiveContainer width={100} height={100}>
                <PieChart>
                  <Pie data={serpPieData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} dataKey="value" stroke="none">
                    {serpPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                </PieChart>
             </ResponsiveContainer>
             <div style={{ flex: 1 }}>
                {serpPieData.map(item => (
                  <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                     <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#595959' }}>
                       <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }}></div> {item.name}
                     </span>
                     <span style={{ fontWeight: 500, color: item.color }}>{item.value}%</span>
                  </div>
                ))}
             </div>
          </div>
          <div style={{ height: 120 }}>
            {data?.trend && data.trend.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trend} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" hide />
                  <YAxis hide />
                  <Area type="monotone" dataKey="traffic" stroke="#5b61f4" fill="none" strokeWidth={2} />
                  <Area type="monotone" dataKey="traffic" stroke="#ffbc3b" fill="none" strokeWidth={2} style={{ transform: 'translateY(-10px)' }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 4. Organic Research */}
      <Title level={4} style={{ marginTop: 16 }}>Organic Research</Title>
      <div className="so-organic-research-grid">
        <div className="so-card">
          <h3 className="so-card-title" style={{ marginBottom: 20 }}>Top Organic Keywords <span style={{ color: '#8c8c8c', fontWeight: 'normal', fontSize: 14 }}>{formatNumber(data?.['Organic Keywords'])}</span></h3>
          <Table 
            className="so-table-minimal"
            dataSource={data?.topKeywords?.slice(0, 5) || []}
            pagination={false}
            rowKey="keyword"
            columns={[
              { title: 'Keyword', dataIndex: 'keyword', render: (text) => <span style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>{text}</span> },
              { title: 'Intent', dataIndex: 'intents', render: (intents) => (
                <>{(intents || ['I']).map(i => <span key={i} className="so-intent-tag" style={{ background: i === 'I' ? 'var(--accent-primary)' : i === 'N' ? '#722ed1' : i === 'C' ? '#faad14' : '#52c41a' }}>{i}</span>)}</>
              ) },
              { title: 'Pos.', dataIndex: 'position' },
              { title: 'Volume', dataIndex: 'searchVolume', render: formatNumber },
              { title: 'CPC (USD)', dataIndex: 'cpc' },
              { title: 'Traffic %', dataIndex: 'trafficPercent' },
            ]}
          />
          <div style={{ marginTop: 24 }}><Tag color="default" style={{ padding: '4px 12px', background: '#2b2b2b', color: 'white', border: 'none', cursor: 'pointer' }} onClick={() => navigate(`/intelligence/semrush/${project?._id}/organic-keywords`)}>View details</Tag></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {intentDistribution.length > 0 && (
            <div className="so-card">
              <h3 className="so-card-title" style={{ marginBottom: 16 }}>Keywords by Intent</h3>
              <div className="so-intent-bar">
                {intentDistribution.map(item => (
                  <div key={item.intent} className="so-intent-segment" style={{ width: `${item.ratio}%`, background: item.color }}></div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8c8c8c', paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
                <span>Intent</span>
                <div style={{ display: 'flex', gap: 32 }}><span>Ratio</span></div>
              </div>
              {intentDistribution.map(item => (
                <div key={item.intent} className="so-intent-legend-item">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#595959', fontSize: 13 }}>
                    <div className="so-intent-dot" style={{ background: item.color }}></div> {item.intent}
                  </span>
                  <div style={{ display: 'flex', gap: 32, fontSize: 13 }}>
                    <span style={{ color: 'var(--accent-primary)', width: 40, textAlign: 'right' }}>{item.ratio}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="so-card">
             <h3 className="so-card-title" style={{ marginBottom: 16 }}>Organic Position Distribution</h3>
             <div style={{ height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={posDistData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8c8c8c' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8c8c8c' }} />
                    <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="value" fill="#5b61f4" barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>

      {/* 5. Competitors Section */}
      <div className="so-competitor-grid">
        <div className="so-card">
           <h3 className="so-card-title" style={{ marginBottom: 20 }}>Main Organic Competitors <span style={{ color: '#8c8c8c', fontWeight: 'normal', fontSize: 14 }}>{data?.competitors?.length ?? 'Unavailable'}</span></h3>
           <Table 
            className="so-table-minimal"
            dataSource={(data?.competitors || []).slice(0, 5)}
            pagination={false}
            rowKey="domain"
            columns={[
              { title: 'Competitor', dataIndex: 'domain', render: (text) => <span style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>{text} <ExternalLink size={12}/></span> },
              { title: 'Com. Level', dataIndex: 'comLevel', render: (val) => <Progress percent={val} showInfo={false} strokeColor="#5b61f4" size="small" style={{ width: 60 }} /> },
              { title: 'Com. Keywords', dataIndex: 'commonKeywords', align: 'right', render: formatNumber },
              { title: 'SE Keywords', dataIndex: 'seKeywords', align: 'right', render: formatNumber },
            ]}
          />
          <div style={{ marginTop: 24 }}><Tag color="default" style={{ padding: '4px 12px', background: '#2b2b2b', color: 'white', border: 'none', cursor: 'pointer' }} onClick={() => navigate(`/intelligence/semrush/${project?._id}/organic-keywords`)}>View details</Tag></div>
        </div>
        
        <div className="so-card">
           <h3 className="so-card-title" style={{ marginBottom: 20 }}>Competitive Positioning Map</h3>
           <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24, fontSize: 12 }}>
             {competitorsScatterData.map(c => (
               <span key={c.domain} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#595959' }}>
                 <div className="so-intent-dot" style={{ background: c.color }}></div> {c.domain}
               </span>
             ))}
           </div>
           <div style={{ height: 260 }}>
             <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                  <CartesianGrid stroke="#f0f0f0" />
                  <XAxis type="number" dataKey="x" name="Organic Keywords" tick={{ fontSize: 11, fill: '#8c8c8c' }} axisLine={false} tickLine={false} label={{ value: 'Organic Keywords', position: 'bottom', fill: '#8c8c8c', fontSize: 12 }} />
                  <YAxis type="number" dataKey="y" name="Organic Traffic" tick={{ fontSize: 11, fill: '#8c8c8c' }} axisLine={false} tickLine={false} tickFormatter={formatNumber} label={{ value: 'Organic Search Traffic', angle: -90, position: 'insideLeft', fill: '#8c8c8c', fontSize: 12 }} />
                  <ZAxis type="number" dataKey="z" range={[100, 1500]} />
                  <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  {competitorsScatterData.map((entry, index) => (
                    <Scatter key={`scatter-${index}`} name={entry.domain} data={[entry]} fill={entry.color} fillOpacity={0.6} />
                  ))}
                </ScatterChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
      
    </div>
  );
};

export default DomainOverviewTab;
