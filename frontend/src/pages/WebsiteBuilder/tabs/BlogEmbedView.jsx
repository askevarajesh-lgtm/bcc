import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Typography, Result, Spin, Card, Row, Col, Tag } from "antd";
import { Calendar, User } from "lucide-react";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

const BlogEmbedView = () => {
  const { blogId } = useParams();
  const [blogData, setBlogData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlog();
  }, [blogId]);

  const fetchBlog = async () => {
    try {
      const res = await fetch(`/api/blogs/${blogId}/public`);
      const data = await res.json();
      if (data.success && data.data) {
        setBlogData(data.data);
      } else {
        setBlogData(null);
      }
    } catch (err) {
      console.error(err);
      setBlogData(null);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "transparent" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!blogData) {
    return (
      <Result
        status="404"
        title="Blog Not Found"
        subTitle="Sorry, the blog you are looking for does not exist or has been disabled."
      />
    );
  }

  const { name, description, posts = [] } = blogData;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 20px", fontFamily: "inherit" }}>
      {/* Blog Header */}
      <div style={{ textAlign: "center", marginBottom: 60 }}>
        <Title level={1} style={{ fontWeight: 900, marginBottom: 16 }}>{name}</Title>
        {description && (
          <Text style={{ fontSize: 18, color: "#64748b", maxWidth: 700, margin: "0 auto", display: "block" }}>
            {description}
          </Text>
        )}
      </div>

      {/* Blog Posts Grid */}
      {posts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "#f8fafc", borderRadius: 16 }}>
          <Title level={4} style={{ color: "#64748b" }}>No posts published yet.</Title>
          <Text type="secondary">Check back later for updates!</Text>
        </div>
      ) : (
        <Row gutter={[32, 32]}>
          {posts.map(post => (
            <Col xs={24} md={12} lg={8} key={post._id}>
              <Card 
                hoverable 
                style={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0' }}
                bodyStyle={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}
              >
                {post.categories && post.categories.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    {post.categories.map((cat, idx) => (
                      <Tag color="blue" key={idx} style={{ borderRadius: 4, fontWeight: 600 }}>{cat}</Tag>
                    ))}
                  </div>
                )}
                <Title level={4} style={{ marginTop: 0, marginBottom: 12, fontWeight: 800, lineHeight: 1.4 }}>
                  <a href={`/blog/${blogData.slug}/${post.slug}`} style={{ color: 'inherit', textDecoration: 'none' }} target="_parent">
                    {post.title}
                  </a>
                </Title>
                
                <Paragraph style={{ color: '#475569', fontSize: 15, flex: 1, marginBottom: 24 }} ellipsis={{ rows: 3 }}>
                  {/* Extract plain text from HTML content or use description if available */}
                  {post.content ? post.content.replace(/<[^>]+>/g, '') : "Read the full post for more details."}
                </Paragraph>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: '#94a3b8', fontSize: 13, fontWeight: 500, marginTop: 'auto' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={14} /> {dayjs(post.createdAt).format('MMM D, YYYY')}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <User size={14} /> Admin
                  </span>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default BlogEmbedView;
