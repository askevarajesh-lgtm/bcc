import React, { useEffect, useRef, useState } from 'react';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import webpagePlugin from 'grapesjs-preset-webpage';
import { Button, message } from 'antd';
import { ArrowLeft } from 'lucide-react';

const GrapesJSBuilder = ({ activeWebsite, activePage, setEditingPage, onSave }) => {
  const editorRef = useRef(null);
  const [editor, setEditor] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editorRef.current) return;

    const e = grapesjs.init({
      container: editorRef.current,
      fromElement: true,
      height: '100%',
      width: 'auto',
      storageManager: false, // We'll handle saving manually
      plugins: [webpagePlugin],
      pluginsOpts: {
        'grapesjs-preset-webpage': {
          // options for the preset
        }
      },
      canvas: {
        styles: [
          // Basic reset or custom styles
          'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap'
        ],
      }
    });

    // Load initial HTML/CSS if it exists
    if (activePage.html || activePage.css) {
      e.setComponents(activePage.html || '');
      e.setStyle(activePage.css || '');
    } else {
      // Default empty template
      e.setComponents('<div style="padding: 50px; text-align: center; font-family: Inter, sans-serif;"><h1>Welcome to Jeema Builder</h1><p>Start dragging blocks from the right panel to build your page!</p></div>');
    }

    setEditor(e);

    // Hide common HTML template preloaders/spiners inside the canvas
    e.on('load', () => {
      try {
        const doc = e.Canvas.getDocument();
        if (doc) {
          const style = doc.createElement('style');
          style.innerHTML = `
            /* Hide preloaders in builder so they don't block the canvas */
            #spinner, #preloader, .preloader, .loader-wrapper, .loader {
              display: none !important;
              opacity: 0 !important;
              visibility: hidden !important;
              pointer-events: none !important;
            }
            /* Specific Bootstrap 5 spinner overlay used in many templates */
            div.show.bg-white.position-fixed.translate-middle.w-100.vh-100 {
              display: none !important;
              opacity: 0 !important;
              visibility: hidden !important;
              pointer-events: none !important;
            }
          `;
          doc.head.appendChild(style);
        }
      } catch (err) {
        console.error("Error injecting canvas styles", err);
      }
    });

    return () => {
      e.destroy();
    };
  }, [activePage.html, activePage.css]);

  const handleSave = async () => {
    if (!editor) return;
    
    const html = editor.getHtml();
    const css = editor.getCss();
    
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/websites/${activeWebsite.key}/pages/${activePage._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ html, css })
      });
      const data = await res.json();
      if (data.success) {
        message.success('Page saved successfully!');
        onSave(data.data);
      } else {
        message.error(data.error || 'Failed to save page');
      }
    } catch (err) {
      console.error(err);
      message.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Custom Top Bar */}
      <div style={{ 
        height: '60px', 
        background: '#1a1a1a', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 24px',
        color: '#fff',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button 
            type="text" 
            style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }} 
            onClick={() => setEditingPage(null)}
          >
            <ArrowLeft size={16} /> Back
          </Button>
          <div style={{ fontWeight: 600, fontSize: '16px' }}>
            Jeema Builder: <span style={{ opacity: 0.7 }}>{activePage.title}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button type="primary" loading={saving} onClick={handleSave} style={{ background: '#3b82f6', border: 'none', fontWeight: 600 }}>
            Save
          </Button>
        </div>
      </div>

      {/* Editor Container */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div ref={editorRef} style={{ height: '100%' }}></div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .gjs-cv-canvas {
          top: 0;
          width: 100%;
          height: 100%;
        }
        /* Make sure GrapesJS panels do not overlap our top bar incorrectly if we use default layout */
        .gjs-editor {
          height: 100% !important;
        }
      `}} />
    </div>
  );
};

export default GrapesJSBuilder;
