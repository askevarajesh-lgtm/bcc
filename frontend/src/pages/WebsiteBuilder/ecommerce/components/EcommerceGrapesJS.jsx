import React, { useState, useEffect, useRef } from 'react';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import webpagePlugin from 'grapesjs-preset-webpage';
import { Button, message, Space, Modal, Input } from 'antd';
import { ArrowLeft, Save } from 'lucide-react';
import { getStorageData, setStorageData } from '../utils/storage';

const EcommerceGrapesJS = ({ templateId, pageId, initialHtml, initialCss, assets = {}, initialName = '', onBack, onSave }) => {
  const editorRef = useRef(null);
  const [editor, setEditor] = useState(null);
  const [isNameModalVisible, setIsNameModalVisible] = useState(false);
  const [templateName, setTemplateName] = useState(initialName);
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
          'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
          ...Object.keys(assets)
            .filter(path => assets[path].ext === 'css' && assets[path].type === 'text')
            .map(path => `data:text/css;charset=utf-8,${encodeURIComponent(assets[path].content)}`)
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

  const handleSaveClick = () => {
    setIsNameModalVisible(true);
  };

  const handleConfirmSave = () => {
    if (!templateName || !templateName.trim()) {
      message.error('Template name is required');
      return;
    }
    if (templateName.trim().length > 100) {
      message.error('Template name is too long');
      return;
    }

    setIsNameModalVisible(false);

    if (!editor) return;
    const html = editor.getHtml();
    const css = editor.getCss();
    
    if (!pageId) {
      const templates = getStorageData(workspaceId, websiteId, 'templates', {});
      templates[templateId] = {
        ...templates[templateId],
        html,
        css,
        name: templateName.trim(),
        updatedAt: new Date().toISOString()
      };
      setStorageData(workspaceId, websiteId, 'templates', templates);
    }
    
    message.success('Template saved successfully!');
    if (onSave) onSave(html, css, templateName.trim());
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 60, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1e293b', color: 'white' }}>
        <Space>
          <Button type="text" icon={<ArrowLeft size={16} />} style={{ color: 'white' }} onClick={onBack}>
            Back
          </Button>
          <span style={{ fontWeight: 600 }}>Editing: {pageId || templateId}</span>
        </Space>
        <Button type="primary" icon={<Save size={16} />} onClick={handleSaveClick}>
          Save Template
        </Button>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={editorRef} style={{ height: '100%', width: '100%' }} />
      </div>
      <Modal
        title="Save Template"
        open={isNameModalVisible}
        onOk={handleConfirmSave}
        onCancel={() => setIsNameModalVisible(false)}
        okText="Save Template"
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Template Name</label>
          <Input 
            value={templateName} 
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="e.g. Modern Fashion Store"
            maxLength={100}
          />
        </div>
      </Modal>
    </div>
  );
};

export default EcommerceGrapesJS;
