import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GrapesJSBuilder from './GrapesJSBuilder';
import { Spin, message } from 'antd';

const BuilderRouteWrapper = () => {
  const { websiteId, pageId } = useParams();
  const navigate = useNavigate();
  const [activeWebsite, setActiveWebsite] = useState(null);
  const [activePage, setActivePage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { "Authorization": token ? `Bearer ${token}` : "" };
        
        // Fetch website and page data
        const [webRes, pageRes] = await Promise.all([
          fetch(`/api/websites/${websiteId}`, { headers }),
          fetch(`/api/websites/${websiteId}/pages/${pageId}`, { headers })
        ]);

        const webData = await webRes.json();
        const pageData = await pageRes.json();

        if (webData.success && pageData.success) {
          const web = webData.data;
          // Ensure backward compatibility with UI components expecting 'key'
          web.key = web._id;
          
          setActiveWebsite(web);
          setActivePage(pageData.data);
        } else {
          message.error("Failed to load page data.");
          navigate('/workspace/website');
        }
      } catch (err) {
        console.error("Error fetching builder data:", err);
        message.error("An error occurred while loading the builder.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [websiteId, pageId, navigate]);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
        <Spin size="large" tip="Loading builder environment..." />
      </div>
    );
  }

  if (!activeWebsite || !activePage) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: '#fff' }}>
      <GrapesJSBuilder 
        activeWebsite={activeWebsite} 
        activePage={activePage} 
        setEditingPage={() => navigate('/workspace/website')} 
        onSave={() => {}} // Save is handled inside GrapesJSBuilder
      />
    </div>
  );
};

export default BuilderRouteWrapper;
