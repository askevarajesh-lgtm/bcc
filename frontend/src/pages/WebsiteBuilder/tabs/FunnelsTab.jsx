import React, { useState, useEffect } from "react";
import { Button, Input, Radio, Table, Typography, Space, Modal, Card, Select, Row, Col, Tag } from "antd";
import { FolderPlus, Plus, Search, CheckCircle2, ChevronRight, BarChart3, Edit3, Eye, Trash2, Smartphone, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FunnelTemplateLibraryModal from "./FunnelTemplateLibraryModal";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CreateFunnelModal = ({ open, onCancel, onCreate }) => {
  const [selectedType, setSelectedType] = useState("ai");
  const [funnelName, setFunnelName] = useState("");
  const [industry, setIndustry] = useState("");
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState("Professional");

  const handleCreate = () => {
    onCreate({ name: funnelName, type: selectedType, description });
    setFunnelName("");
    setIndustry("");
    setDescription("");
    setSelectedType("ai");
  };

  const isFormValid = funnelName.trim().length > 0 && (selectedType !== "ai" || description.trim().length > 0);

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={900}
      title={<div style={{ fontSize: 20, fontWeight: 800, paddingBottom: 16, color: 'var(--text-primary)' }}>Create New Funnel</div>}
      className="glassmorphism-modal"
    >
      <div style={{ display: "flex", gap: 24, marginBottom: 32, marginTop: 16 }}>
        {/* From blank */}
        <div 
          onClick={() => setSelectedType("blank")}
          style={{ flex: 1, borderRadius: 16, border: selectedType === "blank" ? '2px solid var(--accent-secondary)' : '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: 24, cursor: 'pointer', transition: 'all 0.2s', boxShadow: selectedType === "blank" ? '0 4px 20px rgba(13, 148, 136, 0.15)' : 'none' }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>From blank</div>
            <div style={{ width: 24, height: 24, borderRadius: '50%', border: selectedType === 'blank' ? '7px solid var(--accent-secondary)' : '2px solid var(--border-color)' }}></div>
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 32, minHeight: 40 }}>
            Design from scratch using the Funnel builder
          </div>
          <div style={{ textAlign: "center", color: "var(--text-tertiary)", fontSize: 13, fontWeight: 600, padding: "20px 0", background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
            Empty site with a home page
          </div>
        </div>

        {/* Create with AI */}
        <div 
          onClick={() => setSelectedType("ai")}
          style={{ flex: 1, borderRadius: 16, border: selectedType === "ai" ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: 24, cursor: 'pointer', transition: 'all 0.2s', boxShadow: selectedType === "ai" ? '0 4px 20px rgba(59, 130, 246, 0.15)' : 'none' }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Create with AI</div>
              <Tag style={{ margin: 0, borderRadius: 12, border: 'none', background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', fontWeight: 700 }}>Beta</Tag>
            </div>
            <div style={{ width: 24, height: 24, borderRadius: '50%', border: selectedType === 'ai' ? '7px solid var(--accent-primary)' : '2px solid var(--border-color)' }}></div>
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 24, minHeight: 40 }}>
            Generate content from your business brief
          </div>
          <div style={{ background: "var(--accent-primary)", color: "#fff", padding: "16px", textAlign: "center", borderRadius: 8, fontWeight: 700, fontSize: 13, boxShadow: 'var(--shadow-sm)' }}>
            Home + contact pages
          </div>
        </div>

        {/* From templates */}
        <div 
          onClick={() => setSelectedType("templates")}
          style={{ flex: 1, borderRadius: 16, border: selectedType === "templates" ? '2px solid var(--accent-info)' : '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: 24, cursor: 'pointer', transition: 'all 0.2s', boxShadow: selectedType === "templates" ? '0 4px 20px rgba(14, 165, 233, 0.15)' : 'none' }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>From templates</div>
            <div style={{ width: 24, height: 24, borderRadius: '50%', border: selectedType === 'templates' ? '7px solid var(--accent-info)' : '2px solid var(--border-color)' }}></div>
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 24, minHeight: 40 }}>
            Jump start with an awesome prebuilt Funnel
          </div>
          <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", padding: "16px", textAlign: "center", borderRadius: 8, fontWeight: 700, fontSize: 15, color: "var(--text-secondary)" }}>
            Over 500+<br />Templates
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Funnel name <span style={{ color: "var(--accent-danger)" }}>*</span></div>
        <Input 
          size="large"
          placeholder="e.g. Acme Plumbing" 
          value={funnelName}
          onChange={(e) => setFunnelName(e.target.value)}
          style={{ borderRadius: 8, fontSize: 15 }} 
        />
      </div>

      <AnimatePresence>
        {selectedType === "ai" && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ border: "2px solid rgba(59, 130, 246, 0.3)", background: "rgba(59, 130, 246, 0.05)", borderRadius: 12, padding: 24, marginBottom: 24 }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "var(--accent-primary)" }}>Industry</div>
                <Input 
                  placeholder="e.g. Dental clinic, Real estate" 
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  style={{ height: 44, borderRadius: 8 }} 
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "var(--accent-primary)" }}>Describe your business <span style={{ color: "var(--accent-danger)" }}>*</span></div>
                <TextArea 
                  placeholder="What you do, who you serve, and what visitors should do next." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ minHeight: 100, borderRadius: 8 }} 
                />
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "var(--accent-primary)" }}>Tone</div>
                <Select value={tone} onChange={setTone} style={{ width: "100%", height: 44 }} size="large">
                  <Option value="Professional">Professional</Option>
                  <Option value="Friendly">Friendly</Option>
                  <Option value="Energetic">Energetic</Option>
                </Select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <Button onClick={onCancel} style={{ height: 44, borderRadius: 8, fontWeight: 600, padding: "0 24px", borderColor: 'var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Cancel</Button>
        <Button 
          type="primary" 
          onClick={handleCreate}
          disabled={!isFormValid}
          style={{ 
            background: selectedType === "ai" ? "var(--accent-primary)" : (selectedType === "templates" ? "var(--accent-info)" : "var(--accent-secondary)"), 
            border: 'none',
            height: 44, borderRadius: 8, fontWeight: 600, padding: "0 24px" 
          }}
        >
          {selectedType === "ai" ? "Generate funnel" : (selectedType === "templates" ? "Next" : "Create")}
        </Button>
      </div>
    </Modal>
  );
};

const ManageFunnelView = ({ activeFunnel, setView, itemVariants }) => {
  const [steps, setSteps] = useState(activeFunnel.steps || []);
  const [newStepName, setNewStepName] = useState("");
  const [stepType, setStepType] = useState("landing");
  const [funnelName, setFunnelName] = useState(activeFunnel.name || "");
  const [slug, setSlug] = useState(activeFunnel.slug || "");
  const [status, setStatus] = useState(activeFunnel.status || "Draft");
  const [domain, setDomain] = useState(activeFunnel.domain || "");

  const handleAddStep = async () => {
    if (!newStepName.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const path = `/${newStepName.toLowerCase().replace(/\s+/g, "-")}`;
      const res = await fetch(`/api/funnels/${activeFunnel.key}/steps`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ name: newStepName, type: stepType, path })
      });
      const data = await res.json();
      if (data.success) {
        setSteps([...steps, data.data]);
        setNewStepName("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStep = async (stepId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/funnels/${activeFunnel.key}/steps/${stepId}`, {
        method: "DELETE",
        headers: {
          "Authorization": token ? `Bearer ${token}` : ""
        }
      });
      const data = await res.json();
      if (data.success) {
        setSteps(steps.filter(s => s._id !== stepId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/funnels/${activeFunnel.key}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ name: funnelName, slug, domain, status })
      });
      const data = await res.json();
      if (data.success) {
        Modal.success({ title: "Success", content: "Funnel settings saved successfully!" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div variants={itemVariants} className="glassmorphism" style={{ borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <Title level={3} style={{ margin: '0 0 4px', color: 'var(--text-primary)', fontWeight: 800 }}>{funnelName}</Title>
          <Text type="secondary" style={{ fontWeight: 500 }}>/{slug} / <Tag style={{ margin: '0 0 0 8px', borderRadius: 12, border: 'none', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-warning)', fontWeight: 700 }}>{status.toUpperCase()}</Tag></Text>
        </div>
        <Button style={{ borderRadius: 8, fontWeight: 600, borderColor: 'var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} onClick={() => setView("list")}>Back to Funnels</Button>
      </div>

      <div style={{ padding: 32 }}>
        {activeFunnel.isNew && (
          <div style={{ marginBottom: 24, padding: "16px 24px", borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 12, fontWeight: 600 }}>
            <CheckCircle2 size={20} />
            Funnel created successfully.
          </div>
        )}

        <Row gutter={32}>
          {/* Left Sidebar */}
          <Col span={8}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              
              <Card bodyStyle={{ padding: 24 }} style={{ borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>FUNNEL NAME</div>
                  <Input value={funnelName} onChange={e => setFunnelName(e.target.value)} style={{ borderRadius: 8, height: 40 }} />
                </div>
                
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>PATH</div>
                  <Input value={slug} onChange={e => setSlug(e.target.value)} style={{ borderRadius: 8, height: 40 }} />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>DOMAIN</div>
                  <Input value={domain} onChange={e => setDomain(e.target.value)} style={{ borderRadius: 8, height: 40 }} />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>FAVICON URL</div>
                  <Input placeholder="https://example.com/favicon.png" style={{ borderRadius: 8, height: 40 }} />
                </div>

                <div style={{ marginBottom: 32 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>STATUS</div>
                  <Select value={status} onChange={setStatus} style={{ width: "100%", height: 40 }}>
                    <Option value="Draft">Draft</Option>
                    <Option value="Active">Active</Option>
                  </Select>
                </div>

                {/* Tracking Pixels */}
                <div style={{ border: "1px solid var(--border-color)", borderRadius: 12, padding: 20, marginBottom: 24, background: "var(--bg-primary)" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4, color: 'var(--text-primary)' }}>Tracking Pixels</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: 11, marginBottom: 16 }}>Injected on every public page for this funnel.</div>
                  
                  <Row gutter={12} style={{ marginBottom: 16 }}>
                    <Col span={12}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: 0.5, marginBottom: 4 }}>META PIXEL ID</div>
                      <Input placeholder="1234567890" style={{ borderRadius: 6, height: 36, fontSize: 12 }} />
                    </Col>
                    <Col span={12}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: 0.5, marginBottom: 4 }}>GA4 ID</div>
                      <Input placeholder="G-XXXXXXXXXX" style={{ borderRadius: 6, height: 36, fontSize: 12 }} />
                    </Col>
                  </Row>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: 0.5, marginBottom: 4 }}>CUSTOM HEAD CODE</div>
                    <TextArea placeholder="<script>...</script> placed before </head>" style={{ borderRadius: 6, minHeight: 60, fontFamily: "monospace", fontSize: 11 }} />
                  </div>
                </div>

                <Button type="primary" onClick={handleSaveSettings} block style={{ background: "var(--accent-secondary)", border: "none", borderRadius: 8, fontWeight: 700, height: 44, marginBottom: 16 }}>
                  Save Funnel
                </Button>
              </Card>
            </div>
          </Col>

          {/* Right Area */}
          <Col span={16}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              
              <Card bodyStyle={{ padding: 32 }} style={{ borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 24, color: 'var(--text-primary)' }}>Funnel Steps</div>
                
                <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
                  <Input placeholder="Step name" value={newStepName} onChange={e => setNewStepName(e.target.value)} style={{ flex: 1, borderRadius: 8, height: 44 }} />
                  <Select value={stepType} onChange={setStepType} style={{ width: 150, height: 44 }}>
                    <Option value="landing">Landing</Option>
                    <Option value="checkout">Checkout</Option>
                  </Select>
                  <Button type="primary" onClick={handleAddStep} style={{ background: "var(--text-primary)", color: 'var(--bg-primary)', border: "none", borderRadius: 8, fontWeight: 700, height: 44, padding: "0 24px" }}>
                    Add Step
                  </Button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {steps.map((step, index) => (
                    <div key={step._id || index} style={{ borderTop: index > 0 ? "1px solid var(--border-color)" : "none", padding: '24px 0', display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Smartphone size={24} />
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4, color: 'var(--text-primary)' }}>{step.name}</div>
                          <div style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 500 }}>{step.type} / <Tag style={{ margin: '0 4px', borderRadius: 12, border: 'none', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-warning)', fontWeight: 700, padding: '0 6px', fontSize: 10 }}>{step.status || "DRAFT"}</Tag> / {step.path}</div>
                        </div>
                      </div>
                      <Space>
                        <Button icon={<Edit3 size={14}/>} style={{ borderRadius: 8, fontWeight: 600, borderColor: 'var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>Edit</Button>
                        <Button icon={<Eye size={14}/>} style={{ borderRadius: 8, fontWeight: 600, borderColor: 'var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-primary)' }} />
                        <Button danger icon={<Trash2 size={14}/>} style={{ borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', border: 'none' }} onClick={() => handleDeleteStep(step._id)} />
                      </Space>
                    </div>
                  ))}
                </div>
              </Card>

              <Card bodyStyle={{ padding: 32 }} style={{ borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, color: 'var(--text-primary)' }}>Tracking Events</div>
                <div style={{ border: "2px dashed var(--border-color)", borderRadius: 12, padding: 40, textAlign: "center", color: "var(--text-secondary)", fontSize: 14, fontWeight: 600 }}>
                  No tracking events yet. Add custom events inside the Builder.
                </div>
              </Card>

            </div>
          </Col>
        </Row>
      </div>
    </motion.div>
  );
};

const FunnelsTab = ({ itemVariants }) => {
  const [viewType, setViewType] = useState("list");
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [pendingFunnelName, setPendingFunnelName] = useState("");
  
  const [funnels, setFunnels] = useState([]);
  const [activeFunnel, setActiveFunnel] = useState(null);
  const [view, setView] = useState("list");

  useEffect(() => {
    const fetchFunnels = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/funnels", {
          headers: {
            "Authorization": token ? `Bearer ${token}` : ""
          }
        });
        const data = await res.json();
        if (data.success) {
          const mapped = data.data.map(f => ({
            key: f._id,
            name: f.name,
            slug: f.slug,
            lastUpdated: new Date(f.updatedAt).toLocaleDateString(),
            steps: f.stepsCount || 1,
            events: f.eventsCount || 0,
            isNew: false
          }));
          setFunnels(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch funnels", err);
      }
    };
    fetchFunnels();
  }, [view]);

  const handleCreateFunnel = async (data) => {
    if (data.type === "blank" || data.type === "template" || data.type === "ai") {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/funnels", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : ""
          },
          body: JSON.stringify({
            name: data.name,
            type: data.type,
            templateName: data.template
          })
        });
        const resData = await res.json();
        if (resData.success) {
          const newFunnel = {
            key: resData.data._id,
            name: resData.data.name,
            slug: resData.data.slug,
            type: resData.data.type,
            lastUpdated: "Just now",
            steps: resData.data.steps || [],
            events: 0,
            isNew: true
          };
          setFunnels([newFunnel, ...funnels]);
          setIsModalOpen(false);
          setIsTemplateModalOpen(false);
          setActiveFunnel(newFunnel);
          setView("manage");
        }
      } catch (err) {
        console.error(err);
      }
    } else if (data.type === "templates") {
      setPendingFunnelName(data.name);
      setIsModalOpen(false);
      setIsTemplateModalOpen(true);
    } else {
      setIsModalOpen(false);
    }
  };

  if (view === "manage" && activeFunnel) {
    return <ManageFunnelView activeFunnel={activeFunnel} setView={setView} itemVariants={itemVariants} />;
  }

  const columns = [
    {
      title: "NAME",
      dataIndex: "name",
      key: "name",
      render: (t) => <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t}</span>
    },
    {
      title: "LAST UPDATED",
      dataIndex: "lastUpdated",
      key: "lastUpdated",
      render: t => <Text type="secondary" style={{ fontWeight: 500 }}>{t}</Text>
    },
    {
      title: "STEPS",
      dataIndex: "steps",
      key: "steps",
      render: t => <strong style={{ color: 'var(--text-primary)' }}>{Array.isArray(t) ? t.length : (t || 0)}</strong>
    },
    {
      title: "EVENTS",
      dataIndex: "events",
      key: "events",
      render: t => <strong style={{ color: 'var(--text-primary)' }}>{t}</strong>
    },
    {
      title: "ACTIONS",
      key: "actions",
      render: (_, r) => (
        <span 
          style={{ color: "var(--accent-secondary)", fontWeight: 700, cursor: "pointer", display: 'flex', alignItems: 'center', gap: 4 }}
          onClick={async () => {
            try {
              const token = localStorage.getItem("token");
              const res = await fetch(`/api/funnels/${r.key}`, {
                headers: {
                  "Authorization": token ? `Bearer ${token}` : ""
                }
              });
              const resData = await res.json();
              if (resData.success) {
                setActiveFunnel({
                  ...resData.data,
                  key: resData.data._id,
                  steps: resData.data.steps || [],
                  isNew: false
                });
                setView("manage");
              }
            } catch (err) {
              console.error("Error loading funnel details", err);
            }
          }}
        >
          Manage <ChevronRight size={14} />
        </span>
      )
    },
  ];

  return (
    <motion.div variants={itemVariants}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={4} style={{ margin: '0 0 8px', color: 'var(--text-primary)', fontWeight: 800 }}>Funnels</Title>
          <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Build high-converting journeys with landing pages, opt-ins, checkout steps, events, and funnel-wide settings.</Text>
        </div>
        <Space>
          <Button icon={<FolderPlus size={16} />} style={{ borderRadius: 8, height: 40, borderColor: 'var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-secondary)', fontWeight: 600 }}>Create Folder</Button>
          <Button type="primary" icon={<Plus size={16} />} onClick={() => setIsModalOpen(true)} style={{ borderRadius: 8, height: 40, background: 'var(--accent-secondary)', border: 'none', boxShadow: 'var(--shadow-md)', fontWeight: 600 }}>New Funnel</Button>
        </Space>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <Radio.Group value={viewType} onChange={(e) => setViewType(e.target.value)} buttonStyle="solid">
          <Radio.Button value="recent" style={{ borderRadius: '8px 0 0 8px' }}>Recent</Radio.Button>
          <Radio.Button value="list" style={{ borderRadius: '0 8px 8px 0' }}>List</Radio.Button>
        </Radio.Group>
        <Input placeholder="Search for Funnels" prefix={<Search size={16} color="var(--text-tertiary)" />} value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ width: 300, borderRadius: 8, height: 40 }} />
      </div>

      <Table
        columns={columns}
        dataSource={funnels}
        pagination={false}
        size="middle"
        rowKey="key"
        locale={{
          emptyText: (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, background: 'rgba(13, 148, 136, 0.1)', color: 'var(--accent-secondary)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <BarChart3 size={32} />
              </div>
              <Title level={4} style={{ marginBottom: 8, color: 'var(--text-primary)', fontWeight: 800 }}>No funnels yet</Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: 24, fontSize: 14, fontWeight: 500 }}>Create your first funnel from blank, AI, templates, or a ZIP export.</Text>
              <Button type="primary" icon={<Plus size={16} />} onClick={() => setIsModalOpen(true)} style={{ borderRadius: 8, height: 40, background: 'var(--accent-secondary)', border: 'none', fontWeight: 600, padding: '0 24px' }}>New Funnel</Button>
            </div>
          )
        }}
      />

      <CreateFunnelModal 
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onCreate={handleCreateFunnel}
      />

      <FunnelTemplateLibraryModal 
        open={isTemplateModalOpen}
        initialFunnelName={pendingFunnelName}
        onCancel={() => {
          setIsTemplateModalOpen(false);
          setIsModalOpen(true);
        }}
        onCreate={handleCreateFunnel}
      />
    </motion.div>
  );
};

export default FunnelsTab;
