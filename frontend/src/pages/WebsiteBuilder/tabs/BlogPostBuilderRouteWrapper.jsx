import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GrapesJSBuilder from './GrapesJSBuilder';
import { Spin, message } from 'antd';

const BlogPostBuilderRouteWrapper = () => {
  const { websiteId, postId } = useParams();
  const navigate = useNavigate();
  const [activeWebsite, setActiveWebsite] = useState(null);
  const [activePost, setActivePost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { "Authorization": token ? `Bearer ${token}` : "" };

        const [webRes, postRes] = await Promise.all([
          fetch(`/api/websites/${websiteId}`, { headers }),
          fetch(`/api/blogs/posts/${postId}`, { headers })
        ]);

        const webData = await webRes.json();
        const postData = await postRes.json();

        if (webData.success && postData.success) {
          const web = webData.data;
          web.key = web._id;

          setActiveWebsite(web);
          setActivePost(postData.data);
        } else {
          message.error("Failed to load blog post data.");
          navigate(`/workspace/website/websites/${websiteId}`);
        }
      } catch (err) {
        console.error("Error fetching builder data:", err);
        message.error("An error occurred while loading the builder.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [websiteId, postId, navigate]);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
        <Spin size="large" tip="Loading builder environment..." />
      </div>
    );
  }

  if (!activeWebsite || !activePost) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: '#fff' }}>
      <GrapesJSBuilder
        activeWebsite={activeWebsite}
        activePost={activePost}
        mode="post"
        setEditingPage={() => navigate(`/workspace/website/websites/${websiteId}`)}
        onSave={() => {}} // Save is handled inside GrapesJSBuilder
      />
    </div>
  );
};

export default BlogPostBuilderRouteWrapper;
