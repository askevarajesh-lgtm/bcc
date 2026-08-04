import React, { useEffect, useState } from 'react';
import { Typography, Space, Select, Empty, Alert, Tag, message } from 'antd';
import { BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { blogSeoAgentApi } from '../../../../api/blogSeoAgentApi';
import AgentFindingsCard from '../components/shared/AgentFindingsCard';
import { SeverityTag } from '../components/shared/StatusTags';

const { Title, Text } = Typography;

const BlogSEOTab = () => {
  const [blogs, setBlogs] = useState([]);
  const [blogId, setBlogId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postId, setPostId] = useState(null);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoadingBlogs(true);
      try {
        const res = await blogSeoAgentApi.getBlogs();
        setBlogs(res.data || []);
      } catch (err) {
        setError(err?.response?.data?.error || 'Failed to load blogs');
      } finally {
        setLoadingBlogs(false);
      }
    })();
  }, []);

  useEffect(() => {
    setPostId(null);
    setPosts([]);
    if (!blogId) return;
    (async () => {
      setLoadingPosts(true);
      try {
        const res = await blogSeoAgentApi.getPosts(blogId);
        setPosts(res.data || []);
      } catch (err) {
        message.error('Failed to load posts for this blog');
      } finally {
        setLoadingPosts(false);
      }
    })();
  }, [blogId]);

  const findingsColumns = [
    { title: 'Type', dataIndex: 'findingType', key: 'findingType', render: (t) => <Tag>{t?.replace(/_/g, ' ')}</Tag> },
    { title: 'Severity', dataIndex: 'severity', key: 'severity', render: (s) => <SeverityTag severity={s} /> },
    { title: 'Current', dataIndex: 'currentValue', key: 'currentValue', ellipsis: true },
    { title: 'Proposed', dataIndex: 'proposedValue', key: 'proposedValue', ellipsis: true },
    { title: 'Rationale', dataIndex: 'rationale', key: 'rationale', ellipsis: true }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: 'linear-gradient(135deg, #13c2c2 0%, #1677ff 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <BookOpen size={24} color="#fff" />
        </div>
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 900 }}>Blog SEO</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Per-post SEO findings and approvals for blog posts.</Text>
        </div>
      </div>

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} closable onClose={() => setError(null)} />}

      <Space style={{ marginBottom: 20 }} wrap>
        <Select
          loading={loadingBlogs}
          placeholder="Select a blog"
          style={{ minWidth: 240 }}
          value={blogId}
          onChange={setBlogId}
          options={blogs.map((b) => ({ value: b._id, label: b.name || b.title }))}
          notFoundContent={<Empty description="No blogs yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
        />
        <Select
          loading={loadingPosts}
          placeholder="Select a post"
          style={{ minWidth: 280 }}
          value={postId}
          onChange={setPostId}
          disabled={!blogId}
          options={posts.map((p) => ({ value: p._id, label: p.title }))}
          notFoundContent={<Empty description="No posts on this blog" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
        />
      </Space>

      {!blogId || !postId ? (
        <Empty description="Select a blog and post to run the SEO agent" />
      ) : (
        <AgentFindingsCard
          key={postId}
          title="Blog SEO Agent"
          runLabel="Run Post SEO Analysis"
          emptyHint="Run the SEO agent for this post to see findings."
          columns={findingsColumns}
          onRun={() => blogSeoAgentApi.runBlogSeoAgent(blogId, postId)}
          onApprove={async (runId) => {
            const res = await blogSeoAgentApi.approveBlogSeoFindings(blogId, postId, runId);
            return { data: res.data?.run, createdTasks: res.data?.createdTasks };
          }}
          onReject={(runId, reason) => blogSeoAgentApi.rejectBlogSeoFindings(blogId, postId, runId, reason)}
          onLoadHistory={() => blogSeoAgentApi.getBlogSeoHistory(blogId, postId)}
        />
      )}
    </motion.div>
  );
};

export default BlogSEOTab;