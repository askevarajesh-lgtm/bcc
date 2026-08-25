import React, { useState, useEffect, useRef } from 'react';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import webpagePlugin from 'grapesjs-preset-webpage';
import { Button, message, Space } from 'antd';
import { ArrowLeft, Save } from 'lucide-react';
import { getStorageData, setStorageData } from '../utils/storage';

const EcommerceGrapesJS = ({ templateId, initialHtml, initialCss, onBack, onSave }) => {
  const editorRef = useRef(null);
  const [editor, setEditor] = useState(null);
  const workspaceId = 'default';
  const websiteId = 'default';

  useEffect(() => {
    if (!editorRef.current) return;

    const e = grapesjs.init({
      container: editorRef.current,
      fromElement: true,
      height: '100%',
      width: 'auto',
      storageManager: false,
      plugins: [webpagePlugin],
      pluginsOpts: {
        'grapesjs-preset-webpage': {},
      },
      canvas: {
        styles: [
          'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'
        ],
      },
    });

    e.on('load', () => {
      if (initialHtml) {
        e.setComponents(initialHtml);
      }
      if (initialCss) {
        e.setStyle(initialCss);
      }
    });

    setEditor(e);

    return () => {
      e.destroy();
    };
  }, []);

  const handleSave = () => {
    if (!editor) return;
    const html = editor.getHtml();
    const css = editor.getCss();
    
    // Save to local storage under templates
    const templates = getStorageData(workspaceId, websiteId, 'templates', {});
    templates[templateId] = {
      ...templates[templateId],
      html,
      css,
      updatedAt: new Date().toISOString()
    };
    setStorageData(workspaceId, websiteId, 'templates', templates);
    
    message.success('Template saved successfully!');
    if (onSave) onSave(html, css);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 60, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1e293b', color: 'white' }}>
        <Space>
          <Button type="text" icon={<ArrowLeft size={16} />} style={{ color: 'white' }} onClick={onBack}>
            Back
          </Button>
          <span style={{ fontWeight: 600 }}>Store Builder ({templateId})</span>
        </Space>
        <Button type="primary" icon={<Save size={16} />} onClick={handleSave}>
          Save Template
        </Button>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={editorRef} style={{ height: '100%', width: '100%' }} />
      </div>
    </div>
  );
};

export default EcommerceGrapesJS;
