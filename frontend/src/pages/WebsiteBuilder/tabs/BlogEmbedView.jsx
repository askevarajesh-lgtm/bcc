import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { ConfigProvider, Typography, Result, Spin, Card, Row, Col, Tag, Button } from "antd";
import { Calendar, User } from "lucide-react";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const BlogEmbedView = () => {
  const { blogId, blogSlug } = useParams();
  const [searchParams] = useSearchParams();
  const [blogData, setBlogData] = useState(null);
  const [loading, setLoading] = useState(true);

  const themeFont = searchParams.get("font") || blogData?.websiteTheme?.fontFamily || "Inter";
  const themeColor = searchParams.get("color") || blogData?.websiteTheme?.primaryColor || "#3b82f6";
  const googleFontHref = `https://fonts.googleapis.com/css2?family=${themeFont.replace(/ /g, "+")}:wght@400;600;700;800;900&display=swap`;

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
    <ConfigProvider theme={{ token: { fontFamily: `'${themeFont}', 'Inter', sans-serif` } }}>
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 20px", fontFamily: `'${themeFont}', 'Inter', sans-serif` }}>
      <link rel="stylesheet" href={googleFontHref} />
      <style>{`
        .excerpt-content, .excerpt-content * { background-color: transparent !important; }
        .excerpt-content p { margin: 0; }
        .blog-card-excerpt {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
          overflow: hidden;
          text-overflow: ellipsis;
          min-height: 0;
        }
      `}</style>
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
          <Row gutter={[32, 32]} align="stretch">
            {displayedPosts.map(post => {
              const postUrl = `/blog/${blogData.slug}/${post.slug}`;
              const postWebsiteId = post.websiteId || blogData.websiteId;
              const postPreviewUrl = postWebsiteId
                ? `/preview/website/${postWebsiteId}/blog-post/${post._id}`
                : postUrl;

              const excerptHtml = post.excerpt?.trim() || '';
              const fallbackPlainText = !excerptHtml && post.content
                ? post.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
                : '';

              const rawExcerpt = excerptHtml || fallbackPlainText || 'Read the full post for more details.';

              const WORD_LIMIT = 30;
              const plainForTruncation = excerptHtml
                ? excerptHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
                : rawExcerpt;
              const words = plainForTruncation.split(' ').filter(Boolean);
              const isTruncated = words.length > WORD_LIMIT;
              const excerptContent = isTruncated
                ? `${words.slice(0, WORD_LIMIT).join(' ')}...`
                : rawExcerpt;

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
                          <Tag key={idx} style={{ borderRadius: 4, fontWeight: 600, color: themeColor, background: `${themeColor}1a`, border: `1px solid ${themeColor}40` }}>{cat}</Tag>
                        ))}
                      </div>
                    )}
                    <Title level={4} style={{ marginTop: 0, marginBottom: 12, fontWeight: 800, lineHeight: 1.4 }}>
                      <a href={postUrl} style={{ color: 'inherit', textDecoration: 'none' }} target="_parent">
                        {post.title}
                      </a>
                    </Title>

                    <div
                      className="excerpt-content blog-card-excerpt"
                      style={{
                        color: '#475569',
                        fontSize: 15,
                        lineHeight: 1.6,
                        flex: 1,
                        minHeight: 0,
                        marginBottom: 16
                      }}
                      dangerouslySetInnerHTML={{ __html: excerptContent }}
                    />

                    {/* {isTruncated && ( */}
                      <Button
                        type="link"
                        href={postPreviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ padding: 0, marginBottom: 16, alignSelf: 'flex-start', fontWeight: 600, color: themeColor }}
                      >
                        Read More
                      </Button>
                    {/* )} */}

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
                // type="primary" 
                size="large" 
                href={`/blog/${blogData.slug}`} 
                target="_parent"
                style={{ borderRadius: 8, padding: '0 32px', height: 48, fontSize: 16, fontWeight: 600, background: themeColor, borderColor: themeColor, boxShadow: `0 4px 14px 0 ${themeColor}66`}}
              >
                View More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
    </ConfigProvider>
  );
};

export default BlogEmbedView;