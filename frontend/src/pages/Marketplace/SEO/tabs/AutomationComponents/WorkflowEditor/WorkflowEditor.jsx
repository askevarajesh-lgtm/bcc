import React, { useState, useEffect, useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import Canvas from './Canvas';
import NodePalette from './NodePalette';
import InspectorPanel from './InspectorPanel';
import SimulationDrawer from './SimulationDrawer';
import AiGeneratorModal from './AiGeneratorModal';
import VersionHistoryModal from './VersionHistoryModal';
import { Button, message, Tooltip, Space, Tag, Input, Modal } from 'antd';
import { 
  Save, ArrowLeft, Play, Sparkles, History, Download, Upload, 
  CheckCircle, Globe, Zap, Settings, RefreshCw
} from 'lucide-react';
import { seoWorkspaceApi } from '../../../../../../api/seoWorkspaceApi';

export default function WorkflowEditor({ projectId, workflowId, onClose }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [workflowMeta, setWorkflowMeta] = useState({ name: 'Untitled Workflow', status: 'Draft', triggerType: 'event' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Modals & Drawers
  const [showSimulator, setShowSimulator] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);

  // Load workflow data if editing existing
  useEffect(() => {
    if (workflowId) {
      setLoading(true);
      seoWorkspaceApi.getAutomationWorkflow(projectId, workflowId)
        .then(res => {
          const wf = res?.data || res;
          if (wf) {
            setWorkflowMeta({
              name: wf.name || 'Enterprise Workflow',
              status: wf.status || 'Draft',
              triggerType: wf.triggerType || 'event'
            });
            if (wf.nodes && Array.isArray(wf.nodes)) setNodes(wf.nodes);
            if (wf.edges && Array.isArray(wf.edges)) setEdges(wf.edges);
          }
        })
        .catch(err => {
          message.error('Failed to load workflow details');
        })
        .finally(() => setLoading(false));
    } else {
      // Default starting nodes for new workflow
      setNodes([
        {
          id: 'node_trigger_start',
          type: 'custom',
          position: { x: 250, y: 50 },
          data: {
            label: 'Keyword Rank Drop',
            subtitle: 'Position drops >= 3',
            type: 'trigger',
            subtype: 'keyword_rank_dropped',
            config: { threshold: 3 }
          }
        },
        {
          id: 'node_condition_check',
          type: 'custom',
          position: { x: 250, y: 180 },
          data: {
            label: 'Severity Condition',
            subtitle: 'Check if severity == Critical',
            type: 'condition',
            subtype: 'if_else',
            config: { expression: "trigger.payload.severity === 'Critical'" }
          }
        },
        {
          id: 'node_slack_alert',
          type: 'custom',
          position: { x: 100, y: 320 },
          data: {
            label: 'Send Slack Notification',
            subtitle: '#seo-emergency channel',
            type: 'action',
            subtype: 'send_slack_message',
            config: { recipient: '#seo-emergency' }
          }
        },
        {
          id: 'node_ai_diagnosis',
          type: 'custom',
          position: { x: 380, y: 320 },
          data: {
            label: 'AI Root Cause Analysis',
            subtitle: 'Diagnose SERP & competitor change',
            type: 'ai_agent',
            subtype: 'seo_root_cause',
            config: { agentKey: 'rootCauseDiagnostician' }
          }
        }
      ]);

      setEdges([
        { id: 'e1', source: 'node_trigger_start', target: 'node_condition_check', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
        { id: 'e2', source: 'node_condition_check', sourceHandle: 'true', target: 'node_slack_alert', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
        { id: 'e3', source: 'node_condition_check', sourceHandle: 'false', target: 'node_ai_diagnosis', animated: true, style: { stroke: '#ef4444', strokeWidth: 2 } }
      ]);
    }
  }, [workflowId, projectId]);

  const handleSave = async (publish = false) => {
    setSaving(true);
    try {
      const payload = {
        name: workflowMeta.name,
        triggerType: workflowMeta.triggerType,
        status: publish ? 'Active' : workflowMeta.status,
        nodes,
        edges
      };

      if (workflowId) {
        await seoWorkspaceApi.updateAutomationWorkflow(projectId, workflowId, payload);
      } else {
        await seoWorkspaceApi.createAutomationWorkflow(projectId, payload);
      }

      message.success(publish ? 'Workflow published and active!' : 'Workflow saved successfully!');
    } catch (err) {
      message.error(err?.response?.data?.error || 'Failed to save workflow');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyAiGraph = (newNodes, newEdges, name) => {
    setNodes(newNodes);
    setEdges(newEdges);
    if (name) setWorkflowMeta(prev => ({ ...prev, name }));
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ meta: workflowMeta, nodes, edges }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${workflowMeta.name.toLowerCase().replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    message.success('Workflow JSON exported');
  };

  const handleImportJson = (e) => {
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.nodes && parsed.edges) {
          setNodes(parsed.nodes);
          setEdges(parsed.edges);
          if (parsed.meta?.name) setWorkflowMeta(prev => ({ ...prev, name: parsed.meta.name }));
          message.success('Workflow JSON imported!');
        } else {
          message.error('Invalid workflow file format');
        }
      } catch (err) {
        message.error('Failed to parse JSON file');
      }
    };
  };

  return (
    <div className="workflow-editor-container" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      {/* Studio Header Bar */}
      <div className="workflow-editor-header" style={{ height: 56, padding: '0 16px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button type="text" icon={<ArrowLeft size={16} />} onClick={onClose} />
          
          {editingTitle ? (
            <Input
              value={workflowMeta.name}
              onChange={e => setWorkflowMeta({ ...workflowMeta, name: e.target.value })}
              onBlur={() => setEditingTitle(false)}
              onPressEnter={() => setEditingTitle(false)}
              autoFocus
              size="small"
              style={{ width: 250, fontWeight: 700 }}
            />
          ) : (
            <div 
              onClick={() => setEditingTitle(true)}
              style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <span>{workflowMeta.name}</span>
              <Tag color={workflowMeta.status === 'Active' ? 'green' : 'default'} style={{ margin: 0, fontSize: 11 }}>
                {workflowMeta.status}
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
            icon={<Zap size={14} />} 
            loading={saving}
            onClick={() => handleSave(true)}
            style={{ background: '#2563eb' }}
          >
            Publish Workflow
          </Button>
        </div>
      </div>

      {/* Main Studio Body: 3-column Layout */}
      <div className="workflow-editor-body" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <ReactFlowProvider>
          <NodePalette />
          
          <Canvas 
            nodes={nodes} 
            edges={edges} 
            setNodes={setNodes} 
            setEdges={setEdges}
            onSelectNode={setSelectedNode}
          />
          
          <InspectorPanel 
            selectedNode={selectedNode}
            setNodes={setNodes}
            projectId={projectId}
          />
        </ReactFlowProvider>
      </div>

      {/* Modals & Drawers */}
      <SimulationDrawer
        visible={showSimulator}
        onClose={() => setShowSimulator(false)}
        projectId={projectId}
        workflowId={workflowId}
        nodes={nodes}
        edges={edges}
      />

      <AiGeneratorModal
        visible={showAiModal}
        onCancel={() => setShowAiModal(false)}
        onApplyGraph={handleApplyAiGraph}
        projectId={projectId}
      />

      <VersionHistoryModal
        visible={showVersionModal}
        onCancel={() => setShowVersionModal(false)}
        workflowId={workflowId}
        projectId={projectId}
      />
    </div>
  );
}
