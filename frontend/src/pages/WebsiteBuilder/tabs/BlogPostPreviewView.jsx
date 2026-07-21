import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const buildFallbackHtml = (post, themeFont, themeColor) => {
  const hasAnyContent =
    post.title || post.excerpt || post.featuredImageUrl || (post.faqs && post.faqs.length > 0);

  if (!hasAnyContent) {
    return `<div style="padding:40px;text-align:center;font-family:'${themeFont}',sans-serif;">This post is currently empty.</div>`;
  }

  const image = post.featuredImageUrl
    ? `<img src="${post.featuredImageUrl}" alt="${post.title || ""}" style="width:100%; max-height:420px; object-fit:cover; border-radius:12px; margin-bottom:28px;" />`
    : "";

  const excerpt = post.excerpt
    ? `<div style="font-size:17px; color:#334155; line-height:1.7; margin-bottom:32px;">${post.excerpt}</div>`
    : "";

  const faqs = Array.isArray(post.faqs) && post.faqs.length > 0
    ? `
      <div style="margin-top:40px; padding-top:32px; border-top:1px solid #e2e8f0;">
        <h2 style="font-size:24px; font-weight:800; margin:0 0 20px; color:#0f172a;">Frequently Asked Questions</h2>
        ${post.faqs
          .map(
            (item) => `
          <details style="background:#ffffff; border:1px solid #e2e8f0; border-radius:16px; padding:20px 24px; margin-bottom:16px; box-shadow:0 1px 2px rgba(15,23,42,0.04);">
            <summary style="list-style:none; cursor:pointer; margin:0; display:flex; align-items:center; justify-content:space-between; gap:16px;">
              <span style="font-weight:700; font-size:16px; color:#0f172a;">${item.question || ""}</span>
              <span style="flex-shrink:0; width:32px; height:32px; border-radius:999px; background:${themeColor}; display:flex; align-items:center; justify-content:center;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </span>
            </summary>
            <div style="font-size:15px; color:#64748b; line-height:1.7; margin-top:12px;">${item.answer || ""}</div>
          </details>`
          )
          .join("")}
      </div>`
    : "";

  return `
    <div style="max-width:760px; margin:0 auto; padding:56px 24px; font-family:'${themeFont}', sans-serif;">
      <h1 style="font-size:36px; font-weight:800; line-height:1.2; margin:0 0 24px; color:#0f172a;">${post.title || "Untitled post"}</h1>
      ${image}
      ${excerpt}
      ${faqs}
      <div style="margin-top:40px; padding:16px 20px; background:#fffbeb; border:1px solid #fde68a; border-radius:12px; font-size:13px; color:#92400e;">
        This post hasn't been built in the page builder yet, so only its basic details are shown here. Open <strong>Edit in Builder</strong> to design the full layout.
      </div>
    </div>`;
};

const BlogPostPreviewView = () => {
  const { postId } = useParams();
  const [postData, setPostData] = useState(null);
  const [loading, setLoading] = useState(true);
  const themeFont = postData?.websiteTheme?.fontFamily || "Inter";
  const themeColor = postData?.websiteTheme?.primaryColor || "#3b82f6";
  const googleFontHref = `https://fonts.googleapis.com/css2?family=${themeFont.replace(/ /g, "+")}:wght@300;400;500;600;700;800;900&display=swap`;

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: token ? `Bearer ${token}` : "" };
        const res = await fetch(`/api/blogs/posts/${postId}`, { headers });
        const data = await res.json();
        if (data.success) {
          setPostData(data.data);
        }
      } catch (err) {
        console.error("Error fetching post preview", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = googleFontHref;
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, [googleFontHref]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "Inter, sans-serif",
        }}
      >
        Loading preview...
      </div>
    );
  }

  if (!postData) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          fontFamily: "Inter, sans-serif",
        }}
      >
        Post not found.
      </div>
    );
  }

  return (
    <iframe
      title={`Preview ${postData.title}`}
      srcDoc={`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>${postData.title}</title>
          <link href="${googleFontHref}" rel="stylesheet">
          <style>
            :root {
              --site-font: '${themeFont}', 'Inter', sans-serif;
              --brand-color: ${themeColor};
            }
            body {
              margin: 0;
              padding: 0;
              background: #fff;
              font-family: var(--site-font);
            }
            ${postData.css || ""}
          </style>
        </head>
        <body>
          ${postData.html || buildFallbackHtml(postData, themeFont, themeColor)}
        </body>
        </html>
      `}
      style={{
        width: "100vw",
        height: "100vh",
        border: "none",
        display: "block",
      }}
    />
  );
};

export default BlogPostPreviewView;