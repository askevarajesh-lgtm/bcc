import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Typography, Card, Table, Button, Tag, Space, Modal, Input, message, Drawer, Select, Tooltip } from "antd";
import { ArrowLeft, ExternalLink, Plus, Edit2, Trash2, FileText, CheckCircle, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const WordPressPages = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("publish");

  useEffect(() => {
    fetchPages();
  }, [id]);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/wordpress/${id}/pages`, {
        headers: { "Authorization": token ? `Bearer ${token}` : "" }
      });
      const data = await res.json();
      if (data.success) {
        setPages(data.data);
      } else {
        message.error("Failed to fetch WordPress pages");
      }
    } catch (err) {
      console.error(err);
      message.error("Error fetching pages");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(location.pathname.replace(/\/pages$/, '/dashboard'));
  };

  const openDrawer = (page = null) => {
    if (page) {
      setEditingPage(page);
      setTitle(page.title?.raw || page.title?.rendered || "");
      setContent(page.content?.raw || page.content?.rendered || "");
      setStatus(page.status || "publish");
    } else {
      setEditingPage(null);
      setTitle("");
      setContent("");
      setStatus("publish");
    }
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setEditingPage(null);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      message.error("Title is required");
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        title,
        content,
        status
      };
      
      const endpoint = editingPage 
        ? `/api/wordpress/${id}/pages/${editingPage.id}`
        : `/api/wordpress/${id}/pages`;
        
      const method = editingPage ? "PUT" : "POST";
      
      const res = await fetch(endpoint, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "" 
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (data.success) {
        message.success(`Page ${editingPage ? 'updated' : 'created'} successfully`);
        closeDrawer();
        fetchPages();
      } else {
        message.error(data.message || "Failed to save page");
      }
    } catch (err) {
      console.error(err);
      message.error("Error saving page");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (pageId) => {
    Modal.confirm({
      title: <div style={{ fontSize: 18, fontWeight: 900 }}>Delete this page?</div>,
      content: <div style={{ fontWeight: 500 }}>This will move the page to trash in WordPress.</div>,
      okText: "Yes, delete",
      cancelText: "Cancel",
      okButtonProps: { danger: true, style: { borderRadius: 8, fontWeight: 700 } },
      cancelButtonProps: { style: { borderRadius: 8, fontWeight: 600 } },
      className: "glassmorphism-modal",
      onOk: async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`/api/wordpress/${id}/pages/${pageId}`, {
            method: "DELETE",
            headers: { "Authorization": token ? `Bearer ${token}` : "" }
          });
          const data = await res.json();
          if (data.success) {
            message.success("Page deleted successfully");
            fetchPages();
          } else {
            message.error(data.message || "Failed to delete page");
          }
        } catch (err) {
          message.error("Error deleting page");
        }
      }
    });
  };

  const columns = [
    {
      title: "TITLE",
      dataIndex: "title",
      key: "title",
      render: (t, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0, 115, 170, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={16} color="#0073AA" />
          </div>
          <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 15 }} dangerouslySetInnerHTML={{ __html: t.rendered || '(No title)' }}></span>
        </div>
      )
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      render: (t) => {
        const isPublished = t === 'publish';
        return (
          <Tag style={{ 
            margin: 0, 
            borderRadius: 12, 
            border: 'none', 
            background: isPublished ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-secondary)', 
            color: isPublished ? 'var(--accent-success)' : 'var(--text-tertiary)', 
            fontWeight: 800, 
            padding: '2px 10px',
            textTransform: 'uppercase'
          }}>
            {t}
          </Tag>
        );
      }
    },
    {
      title: "DATE",
      dataIndex: "date",
      key: "date",
      render: (t) => <Text style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{new Date(t).toLocaleDateString()}</Text>
    },
    {
      title: "ACTIONS",
      key: "actions",
      align: "right",
      render: (_, r) => (
        <Space size="middle">
          <Tooltip title="Preview">
            <Button type="text" icon={<ExternalLink size={16} color="var(--text-secondary)" />} onClick={() => window.open(r.link, '_blank')} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button type="text" icon={<Edit2 size={16} color="var(--accent-info)" />} onClick={() => openDrawer(r)} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button type="text" danger icon={<Trash2 size={16} />} onClick={() => handleDelete(r.id)} />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, cursor: 'pointer', color: '#0073AA', fontWeight: 700 }} onClick={handleBack}>
        <ArrowLeft size={16} /> Back to Dashboard
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <Title level={2} style={{ margin: '0 0 8px', color: 'var(--text-primary)', fontWeight: 900 }}>WordPress Pages</Title>
          <Text type="secondary" style={{ fontSize: 15, fontWeight: 500 }}>Manage pages synchronized with your remote WordPress installation.</Text>
        </div>
        
        <Space>
          <Button size="large" icon={<RefreshCcw size={16} />} onClick={fetchPages} loading={loading} style={{ borderRadius: 8, fontWeight: 700, borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
            Sync
          </Button>
          <Button size="large" type="primary" icon={<Plus size={16} />} onClick={() => openDrawer()} style={{ borderRadius: 8, fontWeight: 800, background: '#0073AA', border: 'none' }}>
            New Page
          </Button>
        </Space>
      </div>

      <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}>
        <Table 
          columns={columns} 
          dataSource={pages} 
          rowKey="id" 
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            position: ['bottomCenter']
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      <Drawer
        title={<div style={{ fontSize: 18, fontWeight: 900 }}>{editingPage ? 'Edit WordPress Page' : 'Create WordPress Page'}</div>}
        width={600}
        onClose={closeDrawer}
        open={drawerVisible}
        bodyStyle={{ paddingBottom: 80, background: 'var(--bg-primary)' }}
        extra={
          <Space>
            <Button onClick={closeDrawer} style={{ borderRadius: 8, fontWeight: 700 }}>Cancel</Button>
            <Button onClick={handleSave} type="primary" loading={saving} style={{ background: '#0073AA', border: 'none', borderRadius: 8, fontWeight: 800 }}>
              {editingPage ? 'Update Page' : 'Publish Page'}
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: 0.5, marginBottom: 8 }}>PAGE TITLE <span style={{ color: "var(--accent-danger)" }}>*</span></div>
          <Input 
            size="large"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. About Us"
            style={{ borderRadius: 8, fontWeight: 600, fontSize: 16 }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: 0.5, marginBottom: 8 }}>PUBLICATION STATUS</div>
          <Select size="large" value={status} onChange={setStatus} style={{ width: '100%' }} dropdownStyle={{ borderRadius: 8 }}>
            <Option value="publish">Published</Option>
            <Option value="draft">Draft</Option>
            <Option value="pending">Pending Review</Option>
            <Option value="private">Private</Option>
          </Select>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: 0.5, marginBottom: 8 }}>PAGE CONTENT (HTML SUPPORTED)</div>
          <TextArea
            rows={15}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="<h1>Welcome to my site!</h1><p>This is my new page content...</p>"
            style={{ borderRadius: 8, fontFamily: 'monospace', fontSize: 13, background: 'var(--bg-secondary)' }}
          />
          <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
            Note: The content you enter here will be directly rendered by your WordPress theme. You can use standard HTML tags.
          </Text>
        </div>
      </Drawer>
    </div>
  );
};

export default WordPressPages;
