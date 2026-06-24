import React, { useEffect, useRef, useState } from 'react';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import './grapesjs-theme.css'; // Premium custom theme override
import webpagePlugin from 'grapesjs-preset-webpage';
import { Button, message } from 'antd';
import { ArrowLeft } from 'lucide-react';
import CustomImagePanel from './CustomImagePanel';
import MediaStorageModal from './MediaStorageModal';

const GrapesJSBuilder = ({ activeWebsite, activePage, setEditingPage, onSave }) => {
  const editorRef = useRef(null);
  const [editor, setEditor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  useEffect(() => {
    if (!editorRef.current) return;

    const e = grapesjs.init({
      container: editorRef.current,
      fromElement: true,
      height: '100%',
      width: 'auto',
      storageManager: false, // We'll handle saving manually
      assetManager: {
        custom: {
          open() {
            setIsMediaModalOpen(true);
          },
          close() {
            setIsMediaModalOpen(false);
          }
        }
      },
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

    // Fetch forms and register them as GrapesJS blocks
    const loadForms = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/forms", {
          headers: { "Authorization": token ? `Bearer ${token}` : "" }
        });
        const data = await res.json();
        
        if (data.success && Array.isArray(data.data)) {
          data.data.forEach(form => {
            const embedUrl = `${window.location.origin}/embed/form/${form._id}`;
            const iframeCode = `<iframe src="${embedUrl}" title="${form.name}" style="width:100%; min-height:520px; border:0; border-radius:16px;"></iframe>`;
            
            e.BlockManager.add(`form-${form._id}`, {
              label: form.name,
              category: 'Forms',
              content: iframeCode,
              attributes: { class: 'fa fa-wpforms' }, // simple icon representation
            });
          });
        }
      } catch (err) {
        console.error("Failed to fetch forms for GrapesJS", err);
      }
    };

    // Fetch blogs and register them as GrapesJS blocks
    const loadBlogs = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/blogs", {
          headers: { "Authorization": token ? `Bearer ${token}` : "" }
        });
        const data = await res.json();
        
        if (data.success && Array.isArray(data.data)) {
          data.data.forEach(blog => {
            const embedUrl = `${window.location.origin}/embed/blog/${blog._id}`;
            const iframeCode = `<iframe src="${embedUrl}" title="${blog.name}" style="width:100%; min-height:600px; border:0; border-radius:16px;"></iframe>`;
            
            e.BlockManager.add(`blog-${blog._id}`, {
              label: blog.name,
              category: 'Blogs',
              content: iframeCode,
              attributes: { class: 'fa fa-newspaper-o' }, // FontAwesome newspaper icon
            });
          });
        }
      } catch (err) {
        console.error("Failed to fetch blogs for GrapesJS", err);
      }
    };

    loadForms();
    loadBlogs();

    // Hide common HTML template preloaders/spinners inside the canvas
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

      // Add 'src' to the image component's traits so it's easily editable in the Settings panel
      try {
        const domc = e.DomComponents;
        const imgType = domc.getType('image');
        if (imgType) {
          domc.addType('image', {
            model: {
              defaults: {
                traits: [
                  {
                    type: 'text',
                    label: 'Image URL',
                    name: 'src',
                    placeholder: 'https://example.com/image.jpg'
                  },
                  {
                    type: 'text',
                    label: 'Alt Text',
                    name: 'alt',
                    placeholder: 'eg. Text here'
                  }
                ]
              }
            }
          });
        }
      } catch (err) {
        console.error("Error updating image traits", err);
      }
    });

    e.on('component:selected', (component) => {
      setSelectedComponent(component);
    });
    
    e.on('component:deselected', () => {
      setSelectedComponent(null);
    });

    e.on('run:core:preview', () => setIsPreviewing(true));
    e.on('stop:core:preview', () => setIsPreviewing(false));

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
    <div className={`builder-container ${isPreviewing ? 'is-previewing' : ''}`} style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Custom Premium Top Bar */}
      {!isPreviewing && (
        <div style={{ 
        height: '60px', 
        background: '#0f172a', // Deep Navy from reference
        borderBottom: '1px solid #1e293b',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button 
            type="text" 
            icon={<ArrowLeft size={16} />} 
            onClick={() => setEditingPage(null)}
            style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', fontWeight: 600, padding: '4px 8px', borderRadius: 6 }}
          >
            Back
          </Button>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }}></div>
          <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: 15, letterSpacing: 0.3 }}>
            Jeema Builder: <span style={{ color: '#3b82f6' }}>{activePage.title}</span>
          </div>
        </div>
        
        <div>
          <Button 
            type="primary" 
            onClick={handleSave} 
            loading={saving}
            style={{ background: '#3b82f6', color: '#ffffff', border: 'none', fontWeight: 700, borderRadius: 6, padding: '0 20px', height: 36, boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)' }}
          >
            Save Changes
          </Button>
        </div>
      </div>
      )}

      {/* Editor Container */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div ref={editorRef} style={{ height: '100%' }}></div>
        
        {/* Custom Image Panel */}
        {!isPreviewing && selectedComponent && selectedComponent.is('image') && (
          <CustomImagePanel 
            editor={editor}
            selectedComponent={selectedComponent}
            onClose={() => editor.select(null)}
            onOpenMedia={() => setIsMediaModalOpen(true)}
          />
        )}
      </div>

      <MediaStorageModal 
        isOpen={isMediaModalOpen} 
        onClose={() => setIsMediaModalOpen(false)} 
        onSelectImage={(url) => {
          if (selectedComponent && selectedComponent.is('image')) {
            selectedComponent.addAttributes({ src: url });
          } else {
            // If they opened Asset Manager without selecting image (e.g. from top bar), GrapesJS expects asset to be added
            editor.AssetManager.add(url);
          }
          setIsMediaModalOpen(false);
        }}
      />
      
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
