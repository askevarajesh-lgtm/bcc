import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Typography, Result, Spin, Tag, Breadcrumb } from "antd";
import { Calendar, User } from "lucide-react";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

const BlogPostEmbedView = () => {
  const { blogSlug, postSlug } = useParams();
  const [blogData, setBlogData] = useState(null);
  const [postData, setPostData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Same as BlogEmbedView: the API returns the theme (font + brand color) of
  // whichever website this blog is linked to, so a post matches the site it
  // belongs to instead of always using the browser's default font/colors.
  const themeFont = blogData?.websiteTheme?.fontFamily || "Inter";
  const themeColor = blogData?.websiteTheme?.primaryColor || "#3b82f6";
  const googleFontHref = `https://fonts.googleapis.com/css2?family=${themeFont.replace(/ /g, "+")}:wght@400;600;700;800;900&display=swap`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/blogs/slug/${blogSlug}/public`);
        const data = await res.json();
        if (data.success && data.data) {
          setBlogData(data.data);
          const post = data.data.posts.find(p => p.slug === postSlug);
          if (post) {
            setPostData(post);
          }
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchData();
  }, [blogSlug, postSlug]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "transparent" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!blogData || !postData) {
    return (
      <Result
        status="404"
        title="Post Not Found"
        subTitle="Sorry, the post you are looking for does not exist."
      />
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 20px", fontFamily: `'${themeFont}', 'Inter', sans-serif` }}>
      <link rel="stylesheet" href={googleFontHref} />
      <Breadcrumb style={{ marginBottom: 32 }}>
        <Breadcrumb.Item>
          <a href={`/blog/${blogData.slug}`} style={{ color: themeColor, fontWeight: 600 }}>{blogData.name}</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{postData.title}</Breadcrumb.Item>
      </Breadcrumb>
      
      <Title level={1} style={{ fontWeight: 900, marginBottom: 16 }}>{postData.title}</Title>

      {postData.featuredImageUrl && (
        <img
          src={postData.featuredImageUrl}
          alt={postData.title}
          style={{ width: "100%", maxHeight: 420, objectFit: "cover", borderRadius: 16, marginBottom: 32 }}
        />
      )}
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: '#64748b', fontSize: 14, fontWeight: 500, marginBottom: 32 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={16} /> {dayjs(postData.createdAt).format('MMMM D, YYYY')}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <User size={16} /> Admin
        </span>
      </div>

      {postData.categories && postData.categories.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          {postData.categories.map((cat, idx) => (
            <Tag key={idx} style={{ borderRadius: 4, fontWeight: 600, color: themeColor, background: `${themeColor}1a`, border: `1px solid ${themeColor}40` }}>{cat}</Tag>
          ))}
        </div>
      )}

      {postData.content ? (
        <div 
          style={{ fontSize: 18, lineHeight: 1.8, color: '#334155' }}
          dangerouslySetInnerHTML={{ __html: postData.content }}
        />
      ) : (
        <div
          style={{ fontSize: 18, lineHeight: 1.8, color: '#334155' }}
          dangerouslySetInnerHTML={{ __html: postData.excerpt || "No content provided." }}
        />
      )}
    </div>
  );
};

export default BlogPostEmbedView;