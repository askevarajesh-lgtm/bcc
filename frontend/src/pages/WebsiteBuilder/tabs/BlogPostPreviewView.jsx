import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const BlogPostPreviewView = () => {
  const { postId } = useParams();
  const [postData, setPostData] = useState(null);
  const [loading, setLoading] = useState(true);

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
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

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
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            body { margin: 0; padding: 0; background: #fff; }
            ${postData.css || ""}
          </style>
        </head>
        <body>
          ${postData.html || '<div style="padding:40px;text-align:center;font-family:sans-serif;">This post is currently empty.</div>'}
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
