import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Typography, Card, Button, Row, Col, Modal, message, Space, Spin, Tooltip, Image } from "antd";
import { ArrowLeft, ExternalLink, Plus, Trash2, Copy, RefreshCcw, Upload, File, ImageIcon, Video } from "lucide-react";

const { Title, Text } = Typography;

const WordPressMedia = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchMedia();
  }, [id]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/wordpress/${id}/media`, {
        headers: { "Authorization": token ? `Bearer ${token}` : "" }
      });
      const data = await res.json();
      if (data.success) {
        setMedia(data.data);
      } else {
        message.error("Failed to fetch WordPress media");
      }
    } catch (err) {
      console.error(err);
      message.error("Error fetching media");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(location.pathname.replace(/\/media$/, '/dashboard'));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/wordpress/${id}/media`, {
        method: "POST",
        headers: { "Authorization": token ? `Bearer ${token}` : "" },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        message.success("Media uploaded successfully");
        fetchMedia();
      } else {
        message.error(data.message || "Failed to upload media");
      }
    } catch (err) {
      console.error(err);
      message.error("Error uploading media");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = (mediaId) => {
    Modal.confirm({
      title: <div style={{ fontSize: 18, fontWeight: 900 }}>Delete this file?</div>,
      content: <div style={{ fontWeight: 500 }}>This will permanently delete the file from WordPress.</div>,
      okText: "Yes, delete",
      cancelText: "Cancel",
      okButtonProps: { danger: true, style: { borderRadius: 8, fontWeight: 700 } },
      cancelButtonProps: { style: { borderRadius: 8, fontWeight: 600 } },
      className: "glassmorphism-modal",
      onOk: async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`/api/wordpress/${id}/media/${mediaId}`, {
            method: "DELETE",
            headers: { "Authorization": token ? `Bearer ${token}` : "" }
          });
          const data = await res.json();
          if (data.success) {
            message.success("File deleted successfully");
            fetchMedia();
          } else {
            message.error(data.message || "Failed to delete file");
          }
        } catch (err) {
          message.error("Error deleting file");
        }
      }
    });
  };

  const copyLink = (url) => {
    navigator.clipboard.writeText(url);
    message.success("Link copied to clipboard");
  };

  const renderMediaItem = (item) => {
    const isImage = item.media_type === 'image';
    const isVideo = item.mime_type?.startsWith('video/');
    const url = item.source_url;
    
    return (
      <Card 
        key={item.id}
        hoverable 
        bodyStyle={{ padding: 12, display: 'flex', flexDirection: 'column' }} 
        style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)', height: '100%' }}
        cover={
          <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)', position: 'relative', overflow: 'hidden' }}>
            {isImage ? (
              <Image src={url} alt={item.title?.rendered} style={{ objectFit: 'cover', width: '100%', height: 160 }} preview={{ src: url }} />
            ) : isVideo ? (
              <Video size={48} color="var(--text-tertiary)" />
            ) : (
              <File size={48} color="var(--text-tertiary)" />
            )}
          </div>
        }
      >
        <div style={{ flex: 1 }}>
          <Text strong ellipsis style={{ display: 'block', fontSize: 14, marginBottom: 4, color: 'var(--text-primary)' }}>
            {item.title?.rendered || 'Untitled'}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-color)' }}>
          <Tooltip title="Copy Link">
            <Button type="text" size="small" icon={<Copy size={16} color="var(--text-secondary)" />} onClick={() => copyLink(url)} />
          </Tooltip>
          <Tooltip title="Open">
            <Button type="text" size="small" icon={<ExternalLink size={16} color="var(--accent-info)" />} onClick={() => window.open(url, '_blank')} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button type="text" size="small" danger icon={<Trash2 size={16} />} onClick={() => handleDelete(item.id)} />
          </Tooltip>
        </div>
      </Card>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, cursor: 'pointer', color: '#f59e0b', fontWeight: 700 }} onClick={handleBack}>
        <ArrowLeft size={16} /> Back to Dashboard
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <Title level={2} style={{ margin: '0 0 8px', color: 'var(--text-primary)', fontWeight: 900 }}>Media Library</Title>
          <Text type="secondary" style={{ fontSize: 15, fontWeight: 500 }}>Upload and manage images and documents synchronized with WordPress.</Text>
        </div>
        
        <Space>
          <Button size="large" icon={<RefreshCcw size={16} />} onClick={fetchMedia} loading={loading} style={{ borderRadius: 8, fontWeight: 700, borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
            Sync
          </Button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileChange}
            accept="image/*,video/*,application/pdf"
          />
          <Button 
            size="large" 
            type="primary" 
            icon={<Upload size={16} />} 
            onClick={() => fileInputRef.current?.click()} 
            loading={uploading}
            style={{ borderRadius: 8, fontWeight: 800, background: '#f59e0b', border: 'none' }}
          >
            Upload Media
          </Button>
        </Space>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      ) : media.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '40px 0', borderRadius: 16, border: '1px dashed var(--border-color)', background: 'var(--bg-secondary)' }}>
          <ImageIcon size={48} color="var(--text-tertiary)" style={{ marginBottom: 16 }} />
          <Title level={5} style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>No media files found</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>Upload your first image or document to see it here.</Text>
          <Button type="primary" onClick={() => fileInputRef.current?.click()} style={{ borderRadius: 8, fontWeight: 700, background: '#f59e0b', border: 'none' }}>
            Upload Now
          </Button>
        </Card>
      ) : (
        <Row gutter={[24, 24]}>
          {media.map((item) => (
            <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
              {renderMediaItem(item)}
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default WordPressMedia;
