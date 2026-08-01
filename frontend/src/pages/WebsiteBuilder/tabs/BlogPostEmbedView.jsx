import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ConfigProvider, Typography, Result, Spin, Tag, Breadcrumb } from "antd";
import { Calendar, User } from "lucide-react";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

const DEFAULT_FEATURED_IMAGE_ASPECT_RATIO = "16/9";
const LEGACY_DEFAULT_FEATURED_IMAGE_HEIGHT = "280px";
const normalizeFeaturedImageHeight = (html) => {
  if (!html) return html;
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const img = doc.querySelector('[data-post-field="image"]');
    if (img) {
      // A fixed pixel height (e.g. the old 280px default, tuned for the
      // builder's own canvas width) looks squashed or overly tall once the
      // same image renders in a narrower/wider container. Only swap it for a
      // proportional aspect-ratio when the height is missing or still the
      // untouched legacy default — a real resize (any other height value)
      // reflects a deliberate choice in the builder, so leave that alone and
      // just strip the stale max-height below.
      if (!img.style.aspectRatio && (!img.style.height || img.style.height === LEGACY_DEFAULT_FEATURED_IMAGE_HEIGHT)) {
        img.style.removeProperty("height");
        img.style.aspectRatio = DEFAULT_FEATURED_IMAGE_ASPECT_RATIO;
      }
      // max-height is a stale leftover from the old insert default even after
      // the image was resized larger in the builder, which clamps it back
      // down. aspect-ratio/height + object-fit:cover already size it correctly.
      img.style.removeProperty("max-height");
      if (!img.style.objectFit) img.style.objectFit = "cover";
    }
    return doc.body.innerHTML;
  } catch (err) {
    console.error("Failed to normalize featured image height", err);
    return html;
  }
};

const BlogPostEmbedView = () => {
  const { blogSlug, postSlug } = useParams();
  const [blogData, setBlogData] = useState(null);
  const [postData, setPostData] = useState(null);
  const [loading, setLoading] = useState(true);
  const themeFont = blogData?.websiteTheme?.fontFamily || "Inter";
  const themeColor = blogData?.websiteTheme?.primaryColor || "var(--accent-primary)";
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
  const siteHeaderHtml = blogData.siteHeaderHtml || "";
  const siteFooterHtml = blogData.siteFooterHtml || "";
  const siteStylesheetUrls = blogData.siteStylesheetUrls || [];
  const hasBuiltLayout = !!postData.html;

  return (
    <ConfigProvider theme={{ token: { fontFamily: `'${themeFont}', 'Outfit', sans-serif` } }}>
    <div style={{ fontFamily: `'${themeFont}', 'Outfit', sans-serif`, '--site-font': `'${themeFont}', sans-serif`, '--brand-color': themeColor }}>
      <link rel="stylesheet" href={googleFontHref} />
      {siteStylesheetUrls.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
      <style>{`
        [data-post-field="faq"], [data-post-field="faq"] *, .faq-item, .faq-item * { font-family: var(--site-font) !important; }
        [data-post-field="faq"] > div:first-child > span:first-child > span:first-child,
        .faq-item summary span[style*="border-radius:999px"] { background: var(--brand-color) !important; }
        [data-post-field="faq"] h2 span { color: var(--brand-color) !important; }
        [data-post-field="faq"] > div:first-child > span:first-child {
          background: color-mix(in srgb, var(--brand-color) 10%, transparent) !important;
          border-color: color-mix(in srgb, var(--brand-color) 20%, transparent) !important;
        }
        .bcc-brand-bg { background: var(--brand-color) !important; }
        .bcc-brand-text { color: var(--brand-color) !important; }
        .bcc-brand-tint { background: color-mix(in srgb, var(--brand-color) 10%, transparent) !important; border-color: color-mix(in srgb, var(--brand-color) 20%, transparent) !important; }
        /* Posts saved before the featured-image max-height fix can still carry
           a stale max-height:280px alongside a larger resized height, which
           clamps the image back down. Neutralize it here as a safety net. */
        [data-post-field="image"] { max-height: none !important; }
        /* Match the GrapesJS canvas/preview's own render-time override: top-level
           sections stretch to the full page width instead of keeping whatever
           narrow width they had in the builder's canvas, so a "Read More" click
           shows the same layout the post looks like in the builder. */
        .bcc-post-built-layout > * {
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box;
        }
        ${postData.css || ""}
      `}</style>

      {hasBuiltLayout ? (
        // Rendered exactly like BlogPostPreviewView.jsx: the saved html already
        // includes its own header/footer/content, so it's rendered as-is with
        // no extra wrapper.
        <div className="bcc-post-built-layout" dangerouslySetInnerHTML={{ __html: normalizeFeaturedImageHeight(postData.html) }} />
      ) : (
        <>
          {siteHeaderHtml && (
            <div dangerouslySetInnerHTML={{ __html: siteHeaderHtml }} />
          )}
          <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 20px" }}>
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
                style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 16, marginBottom: 32 }}
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
        </>
      )}
      {!hasBuiltLayout && siteFooterHtml && (
        <div dangerouslySetInnerHTML={{ __html: siteFooterHtml }} />
      )}
    </div>
    </ConfigProvider>
  );
};

export default BlogPostEmbedView;