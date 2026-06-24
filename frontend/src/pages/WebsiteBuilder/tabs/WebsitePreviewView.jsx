import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const WebsitePreviewView = () => {
  const { websiteId, pageId } = useParams();
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/websites/${websiteId}`, {
          headers: { "Authorization": token ? `Bearer ${token}` : "" }
        });
        const data = await res.json();
        if (data.success && data.data && data.data.pages) {
          const page = data.data.pages.find(p => p._id === pageId || p.key === pageId);
          setPageData(page);
        }
      } catch (err) {
        console.error("Error fetching preview", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [websiteId, pageId]);

  useEffect(() => {
    // Inject Inter font just in case
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter, sans-serif' }}>
        Loading preview...
      </div>
    );
  }

  if (!pageData) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
        Page not found.
      </div>
    );
  }

  return (
    <iframe
      title={`Preview ${pageData.title}`}
      srcDoc={`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>${pageData.title}</title>
          <style>
            body { margin: 0; padding: 0; background: #fff; }
            ${pageData.css || ''}
            /* Hide preloaders exactly like the builder view */
            #spinner, #preloader, .preloader, .loader-wrapper, .loader, .td-preloader-wrap {
              display: none !important;
              opacity: 0 !important;
              visibility: hidden !important;
              pointer-events: none !important;
              z-index: -9999 !important;
            }
            /* Specific Bootstrap 5 spinner overlay used in many templates */
            div.show.bg-white.position-fixed.translate-middle.w-100.vh-100 {
              display: none !important;
              opacity: 0 !important;
              visibility: hidden !important;
              pointer-events: none !important;
            }
          </style>
        </head>
        <body>
          ${pageData.html || '<div style="padding:40px;text-align:center;font-family:sans-serif;">This page is currently empty.</div>'}
        </body>
        </html>
      `}
      style={{ width: '100vw', height: '100vh', border: 'none', display: 'block' }}
    />
  );
};

export default WebsitePreviewView;
