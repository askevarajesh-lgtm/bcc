import React, { useState, useEffect } from 'react';
import { Tabs, Button, Space, message } from 'antd';
import { semrushApi } from '../../../api/semrushApi';
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import { useOutletContext } from 'react-router-dom';
import * as XLSX from 'xlsx';
import BacklinksOverview from './backlinks/BacklinksOverview';
import BacklinksList from './backlinks/BacklinksList';
import BacklinksAnchors from './backlinks/BacklinksAnchors';
import BacklinksPages from './backlinks/BacklinksPages';
import BacklinksNetworkGraph from './backlinks/BacklinksNetworkGraph';

const BacklinksTab = () => {
  const { project, projectData, fetchProjectData } = useOutletContext();
  const domain = project?.domain;
  const [activeKey, setActiveKey] = useState('overview');
  const [localData, setLocalData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (projectData) {
      setLocalData((prev) => prev || {
        overview: projectData.overview,
        backlinksOverview: projectData.backlinksOverview
      });
    }
  }, [projectData]);

  const handleRefresh = async () => {
    if (!project?._id) return;
    setRefreshing(true);
    try {
      const res = await semrushApi.getBacklinks(project._id, true);
      if (res.data.success && res.data.data) {
        setLocalData({
           ...localData,
           backlinksOverview: {
             total: res.data.data.backlinks?.value,
             score: res.data.data.authorityScore?.value,
             ...(res.data.data.backlinksDetails || {})
           }
        });
        message.success('Backlinks updated successfully');
        if (fetchProjectData) fetchProjectData();
      } else {
        message.error(res.data.errorCode || 'Failed to refresh Backlinks');
      }
    } catch (err) {
      message.error('An error occurred during refresh');
    } finally {
      setRefreshing(false);
    }
  };

  const handleTabChange = (key) => {
    setActiveKey(key);
  };

  const handleExport = () => {
    try {
      const backlinks = localData?.backlinksOverview || projectData?.backlinksOverview || {};
      const rawBacklinks = backlinks.rawBacklinks || [];
      
      if (rawBacklinks.length === 0) {
        message.warning('No backlink data available to export.');
        return;
      }

      // Map data for Excel
      const exportData = rawBacklinks.map(row => ({
        'Page AS': row.page_as || row.pageAs || '-',
        'Source Title': row.source_title || '-',
        'Source URL': row.source_url || '-',
        'Target URL': row.target_url || '-',
        'External Links': row.external || 0,
        'Internal Links': row.internal || 0,
        'Anchor': row.anchor || 'Empty Anchor',
        'Follow': row.isFollow === false ? 'No' : 'Yes',
        'First Seen': row.first_seen ? new Date(row.first_seen * 1000).toLocaleDateString() : '-'
      }));

      // Create workbook
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Backlinks');

      // Export
      const filename = `${domain?.replace(/\./g, '_') || 'project'}_Backlinks.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      message.success('Backlink report exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      message.error('Failed to export backlink report.');
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
         <div style={{ paddingTop: 8, display: 'flex', gap: '12px' }}>
           <Button 
             icon={<DownloadOutlined />} 
             onClick={handleExport} 
             style={{ borderRadius: 8, fontWeight: 600 }}
           >
             Export
           </Button>
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
