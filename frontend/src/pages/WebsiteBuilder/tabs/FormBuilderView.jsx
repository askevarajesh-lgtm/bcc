import React, { useState, useEffect } from "react";
import { Button, Input, Typography, Space, Select, Checkbox, Radio, DatePicker, Card, Modal, message, Form, Tag, Row, Col } from "antd";
import { Plus, X, ArrowUp, ArrowDown, Edit3, Copy, HelpCircle, ListPlus } from "lucide-react";
import { motion } from "framer-motion";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const { Title, Text } = Typography;

const SortableFieldItem = ({ field, onEdit, onDelete, onDuplicate, onMoveUp, onMoveDown, isFirst, isLast }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: 24, padding: 16, border: '1px solid var(--border-color)', borderRadius: 12, background: 'var(--bg-primary)', position: 'relative',
    touchAction: 'none',
    userSelect: 'none',
    opacity: attributes?.['aria-pressed'] ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="builder-field-row">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {field.label} {field.required && <span style={{ color: "var(--accent-danger)" }}>*</span>} <HelpCircle size={14} color="var(--text-tertiary)" />
        </div>
        <div style={{ display: "flex", gap: 8, opacity: 0.6 }} onPointerDown={(e) => e.stopPropagation()}>
          <Edit3 size={16} style={{ cursor: 'pointer' }} onClick={() => onEdit(field)} />
          <Copy size={16} style={{ cursor: 'pointer' }} onClick={() => onDuplicate(field)} />
          <ArrowUp size={16} style={{ cursor: isFirst ? 'not-allowed' : 'pointer', opacity: isFirst ? 0.3 : 1 }} onClick={() => !isFirst && onMoveUp(field)} />
          <ArrowDown size={16} style={{ cursor: isLast ? 'not-allowed' : 'pointer', opacity: isLast ? 0.3 : 1 }} onClick={() => !isLast && onMoveDown(field)} />
          <X size={16} style={{ cursor: 'pointer', color: 'var(--accent-danger)' }} onClick={() => onDelete(field)} />
        </div>
      </div>
      {/* Render mock input based on type */}
      {field.type === 'Text Area' ? <Input.TextArea rows={3} placeholder={field.placeholder} style={{ borderRadius: 8 }} readOnly /> :
       field.type === 'Select' ? <Select placeholder={field.placeholder} style={{ width: '100%' }} disabled /> :
       field.type === 'Checkbox Group' ? <Checkbox.Group options={field.options && field.options.length ? field.options : ['Option 1']} disabled /> :
       field.type === 'Radio Group' ? <Radio.Group options={field.options && field.options.length ? field.options : ['Option 1']} disabled /> :
       field.type === 'Date Field' ? <DatePicker style={{ width: '100%', borderRadius: 8 }} disabled /> :
       <Input size="large" placeholder={field.placeholder} style={{ borderRadius: 8 }} readOnly />}
    </div>
  );
};

const DraggableSidebarItem = ({ item, isLast, onAdd }) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `sidebar-${item}`,
    data: { type: item, fromSidebar: true }
  });
  
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={{ 
      padding: '16px 24px', 
      borderBottom: isLast ? 'none' : '1px solid var(--border-color)', 
      color: 'var(--text-primary)', 
      fontWeight: 600, 
      cursor: attributes?.['aria-pressed'] ? 'grabbing' : 'grab',
      transition: 'background 0.2s',
      position: 'relative',
      zIndex: 10,
      touchAction: 'none',
      userSelect: 'none',
      opacity: attributes?.['aria-pressed'] ? 0.5 : 1,
    }}
    onClick={() => onAdd(item)}
    onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
    >
      {item}
    </div>
  );
};

const FormBuilderView = ({ activeForm, setActiveForm, itemVariants }) => {
  const [currentTab, setCurrentTab] = useState("Edit");
  const [formName, setFormName] = useState(activeForm?.name || "New Form");
  const [status, setStatus] = useState(activeForm?.status || "Draft");
  
  const [settings, setSettings] = useState({
    headline: "",
    subHeadline: "",
    accentColor: "var(--accent-primary)",
    submitButtonLabel: "Submit",
    successMessage: "Thank you — we received your submission.",
    trackingPixels: {
      metaPixelId: "",
      googleAnalyticsId: "",
      googleTagManagerId: "",
      tiktokPixelId: "",
      fireMetaLeadEvent: false
    },
    customHeadCode: "",
    customBodyCode: ""
  });

  const [fields, setFields] = useState([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const [activeDragType, setActiveDragType] = useState(null);
  const [activeDragField, setActiveDragField] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: 'canvas-droppable'
  });

  useEffect(() => {
    if (activeForm && activeForm._id) {
      fetchForm();
    } else if (activeForm && activeForm.from === 'template') {
      if (activeForm.templateFields && activeForm.templateFields.length > 0) {
        setFields(activeForm.templateFields.map((f, i) => ({ ...f, id: f._id || f.id || `id-${Date.now()}-${i}` })));
      } else {
        setFields([]);
      }
      setFormName(activeForm.name || "Template Form");
    } else {
      setFields([]);
      setFormName(activeForm?.name || "New Form");
    }
  }, [activeForm]);

  const fetchForm = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/forms/${activeForm._id}`, {
        headers: { "Authorization": token ? `Bearer ${token}` : "" }
      });
      const data = await res.json();
      if (data.success) {
        if (data.data.fields) {
          setFields(data.data.fields.map((f, i) => ({ ...f, id: f._id || `id-${Date.now()}-${i}` })));
        }
        if (data.data.settings) {
          setSettings(s => ({ ...s, ...data.data.settings }));
        }
        if (data.data.name) setFormName(data.data.name);
        if (data.data.status) setStatus(data.data.status);
      }
    } catch (error) {
      message.error("Failed to fetch form details");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payloadFields = fields.map((f, i) => ({
        label: f.label,
        type: f.type,
        required: f.required || false,
        placeholder: f.placeholder || "",
        options: f.options || [],
        order: i
      }));

      const payload = {
        name: formName || "New Form",
        status: status,
        fields: payloadFields,
        settings: settings
      };

      if (!activeForm._id) {
        // CREATE FORM
        const res = await fetch(`/api/forms`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : "" 
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          message.success("Form created and saved successfully!");
          setActiveForm({ ...activeForm, _id: data.data._id });
        } else {
          message.error("Failed to create form.");
        }
      } else {
        // UPDATE FORM
        const res = await fetch(`/api/forms/${activeForm._id}`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : "" 
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          message.success("Form updated successfully!");
        } else {
          message.error("Failed to update form.");
        }
      }
    } catch (err) {
      message.error("Error saving form");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!activeForm._id) {
      message.error("Cannot delete an unsaved form");
      return;
    }
    Modal.confirm({
      title: "Delete Form",
      content: "Are you sure you want to delete this form? This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      onOk: async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`/api/forms/${activeForm._id}`, {
            method: "DELETE",
            headers: { "Authorization": token ? `Bearer ${token}` : "" }
          });
          if (res.ok) {
            message.success("Form deleted");
            setActiveForm(null);
          }
        } catch (err) {
          message.error("Failed to delete form");
        }
      }
    })
  };

  const handleDragStart = (event) => {
    const { active } = event;
    if (active.data.current?.fromSidebar) {
      setActiveDragType(active.data.current.type);
      setActiveDragField(null);
    } else {
      const field = fields.find(f => f.id === active.id);
      setActiveDragField(field);
      setActiveDragType(null);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveDragType(null);
    setActiveDragField(null);

    if (!over) return;

    if (active.data.current?.fromSidebar) {
      const type = active.data.current.type;
      const newField = { 
        id: `id-${Date.now()}`, 
        label: `New ${type}`, 
        type, 
        required: false, 
        placeholder: '',
        options: ['Option 1', 'Option 2']
      };

      if (over.id === 'canvas-droppable' || !fields.find(f => f.id === over.id)) {
        setFields([...fields, newField]);
      } else {
        const overIndex = fields.findIndex(f => f.id === over.id);
        const newFields = [...fields];
        // Ensure it drops above or below based on rects, but simple splice at overIndex works well enough
        newFields.splice(overIndex, 0, newField);
        setFields(newFields);
      }
      return;
    }

    if (active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addField = (type) => {
    setFields([...fields, { 
      id: `id-${Date.now()}`, 
      label: `New ${type}`, 
      type, 
      required: false, 
      placeholder: '',
      options: ['Option 1', 'Option 2']
    }]);
  };

  const deleteField = (field) => {
    setFields(fields.filter(f => f.id !== field.id));
  };

  const duplicateField = (field) => {
    const index = fields.findIndex(f => f.id === field.id);
    const newFields = [...fields];
    newFields.splice(index + 1, 0, { ...field, id: `id-${Date.now()}` });
    setFields(newFields);
  };

  const moveField = (field, direction) => {
    const index = fields.findIndex(f => f.id === field.id);
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    setFields(arrayMove(fields, index, newIndex));
  };

  const submitPreviewForm = async (values) => {
    if (!activeForm._id) {
      message.success("Form submission tested successfully (no form ID to save to).");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/forms/${activeForm._id}/submit`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "" 
        },
        body: JSON.stringify(values)
      });
      const data = await res.json();
      if (data.success) {
        message.success("Form submitted successfully!");
        form.resetFields();
      } else {
        message.error("Form submission failed.");
      }
    } catch (err) {
      message.error("Form submission error.");
    }
  };

  const fieldTypes = ["Autocomplete", "Button", "Checkbox Group", "Date Field", "File Upload", "Header", "Hidden Input", "Number", "Paragraph", "Radio Group", "Select", "Text Field", "Text Area"];

  return (
    <motion.div variants={itemVariants} className="builder-view-container" style={{ minHeight: "calc(100vh - 64px)", background: 'var(--bg-primary)', margin: "-24px", paddingTop: 0 }}>
      {/* Redesigned Header Layout */}
      <div style={{ background: "var(--bg-primary)", borderBottom: "1px solid var(--border-color)", padding: "16px 32px 0 32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 1200, margin: "0 auto 16px" }}>
          <Space size="middle">
            <Button style={{ borderRadius: 8, fontWeight: 700, borderColor: "var(--border-color)", height: 38 }} onClick={() => setActiveForm(null)}>
              ← Back
            </Button>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: 0.5, marginBottom: 4, textTransform: "uppercase" }}>FORM NAME</div>
              <Input 
                value={formName} 
                onChange={e => setFormName(e.target.value)} 
                style={{ width: 250 }} 
              />
            </div>
          </Space>
          <Space size="large" align="center">
            <Select 
              value={status} 
              onChange={setStatus} 
              style={{ width: 120 }} 
              size="large"
            >
              <Select.Option value="Draft"><span style={{ fontWeight: 600 }}>Draft</span></Select.Option>
              <Select.Option value="Published"><span style={{ fontWeight: 600, color: 'var(--accent-success)' }}>Published</span></Select.Option>
            </Select>
            <Button type="primary" onClick={handleSave} loading={loading} style={{ borderRadius: 8, fontWeight: 800, padding: "0 24px", height: 38, background: 'var(--accent-success)', border: 'none' }}>
              Save
            </Button>
          </Space>
        </div>
        
        {/* Top Tab Navigation */}
        <div style={{ display: 'flex', gap: 24, maxWidth: 1200, margin: "0 auto" }}>
          {["Edit", "Settings", "Integrate"].map(tab => (
            <div 
              key={tab}
              onClick={() => setCurrentTab(tab)}
              style={{
                paddingBottom: 16,
                paddingTop: 8,
                color: currentTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: currentTab === tab ? 800 : 600,
                fontSize: 15,
                cursor: 'pointer',
                borderBottom: currentTab === tab ? '3px solid var(--text-primary)' : '3px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {tab}
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "32px auto", padding: "0 32px" }}>
        
        {/* -------------------- EDIT TAB -------------------- */}
        {currentTab === "Edit" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>
                {isPreviewMode ? "Previewing your form. Submissions will be recorded." : "Drag fields from the left, reorder on the canvas, then save."}
              </Text>
              <div style={{ background: 'var(--bg-secondary)', padding: '4px', borderRadius: 8, display: 'flex', gap: 4, border: '1px solid var(--border-color)' }}>
                <div 
                  onClick={() => setIsPreviewMode(false)}
                  style={{ padding: '6px 16px', background: !isPreviewMode ? 'var(--text-primary)' : 'transparent', color: !isPreviewMode ? 'var(--bg-primary)' : 'var(--text-secondary)', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  Visual
                </div>
                <div 
                  onClick={() => setIsPreviewMode(true)}
                  style={{ padding: '6px 16px', background: isPreviewMode ? 'var(--text-primary)' : 'transparent', color: isPreviewMode ? 'var(--bg-primary)' : 'var(--text-secondary)', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  Preview
                </div>
              </div>
            </div>

            {!isPreviewMode ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
                    <Card ref={setDroppableRef} bodyStyle={{ padding: "40px" }} style={{ borderRadius: 16, border: "1px solid var(--border-color)", background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-md)' }} className="builder-canvas">
                      <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                        {fields.length === 0 ? (
                          <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-secondary)" }}>
                            Drag a field from the right to add it to the form.
                          </div>
                        ) : (
                          fields.map((field, index) => (
                            <SortableFieldItem 
                              key={field.id} 
                              field={field} 
                              onEdit={setEditingField}
                              onDelete={deleteField}
                              onDuplicate={duplicateField}
                              onMoveUp={(f) => moveField(f, 'up')}
                              onMoveDown={(f) => moveField(f, 'down')}
                              isFirst={index === 0}
                              isLast={index === fields.length - 1}
                            />
                          ))
                        )}
                      </SortableContext>
                    </Card>
                  </div>

                  <div style={{ width: 280, flexShrink: 0, position: 'sticky', top: 24 }}>
                    <Card bodyStyle={{ padding: "0" }} style={{ borderRadius: 16, border: "1px solid var(--border-color)", background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}><ListPlus size={18} /> Add Fields</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {fieldTypes.map((item, idx) => (
                          <DraggableSidebarItem 
                            key={item} 
                            item={item} 
                            isLast={idx === fieldTypes.length - 1} 
                            onAdd={addField} 
                          />
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
                <DragOverlay dropAnimation={null}>
                  {activeDragType ? (
                    <div style={{ padding: '16px 24px', background: 'var(--bg-primary)', border: '1px solid var(--accent-primary)', borderRadius: 8, fontWeight: 600, color: 'var(--text-primary)', boxShadow: 'var(--shadow-lg)', opacity: 0.9, cursor: 'grabbing' }}>
                      {activeDragType}
                    </div>
                  ) : activeDragField ? (
                    <div style={{ padding: 16, border: '2px solid var(--accent-primary)', borderRadius: 12, background: 'var(--bg-primary)', boxShadow: 'var(--shadow-lg)', opacity: 0.9, cursor: 'grabbing', width: '100%' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 12 }}>
                        {activeDragField.label} {activeDragField.required && <span style={{ color: "var(--accent-danger)" }}>*</span>}
                      </div>
                      <Input size="large" placeholder={activeDragField.placeholder} style={{ borderRadius: 8 }} readOnly />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            ) : (
              <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
                  <Card bodyStyle={{ padding: "40px" }} style={{ borderRadius: 16, border: "1px solid var(--border-color)", background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-md)' }} className="builder-canvas">
                    <Form form={form} layout="vertical" onFinish={submitPreviewForm}>
                      {settings.headline && <Title level={3} style={{ textAlign: "center", marginBottom: 8, color: settings.accentColor || 'var(--text-primary)' }}>{settings.headline}</Title>}
                      {settings.subHeadline && <Text style={{ display: "block", textAlign: "center", marginBottom: 32, color: 'var(--text-secondary)', fontSize: 16 }}>{settings.subHeadline}</Text>}
                      {fields.map(field => (
                        <Form.Item 
                          key={field.id} 
                          label={<span style={{ fontWeight: 600 }}>{field.label}</span>} 
                          name={field.label} 
                          rules={[{ required: field.required, message: `Please input your ${field.label}!` }]}
                        >
                          {field.type === 'Text Area' ? <Input.TextArea rows={4} placeholder={field.placeholder} /> :
                           field.type === 'Select' ? <Select placeholder={field.placeholder} options={field.options?.map(o => ({label: o, value: o})) || []} /> :
                           field.type === 'Checkbox Group' ? <Checkbox.Group options={field.options || []} /> :
                           field.type === 'Radio Group' ? <Radio.Group options={field.options || []} /> :
                           field.type === 'Date Field' ? <DatePicker style={{ width: '100%' }} /> :
                           <Input size="large" placeholder={field.placeholder} />}
                        </Form.Item>
                      ))}
                      <div style={{ textAlign: "center", marginTop: 24 }}>
                        <Button type="primary" htmlType="submit" block style={{ height: 56, borderRadius: 12, backgroundColor: settings.accentColor || "var(--accent-primary)", border: 'none', fontWeight: 800, fontSize: 16, boxShadow: 'var(--shadow-md)' }}>
                          {settings.submitButtonLabel || "Submit Form"}
                        </Button>
                      </div>
                    </Form>
                  </Card>
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------- SETTINGS TAB -------------------- */}
        {currentTab === "Settings" && (
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <Card style={{ borderRadius: 16, border: "1px solid var(--border-color)", background: "var(--bg-secondary)", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ marginBottom: 32 }}>
                <Title level={4} style={{ margin: "0 0 8px", fontWeight: 800, color: "var(--text-primary)" }}>Form settings</Title>
                <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>Status, messages, and button label shown on the hosted form.</Text>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>Headline</div>
                  <Input 
                    size="large" 
                    value={settings.headline} 
                    onChange={e => setSettings({...settings, headline: e.target.value})} 
                    style={{ borderRadius: 8 }} 
                  />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>Sub-headline</div>
                  <Input.TextArea 
                    rows={3} 
                    value={settings.subHeadline} 
                    onChange={e => setSettings({...settings, subHeadline: e.target.value})} 
                    style={{ borderRadius: 8 }} 
                  />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>Accent Color</div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <Input 
                      type="color" 
                      value={settings.accentColor} 
                      onChange={e => setSettings({...settings, accentColor: e.target.value})} 
                      style={{ width: 50, height: 40, padding: 0, borderRadius: 8, border: "1px solid var(--border-color)", cursor: "pointer" }} 
                    />
                    <Input 
                      value={settings.accentColor} 
                      onChange={e => setSettings({...settings, accentColor: e.target.value})} 
                      style={{ width: 120, borderRadius: 8, height: 40 }} 
                    />
                  </div>
                </div>
                
                <Row gutter={24}>
                  <Col span={12}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>Submit Button Label</div>
                    <Input 
                      size="large" 
                      value={settings.submitButtonLabel} 
                      onChange={e => setSettings({...settings, submitButtonLabel: e.target.value})} 
                      style={{ borderRadius: 8 }} 
                    />
                  </Col>
                  <Col span={12}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>Success Message</div>
                    <Input 
                      size="large" 
                      value={settings.successMessage} 
                      onChange={e => setSettings({...settings, successMessage: e.target.value})} 
                      style={{ borderRadius: 8 }} 
                    />
                  </Col>
                </Row>

                <div style={{ background: "rgba(59, 130, 246, 0.03)", border: "1px solid rgba(59, 130, 246, 0.2)", padding: 24, borderRadius: 12 }}>
                  <Title level={5} style={{ margin: "0 0 8px", fontWeight: 800 }}>Tracking pixels</Title>
                  <Text type="secondary" style={{ display: "block", marginBottom: 24, fontSize: 13, fontWeight: 500 }}>Injected on every public page for this form.</Text>
                  
                  <Row gutter={[24, 24]}>
                    <Col span={12}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>Meta (Facebook) Pixel ID</div>
                      <Input 
                        placeholder="1234567890" 
                        value={settings.trackingPixels?.metaPixelId} 
                        onChange={e => setSettings({...settings, trackingPixels: { ...settings.trackingPixels, metaPixelId: e.target.value }})} 
                        style={{ borderRadius: 8 }} 
                      />
                    </Col>
                    <Col span={12}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>Google Analytics 4 ID</div>
                      <Input 
                        placeholder="G-XXXXXXXXXX" 
                        value={settings.trackingPixels?.googleAnalyticsId} 
                        onChange={e => setSettings({...settings, trackingPixels: { ...settings.trackingPixels, googleAnalyticsId: e.target.value }})} 
                        style={{ borderRadius: 8 }} 
                      />
                    </Col>
                    <Col span={12}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>Google Tag Manager ID</div>
                      <Input 
                        placeholder="GTM-XXXXXXX" 
                        value={settings.trackingPixels?.googleTagManagerId} 
                        onChange={e => setSettings({...settings, trackingPixels: { ...settings.trackingPixels, googleTagManagerId: e.target.value }})} 
                        style={{ borderRadius: 8 }} 
                      />
                    </Col>
                    <Col span={12}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>TikTok Pixel ID</div>
                      <Input 
                        placeholder="CXXXXXXXXXXXXXXXX" 
                        value={settings.trackingPixels?.tiktokPixelId} 
                        onChange={e => setSettings({...settings, trackingPixels: { ...settings.trackingPixels, tiktokPixelId: e.target.value }})} 
                        style={{ borderRadius: 8 }} 
                      />
                    </Col>
                    <Col span={24}>
                      <Checkbox 
                        checked={settings.trackingPixels?.fireMetaLeadEvent} 
                        onChange={e => setSettings({...settings, trackingPixels: { ...settings.trackingPixels, fireMetaLeadEvent: e.target.checked }})}
                      >
                        <span style={{ fontWeight: 600 }}>Fire Meta `Lead` event when the form is submitted</span>
                      </Checkbox>
                    </Col>
                  </Row>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>Custom Head Code</div>
                  <Input.TextArea 
                    rows={4} 
                    placeholder="<script>...</script> placed before </head>"
                    value={settings.customHeadCode} 
                    onChange={e => setSettings({...settings, customHeadCode: e.target.value})} 
                    style={{ borderRadius: 8, fontFamily: "monospace" }} 
                  />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>Custom Body Code</div>
                  <Input.TextArea 
                    rows={4} 
                    placeholder="<noscript>...</noscript> placed after <body>"
                    value={settings.customBodyCode} 
                    onChange={e => setSettings({...settings, customBodyCode: e.target.value})} 
                    style={{ borderRadius: 8, fontFamily: "monospace" }} 
                  />
                </div>
              </div>
            </Card>

            <div style={{ marginTop: 24, textAlign: "center" }}>
              <Button type="link" danger onClick={handleDelete} style={{ fontWeight: 700, padding: 0 }}>
                Delete form
              </Button>
            </div>
          </div>
        )}

        {/* -------------------- INTEGRATE TAB -------------------- */}
        {currentTab === "Integrate" && (
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <Card style={{ borderRadius: 16, border: "1px solid var(--border-color)", background: "var(--bg-secondary)", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ marginBottom: 24 }}>
                <Title level={4} style={{ margin: "0 0 8px", fontWeight: 800, color: "var(--text-primary)" }}>Integrate</Title>
                <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>Paste into any site, or drag from <strong>Your forms</strong> in the page builder after publishing.</Text>
              </div>

              {!activeForm._id ? (
                <div style={{ padding: "40px", textAlign: "center", background: "var(--bg-primary)", border: "1px dashed var(--border-color)", borderRadius: 12 }}>
                  <Text type="secondary" style={{ fontWeight: 600 }}>Please save the form first to generate the embed code.</Text>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <Input.TextArea 
                    rows={4} 
                    readOnly 
                    value={`<iframe src="${window.location.origin}/embed/form/${activeForm._id}"\n  title="${formName}" style="width:100%;min-height:520px;border:0;border-radius:16px;">\n</iframe>`}
                    style={{ borderRadius: 12, fontFamily: "monospace", padding: 16, background: "var(--bg-primary)", border: "1px solid var(--border-color)" }} 
                  />
                  <div>
                    <Button 
                      onClick={() => {
                        navigator.clipboard.writeText(`<iframe src="${window.location.origin}/embed/form/${activeForm._id}" title="${formName}" style="width:100%;min-height:520px;border:0;border-radius:16px;"></iframe>`);
                        message.success("Embed code copied to clipboard!");
                      }} 
                      style={{ borderRadius: 8, fontWeight: 700, height: 40, padding: "0 24px", borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-primary)" }}
                    >
                      Copy embed code
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            <div style={{ marginTop: 24, textAlign: "center" }}>
              <Button type="link" danger onClick={handleDelete} style={{ fontWeight: 700, padding: 0 }}>
                Delete form
              </Button>
            </div>
          </div>
        )}

      </div>

      {/* Field Editing Modal */}
      <Modal
        title="Field Settings"
        open={!!editingField}
        onCancel={() => setEditingField(null)}
        onOk={() => {
          setFields(fields.map(f => f.id === editingField.id ? editingField : f));
          setEditingField(null);
        }}
        okText="Save Changes"
        okButtonProps={{ style: { borderRadius: 8, fontWeight: 700, background: 'var(--accent-primary)', border: 'none' } }}
        cancelButtonProps={{ style: { borderRadius: 8, fontWeight: 700 } }}
      >
        {editingField && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            <div>
              <Text strong>Label</Text>
              <Input 
                value={editingField.label} 
                onChange={(e) => setEditingField({...editingField, label: e.target.value})} 
                style={{ marginTop: 8 }}
              />
            </div>
            <div>
              <Text strong>Placeholder</Text>
              <Input 
                value={editingField.placeholder} 
                onChange={(e) => setEditingField({...editingField, placeholder: e.target.value})} 
                style={{ marginTop: 8 }}
              />
            </div>
            <div>
              <Checkbox 
                checked={editingField.required} 
                onChange={(e) => setEditingField({...editingField, required: e.target.checked})}
              >
                Required Field
              </Checkbox>
            </div>
            {['Select', 'Radio Group', 'Checkbox Group'].includes(editingField.type) && (
              <div>
                <Text strong>Options (comma separated)</Text>
                <Input 
                  value={(editingField.options || []).join(', ')} 
                  onChange={(e) => setEditingField({
                    ...editingField, 
                    options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })} 
                  style={{ marginTop: 8 }}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default FormBuilderView;
