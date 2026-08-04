import React, { useState, useEffect, useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import Canvas from './Canvas';
import NodePalette from './NodePalette';
import InspectorPanel from './InspectorPanel';
import SimulationDrawer from './SimulationDrawer';
import AiGeneratorModal from './AiGeneratorModal';
import VersionHistoryModal from './VersionHistoryModal';
import { Button, message, Tooltip, Space, Tag, Input, Modal, Spin } from 'antd';
import { 
  Save, ArrowLeft, Play, Sparkles, History, Download, Upload, 
  CheckCircle, Globe, Zap, Settings, RefreshCw, Edit3, Check, X
} from 'lucide-react';
import { seoWorkspaceApi } from '../../../../../../api/seoWorkspaceApi';
import { useTheme } from '../../../../../../contexts/ThemeContext';

export default function WorkflowEditor({ projectId, workflowId, initialData, onClose }) {
  const isExistingWorkflow = workflowId && workflowId !== 'new' && workflowId !== 'temp_workflow';
  const [currentWorkflowId, setCurrentWorkflowId] = useState(isExistingWorkflow ? workflowId : null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [workflowMeta, setWorkflowMeta] = useState({
    name: initialData?.name || 'Untitled Workflow',
    status: 'Draft',
    triggerType: initialData?.triggerType || 'schedule',
    category: initialData?.category || 'Website Audit',
    description: initialData?.description || ''
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isDark } = useTheme();

  // Modals & Drawers
  const [showSimulator, setShowSimulator] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(initialData?.name || 'Untitled Workflow');

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  const buildStarterNodes = (category = 'Website Audit', triggerType = 'schedule') => {
    const triggerSubtype = triggerType === 'schedule' ? 'schedule_cron' : triggerType === 'webhook' ? 'webhook_inbound' : 'keyword_rank_dropped';
    const triggerLabel = triggerType === 'schedule' ? 'Daily Schedule' : triggerType === 'webhook' ? 'Inbound Webhook' : 'Rank Drop Alert';

    let actionSubtype = 'run_site_audit';
    let actionLabel = 'Run Website Audit';
    if (category === 'Technical SEO') {
      actionSubtype = 'run_technical_seo';
      actionLabel = 'Deep Technical SEO Crawl';
    } else if (category === 'Keywords & Rankings') {
      actionSubtype = 'track_keyword_ranks';
      actionLabel = 'Track Keyword Positions';
    } else if (category === 'Competitor Analysis') {
      actionSubtype = 'scan_competitor_changes';
      actionLabel = 'Scan Competitor Gap';
    } else if (category === 'Content AI') {
      actionSubtype = 'generate_content_brief';
      actionLabel = 'Generate Content Brief';
    } else if (category === 'Internal Linking') {
      actionSubtype = 'generate_internal_links';
      actionLabel = 'Generate Internal Links';
    } else if (category === 'Monitoring & Uptime') {
      actionSubtype = 'check_site_health';
      actionLabel = 'Check Site Uptime & SSL';
    }

    const starterNodes = [
      {
        id: 'node_starter_trigger',
        type: 'custom',
        position: { x: 250, y: 50 },
        data: {
          label: triggerLabel,
          subtitle: triggerType === 'schedule' ? '0 19 * * * (Daily at 19:00 UTC)' : 'Auto-triggered',
          type: 'trigger',
          subtype: triggerSubtype,
          config: triggerType === 'schedule' ? { cronExpression: '0 19 * * *', timezone: 'UTC' } : {}
        }
      },
      {
        id: 'node_starter_action',
        type: 'custom',
        position: { x: 250, y: 200 },
        data: {
          label: actionLabel,
          subtitle: `Auto-invokes ${category} Engine`,
          type: 'action',
          subtype: actionSubtype,
          config: { domain: '{{project.domain}}' }
        }
      },
      {
        id: 'node_starter_notify',
        type: 'custom',
        position: { x: 250, y: 350 },
        data: {
          label: 'Send Email Digest',
          subtitle: 'Notify team with execution metrics',
          type: 'action',
          subtype: 'send_email_digest',
          config: {
            recipient: 'seo-team@company.com',
            subject: `[SEO Alert] ${category} executed successfully`,
            body: `Automation finished for {{project.domain}}.\nScore: {{steps.${actionSubtype}.score}}`
          }
        }
      }
    ];

    const starterEdges = [
      { id: 'e_starter_1', source: 'node_starter_trigger', target: 'node_starter_action', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
      { id: 'e_starter_2', source: 'node_starter_action', target: 'node_starter_notify', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } }
    ];

    return { nodes: starterNodes, edges: starterEdges };
  };

  // Load workflow data if editing existing or initialize new
  useEffect(() => {
    if (workflowId && workflowId !== 'new' && workflowId !== 'temp_workflow') {
      setLoading(true);
      setCurrentWorkflowId(workflowId);
      seoWorkspaceApi.getAutomationWorkflow(projectId, workflowId)
        .then(res => {
          const wf = res?.data || res;
          if (wf) {
            const name = wf.name || 'Enterprise Workflow';
            setWorkflowMeta({
              name: name,
              status: wf.status || 'Draft',
              triggerType: wf.triggerType || 'event',
              category: wf.category || 'General',
              description: wf.description || ''
            });
            setTempTitle(name);
            const activeVer = wf.activeVersionId || {};
            const wfNodes = wf.nodes || activeVer.nodes;
            const wfEdges = wf.edges || activeVer.edges;
            if (Array.isArray(wfNodes) && wfNodes.length > 0) {
              setNodes(wfNodes);
            }
            if (Array.isArray(wfEdges) && wfEdges.length > 0) {
              setEdges(wfEdges);
            }
          }
        })
        .catch(err => {
          console.warn('Could not load remote workflow details, continuing in design mode:', err);
        })
        .finally(() => setLoading(false));
    } else {
      // Initialize with user provided config
      setCurrentWorkflowId(null);
      const customName = initialData?.name || 'New Custom Workflow';
      const customCategory = initialData?.category || 'Website Audit';
      const customTriggerType = initialData?.triggerType || 'schedule';
      const customDesc = initialData?.description || '';

      setWorkflowMeta({
        name: customName,
        status: 'Draft',
        triggerType: customTriggerType,
        category: customCategory,
        description: customDesc
      });
      setTempTitle(customName);

      if (initialData?.startType === 'blank') {
        // Single starting trigger node
        const triggerSubtype = customTriggerType === 'schedule' ? 'schedule_cron' : customTriggerType === 'webhook' ? 'webhook_inbound' : 'keyword_rank_dropped';
        const triggerLabel = customTriggerType === 'schedule' ? 'Schedule Trigger' : customTriggerType === 'webhook' ? 'Inbound Webhook' : 'Event Trigger';
        setNodes([
          {
            id: 'node_start_trigger',
            type: 'custom',
            position: { x: 250, y: 80 },
            data: {
              label: triggerLabel,
              subtitle: 'Configure parameters in Inspector panel',
              type: 'trigger',
              subtype: triggerSubtype,
              config: customTriggerType === 'schedule' ? { cronExpression: '0 19 * * *', timezone: 'UTC' } : {}
            }
          }
        ]);
        setEdges([]);
      } else if (initialData?.startType === 'ai' && initialData?.aiPrompt) {
        // AI generation flow
        setLoading(true);
        seoWorkspaceApi.generateAiWorkflow(projectId, initialData.aiPrompt)
          .then(res => {
            const aiData = res?.data || res;
            if (aiData?.nodes && Array.isArray(aiData.nodes) && aiData.nodes.length > 0) {
              setNodes(aiData.nodes);
              setEdges(aiData.edges || []);
              if (aiData.name) {
                setWorkflowMeta(prev => ({ ...prev, name: aiData.name }));
                setTempTitle(aiData.name);
              }
              message.success('AI Workflow graph generated and wired!');
            } else {
              const starter = buildStarterNodes(customCategory, customTriggerType);
              setNodes(starter.nodes);
              setEdges(starter.edges);
            }
          })
          .catch(err => {
            console.warn('AI generation error, loading starter nodes:', err);
            const starter = buildStarterNodes(customCategory, customTriggerType);
            setNodes(starter.nodes);
            setEdges(starter.edges);
          })
          .finally(() => setLoading(false));
      } else {
        // Default starter nodes
        const starter = buildStarterNodes(customCategory, customTriggerType);
        setNodes(starter.nodes);
        setEdges(starter.edges);
      }
    }
  }, [workflowId, projectId, initialData]);

  // Auto-select first node if none is currently selected
  useEffect(() => {
    if (nodes.length > 0 && (!selectedNodeId || !nodes.find(n => n.id === selectedNodeId))) {
      setSelectedNodeId(nodes[0].id);
    }
  }, [nodes, selectedNodeId]);

  const handleSaveTitle = () => {
    const cleanTitle = tempTitle.trim() || 'Untitled Workflow';
    setWorkflowMeta(prev => ({ ...prev, name: cleanTitle }));
    setTempTitle(cleanTitle);
    setEditingTitle(false);
  };

  const handleSave = async (publish = false) => {
    const finalName = (workflowMeta.name || '').trim();
    if (!finalName || finalName === 'Untitled Workflow') {
      setEditingTitle(true);
      message.warning('Please enter a specific name for your workflow');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: finalName,
        triggerType: workflowMeta.triggerType || 'schedule',
        category: workflowMeta.category || 'General',
        description: workflowMeta.description || '',
        status: publish ? 'Published' : (workflowMeta.status === 'Published' || workflowMeta.status === 'Active' ? 'Active' : 'Draft'),
        nodes: Array.isArray(nodes) ? nodes : [],
        edges: Array.isArray(edges) ? edges : []
      };

      let res;
      if (currentWorkflowId && currentWorkflowId !== 'new' && currentWorkflowId !== 'temp_workflow') {
        res = await seoWorkspaceApi.updateAutomationWorkflow(projectId, currentWorkflowId, payload);
      } else {
        res = await seoWorkspaceApi.createAutomationWorkflow(projectId, payload);
      }
      
      const savedData = res?.data || res;
      if (savedData?._id) {
        setCurrentWorkflowId(savedData._id);
      }
      if (savedData?.name) {
        setWorkflowMeta(prev => ({
          ...prev,
          name: savedData.name,
          status: savedData.status || (publish ? 'Published' : 'Draft')
        }));
        setTempTitle(savedData.name);
      }
      message.success(publish ? 'Workflow published and active in workspace!' : 'Workflow draft saved successfully!');
    } catch (err) {
      console.error('[handleSave] Error:', err);
      const errMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to save workflow';
      message.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleApplyAiGraph = (newNodes, newEdges, name) => {
    setNodes(newNodes);
    setEdges(newEdges);
    if (name) {
      setWorkflowMeta(prev => ({ ...prev, name }));
      setTempTitle(name);
    }
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ meta: workflowMeta, nodes, edges }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${(workflowMeta.name || 'workflow').toLowerCase().replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    message.success('Workflow JSON exported');
  };

  const handleImportJson = (e) => {
    const fileReader = new FileReader();
    if (!e.target.files?.[0]) return;
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.nodes && parsed.edges) {
          setNodes(parsed.nodes);
          setEdges(parsed.edges);
          if (parsed.meta?.name) {
            setWorkflowMeta(prev => ({ ...prev, name: parsed.meta.name }));
            setTempTitle(parsed.meta.name);
          }
          message.success('Workflow JSON imported!');
        } else {
          message.error('Invalid workflow file format');
        }
      } catch (err) {
        message.error('Failed to parse JSON file');
      }
    };
  };

  const handleAddNode = (nodeData) => {
    const xOffset = 250 + (nodes.length % 5) * 40;
    const yOffset = 100 + (nodes.length % 5) * 50;

    const newNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: 'custom',
      position: { x: xOffset, y: yOffset },
      data: {
        label: nodeData.label || 'New Node',
        subtitle: nodeData.subtitle || '',
        type: nodeData.type || 'action',
        subtype: nodeData.subtype || 'generic',
        config: nodeData.config || {},
        retryPolicy: { maxRetries: 3, backoffMs: 1000 }
      }
    };

    setNodes((nds) => nds.concat(newNode));
    setSelectedNodeId(newNode.id);
    message.success(`Added "${nodeData.label}" to canvas`);
  };

  const handleDeleteNode = (nodeId) => {
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    setSelectedNodeId(null);
    message.success('Node removed from workflow');
  };

  const handleDuplicateNode = (nodeToDup) => {
    if (!nodeToDup) return;
    const clonedId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const cloned = {
      ...nodeToDup,
      id: clonedId,
      position: { 
        x: (nodeToDup.position?.x || 200) + 30, 
        y: (nodeToDup.position?.y || 200) + 40 
      },
      data: { 
        ...nodeToDup.data, 
        label: `${nodeToDup.data?.label || 'Node'} (Copy)` 
      }
    };
    setNodes(nds => nds.concat(cloned));
    setSelectedNodeId(clonedId);
    message.success('Node duplicated');
  };

  return (
    <div 
      className="workflow-editor-container" 
      style={{ 
        height: 'calc(100vh - 170px)', 
        minHeight: 650, 
        display: 'flex', 
        flexDirection: 'column', 
        background: isDark ? '#0b132b' : '#f8fafc',
        borderRadius: 12,
        border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
        overflow: 'hidden',
        marginTop: 8
      }}
    >
      {/* Studio Header Bar */}
      <div 
        className="workflow-editor-header" 
        style={{ 
          height: 60, 
          minHeight: 60,
          padding: '0 16px', 
          background: isDark ? '#0f172a' : '#ffffff', 
          borderBottom: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button type="text" icon={<ArrowLeft size={16} />} onClick={onClose} />
          
          {editingTitle ? (
            <Space.Compact style={{ width: 320 }}>
              <Input
                value={tempTitle}
                onChange={e => setTempTitle(e.target.value)}
                onPressEnter={handleSaveTitle}
                autoFocus
                size="middle"
                style={{ fontWeight: 700, borderRadius: '6px 0 0 6px' }}
              />
              <Button type="primary" icon={<Check size={14} />} onClick={handleSaveTitle} />
              <Button icon={<X size={14} />} onClick={() => { setTempTitle(workflowMeta.name); setEditingTitle(false); }} />
            </Space.Compact>
          ) : (
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <span 
                onClick={() => { setTempTitle(workflowMeta.name); setEditingTitle(true); }}
                style={{ 
                  fontWeight: 700, 
                  fontSize: 16, 
                  color: isDark ? '#f1f5f9' : '#0f172a', 
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: 4,
                  border: '1px solid transparent',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                title="Click to rename workflow"
              >
                {workflowMeta.name}
              </span>
              <Tooltip title="Rename workflow">
                <Button 
                  type="text" 
                  size="small" 
                  icon={<Edit3 size={13} color="#64748b" />} 
                  onClick={() => { setTempTitle(workflowMeta.name); setEditingTitle(true); }} 
                />
              </Tooltip>
              <Tag color={workflowMeta.status === 'Active' || workflowMeta.status === 'Published' ? 'green' : 'default'} style={{ margin: 0, fontSize: 11 }}>
                {workflowMeta.status}
              </Tag>
              <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                {workflowMeta.category || 'Website Audit'}
              </Tag>
            </div>
          )}
        </div>

        {/* Action Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button 
            icon={<Sparkles size={14} color="#7c3aed" />} 
            onClick={() => setShowAiModal(true)}
            style={{ color: '#7c3aed', borderColor: '#ddd6fe', background: '#f5f3ff' }}
          >
            AI Studio Assistant
          </Button>

          <Button icon={<Play size={14} />} onClick={() => setShowSimulator(true)}>
            Simulate DAG
          </Button>

          <Button icon={<History size={14} />} onClick={() => setShowVersionModal(true)}>
            Versions
          </Button>

          <Tooltip title="Export JSON">
            <Button icon={<Download size={14} />} onClick={handleExportJson} />
          </Tooltip>

          <label style={{ margin: 0 }}>
            <input type="file" accept=".json" onChange={handleImportJson} style={{ display: 'none' }} />
            <Tooltip title="Import JSON">
              <Button icon={<Upload size={14} />} as="span" style={{ cursor: 'pointer' }} />
            </Tooltip>
          </label>

          <Button 
            icon={<Save size={14} />} 
            loading={saving}
            onClick={() => handleSave(false)}
          >
            Save Draft
          </Button>

          <Button 
            type="primary" 
            icon={<CheckCircle size={14} />} 
            loading={saving}
            onClick={() => handleSave(true)}
            style={{ background: '#10b981', borderColor: '#10b981' }}
          >
            Publish Workflow
          </Button>
        </div>
      </div>

      {/* Main Studio Body: Palette, Visual Canvas, Inspector */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {loading ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spin size="large" tip="Loading workflow canvas..." />
          </div>
        ) : (
          <ReactFlowProvider>
            {/* Left Node Palette */}
            <NodePalette onAddNode={handleAddNode} />

            {/* Central Visual DAG Canvas */}
            <div style={{ flex: 1, height: '100%', position: 'relative' }}>
              <Canvas
                nodes={nodes}
                edges={edges}
                setNodes={setNodes}
                setEdges={setEdges}
                selectedNodeId={selectedNodeId}
                setSelectedNodeId={setSelectedNodeId}
                onDuplicateNode={handleDuplicateNode}
                onDeleteNode={handleDeleteNode}
              />
            </div>

            {/* Right Node Inspector / Edit Panel */}
            <InspectorPanel
              selectedNode={selectedNode}
              setNodes={setNodes}
              projectId={projectId}
              onDeleteNode={handleDeleteNode}
              onDuplicateNode={handleDuplicateNode}
              onClose={() => setSelectedNodeId(null)}
            />
          </ReactFlowProvider>
        )}
      </div>

      {/* Simulation Drawer */}
      <SimulationDrawer
        visible={showSimulator}
        onClose={() => setShowSimulator(false)}
        projectId={projectId}
        workflow={{
          ...workflowMeta,
          nodes,
          edges
        }}
      />

      {/* AI Generator Modal */}
      <AiGeneratorModal
        visible={showAiModal}
        onClose={() => setShowAiModal(false)}
        projectId={projectId}
        onApplyGraph={handleApplyAiGraph}
      />

      {/* Version History Modal */}
      <VersionHistoryModal
        visible={showVersionModal}
        onClose={() => setShowVersionModal(false)}
        projectId={projectId}
        workflowId={currentWorkflowId}
        onRestoreVersion={(verNodes, verEdges) => {
          setNodes(verNodes);
          setEdges(verEdges);
          message.success('Workflow restored to chosen version');
        }}
      />
    </div>
  );
}
