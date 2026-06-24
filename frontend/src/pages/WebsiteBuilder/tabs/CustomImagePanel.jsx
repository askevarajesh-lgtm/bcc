import React, { useState, useEffect } from 'react';
import { Input, Select, Collapse, Button, Tooltip, Upload, message, Spin } from 'antd';
import { Image as ImageIcon, X, UploadCloud, RotateCcw } from 'lucide-react';

const { Panel } = Collapse;

const CustomImagePanel = ({ editor, selectedComponent, onClose, onOpenMedia }) => {
  const [src, setSrc] = useState('');
  const [alt, setAlt] = useState('');
  const [fit, setFit] = useState('');
  const [uploading, setUploading] = useState(false);
  
  
  useEffect(() => {
    if (selectedComponent && selectedComponent.is('image')) {
      const attributes = selectedComponent.getAttributes();
      const currentSrc = selectedComponent.get('src') || attributes.src || '';
      
      // Store the original template image source the first time we see it
      if (!attributes['data-original-src'] && currentSrc) {
        selectedComponent.addAttributes({ 'data-original-src': currentSrc });
      }

      setSrc(currentSrc);
      setAlt(attributes.alt || '');
      
      const style = selectedComponent.getStyle();
      setFit(style['object-fit'] || 'contain');
    }
  }, [selectedComponent]);

  const updateTrait = (name, value) => {
    if (!selectedComponent) return;
    if (name === 'src') {
      selectedComponent.set('src', value);
    }
    selectedComponent.addAttributes({ [name]: value });
  };

  const updateStyle = (name, value) => {
    if (!selectedComponent) return;
    const style = selectedComponent.getStyle();
    style[name] = value;
    selectedComponent.setStyle(style);
  };

  const handleSrcChange = (e) => {
    const val = e.target.value;
    setSrc(val);
    updateTrait('src', val);
  };

  const handleAltChange = (e) => {
    const val = e.target.value;
    setAlt(val);
    updateTrait('alt', val);
  };

  const handleFitChange = (val) => {
    setFit(val);
    updateStyle('object-fit', val);
  };

  const handleRevert = () => {
    if (!selectedComponent) return;
    const orig = selectedComponent.getAttributes()['data-original-src'];
    if (orig) {
      setSrc(orig);
      selectedComponent.set('src', orig);
      selectedComponent.addAttributes({ src: orig });
    }
  };

  const handleUpload = async (file) => {
    try {
      setUploading(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { "Authorization": token ? `Bearer ${token}` : "" },
        body: formData
      });
      
      const data = await res.json();
      if (data.success) {
        message.success("Image replaced successfully!");
        setSrc(data.data.url);
        updateTrait('src', data.data.url);
      } else {
        message.error(data.error || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      message.error("Upload failed");
    } finally {
      setUploading(false);
    }
    return false; // Prevent default Antd upload
  };

  if (!selectedComponent || !selectedComponent.is('image')) {
    return null;
  }

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: 320,
      height: '100%',
      backgroundColor: '#ffffff',
      borderLeft: '1px solid #e2e8f0',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.05)',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Image</h2>
          <Button type="text" icon={<X size={18} />} onClick={onClose} style={{ color: '#64748b' }} />
        </div>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 24, marginBottom: -1 }}>
          <div style={{ paddingBottom: 12, borderBottom: '2px solid #3b82f6', color: '#3b82f6', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            General
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px', flex: 1 }}>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 8 }}>Element Name</label>
          <Input defaultValue="Image" />
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Image</label>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Input 
              value={src} 
              onChange={handleSrcChange} 
              placeholder="https://..." 
              style={{ flex: 1 }}
            />
            <Upload beforeUpload={handleUpload} showUploadList={false} accept="image/*">
              <Tooltip title="Upload from computer">
                <Button icon={<ImageIcon size={16} />} loading={uploading} />
              </Tooltip>
            </Upload>
          </div>
          
          {/* Preview & Upload Area */}
          <Spin spinning={uploading} tip="Uploading...">
            <Upload beforeUpload={handleUpload} showUploadList={false} accept="image/*">
              <div style={{ 
                marginTop: 12, 
                height: 140, 
                background: '#f8fafc', 
                borderRadius: 8, 
                border: '1px dashed #cbd5e1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                cursor: 'pointer',
                position: 'relative',
                width: '270px'
              }}>
                {src ? (
                  <>
                    <img src={src} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    <div 
                      className="image-overlay"
                      style={{ 
                        position: 'absolute', 
                        inset: 0, 
                        background: 'rgba(0,0,0,0.6)', 
                        opacity: 0, 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: 'white', 
                        transition: 'opacity 0.2s', 
                        fontWeight: 600,
                        gap: 8
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                    >
                      <UploadCloud size={24} />
                      <span>Click to Replace Image</span>
                    </div>
                  </>
                ) : (
                  <div style={{ color: '#64748b', fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <UploadCloud size={24} />
                    <span>Click to Upload Image</span>
                  </div>
                )}
              </div>
            </Upload>
          </Spin>

          {/* Revert Button */}
          {selectedComponent && selectedComponent.getAttributes()['data-original-src'] && selectedComponent.getAttributes()['data-original-src'] !== src && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <Button 
                type="link" 
                icon={<RotateCcw size={14} />} 
                onClick={handleRevert}
                style={{ padding: 0, fontSize: 13, color: '#f59e0b' }}
              >
                Revert to Original
              </Button>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 8 }}>Alt Text (For SEO)</label>
          <Input value={alt} onChange={handleAltChange} placeholder="Describe this image" />
        </div>

        <Collapse bordered={false} defaultActiveKey={['options']} style={{ background: 'transparent', padding: 0 }}>
          <Panel header={<span style={{ fontWeight: 600, fontSize: 13 }}>Image options</span>} key="options" style={{ border: 'none', padding: 0 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 8 }}>Fit</label>
              <Select value={fit} onChange={handleFitChange} style={{ width: '100%' }}>
                <Select.Option value="contain">Contain (full image visible)</Select.Option>
                <Select.Option value="cover">Cover (fill the area)</Select.Option>
                <Select.Option value="fill">Fill (stretch)</Select.Option>
                <Select.Option value="none">None (original size)</Select.Option>
              </Select>
            </div>
          </Panel>
        </Collapse>
      </div>
    </div>
  );
};

export default CustomImagePanel;
