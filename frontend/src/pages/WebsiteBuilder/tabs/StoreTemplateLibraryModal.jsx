import React, { useState, useEffect, useRef } from "react";
import { Modal, Input, Checkbox, Button, Typography, Space, Row, Col, Card, Tag, message, Spin } from "antd";
import { Store, X as CloseIcon, Search as SearchIcon, CheckCircle, Upload as UploadIcon } from "lucide-react";

const { Title, Text } = Typography;

const StoreTemplateLibraryModal = ({ open, onCancel, onCreate, initialStoreName }) => {
  const [storeName, setStoreName] = useState(initialStoreName || "");
  const [installDemo, setInstallDemo] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/templates?type=store", {
        headers: { "Authorization": token ? `Bearer ${token}` : "" }
      });
      const data = await res.json();
      if (data.success) {
        setTemplates(data.data.templates);
        const catNames = ["All", ...data.data.categories.map(c => c.name)];
        setCategories(catNames);
      }
    } catch (error) {
      console.error("Error fetching store templates:", error);
      message.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleZipUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploadingTemplate(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", file.name.replace(".zip", ""));
    formData.append("type", "store");
    formData.append("category", "Custom Uploads");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/templates/upload", {
        method: "POST",
        headers: {
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        message.success({ content: 'Template uploaded successfully', key: 'upload' });
        await fetchTemplates();
        if (data.data && data.data._id) {
          setSelectedTemplate(data.data._id);
          setSelectedCategory("All");
        }
      } else {
        message.error({ content: data.error || 'Failed to upload', key: 'upload' });
      }
    } catch (error) {
      message.error({ content: 'Error uploading template', key: 'upload' });
    } finally {
      setIsUploadingTemplate(false);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreate = () => {
    onCreate({ 
      storeName, 
      template: selectedTemplate ? templates.find(t => t._id === selectedTemplate)?.name : null,
      installDemo 
    });
  };

  return (
    <>
      <Spin fullscreen spinning={isUploadingTemplate} tip="Uploading store template..." size="large" />
      <Modal
        open={open}
        onCancel={onCancel}
        footer={null}
        width={1000}
        closeIcon={<Button type="text" icon={<CloseIcon size={20} />} onClick={onCancel} style={{ color: "var(--text-secondary)" }} />}
        style={{ top: 40 }}
        bodyStyle={{ padding: 0, borderRadius: 16, overflow: "hidden" }}
        className="glassmorphism-modal"
      >
      <div style={{ display: "flex", height: "80vh", maxHeight: 800 }}>
        {/* Sidebar */}
        <div style={{ width: 250, borderRight: "1px solid var(--border-color)", padding: "24px 16px", overflowY: "auto", background: "var(--bg-secondary)", display: "flex", flexDirection: "column" }}>
          <Title level={4} style={{ marginBottom: 24, fontSize: 18, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10 }}>
            <Store size={20} color="var(--accent-success)" /> Store Templates
          </Title>
          
          <div 
            onClick={() => setSelectedCategory("All")}
            style={{ background: selectedCategory === "All" ? "rgba(16, 185, 129, 0.1)" : "transparent", color: selectedCategory === "All" ? "var(--accent-success)" : "var(--text-primary)", padding: "10px 16px", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontWeight: 600, cursor: "pointer" }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle size={16} /> All templates</span>
            <Tag style={{ margin: 0, borderRadius: 12, background: selectedCategory === "All" ? "rgba(16, 185, 129, 0.2)" : "var(--bg-tertiary)", border: "none", color: selectedCategory === "All" ? "var(--accent-success)" : "var(--text-secondary)" }}>{templates.length}</Tag>
          </div>
          
          <div style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", marginBottom: 24, cursor: "not-allowed", fontWeight: 500 }}>
            <span>My Templates</span>
            <Text type="secondary" style={{ fontSize: 12 }}>0</Text>
          </div>

          <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, marginBottom: 16, display: "block" }}>BROWSE CATEGORIES</Text>
          
          <Space direction="vertical" style={{ width: "100%" }}>
            {categories.slice(1).map(cat => (
              <div 
                key={cat} 
                onClick={() => setSelectedCategory(cat)}
                style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  padding: "10px 12px", 
                  cursor: "pointer",
                  borderRadius: 8,
                  background: selectedCategory === cat ? "rgba(16, 185, 129, 0.05)" : "transparent",
                  color: selectedCategory === cat ? "var(--accent-success)" : "var(--text-secondary)",
                  fontWeight: selectedCategory === cat ? 700 : 500
                }}
              >
                <span style={{ fontSize: 13 }}>{cat}</span>
                <span style={{ color: "var(--text-tertiary)", fontSize: 13 }}>{templates.filter(t => t.category === cat).length}</span>
              </div>
            ))}
          </Space>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
          <div style={{ padding: 24, borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <Title level={4} style={{ margin: 0, fontSize: 18, color: "var(--text-primary)" }}>Store templates</Title>
                <Text type="secondary">Showing 275 of 275 template(s) — demo catalog adds sample products when enabled</Text>
              </div>
              <Space>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  accept=".zip,application/zip" 
                  onChange={handleZipUpload} 
                />
                <Button 
                  icon={<UploadIcon size={16} />}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ borderRadius: 8, height: 40, fontWeight: 600, borderColor: "var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                >
                  Upload ZIP
                </Button>
                <Input 
                  placeholder="Search templates..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  prefix={<SearchIcon size={16} color="var(--text-tertiary)" />} 
                  style={{ width: 250, borderRadius: 8, height: 40 }} 
                />
              </Space>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
            <Row gutter={[24, 24]}>
              {filteredTemplates.map(template => (
                <Col span={12} key={template._id}>
                  <Card 
                    hoverable 
                    onClick={() => setSelectedTemplate(template._id)}
                    style={{ 
                      borderRadius: 16, 
                      overflow: "hidden",
                      border: selectedTemplate === template._id ? "2px solid var(--accent-success)" : "1px solid var(--border-color)",
                      boxShadow: selectedTemplate === template._id ? "0 4px 20px rgba(16, 185, 129, 0.15)" : "var(--shadow-sm)",
                      background: "var(--bg-secondary)",
                      padding: 0
                    }}
                    bodyStyle={{ padding: 0 }}
                  >
                    <div style={{ height: 160, background: template.thumbnailColor || "linear-gradient(135deg, #7f1d1d, #450a0a)", padding: 24, color: "#fff", position: 'relative' }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, position: 'relative', zIndex: 2 }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <div style={{ width: 28, height: 28, background: "rgba(255,255,255,0.2)", borderRadius: 6, marginRight: 12, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>{template.name.charAt(0)}</div>
                          <span style={{ fontWeight: 800, fontSize: 16 }}>{template.name}</span>
                        </div>
                        <Space>
                          <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>Home</span>
                          <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>Shop all</span>
                        </Space>
                      </div>
                      <div style={{ position: 'relative', zIndex: 2 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, marginBottom: 4, color: 'rgba(255,255,255,0.8)' }}>ONLINE STORE</div>
                        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{template.name}</div>
                        <div style={{ fontSize: 12, opacity: 0.8, maxWidth: "80%", fontWeight: 500 }}>Parts, care & accessories. Shop {template.name} for curated Automotive products.</div>
                      </div>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)', zIndex: 1 }} />
                    </div>
                    <div style={{ padding: "16px 20px" }}>
                      <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 16, color: "var(--text-primary)" }}>{template.name}</div>
                      <div style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 500 }}>{template.category} · 3 collections · {template.featuresCount || 6} products</div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>

          <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-color)", background: "var(--bg-secondary)", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ width: 300 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Store name</div>
              <Input 
                value={storeName} 
                onChange={(e) => setStoreName(e.target.value)} 
                style={{ borderRadius: 8, height: 44, fontSize: 15 }}
              />
            </div>
            
            <Space size="large">
              <Checkbox checked={installDemo} onChange={(e) => setInstallDemo(e.target.checked)} style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                Install demo products & preview storefront
              </Checkbox>
              <Space>
                <Button onClick={onCancel} style={{ borderRadius: 8, height: 44, fontWeight: 600, borderColor: "var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)", padding: "0 24px" }}>Back</Button>
                <Button 
                  type="primary" 
                  onClick={handleCreate}
                  disabled={!storeName || !selectedTemplate}
                  style={{ backgroundColor: "var(--accent-success)", border: "none", borderRadius: 8, height: 44, fontWeight: 700, padding: "0 24px" }}
                  icon={<CheckCircle size={16} />}
                >
                  Create store
                </Button>
              </Space>
            </Space>
          </div>
        </div>
      </div>
      </Modal>
    </>
  );
};

export default StoreTemplateLibraryModal;
