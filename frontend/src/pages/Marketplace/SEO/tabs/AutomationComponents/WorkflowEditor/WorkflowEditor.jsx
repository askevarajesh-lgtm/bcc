import React, { useState, useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import Canvas from './Canvas';
import NodePalette from './NodePalette';
import InspectorPanel from './InspectorPanel';
import { Button, message, Tooltip } from 'antd';
import { Save, ArrowLeft, Play, LayoutDashboard } from 'lucide-react';
import axios from 'axios';

export default function WorkflowEditor({ projectId, workflowId, onClose }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [workflowMeta, setWorkflowMeta] = useState({ name: 'Untitled Workflow' });

  // In a real implementation, we would fetch the workflow graph based on workflowId
  // For now we start empty if it's new

  const handleSave = async () => {
    try {
      // API call to save nodes and edges
      message.success('Workflow saved successfully!');
    } catch (err) {
      message.error('Failed to save workflow.');
    }
  };

  const handleSimulate = async () => {
    try {
      const res = await axios.post(`/api/v1/automation/projects/${projectId}/workflows/${workflowId}/simulate`, {
        nodes, edges, variables: {}
      });
      console.log('Simulation trace:', res.data.data);
      message.success('Simulation complete (see console)');
    } catch (err) {
      message.error('Simulation failed.');
    }
  };

  return (
    <div className="workflow-editor-container">
      <div className="workflow-editor-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button type="text" icon={<ArrowLeft size={16} />} onClick={onClose} />
          <h2 style={{ margin: 0, fontSize: 18 }}>{workflowMeta.name}</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button icon={<LayoutDashboard size={14} />}>Variables</Button>
          <Button icon={<Play size={14} />} onClick={handleSimulate}>Simulate</Button>
          <Button type="primary" icon={<Save size={14} />} onClick={handleSave}>Save</Button>
        </div>
      </div>
      
      <div className="workflow-editor-body">
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
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
