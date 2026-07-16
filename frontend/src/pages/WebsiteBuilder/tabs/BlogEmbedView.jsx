import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Typography, Result, Spin, Card, Row, Col, Tag, Button } from "antd";
import { Calendar, User } from "lucide-react";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

const BlogEmbedView = () => {
  const { blogId, blogSlug } = useParams();
  const [blogData, setBlogData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedPosts, setExpandedPosts] = useState({});

  const toggleExpand = (postId) => {
    setExpandedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  useEffect(() => {
    fetchBlog();
  }, [blogId, blogSlug]);

  const fetchBlog = async () => {
    try {
      const url = blogId ? `/api/blogs/${blogId}/public` : `/api/blogs/slug/${blogSlug}/public`;
      const res = await fetch(url);
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
  const isEmbed = !!blogId;
  const displayedPosts = isEmbed ? posts.slice(0, 3) : posts;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 20px", fontFamily: "inherit" }}>
      <style>{`.excerpt-content, .excerpt-content * { background-color: transparent !important; }`}</style>
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
        <>
          <Row gutter={[32, 32]}>
            {displayedPosts.map(post => {
              const postUrl = `/blog/${blogData.slug}/${post.slug}`;

              // The excerpt can contain rich text (e.g. a link inserted in the editor) and must be
              // rendered as HTML rather than escaped text, or tags show up literally on the card.
              const excerptHtml = post.excerpt?.trim() || '';
              const fallbackPlainText = !excerptHtml && post.content
                ? post.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
                : '';

              // Word count is measured on plain text (tags stripped) so we don't cut an HTML tag in half.
              const plainForCount = excerptHtml
                ? excerptHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
                : fallbackPlainText;
              const WORD_LIMIT = 20;
              const words = plainForCount.split(' ').filter(Boolean);
              const isLong = words.length > WORD_LIMIT;

              // Full text is always rendered — the max-height clamp (collapsed) plus the
              // Read More/Show Less toggle below controls what's actually visible.
              const excerptContent = excerptHtml
                ? excerptHtml
                : (fallbackPlainText || 'Read the full post for more details.');

              return (
                <Col xs={24} md={12} lg={8} key={post._id}>
                  <Card 
                    hoverable 
                    style={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0' }}
                    bodyStyle={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}
                    cover={post.featuredImageUrl ? (
                      <a href={postUrl} target="_parent">
                        <img
                          src={post.featuredImageUrl}
                          alt={post.title}
                          style={{ width: '100%', height: 180, objectFit: 'cover' }}
                        />
                      </a>
                    ) : undefined}
                  >
                    {post.categories && post.categories.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        {post.categories.map((cat, idx) => (
                          <Tag color="blue" key={idx} style={{ borderRadius: 4, fontWeight: 600 }}>{cat}</Tag>
                        ))}
                      </div>
                    )}
                    <Title level={4} style={{ marginTop: 0, marginBottom: 12, fontWeight: 800, lineHeight: 1.4 }}>
                      <a href={postUrl} style={{ color: 'inherit', textDecoration: 'none' }} target="_parent">
                        {post.title}
                      </a>
                    </Title>

                    <Paragraph
                      className="excerpt-content"
                      style={{
                        color: '#475569',
                        fontSize: 15,
                        lineHeight: 1.6,
                        flex: 1,
                        marginBottom: 16,
                        overflow: 'hidden',
                        maxHeight: expandedPosts[post._id] ? 'none' : '8em'
                      }}
                    >
                      <span dangerouslySetInnerHTML={{ __html: excerptContent }} />
                    </Paragraph>

                    {isLong && (
                      <Button
                        type="link"
                        onClick={() => toggleExpand(post._id)}
                        style={{ padding: 0, marginBottom: 16, alignSelf: 'flex-start', fontWeight: 600 }}
                      >
                        {expandedPosts[post._id] ? 'Show Less' : 'Read More'}
                      </Button>
                    )}

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
              );
            })}
          </Row>

          {isEmbed && posts.length >= 3 && (
            <div style={{ textAlign: "center", marginTop: 40 }}>
              <Button 
                type="primary" 
                size="large" 
                href={`/blog/${blogData.slug}`} 
                target="_parent"
                style={{ borderRadius: 8, padding: '0 32px', height: 48, fontSize: 16, fontWeight: 600, boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)' }}
              >
                View More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BlogEmbedView;