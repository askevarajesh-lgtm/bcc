import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Upload, message, Spin, Empty, Select } from 'antd';
import { Upload as UploadIcon, Search, FolderPlus, Grid, List, Image as ImageIcon } from 'lucide-react';

const { Search: SearchInput } = Input;

const MediaStorageModal = ({ isOpen, onClose, onSelectImage }) => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch('/api/media', {
        headers: { "Authorization": token ? `Bearer ${token}` : "" }
      });
      const data = await res.json();
      if (data.success) {
        setMedia(data.data);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load media");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen]);

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
        message.success("Image uploaded successfully!");
        setMedia([data.data, ...media]);
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

  const filteredMedia = media.filter(m => m.filename.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <Modal
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span style={{ fontSize: 20, fontWeight: 700 }}>Media Storage</span>
          <div style={{ display: 'flex', gap: 12, marginRight: 24 }}>
            <Button icon={<FolderPlus size={16} />}>New folder</Button>
            <Upload beforeUpload={handleUpload} showUploadList={false} accept="image/*">
              <Button type="primary" icon={<UploadIcon size={16} />} loading={uploading}>Upload</Button>
            </Upload>
          </div>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={1000}
      bodyStyle={{ height: 600, overflowY: 'auto', padding: '24px' }}
      closeIcon={<span style={{ fontSize: 18 }}>✕</span>}
    >
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, flex: 1 }}>
          <Button>Select</Button>
          <SearchInput 
            placeholder="Search all images..." 
            style={{ width: 300 }} 
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Select defaultValue="newest" style={{ width: 180 }}>
            <Select.Option value="newest">Modified: newest first</Select.Option>
            <Select.Option value="oldest">Modified: oldest first</Select.Option>
          </Select>
          <Button.Group>
            <Button icon={<Grid size={16} />} type="primary" ghost />
            <Button icon={<List size={16} />} />
          </Button.Group>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Spin tip="Loading images..." />
        </div>
      ) : filteredMedia.length === 0 ? (
        <Empty description="No images found. Upload one to get started!" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          {filteredMedia.map(item => (
            <div 
              key={item._id} 
              style={{ 
                border: '1px solid #e2e8f0', 
                borderRadius: 8, 
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => onSelectImage(item.url)}
              className="media-item-card"
            >
              <div style={{ height: 140, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                  src={item.url} 
                  alt={item.filename} 
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                />
              </div>
              <div style={{ padding: '8px 12px', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
                <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.filename}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                  {item.format?.toUpperCase()} • {Math.round(item.size / 1024)} KB
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        .media-item-card:hover {
          border-color: var(--accent-primary) !important;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
          transform: translateY(-2px);
        }
      `}} />
    </Modal>
  );
};

export default MediaStorageModal;
