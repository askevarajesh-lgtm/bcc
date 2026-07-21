import React, { useState, useEffect } from "react";
import { Button, Input, Radio, Table, Typography, Space, Modal, Card, Select, Row, Col, Badge, Tag, Divider, Popconfirm, Dropdown, Menu, message, Spin } from "antd";
import { Plus, Search, Folder, Sparkles, LayoutTemplate, Link2, Settings, FileText, Monitor, Smartphone, UploadCloud, ChevronRight, PenTool, ExternalLink, ArrowLeft, ArrowRight, Info, Activity, Trash2, ArrowUp, ArrowDown, MoreVertical, Copy, FolderInput, Share2, Edit2, Code2, Newspaper } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import WebsiteTemplateLibraryModal from "./WebsiteTemplateLibraryModal";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Removed basic WebsiteBuilderView in favor of GrapesJSBuilder

const CreateWebsiteModal = ({ open, onCancel, onCreate }) => {
  const [selectedType, setSelectedType] = useState("ai");
  const [websiteName, setWebsiteName] = useState("");
  const [industry, setIndustry] = useState("");
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState("Professional");

  const handleCreate = () => {
    onCreate({ name: websiteName, type: selectedType, description });
    setWebsiteName("");
    setIndustry("");
    setDescription("");
    setSelectedType("ai");
  };

  const isFormValid = websiteName.trim().length > 0 && (selectedType !== "ai" || description.trim().length > 0);

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={900}
      title={<div style={{ fontSize: 24, fontWeight: 900, paddingBottom: 16, borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Create New Website</div>}
      className="glassmorphism-modal"
      bodyStyle={{ maxHeight: "75vh", overflowY: "auto", padding: '24px 0' }}
      closeIcon={<span style={{ color: 'var(--text-secondary)' }}>✕</span>}
    >
      <div style={{ display: "flex", gap: 24, marginBottom: 32 }}>
        {/* From blank */}
        <div 
          onClick={() => setSelectedType("blank")}
          style={{
            flex: 1,
            border: selectedType === "blank" ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
            background: selectedType === "blank" ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-secondary)',
            borderRadius: 16,
            padding: 24,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: selectedType === "blank" ? 'var(--shadow-md)' : 'none',
            display: 'flex',
            flexDirection: 'column'
          }}
          className="hover-shadow-md"
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>From blank</div>
            <div style={{ width: 20, height: 20, borderRadius: '50%', border: selectedType === 'blank' ? '6px solid var(--accent-primary)' : '2px solid var(--border-color)', background: '#fff' }}></div>
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 32, minHeight: 40, fontWeight: 500 }}>
            Design from scratch using the website builder
          </div>
          <div style={{ textAlign: "center", color: "var(--text-tertiary)", fontSize: 13, fontWeight: 700, padding: "20px 0", background: 'var(--bg-primary)', borderRadius: 12, marginTop: 'auto', border: '1px dashed var(--border-color)' }}>
            Empty site with a home page
          </div>
        </div>

        {/* Create with AI */}
        <div 
          onClick={() => setSelectedType("ai")}
          style={{
            flex: 1,
            border: selectedType === "ai" ? '2px solid var(--accent-secondary)' : '1px solid var(--border-color)',
            background: selectedType === "ai" ? 'rgba(13, 148, 136, 0.05)' : 'var(--bg-secondary)',
            borderRadius: 16,
            padding: 24,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: selectedType === "ai" ? 'var(--shadow-md)' : 'none',
            display: 'flex',
            flexDirection: 'column'
          }}
          className="hover-shadow-md"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}><Sparkles size={18} color="var(--accent-secondary)" /> AI generated</div>
              <div style={{ background: "rgba(13, 148, 136, 0.1)", color: "var(--accent-secondary)", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 12 }}>BETA</div>
            </div>
            <div style={{ width: 20, height: 20, borderRadius: '50%', border: selectedType === 'ai' ? '6px solid var(--accent-secondary)' : '2px solid var(--border-color)', background: '#fff' }}></div>
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 24, minHeight: 40, fontWeight: 500 }}>
            Generate content, layout, and images from your business brief
          </div>
          <div style={{ background: "var(--accent-secondary)", color: "#fff", padding: "16px", textAlign: "center", borderRadius: 12, fontWeight: 800, fontSize: 13, marginTop: 'auto' }}>
            Home + Contact + About pages
          </div>
        </div>

        {/* From templates */}
        <div 
          onClick={() => setSelectedType("templates")}
          style={{
            flex: 1,
            border: selectedType === "templates" ? '2px solid var(--accent-info)' : '1px solid var(--border-color)',
            background: selectedType === "templates" ? 'rgba(14, 165, 233, 0.05)' : 'var(--bg-secondary)',
            borderRadius: 16,
            padding: 24,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: selectedType === "templates" ? 'var(--shadow-md)' : 'none',
            display: 'flex',
            flexDirection: 'column'
          }}
          className="hover-shadow-md"
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}><LayoutTemplate size={18} color="var(--accent-info)" /> Templates</div>
            <div style={{ width: 20, height: 20, borderRadius: '50%', border: selectedType === 'templates' ? '6px solid var(--accent-info)' : '2px solid var(--border-color)', background: '#fff' }}></div>
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 24, minHeight: 40, fontWeight: 500 }}>
            Jump start with an awesome prebuilt website
          </div>
          <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", padding: "16px", textAlign: "center", borderRadius: 12, fontWeight: 800, fontSize: 15, color: "var(--text-primary)", marginTop: 'auto' }}>
            100+<br /><span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Templates</span>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>WEBSITE NAME <span style={{ color: "var(--accent-danger)" }}>*</span></div>
        <Input 
          size="large"
          placeholder="e.g. Prestige Estates Luxury Launch" 
          value={websiteName}
          onChange={(e) => setWebsiteName(e.target.value)}
          style={{ borderRadius: 8 }} 
        />
      </div>

      {selectedType === "ai" && (
        <div style={{ border: "2px solid rgba(13, 148, 136, 0.2)", background: "rgba(13, 148, 136, 0.05)", borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8, color: "var(--accent-secondary)" }}>INDUSTRY</div>
            <Input 
              size="large"
              placeholder="e.g. Dental clinic, Real estate" 
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              style={{ borderRadius: 8 }} 
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8, color: "var(--accent-secondary)" }}>DESCRIBE YOUR BUSINESS <span style={{ color: "var(--accent-danger)" }}>*</span></div>
            <TextArea 
              size="large"
              placeholder="What you do, who you serve, and what visitors should do next." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ minHeight: 120, borderRadius: 8 }} 
            />
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8, color: "var(--accent-secondary)" }}>TONE</div>
            <Select size="large" value={tone} onChange={setTone} style={{ width: "100%" }}>
              <Option value="Professional">Professional</Option>
              <Option value="Friendly">Friendly</Option>
              <Option value="Energetic">Energetic</Option>
              <Option value="Luxury">Luxury</Option>
            </Select>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border-color)' }}>
        <Button size="large" onClick={onCancel} style={{ borderRadius: 8, fontWeight: 700, padding: "0 32px", borderColor: 'var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>Cancel</Button>
        <Button 
          size="large"
          type="primary" 
          onClick={handleCreate}
          disabled={!isFormValid}
          style={{ 
            background: selectedType === "ai" ? "var(--accent-secondary)" : (selectedType === "templates" ? "var(--accent-info)" : "var(--accent-primary)"), 
            border: "none", 
            borderRadius: 8, fontWeight: 800, padding: "0 32px" 
          }}
        >
          {selectedType === "ai" ? "Generate Website with AI" : (selectedType === "templates" ? "Browse Templates" : "Create Empty Site")}
        </Button>
      </div>
    </Modal>
  );
};

const ManageWebsiteView = ({ activeWebsite, setView, itemVariants, role }) => {
  const [pages, setPages] = useState(activeWebsite.pages || []);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [websiteName, setWebsiteName] = useState(activeWebsite.name || "");
  const [description, setDescription] = useState(activeWebsite.description || "");
  const [status, setStatus] = useState(activeWebsite.status || "Draft");
  const [fontFamily, setFontFamily] = useState(activeWebsite.theme?.fontFamily || "Inter");
  const [primaryColor, setPrimaryColor] = useState(activeWebsite.theme?.primaryColor || "#3b82f6");
  const [chatWidgets, setChatWidgets] = useState([]);
  const [selectedChatWidgetId, setSelectedChatWidgetId] = useState(activeWebsite.chatWidgetId || "none");
  const [savingWidget, setSavingWidget] = useState(false);
  const [websiteBlogs, setWebsiteBlogs] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [contentView, setContentView] = useState("pages");
  const [scriptModalPageId, setScriptModalPageId] = useState(null);
  const [headCodeInput, setHeadCodeInput] = useState("");
  const [bodyCodeInput, setBodyCodeInput] = useState("");
  const [savingScript, setSavingScript] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchWidgets = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/chat-widgets", {
          headers: { "Authorization": token ? `Bearer ${token}` : "" }
        });
        const data = await res.json();
        if (data.success) {
          setChatWidgets(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch widgets", err);
      }
    };
    fetchWidgets();
  }, []);

  useEffect(() => {
    const fetchWebsiteBlogs = async () => {
      try {
        setLoadingBlogs(true);
        const token = localStorage.getItem("token");
        const headers = { "Authorization": token ? `Bearer ${token}` : "" };
        const res = await fetch(`/api/blogs?websiteId=${activeWebsite.key}`, { headers });
        const data = await res.json();
        if (data.success) {
          const blogsList = data.data || [];
          const blogsWithPosts = await Promise.all(blogsList.map(async (blog) => {
            try {
              const postsRes = await fetch(`/api/blogs/${blog._id}/posts`, { headers });
              const postsData = await postsRes.json();
              return { ...blog, postsList: postsData.success ? (postsData.data || []) : [] };
            } catch (err) {
              return { ...blog, postsList: [] };
            }
          }));
          setWebsiteBlogs(blogsWithPosts);
        }
      } catch (err) {
        console.error("Failed to fetch blogs for website", err);
      } finally {
        setLoadingBlogs(false);
      }
    };
    fetchWebsiteBlogs();
  }, [activeWebsite.key]);

  const handleManageBlogs = () => {
    const match = location.pathname.match(/(.*\/client\/website|.*\/workspace\/website)/);
    const basePath = match ? match[0] : '/workspace/website';
    navigate(`${basePath}/blogs`);
  };

  const handleSaveWidgetAssignment = async () => {
    try {
      setSavingWidget(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/websites/${activeWebsite.key}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ chatWidgetId: selectedChatWidgetId === "none" ? null : selectedChatWidgetId })
      });
      const data = await res.json();
      if (data.success) {
        message.success("Chat widget assigned successfully!");
        activeWebsite.chatWidgetId = selectedChatWidgetId === "none" ? null : selectedChatWidgetId;
      } else {
        message.error(data.error || "Failed to save widget assignment");
      }
    } catch (err) {
      console.error(err);
      message.error("Error saving widget assignment");
    } finally {
      setSavingWidget(false);
    }
  };

  const handleCreateNewChatWidgetClick = () => {
    const match = location.pathname.match(/(.*\/client\/website|.*\/workspace\/website)/);
    const basePath = match ? match[0] : '/workspace/website';
    navigate(`${basePath}/chat-widgets`);
  };

  const handleAddPage = () => {
    if (!newPageTitle.trim()) return;
    const path = `/${newPageTitle.toLowerCase().replace(/\s+/g, "-")}`;
    const newPage = {
      _id: `temp-${Date.now()}`,
      key: `temp-${Date.now()}`,
      title: newPageTitle,
      path,
      status: "Draft",
      isHome: false,
      layoutJson: { sections: [] },
      html: "",
      css: ""
    };
    setPages([...pages, newPage]);
    setNewPageTitle("");
  };

  const handleDuplicatePage = (pageId) => {
    const pageToDuplicate = pages.find(p => p._id === pageId || p.key === pageId);
    if (pageToDuplicate) {
      const newPage = {
        ...pageToDuplicate,
        _id: `temp-${Date.now()}`,
        key: `temp-${Date.now()}`,
        title: `${pageToDuplicate.title} Copy`,
        path: `${pageToDuplicate.path}-copy`,
        isHome: false,
        customHeadCode: pageToDuplicate.customHeadCode || "",
        customBodyCode: pageToDuplicate.customBodyCode || ""
      };
      setPages([...pages, newPage]);
    }
  };

  const handleDeletePage = (pageId) => {
    setPages(pages.filter(p => (p._id !== pageId && p.key !== pageId)));
  };

  const handleSaveSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/websites/${activeWebsite.key}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ name: websiteName, description, status, pages, theme: { fontFamily, primaryColor } })
      });
      const data = await res.json();
      if (data.success) {
        message.success("Changes saved successfully!");
        activeWebsite.theme = { fontFamily, primaryColor };
        // Update local activeWebsite to reflect new saved pages (backend returns updated pages)
        if (data.data && data.data.pages) {
           setPages(data.data.pages);
        }
      } else {
        message.error(data.error || "Failed to save changes");
      }
    } catch (err) {
      console.error(err);
      message.error("Error saving changes");
    }
  };

  const handleSavePage = (updatedPage) => {
    setPages(pages.map(p => p._id === updatedPage._id ? updatedPage : p));
  };

  const handleOpenScriptModal = (page) => {
    setScriptModalPageId(page._id || page.key);
    setHeadCodeInput(page.customHeadCode || "");
    setBodyCodeInput(page.customBodyCode || "");
  };

  const handleCloseScriptModal = () => {
    setScriptModalPageId(null);
    setHeadCodeInput("");
    setBodyCodeInput("");
  };

  const handleSaveScript = async () => {
    const pageId = scriptModalPageId;
    setPages(pages.map(p => (p._id === pageId || p.key === pageId)
      ? { ...p, customHeadCode: headCodeInput, customBodyCode: bodyCodeInput }
      : p));

    // Persist immediately for pages that already exist on the server
    if (pageId && !pageId.toString().startsWith('temp-')) {
      try {
        setSavingScript(true);
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/websites/${activeWebsite.key}/pages/${pageId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : ""
          },
          body: JSON.stringify({ customHeadCode: headCodeInput, customBodyCode: bodyCodeInput })
        });
        const data = await res.json();
        if (data.success) {
          message.success("Custom code saved for this page!");
        } else {
          message.error(data.error || "Failed to save custom code");
        }
      } catch (err) {
        console.error(err);
        message.error("Error saving custom code");
      } finally {
        setSavingScript(false);
      }
    } else {
      message.success("Custom code added. Click \"Save Changes\" to persist this page.");
    }

    handleCloseScriptModal();
  };

  return (
    <motion.div variants={itemVariants} className="builder-view-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, cursor: 'pointer', color: 'var(--accent-primary)', fontWeight: 700 }} onClick={() => {
        const basePath = location.pathname.substring(0, location.pathname.indexOf('/websites') + 9);
        navigate(basePath);
      }}>
        <ArrowLeft size={16} /> Back to Websites
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <Title level={2} style={{ margin: 0, marginBottom: 8, color: 'var(--text-primary)', fontWeight: 900 }}>{websiteName}</Title>
          <Text type="secondary" style={{ fontSize: 15, fontWeight: 500 }}>Manage pages, settings, and tracking for this website.</Text>
        </div>
      </div>

      <div>
        
        {activeWebsite.isNew && (
          <div style={{ marginBottom: 32, padding: "16px 24px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: 12, color: "var(--accent-success)", fontWeight: 600, fontSize: 14 }}>
            Website created successfully.
          </div>
        )}

        <Row gutter={32}>
          {/* Left Sidebar */}
          <Col span={8}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              
              <Card bodyStyle={{ padding: 32 }} style={{ borderRadius: 24, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: 0.5, marginBottom: 8 }}>WEBSITE NAME</div>
                  <Input size="large" value={websiteName} onChange={e => setWebsiteName(e.target.value)} style={{ borderRadius: 8 }} disabled={role === 'agency_client'} />
                </div>
                
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: 0.5, marginBottom: 8 }}>DESCRIPTION</div>
                  <TextArea size="large" value={description} onChange={e => setDescription(e.target.value)} style={{ borderRadius: 8, minHeight: 80 }} disabled={role === 'agency_client'} />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: 0.5, marginBottom: 8 }}>STATUS</div>
                  <Select size="large" value={status} onChange={setStatus} style={{ width: "100%" }} disabled={role === 'agency_client'}>
                    <Option value="Draft">Draft</Option>
                    <Option value="Published">Published</Option>
                  </Select>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: 0.5, marginBottom: 8 }}>FAVICON URL</div>
                  <Input size="large" placeholder="https://example.com/favicon.png" style={{ borderRadius: 8 }} disabled={role === 'agency_client'} />
                </div>

                {role !== 'agency_client' && (
                  <div style={{ marginBottom: 32 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: 0.5, marginBottom: 8 }}>UPLOAD FAVICON</div>
                    <div style={{ border: "1px dashed var(--border-color)", borderRadius: 12, padding: "16px", textAlign: 'center', background: "var(--bg-primary)" }}>
                      <Button size="middle" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", fontWeight: 600, marginBottom: 8 }}>Choose File</Button>
                      <div style={{ fontSize: 12, color: "var(--text-tertiary)", fontWeight: 500 }}>Max 1MB. Recommended 32x32px.</div>
                    </div>
                  </div>
                )}

                {/* Website Theme */}
                <div style={{ border: "1px solid var(--border-color)", borderRadius: 16, padding: 24, marginBottom: 32, background: "var(--bg-primary)" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}><PenTool size={16} color="var(--accent-primary)"/> Theme</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: 12, marginBottom: 20, fontWeight: 500 }}>Default font and brand color used across this site — including embedded blocks like blogs, so they match the rest of the site instead of falling back to generic defaults.</div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: 0.5, marginBottom: 6 }}>SITE FONT</div>
                    <Select size="middle" value={fontFamily} onChange={setFontFamily} style={{ width: "100%" }} disabled={role === 'agency_client'}>
                      <Option value="Inter">Inter</Option>
                      <Option value="Poppins">Poppins</Option>
                      <Option value="Roboto">Roboto</Option>
                      <Option value="Lato">Lato</Option>
                      <Option value="Playfair Display">Playfair Display</Option>
                      <Option value="Montserrat">Montserrat</Option>
                    </Select>
                  </div>

                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: 0.5, marginBottom: 6 }}>BRAND COLOR</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={e => setPrimaryColor(e.target.value)}
                        disabled={role === 'agency_client'}
                        style={{ width: 40, height: 32, padding: 0, border: '1px solid var(--border-color)', borderRadius: 6, background: 'none', cursor: role === 'agency_client' ? 'not-allowed' : 'pointer' }}
                      />
                      <Input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ borderRadius: 6, fontSize: 13 }} disabled={role === 'agency_client'} />
                    </div>
                  </div>
                </div>

                {/* Tracking Pixels */}
                <div style={{ border: "1px solid var(--border-color)", borderRadius: 16, padding: 24, marginBottom: 32, background: "var(--bg-primary)" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}><Activity size={16} color="var(--accent-primary)"/> Tracking pixels</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: 12, marginBottom: 20, fontWeight: 500 }}>Injected on every public page for this website.</div>
                  
                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={12}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: 0.5, marginBottom: 6 }}>META (FB) PIXEL</div>
                      <Input placeholder="123456789012345" style={{ borderRadius: 6, fontSize: 13 }} disabled={role === 'agency_client'} />
                    </Col>
                    <Col span={12}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: 0.5, marginBottom: 6 }}>GA4 ID</div>
                      <Input placeholder="G-XXXXXXXXXX" style={{ borderRadius: 6, fontSize: 13 }} disabled={role === 'agency_client'} />
                    </Col>
                  </Row>

                  <Row gutter={16} style={{ marginBottom: 24 }}>
                    <Col span={12}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: 0.5, marginBottom: 6 }}>GTM ID</div>
                      <Input placeholder="GTM-XXXXXXX" style={{ borderRadius: 6, fontSize: 13 }} disabled={role === 'agency_client'} />
                    </Col>
                    <Col span={12}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: 0.5, marginBottom: 6 }}>TIKTOK PIXEL</div>
                      <Input placeholder="CXX000000000000X" style={{ borderRadius: 6, fontSize: 13 }} disabled={role === 'agency_client'} />
                    </Col>
                  </Row>
                </div>

                {role !== 'agency_client' && (
                  <>
                    <Button type="primary" size="large" onClick={handleSaveSettings} block style={{ background: "var(--accent-primary)", border: "none", borderRadius: 12, fontWeight: 800, height: 48, marginBottom: 16, boxShadow: 'var(--shadow-md)' }}>
                      Save Changes
                    </Button>
                    
                    <Row gutter={16}>
                      <Col span={12}>
                        <Button type="primary" size="large" onClick={() => { setStatus("Published"); handleSaveSettings(); }} block style={{ background: "var(--accent-success)", border: "none", borderRadius: 12, fontWeight: 700, height: 48 }}>
                          Publish
                        </Button>
                      </Col>
                      <Col span={12}>
                        <Button type="primary" size="large" onClick={() => { setStatus("Draft"); handleSaveSettings(); }} block style={{ background: "var(--accent-warning)", border: "none", borderRadius: 12, fontWeight: 700, height: 48, color: '#fff' }}>
                          Revert to Draft
                        </Button>
                      </Col>
                    </Row>
                  </>
                )}
              </Card>

              <Card bodyStyle={{ padding: 24 }} style={{ borderRadius: 24, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontWeight: 800, marginBottom: 8, fontSize: 15, color: 'var(--text-primary)' }}>Chat widget</div>
                <div style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 16, fontWeight: 500 }}>
                  Assign a published chat widget to this property. It also appears in the page builder under Chat.
                </div>
                <Select 
                  size="large" 
                  value={selectedChatWidgetId || "none"} 
                  onChange={setSelectedChatWidgetId}
                  style={{ width: "100%", marginBottom: 16 }} 
                  disabled={role === 'agency_client'}
                >
                  <Option value="none">— None —</Option>
                  {chatWidgets.map(w => (
                    <Option key={w._id} value={w._id}>
                      {w.name} {w.status === 'Draft' ? '(Draft)' : ''}
                    </Option>
                  ))}
                </Select>
                {role !== 'agency_client' && (
                  <>
                    <Button 
                      size="large" 
                      type="primary" 
                      block 
                      loading={savingWidget}
                      onClick={handleSaveWidgetAssignment}
                      style={{ background: "var(--accent-info)", border: "none", borderRadius: 12, fontWeight: 700, height: 48, marginBottom: 16 }}
                    >
                      Save Widget Assignment
                    </Button>
                    <div 
                      onClick={handleCreateNewChatWidgetClick}
                      style={{ textAlign: "center", color: "var(--accent-info)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                    >
                      + Create new chat widget
                    </div>
                  </>
                )}
              </Card>

              <Card bodyStyle={{ padding: 24 }} style={{ borderRadius: 24, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontWeight: 800, marginBottom: 8, fontSize: 15, color: 'var(--text-primary)' }}>Custom domain</div>
                <div style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 16, fontWeight: 500 }}>
                  Connect a domain so visitors reach this property without /shop/ or /p/ paths.
                </div>
                {role !== 'agency_client' && (
                  <Button size="large" type="primary" block style={{ background: "var(--accent-primary)", border: "none", borderRadius: 12, fontWeight: 700, height: 48 }}>
                    Connect Domain
                  </Button>
                )}
              </Card>

            </div>
          </Col>

          {/* Right Area */}
          <Col span={16}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              
              <div style={{ padding: "20px 24px", background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: 16, fontSize: 14, fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <Info size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>Header and footer are synced from your home page. Other pages use them automatically in the builder and when published.</div>
              </div>

              <Card bodyStyle={{ padding: 32 }} style={{ borderRadius: 24, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 24, background: 'var(--bg-primary)', padding: 4, borderRadius: 12, border: '1px solid var(--border-color)', width: 'fit-content' }}>
                  <div
                    onClick={() => setContentView("pages")}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                      padding: '10px 20px', borderRadius: 8, fontWeight: 800, fontSize: 14,
                      background: contentView === 'pages' ? 'var(--bg-secondary)' : 'transparent',
                      color: contentView === 'pages' ? 'var(--text-primary)' : 'var(--text-secondary)',
                      boxShadow: contentView === 'pages' ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    <FileText size={16} /> Pages <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>{pages.length}</span>
                  </div>
                  <div
                    onClick={() => setContentView("blogs")}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                      padding: '10px 20px', borderRadius: 8, fontWeight: 800, fontSize: 14,
                      background: contentView === 'blogs' ? 'var(--bg-secondary)' : 'transparent',
                      color: contentView === 'blogs' ? 'var(--text-primary)' : 'var(--text-secondary)',
                      boxShadow: contentView === 'blogs' ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Newspaper size={16} /> Blogs <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>{websiteBlogs.length}</span>
                  </div>
                </div>

                {contentView === "pages" ? (
                  <>
                    <div style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 32, fontWeight: 500 }}>Home page sets global header & footer for all other pages.</div>

                    {role !== 'agency_client' && (
                      <div style={{ display: "flex", gap: 16, marginBottom: 40, background: 'var(--bg-primary)', padding: 16, borderRadius: 16, border: '1px solid var(--border-color)' }}>
                        <Input size="large" placeholder="New page title (e.g. Services)" value={newPageTitle} onChange={e => setNewPageTitle(e.target.value)} style={{ flex: 1, borderRadius: 8 }} />
                        <Button size="large" type="primary" onClick={handleAddPage} style={{ background: "var(--text-primary)", border: "none", borderRadius: 8, fontWeight: 800, padding: "0 32px" }}>
                          Add Page
                        </Button>
                      </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                      {pages.map((page, index) => (
                        <div key={page._id || page.key || index} style={{ borderBottom: index < pages.length - 1 ? "1px solid var(--border-color)" : "none", paddingBottom: 24, marginBottom: 24 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                              <div style={{ width: 48, height: 48, borderRadius: 12, background: page.isHome ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-primary)', border: page.isHome ? 'none' : '1px solid var(--border-color)', color: page.isHome ? 'var(--accent-primary)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FileText size={24} />
                              </div>
                              <div>
                                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4, display: "flex", alignItems: "center", gap: 10, color: 'var(--text-primary)' }}>
                                  {page.title}
                                  {page.isHome && <Tag style={{ margin: 0, background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)', border: 'none', fontWeight: 800, borderRadius: 6, fontSize: 10 }}>HOME</Tag>}
                                </div>
                                <div style={{ color: "var(--text-tertiary)", fontSize: 13, fontWeight: 500 }}>{page.path}</div>
                              </div>
                            </div>
                            <Select
                              size="large"
                              value={page.status || "Draft"}
                              onChange={(val) => {
                                setPages(pages.map(p => (p._id === page._id || p.key === page._id) ? { ...p, status: val } : p));
                              }}
                              style={{ width: 120 }}
                              disabled={role === 'agency_client'}
                            >
                              <Option value="Draft">Draft</Option>
                              <Option value="Published">Published</Option>
                            </Select>
                          </div>
                          <div style={{ display: 'flex', gap: 12, paddingLeft: 64 }}>
                            {role !== 'agency_client' && <Button type="primary" style={{ background: "var(--accent-primary)", border: "none", borderRadius: 8, fontWeight: 700, padding: "0 20px" }} icon={<PenTool size={14} />} onClick={() => navigate(`/workspace/website/${activeWebsite.key}/pages/${page._id}/edit`)}>Edit in Builder</Button>}
                            <Button style={{ background: "var(--bg-primary)", borderColor: "var(--border-color)", color: 'var(--text-primary)', borderRadius: 8, fontWeight: 600, padding: "0 20px" }} icon={<Monitor size={14} />} onClick={() => window.open(`/preview/website/${activeWebsite.key}/page/${page._id || page.key}`, '_blank')}>Preview</Button>
                            {role !== 'agency_client' && <Button style={{ background: "var(--bg-primary)", borderColor: "var(--border-color)", color: 'var(--text-primary)', borderRadius: 8, fontWeight: 600, padding: "0 20px" }} onClick={() => handleDuplicatePage(page._id)}>Duplicate</Button>}
                            {role !== 'agency_client' && <Button style={{ background: "var(--bg-primary)", borderColor: "var(--border-color)", color: 'var(--text-primary)', borderRadius: 8, fontWeight: 600, padding: "0 20px" }} icon={<Code2 size={14} />} onClick={() => handleOpenScriptModal(page)}>Script</Button>}
                            {(role !== 'agency_client' && !page.isHome) && <Button danger style={{ background: "rgba(239, 68, 68, 0.1)", border: "none", color: "var(--accent-danger)", borderRadius: 8, fontWeight: 700, padding: "0 20px" }} icon={<Trash2 size={14} />} onClick={() => handleDeletePage(page._id)}>Delete</Button>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 32, fontWeight: 500 }}>Blogs linked to this website only.</div>

                    {loadingBlogs ? (
                      <div style={{ padding: '24px 0', textAlign: 'center' }}>
                        <Spin />
                      </div>
                    ) : websiteBlogs.length === 0 ? (
                      <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14, fontWeight: 500 }}>
                        No blogs are linked to this website yet.
                        {role !== 'agency_client' && (
                          <div style={{ marginTop: 16 }}>
                            <Button type="primary" onClick={handleManageBlogs} style={{ background: "var(--text-primary)", border: "none", borderRadius: 8, fontWeight: 800, padding: "0 24px" }}>
                              Create a Blog
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                        {websiteBlogs.map((blog, index) => (
                          <div key={blog._id || index} style={{ borderBottom: index < websiteBlogs.length - 1 ? "1px solid var(--border-color)" : "none", paddingBottom: 24, marginBottom: 24 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: (blog.postsList && blog.postsList.length > 0) ? 20 : 0 }}>
                              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Newspaper size={24} />
                                </div>
                                <div>
                                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4, display: "flex", alignItems: "center", gap: 10, color: 'var(--text-primary)' }}>
                                    {blog.name}
                                    <Tag style={{ margin: 0, background: blog.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-primary)', color: blog.status === 'active' ? 'var(--accent-success)' : 'var(--text-tertiary)', border: 'none', fontWeight: 800, borderRadius: 6, fontSize: 10, textTransform: 'uppercase' }}>{blog.status || 'inactive'}</Tag>
                                  </div>
                                  <div style={{ color: "var(--text-tertiary)", fontSize: 13, fontWeight: 500 }}>{(blog.postsList ? blog.postsList.length : (blog.posts || 0))} posts &middot; {blog.publicUrl || `/blog/${blog.slug}`}</div>
                                </div>
                              </div>
                              <Button style={{ background: "var(--bg-primary)", borderColor: "var(--border-color)", color: 'var(--text-primary)', borderRadius: 8, fontWeight: 600, padding: "0 20px" }} onClick={handleManageBlogs}>
                                Manage
                              </Button>
                            </div>

                            {blog.postsList && blog.postsList.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: 64 }}>
                                {blog.postsList.map((post) => (
                                  <div key={post._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '12px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                      <FileText size={16} color="var(--text-secondary)" />
                                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{post.title}</span>
                                      <Tag style={{ margin: 0, background: post.status === 'published' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-secondary)', color: post.status === 'published' ? 'var(--accent-success)' : 'var(--text-tertiary)', border: 'none', fontWeight: 800, borderRadius: 6, fontSize: 10, textTransform: 'uppercase' }}>{post.status || 'draft'}</Tag>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                      {role !== 'agency_client' && (
                                        <Button
                                          size="small"
                                          type="primary"
                                          icon={<PenTool size={12} />}
                                          style={{ background: "var(--accent-primary)", border: "none", borderRadius: 6, fontWeight: 700 }}
                                          onClick={() => navigate(`/workspace/website/${activeWebsite.key}/blogs/${blog._id}/posts/${post._id}/edit`)}
                                        >
                                          Edit in Builder
                                        </Button>
                                      )}
                                      <Button
                                        size="small"
                                        icon={<Monitor size={12} />}
                                        style={{ background: "var(--bg-secondary)", borderColor: "var(--border-color)", color: 'var(--text-primary)', borderRadius: 6, fontWeight: 600 }}
                                        onClick={() => window.open(`/preview/website/${activeWebsite.key}/blog-post/${post._id}`, '_blank')}
                                      >
                                        Preview
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </Card>

            </div>
          </Col>
        </Row>
      </div>

      <Modal
        open={!!scriptModalPageId}
        onCancel={handleCloseScriptModal}
        footer={null}
        width={640}
        title={<div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}><Code2 size={18} color="var(--accent-primary)" /> Custom Code</div>}
        className="glassmorphism-modal"
      >
        <div style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 24, fontWeight: 500 }}>
          Add custom code for this page only. Head code is injected inside &lt;head&gt;&lt;/head&gt;, body code is injected inside &lt;body&gt;&lt;/body&gt; when the page renders.
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: 0.5, marginBottom: 6 }}>CUSTOM HEAD CODE</div>
          <TextArea
            placeholder="<script>...</script> placed before </head>"
            value={headCodeInput}
            onChange={(e) => setHeadCodeInput(e.target.value)}
            style={{ borderRadius: 6, minHeight: 100, fontFamily: "monospace", fontSize: 12 }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: 0.5, marginBottom: 6 }}>CUSTOM BODY CODE</div>
          <TextArea
            placeholder="<noscript>...</noscript> placed inside <body>"
            value={bodyCodeInput}
            onChange={(e) => setBodyCodeInput(e.target.value)}
            style={{ borderRadius: 6, minHeight: 100, fontFamily: "monospace", fontSize: 12 }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button size="large" onClick={handleCloseScriptModal} style={{ borderRadius: 8, fontWeight: 700, borderColor: 'var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>Cancel</Button>
          <Button size="large" type="primary" loading={savingScript} onClick={handleSaveScript} style={{ background: "var(--accent-primary)", border: "none", borderRadius: 8, fontWeight: 800 }}>Save Code</Button>
        </div>
      </Modal>
    </motion.div>
  );
};

const WebsitesTab = ({ itemVariants, initialAction, onActionComplete }) => {
  const { role } = useAuth();
  const [viewType, setViewType] = useState("list");
  const [folderView, setFolderView] = useState("home");
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [pendingWebsiteName, setPendingWebsiteName] = useState("");
  const [isCloning, setIsCloning] = useState(false);
  
  const [websites, setWebsites] = useState([]);
  const [activeWebsite, setActiveWebsite] = useState(null);
  const [view, setView] = useState("list");

  const navigate = useNavigate();
  const location = useLocation();

  const fetchWebsiteDetails = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/websites/${id}`, {
        headers: { "Authorization": token ? `Bearer ${token}` : "" }
      });
      const resData = await res.json();
      if (resData.success) {
        setActiveWebsite({
          ...resData.data,
          key: resData.data._id,
          pages: resData.data.pages || [],
          isNew: false
        });
        setView("manage");
      } else {
        // If not found, go back to list
        const basePath = location.pathname.substring(0, location.pathname.indexOf('/websites') + 9);
        navigate(basePath, { replace: true });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const match = location.pathname.match(/\/websites\/([a-zA-Z0-9_-]+)$/);
    if (match) {
      const websiteId = match[1];
      if (!activeWebsite || activeWebsite.key !== websiteId) {
        fetchWebsiteDetails(websiteId);
      }
    } else {
      setView("list");
      setActiveWebsite(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (initialAction === 'openTemplates') {
      setIsTemplateModalOpen(true);
      if (onActionComplete) onActionComplete();
    }
  }, [initialAction, onActionComplete]);

  const fetchWebsites = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/websites", {
        headers: {
          "Authorization": token ? `Bearer ${token}` : ""
        }
      });
      const data = await res.json();
      if (data.success) {
        const mapped = data.data.map(w => ({
          key: w._id,
          name: w.name,
          description: w.description,
          lastUpdated: new Date(w.updatedAt).toLocaleDateString(),
          pages: w.pagesCount || 1,
          blogs: w.blogsCount || 0,
          isNew: false
        }));
        setWebsites(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch websites", err);
    }
  };

  useEffect(() => {
    fetchWebsites();
  }, [view]);

  const handleDeleteWebsite = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/websites/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": token ? `Bearer ${token}` : ""
        }
      });
      const data = await res.json();
      if (data.success) {
        message.success("Website deleted successfully");
        fetchWebsites();
      } else {
        message.error(data.error || "Failed to delete website");
      }
    } catch (err) {
      message.error("Error deleting website");
    }
  };

  const handleCloneWebsite = async (id) => {
    setIsCloning(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/websites/${id}/clone`, {
        method: "POST",
        headers: {
          "Authorization": token ? `Bearer ${token}` : ""
        }
      });
      const data = await res.json();
      if (data.success) {
        message.success({ content: 'Website cloned successfully', key: 'clone' });
        fetchWebsites();
      } else {
        message.error({ content: data.error || "Failed to clone website", key: 'clone' });
      }
    } catch (err) {
      message.error({ content: "Error cloning website", key: 'clone' });
    } finally {
      setIsCloning(false);
    }
  };

  const handleCreateWebsite = async (data) => {
    if (data.type === "blank" || data.type === "template" || data.type === "ai") {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/websites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : ""
          },
          body: JSON.stringify({
            name: data.name,
            description: data.description || (data.template ? `Created from ${data.template} template` : ""),
            type: data.type,
            templateName: data.template
          })
        });
        const resData = await res.json();
        if (resData.success) {
          const newWebsite = {
            key: resData.data._id,
            name: resData.data.name,
            description: resData.data.description,
            lastUpdated: "Just now",
            pages: resData.data.pages ? resData.data.pages.length : 1,
            isNew: true
          };
          setWebsites([newWebsite, ...websites]);
          setIsModalOpen(false);
          setIsTemplateModalOpen(false);
          // Navigate to the new website to load it properly
          const basePath = location.pathname.substring(0, location.pathname.indexOf('/websites') + 9);
          navigate(`${basePath}/${newWebsite.key}`);
        }
      } catch (err) {
        console.error(err);
      }
    } else if (data.type === "templates") {
      setPendingWebsiteName(data.name);
      setIsModalOpen(false);
      setIsTemplateModalOpen(true);
    }
  };

  if (view === "manage" && activeWebsite) {
    return <ManageWebsiteView activeWebsite={activeWebsite} setView={setView} itemVariants={itemVariants} role={role} />;
  }

  const columns = [
    {
      title: "NAME",
      dataIndex: "name",
      key: "name",
      render: (t, r) => (
        <div>
          <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 15 }}>{t}</span>
          {r.description && <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4, fontWeight: 500 }}>{r.description}</div>}
        </div>
      )
    },
    {
      title: "LAST UPDATED",
      dataIndex: "lastUpdated",
      key: "lastUpdated",
      render: (t) => <Text style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{t}</Text>
    },
    {
      title: "PAGES",
      dataIndex: "pages",
      key: "pages",
      render: (t) => <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{Array.isArray(t) ? t.length : t}</span>
    },
    {
      title: "BLOGS",
      dataIndex: "blogs",
      key: "blogs",
      render: (t) => <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{Array.isArray(t) ? t.length : (t || 0)}</span>
    },
    {
      title: "ACTIONS",
      key: "actions",
      align: "right",
      render: (_, r) => {
        const handleManage = () => {
          const basePath = location.pathname.substring(0, location.pathname.indexOf('/websites') + 9);
          navigate(`${basePath}/${r.key}`);
        };

        const menuItems = [
          {
            key: 'edit',
            icon: <Edit2 size={16} />,
            label: 'Edit',
            onClick: handleManage,
            style: { fontWeight: 600, color: 'var(--text-primary)', padding: '8px 12px' }
          },
          {
            key: 'clone',
            icon: <Copy size={16} />,
            label: 'Clone',
            onClick: () => handleCloneWebsite(r.key),
            style: { fontWeight: 600, color: 'var(--text-primary)', padding: '8px 12px' }
          },
          {
            key: 'folder',
            icon: <FolderInput size={16} />,
            label: (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span>Move To Folder</span>
                <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 800, marginLeft: 12 }}>Create a folder first</span>
              </div>
            ),
            disabled: true,
            style: { fontWeight: 600, color: 'var(--text-secondary)', padding: '8px 12px' }
          },
          {
            key: 'upload',
            icon: <UploadCloud size={16} />,
            label: (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span>Upload To Website Templates</span>
                <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 800, marginLeft: 12 }}>Soon</span>
              </div>
            ),
            disabled: true,
            style: { fontWeight: 600, color: 'var(--text-secondary)', padding: '8px 12px' }
          },
          {
            key: 'share',
            icon: <Share2 size={16} />,
            label: (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span>Share</span>
                <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 800, marginLeft: 12 }}>Soon</span>
              </div>
            ),
            disabled: true,
            style: { fontWeight: 600, color: 'var(--text-secondary)', padding: '8px 12px' }
          },
          {
            key: 'delete',
            icon: <Trash2 size={16} />,
            label: 'Delete',
            danger: true,
            onClick: () => handleDeleteWebsite(r.key),
            style: { fontWeight: 700, padding: '8px 12px' }
          }
        ];

        return role !== 'agency_client' ? (
          <Space>
            <Dropdown 
              menu={{ items: menuItems }} 
              trigger={['click']} 
              placement="bottomRight"
              overlayStyle={{ minWidth: 220 }}
            >
              <Button type="text" icon={<MoreVertical size={18} color="var(--text-secondary)" />} style={{ borderRadius: 8 }} />
            </Dropdown>
          </Space>
        ) : <Button type="text" onClick={handleManage} style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>View</Button>;
      }
    },
  ];

  return (
    <motion.div variants={itemVariants}>
      <Spin fullscreen spinning={isCloning} tip="Cloning website..." size="large" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={4} style={{ margin: '0 0 8px', color: 'var(--text-primary)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Monitor size={24} color="var(--accent-primary)" /> Websites
          </Title>
          <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>
            Build custom websites to showcase your products and build a trusted brand.
          </Text>
        </div>
        <Space>
          {role !== 'agency_client' && (
            <>
              <Button size="large" icon={<Folder size={18} />} style={{ borderRadius: 8, fontWeight: 700, borderColor: 'var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-secondary)', height: 44 }}>Folders</Button>
              <Button 
                size="large"
                icon={<Sparkles size={18} />} 
                onClick={() => setIsModalOpen(true)}
                style={{ color: "var(--accent-secondary)", borderColor: "var(--accent-secondary)", background: "rgba(13, 148, 136, 0.05)", borderRadius: 8, fontWeight: 800, height: 44, padding: '0 20px' }}
              >
                Build with AI <Tag style={{ margin: '0 0 0 8px', background: 'var(--accent-secondary)', color: '#fff', border: 'none', borderRadius: 12, padding: '2px 8px', fontSize: 10 }}>BETA</Tag>
              </Button>
              <Button 
                size="large"
                type="primary" 
                icon={<Plus size={18} />}
                onClick={() => setIsModalOpen(true)}
                style={{ background: 'var(--accent-primary)', border: 'none', borderRadius: 8, fontWeight: 800, height: 44, padding: '0 24px', boxShadow: 'var(--shadow-md)' }}
              >
                New Website
              </Button>
            </>
          )}
        </Space>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', gap: 12, borderBottom: '2px solid var(--border-color)' }}>
          <div style={{ padding: '8px 16px', fontWeight: folderView === 'home' ? 800 : 600, color: folderView === 'home' ? 'var(--text-primary)' : 'var(--text-secondary)', borderBottom: folderView === 'home' ? '3px solid var(--accent-primary)' : '3px solid transparent', marginBottom: -2, cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setFolderView("home")}>Home</div>
          <div style={{ padding: '8px 16px', fontWeight: folderView === 'unfiled' ? 800 : 600, color: folderView === 'unfiled' ? 'var(--text-primary)' : 'var(--text-secondary)', borderBottom: folderView === 'unfiled' ? '3px solid var(--accent-primary)' : '3px solid transparent', marginBottom: -2, cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setFolderView("unfiled")}>Unfiled</div>
        </div>

        <Space>
          <Radio.Group value={viewType} onChange={(e) => setViewType(e.target.value)} size="large" style={{ background: 'var(--bg-secondary)', padding: 4, borderRadius: 10, border: '1px solid var(--border-color)' }}>
            <Radio.Button value="recent" style={{ borderRadius: 8, border: 'none', background: viewType === 'recent' ? 'var(--bg-primary)' : 'transparent', color: viewType === 'recent' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 700, boxShadow: viewType === 'recent' ? 'var(--shadow-sm)' : 'none' }}>Recent</Radio.Button>
            <Radio.Button value="list" style={{ borderRadius: 8, border: 'none', background: viewType === 'list' ? 'var(--bg-primary)' : 'transparent', color: viewType === 'list' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 700, boxShadow: viewType === 'list' ? 'var(--shadow-sm)' : 'none' }}>List</Radio.Button>
          </Radio.Group>

          <Input
            size="large"
            placeholder="Search for Websites"
            prefix={<Search size={16} color="var(--text-tertiary)" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300, borderRadius: 10 }}
          />
        </Space>
      </div>

      <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
        <Table
          columns={columns}
          dataSource={websites.filter(w => w.name.toLowerCase().includes(searchText.toLowerCase()))}
          pagination={false}
          locale={{
            emptyText: (
              <div style={{ padding: "80px 0", textAlign: "center" }}>
                <div style={{ width: 80, height: 80, background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <Monitor size={40} />
                </div>
                <Title level={4} style={{ marginBottom: 12, color: 'var(--text-primary)', fontWeight: 800 }}>No websites yet</Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: 32, fontSize: 15, fontWeight: 500 }}>
                  Create your first website from blank or from a template.
                </Text>
                <Button type="primary" icon={<Plus size={18} />} onClick={() => setIsModalOpen(true)} style={{ borderRadius: 8, height: 44, background: 'var(--accent-primary)', border: 'none', fontWeight: 700, padding: '0 32px' }}>New Website</Button>
              </div>
            )
          }}
        />
      </Card>

      <CreateWebsiteModal 
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onCreate={handleCreateWebsite}
      />

      <WebsiteTemplateLibraryModal 
        open={isTemplateModalOpen}
        initialWebsiteName={pendingWebsiteName}
        onCancel={() => {
          setIsTemplateModalOpen(false);
          setIsModalOpen(true);
        }}
        onCreate={handleCreateWebsite}
      />
    </motion.div>
  );
};

export default WebsitesTab;