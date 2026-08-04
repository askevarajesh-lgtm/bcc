import React, { useState, useEffect } from 'react';
import { Tabs, Button, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useOutletContext } from 'react-router-dom';
import BacklinksOverview from './backlinks/BacklinksOverview';
import BacklinksList from './backlinks/BacklinksList';
import BacklinksAnchors from './backlinks/BacklinksAnchors';
import BacklinksPages from './backlinks/BacklinksPages';
import BacklinksNetworkGraph from './backlinks/BacklinksNetworkGraph';

const BacklinksTab = () => {
  const { project, projectData } = useOutletContext();
  const domain = project?.domain;
  const [activeKey, setActiveKey] = useState('overview');
  const [localData, setLocalData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projectData && !localData) {
      setLocalData({
        overview: projectData.overview,
        backlinksOverview: projectData.backlinksOverview
      });
    }
  }, [projectData]);

  const handleTabChange = (key) => {
    setActiveKey(key);
  };

  const handleAudit = async () => {
    if (!domain) return;
    try {
      setLoading(true);
      const { semrushApi } = await import('../../../api/semrushApi');
      const [overviewRes, backlinksRes] = await Promise.all([
        semrushApi.getDomainOverview(domain, 'us', true),
        semrushApi.getBacklinksOverview(domain, true)
      ]);
      
      setLocalData(prev => ({
        ...prev,
        overview: overviewRes && overviewRes.length > 0 ? overviewRes[0] : prev?.overview,
        backlinksOverview: backlinksRes && backlinksRes.length > 0 ? backlinksRes[0] : prev?.backlinksOverview
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const EmptyState = ({ message }) => (
    <div style={{ background: 'white', border: '1px solid #f0f0f0', borderRadius: 8, padding: 40, textAlign: 'center', color: '#bfbfbf' }}>
      {message}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
       
       {/* Secondary Sub-Tabs to mirror Semrush */}
       <div style={{ borderBottom: '1px solid #f0f0f0', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
         <Tabs 
           activeKey={activeKey} 
           onChange={handleTabChange}
           items={[
             { key: 'overview', label: 'Overview' },
             { key: 'backlinks', label: 'Backlinks' },
             { key: 'network-graph', label: 'Network Graph' },
             { key: 'anchors', label: 'Anchors' },
             { key: 'indexed-pages', label: 'Indexed Pages' }
           ]}
           style={{ flex: 1 }}
         />
         <Space style={{ marginTop: 8 }}>
           <Button type="primary" icon={<ReloadOutlined />} onClick={handleAudit} loading={loading} style={{ borderRadius: 8, fontWeight: 600 }}>
             Audit Data
           </Button>
         </Space>
       </div>

       <div>
          {activeKey === 'overview' && <BacklinksOverview setActiveTab={setActiveKey} localData={localData} />}
          {activeKey === 'backlinks' && <BacklinksList />}
          {activeKey === 'anchors' && <BacklinksAnchors />}
          {activeKey === 'indexed-pages' && <BacklinksPages />}
          {activeKey === 'network-graph' && <BacklinksNetworkGraph />}
       </div>

    </div>
  );
};

export default BacklinksTab;
