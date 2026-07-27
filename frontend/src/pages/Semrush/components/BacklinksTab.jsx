import React, { useState } from 'react';
import { Tabs } from 'antd';
import { useOutletContext } from 'react-router-dom';
import BacklinksOverview from './backlinks/BacklinksOverview';
import BacklinksList from './backlinks/BacklinksList';
import BacklinksAnchors from './backlinks/BacklinksAnchors';
import BacklinksPages from './backlinks/BacklinksPages';

const BacklinksTab = () => {
  const { project, projectData } = useOutletContext();
  const [activeKey, setActiveKey] = useState('overview');

  const handleTabChange = (key) => {
    setActiveKey(key);
  };

  const EmptyState = ({ message }) => (
    <div style={{ background: 'white', border: '1px solid #f0f0f0', borderRadius: 8, padding: 40, textAlign: 'center', color: '#bfbfbf' }}>
      {message}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
       
       {/* Secondary Sub-Tabs to mirror Semrush */}
       <div style={{ borderBottom: '1px solid #f0f0f0', marginBottom: 20 }}>
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
         />
       </div>

       <div>
          {activeKey === 'overview' && <BacklinksOverview setActiveTab={setActiveKey} />}
          {activeKey === 'backlinks' && <BacklinksList />}
          {activeKey === 'anchors' && <BacklinksAnchors />}
          {activeKey === 'indexed-pages' && <BacklinksPages />}
          {activeKey === 'network-graph' && <EmptyState message="Network Graph visualization not supported by standard API endpoints." />}
       </div>

    </div>
  );
};

export default BacklinksTab;
