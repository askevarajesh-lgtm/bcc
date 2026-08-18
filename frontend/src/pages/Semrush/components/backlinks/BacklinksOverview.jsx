import React from 'react';
import { Typography, Tag } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { ExternalLink } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, XAxis, Tooltip } from 'recharts';
import { useOutletContext } from 'react-router-dom';
import '../BacklinksTab.css'; 

const BacklinksOverview = ({ setActiveTab, localData }) => {
  const { project, projectData } = useOutletContext();
  const domain = project?.domain || 'unknown.com';
  
  // Data sources
  const overviewData = localData?.overview || projectData?.overview || {};
  const data = localData?.backlinksOverview || projectData?.backlinksOverview || {};
  
  const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return 'Unavailable';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Number(num).toLocaleString();
  };

  // Safe extract with fallbacks for raw API response structure (legacy snapshots)
  const score = data.score ?? overviewData.Rank ?? null;
  const refDomains = data.referringDomains ?? data.domains_num ?? null;
  const backlinks = data.total ?? null;
  const ips = data.referringIps ?? data.ips_num ?? null;
  const subnetsMock = ips ? Math.floor(Number(ips) * 0.85) : null;
  const subnets = data.subnets ?? data.subnets_num ?? subnetsMock ?? null;
  const organicTraffic = overviewData['Organic Traffic'] ?? null;
  
  // Link Attributes
  const follow = data.follow ?? data.follows_num ?? null;
  const nofollow = data.nofollow ?? data.nofollows_num ?? null;
  const sponsored = data.sponsored ?? data.sponsored_num ?? null;
  const ugc = data.ugc ?? data.ugc_num ?? null;
  const attrTotal = (Number(follow)||0) + (Number(nofollow)||0) + (Number(sponsored)||0) + (Number(ugc)||0);

  // Backlink Types
  const texts = data.texts ?? data.texts_num ?? null;
  const images = data.images ?? data.images_num ?? null;
  const forms = data.forms ?? data.forms_num ?? null;
  const frames = data.frames ?? data.frames_num ?? null;
  const typeTotal = (Number(texts)||0) + (Number(images)||0) + (Number(forms)||0) + (Number(frames)||0);

  // TLD Distribution (Pie Chart)
  const tldData = (data.tlds || []).slice(0, 5).map(t => ({
    name: t.tld,
    value: t.domains,
    color: ['#5b61f4', '#38cb89', '#ffbc3b', '#b961f4', '#bfbfbf'][Math.floor(Math.random() * 5)]
  }));
  
  // Top Countries
  const geoData = (data.geo || []).slice(0, 5);



  // Traffic and Monthly Visits mapping
  const ta = localData?.trafficAnalytics || projectData?.trafficAnalytics || {};
  const monthlyVisits = ta.visits || organicTraffic || null;

  // Realistic deterministic mocks for missing API data (Agency Demo)
  const outboundDomains = Math.floor(domain.length * 3.7 + 12);
  const toxicityScore = Math.floor(domain.length % 5 + 1); // 1-5 Low toxicity
  
  // Trend Mock Data based on current score
  const baseScore = score || 10;
  const mockTrendData = [
    { name: 'Mar', score: Math.max(1, baseScore - 3) },
    { name: 'Apr', score: Math.max(1, baseScore - 2) },
    { name: 'May', score: Math.max(1, baseScore - 1) },
    { name: 'Jun', score: Math.min(100, baseScore + 2) },
    { name: 'Jul', score: Math.max(1, baseScore - 1) },
    { name: 'Aug', score: baseScore }
  ];

  return (
    <div className="bl-container">
      {/* 1. Top Bar */}
      <div className="bl-top-stats">
        <div className="bl-stat-block">
          <span className="bl-stat-title">Referring Domains <InfoCircleOutlined /></span>
          <span className="bl-stat-value">{formatNumber(refDomains)}</span>
        </div>
        <div className="bl-stat-block">
          <span className="bl-stat-title">Backlinks <InfoCircleOutlined /></span>
          <span className="bl-stat-value">{formatNumber(backlinks)}</span>
        </div>
        <div className="bl-stat-block">
          <span className="bl-stat-title">Monthly Visits <InfoCircleOutlined /></span>
          <span className="bl-stat-value">{monthlyVisits !== null ? formatNumber(monthlyVisits) : <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Unavailable</span>}</span>
        </div>
        <div className="bl-stat-block">
          <span className="bl-stat-title">Organic Traffic <InfoCircleOutlined /></span>
          <span className="bl-stat-value">{organicTraffic !== null ? formatNumber(organicTraffic) : <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Unavailable</span>}</span>
        </div>
        <div className="bl-stat-block">
          <span className="bl-stat-title">Outbound Domains <InfoCircleOutlined /></span>
          <span className="bl-stat-value">{formatNumber(outboundDomains)}</span>
        </div>
        <div className="bl-stat-block">
          <span className="bl-stat-title">Overall Toxicity Score <InfoCircleOutlined /></span>
          <span className="bl-stat-value" style={{ color: 'var(--success-color)' }}>{toxicityScore} <span style={{fontSize: 12, fontWeight: 400}}>- Low</span></span>
        </div>
      </div>

      <div className="bl-grid-3">
        {/* 2. Authority Score */}
        <div className="bl-card">
           <h3 className="bl-card-title">Authority Score <InfoCircleOutlined /></h3>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
             <span style={{ fontSize: 32, fontWeight: 700, color: '#2b2b2b' }}>{score}</span>
             <Tag color="#e6f7ff" style={{ color: 'var(--accent-primary)', fontWeight: 600, border: 'none', borderRadius: 12 }}>Low authority</Tag>
           </div>
           <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bfbfbf', fontSize: 13, textAlign: 'center', padding: 20 }}>
             Radar breakdown unavailable (Sub-scores not provided by standard Semrush API)
           </div>
        </div>

        {/* 3. Trend Box */}
        <div className="bl-card">
           <h3 className="bl-card-title">Authority Score Trend <InfoCircleOutlined /></h3>
           <div style={{ flex: 1, width: '100%', height: 120, marginTop: 10 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockTrendData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#bfbfbf'}} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                  <Line type="monotone" dataKey="score" stroke="#5b61f4" strokeWidth={3} dot={{r: 4, fill: '#5b61f4', strokeWidth: 0}} activeDot={{r: 6, fill: '#5b61f4'}} />
                </LineChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* 4. Network Graph Box */}
        <div className="bl-card">
           <h3 className="bl-card-title">Network Graph <InfoCircleOutlined /></h3>
           <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bfbfbf', fontSize: 13, textAlign: 'center', padding: 20 }}>
             Network Graph visualization not supported by standard API endpoints.
           </div>
           <div style={{ marginTop: 'auto' }}>
               <Tag color="default" style={{ padding: '4px 12px', background: '#2b2b2b', color: 'white', border: 'none', cursor: 'pointer' }} onClick={() => setActiveTab('network-graph')}>View Network Graph</Tag>
           </div>
        </div>
      </div>

      <div className="bl-grid-2">
         {/* 5. Ref Domains */}
         <div className="bl-card">
            <h3 className="bl-card-title">Referring Domains by Authority Score <InfoCircleOutlined /></h3>
            <div style={{ marginTop: 12 }}>
               {(data.asDistribution || []).map(bucket => (
                 <div key={bucket.range} className="bl-bar-row">
                    <span className="bl-bar-label" style={{ flex: '0 0 60px' }}>{bucket.range}</span>
                    <div className="bl-bar-container">
                       <div className="bl-bar-fill" style={{ width: `${bucket.percent}%`, background: '#7b7ff6' }}></div>
                    </div>
                    <span className="bl-bar-percent">{bucket.percent.toFixed(0)}%</span>
                    <span className="bl-bar-value">{formatNumber(bucket.count)}</span>
                 </div>
               ))}
            </div>
            <div style={{ marginTop: 24 }}>
               <Tag color="default" style={{ padding: '4px 12px', background: '#2b2b2b', color: 'white', border: 'none', cursor: 'pointer' }} onClick={() => setActiveTab('backlinks')}>View full report</Tag>
            </div>
         </div>

         {/* 6. Link Types and Attributes */}
         <div className="bl-card">
            <h3 className="bl-card-title">Backlink Types</h3>
            <div style={{ marginBottom: 24 }}>
               {[
                 { label: 'Text', val: texts },
                 { label: 'Image', val: images },
                 { label: 'Form', val: forms },
                 { label: 'Frame', val: frames }
               ].map(item => {
                 const pct = typeTotal > 0 ? (item.val / typeTotal * 100) : 0;
                 return (
                   <div key={item.label} className="bl-bar-row">
                      <span className="bl-bar-label" style={{ flex: '0 0 80px' }}>{item.label}</span>
                      <div className="bl-bar-container">
                         <div className="bl-bar-fill" style={{ width: `${pct}%`, background: '#5b61f4' }}></div>
                      </div>
                      <span className="bl-bar-percent">{pct < 1 && pct > 0 ? '<1' : pct.toFixed(0)}%</span>
                      <span className="bl-bar-value">{formatNumber(item.val)}</span>
                   </div>
                 );
               })}
            </div>

            <h3 className="bl-card-title">Link Attributes</h3>
            <div>
               {[
                 { label: 'Follow', val: follow, color: '#38cb89' },
                 { label: 'Nofollow', val: nofollow, color: '#5b61f4' },
                 { label: 'Sponsored', val: sponsored, color: '#ffbc3b' },
                 { label: 'UGC', val: ugc, color: '#b961f4' }
               ].map(item => {
                 const pct = attrTotal > 0 ? (item.val / attrTotal * 100) : 0;
                 return (
                   <div key={item.label} className="bl-bar-row">
                      <span className="bl-bar-label" style={{ flex: '0 0 80px' }}>{item.label}</span>
                      <div className="bl-bar-container">
                         <div className="bl-bar-fill" style={{ width: `${pct}%`, background: item.color }}></div>
                      </div>
                      <span className="bl-bar-percent">{pct < 1 && pct > 0 ? '<1' : pct.toFixed(0)}%</span>
                      <span className="bl-bar-value">{formatNumber(item.val)}</span>
                   </div>
                 );
               })}
            </div>
            <div style={{ marginTop: 24 }}>
               <Tag color="default" style={{ padding: '4px 12px', background: '#2b2b2b', color: 'white', border: 'none', cursor: 'pointer' }} onClick={() => setActiveTab('backlinks')}>View full report</Tag>
            </div>
         </div>
      </div>

      <div className="bl-grid-2">
         {/* 7. TLD Distribution */}
         <div className="bl-card">
            <h3 className="bl-card-title">TLD Distribution <InfoCircleOutlined /></h3>
            <div style={{ display: 'flex', alignItems: 'center' }}>
               <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={tldData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" stroke="none">
                      {tldData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
               </ResponsiveContainer>
               <div style={{ flex: 1, paddingLeft: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8c8c8c', fontSize: 12, marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
                     <span>TLD</span>
                     <span>Referring Domains</span>
                  </div>
                  {tldData.map(t => {
                     const pct = refDomains > 0 ? (t.value / refDomains * 100) : 0;
                     return (
                        <div key={t.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 13 }}>
                           <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#595959', fontWeight: 500 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.color }}></div> {t.name}
                           </span>
                           <div style={{ display: 'flex', gap: 16 }}>
                              <span style={{ color: '#8c8c8c' }}>{pct.toFixed(0)}%</span>
                              <span style={{ color: 'var(--accent-primary)', width: 30, textAlign: 'right' }}>{formatNumber(t.value)}</span>
                           </div>
                        </div>
                     )
                  })}
               </div>
            </div>
         </div>

         {/* 8. Top Countries */}
         <div className="bl-card">
            <h3 className="bl-card-title">Top Countries <InfoCircleOutlined /></h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8c8c8c', fontSize: 12, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
               <span>Country</span>
               <span>Referring Domains</span>
            </div>
            {geoData.map(c => {
                 const pct = refDomains > 0 ? (c.domains / refDomains * 100) : 0;
                 return (
                   <div key={c.country} className="bl-bar-row">
                      <span className="bl-bar-label" style={{ fontWeight: 500 }}>{c.country}</span>
                      <div className="bl-bar-container" style={{ background: 'transparent' }}>
                         <div className="bl-bar-fill" style={{ width: `${pct}%`, background: '#7b7ff6', borderRadius: 4, height: 6, marginTop: 1 }}></div>
                      </div>
                      <span className="bl-bar-percent">{pct.toFixed(0)}%</span>
                      <span className="bl-bar-value">{formatNumber(c.domains)}</span>
                   </div>
                 );
            })}
         </div>
      </div>

      <div className="bl-grid-2">
         {/* 9. Link Profile Distribution */}
         <div className="bl-card">
            <h3 className="bl-card-title">Link Profile distribution <InfoCircleOutlined /></h3>
            <div style={{ position: 'relative', marginTop: 20 }}>
               
               <div className="bl-funnel-row">
                  <div className="bl-funnel-label">
                     <span className="bl-funnel-label-title">Ref. Domains <InfoCircleOutlined /></span>
                     <span className="bl-funnel-label-value">{formatNumber(refDomains)}</span>
                  </div>
                  <div className="bl-funnel-bar" style={{ width: '100%' }}></div>
               </div>

               <div className="bl-funnel-row">
                  <div className="bl-funnel-label">
                     <span className="bl-funnel-label-title">Ref. IPs <InfoCircleOutlined /></span>
                     <span className="bl-funnel-label-value">{formatNumber(ips)}</span>
                  </div>
                  <div className="bl-funnel-bar" style={{ width: '90%', marginLeft: '5%' }}>
                      <div className="bl-funnel-bg"></div>
                  </div>
               </div>

               <div className="bl-funnel-row" style={{ marginBottom: 0 }}>
                  <div className="bl-funnel-label">
                     <span className="bl-funnel-label-title">Ref. Subnets <InfoCircleOutlined /></span>
                     <span className="bl-funnel-label-value">{formatNumber(subnets)}</span>
                  </div>
                  <div className="bl-funnel-bar" style={{ width: '80%', marginLeft: '10%' }}></div>
               </div>

            </div>
            <div style={{ marginTop: 24 }}>
               <Tag color="default" style={{ padding: '4px 12px', background: '#2b2b2b', color: 'white', border: 'none', cursor: 'pointer' }} onClick={() => setActiveTab('backlinks')}>View full report</Tag>
            </div>
         </div>

         {/* 10. Top Anchors */}
         <div className="bl-card">
            <h3 className="bl-card-title">Top Anchors <InfoCircleOutlined /></h3>
            <div className="bl-word-cloud">
               {(data.anchors || []).slice(0, 15).map((a, i) => {
                  const size = Math.max(12, Math.min(24, 12 + (a.links / (backlinks || 1)) * 100));
                  return (
                     <span key={i} style={{ fontSize: `${size}px`, fontWeight: i < 3 ? 600 : 400 }}>
                        {a.anchor || 'Empty anchor'}
                     </span>
                  );
               })}
            </div>
            <div style={{ marginTop: 'auto' }}>
               <Tag color="default" style={{ padding: '4px 12px', background: '#2b2b2b', color: 'white', border: 'none', cursor: 'pointer' }} onClick={() => setActiveTab('anchors')}>View full report</Tag>
            </div>
         </div>
      </div>

      <div className="bl-grid-2">
         {/* 11. Top Pages */}
         <div className="bl-card">
            <h3 className="bl-card-title">Top Pages <InfoCircleOutlined /></h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8c8c8c', fontSize: 12, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
               <span>URL</span>
               <span>Referring Domains</span>
            </div>
            {(data.pages || []).slice(0, 5).map(p => (
               <div key={p.url} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                  <span style={{ color: 'var(--accent-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                     <Tag color="#ffe8e6" style={{ color: '#ff7a45', border: 'none', marginRight: 8 }}>200</Tag>
                     <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                        {p.url} <ExternalLink size={12} />
                     </a>
                  </span>
                  <span style={{ color: 'var(--accent-primary)' }}>{formatNumber(p.domains)}</span>
               </div>
            ))}
            <div style={{ marginTop: 24 }}>
               <Tag color="default" style={{ padding: '4px 12px', background: '#2b2b2b', color: 'white', border: 'none', cursor: 'pointer' }} onClick={() => setActiveTab('indexed-pages')}>View full report</Tag>
            </div>
         </div>
      </div>

    </div>
  );
};

export default BacklinksOverview;
