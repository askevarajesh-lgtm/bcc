import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  addEdge,
  useReactFlow,
  Panel,
  applyNodeChanges,
  applyEdgeChanges
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CustomNode from './CustomNode';
import { Button, Tooltip } from 'antd';
import { Maximize2, LayoutGrid, RotateCcw } from 'lucide-react';

const nodeTypes = {
  custom: CustomNode,
};

export default function Canvas({ nodes, edges, setNodes, setEdges, onSelectNode, selectedNodeId }) {
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition, fitView } = useReactFlow();

  const formattedNodes = React.useMemo(() => {
    return nodes.map(n => ({
      ...n,
      selected: n.id === selectedNodeId
    }));
  }, [nodes, selectedNodeId]);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      let nodePayload = window.__draggedWorkflowNode;
      if (!nodePayload) {
        const rawData = event.dataTransfer.getData('application/reactflow') || event.dataTransfer.getData('text/plain');
        if (rawData) {
          try {
            nodePayload = JSON.parse(rawData);
          } catch (e) {
            nodePayload = { type: 'action', label: String(rawData) };
          }
        }
      }

      if (!nodePayload) return;

      // Convert client coordinates to flow canvas coordinates
      let position = { x: 250, y: 150 };
      if (reactFlowWrapper.current) {
        const bounds = reactFlowWrapper.current.getBoundingClientRect();
        try {
          position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          });
        } catch (err) {
          position = {
            x: Math.max(20, event.clientX - bounds.left - 100),
            y: Math.max(20, event.clientY - bounds.top - 40),
          };
        }
      }

      const newNode = {
        id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        type: 'custom',
        position,
        data: {
          label: nodePayload.label || 'New Node',
          subtitle: nodePayload.subtitle || '',
          type: nodePayload.type || 'action',
          subtype: nodePayload.subtype || 'generic',
          config: nodePayload.config || {},
          retryPolicy: { maxRetries: 3, backoffMs: 1000 }
        },
      };

      setNodes((nds) => nds.concat(newNode));
      if (onSelectNode) onSelectNode(newNode);
      window.__draggedWorkflowNode = null;
    },
    [screenToFlowPosition, setNodes, onSelectNode]
  );

  const onNodeClick = (_, node) => {
    if (onSelectNode) onSelectNode(node);
  };

  const onPaneClick = () => {
    if (onSelectNode) onSelectNode(null);
  };

  return (
    <div 
      className="workflow-canvas" 
      ref={reactFlowWrapper} 
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{ flex: 1, height: '100%', position: 'relative', background: '#f8fafc' }}
    >
      <ReactFlow
        nodes={formattedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid={true}
        snapGrid={[15, 15]}
      >
        <Controls showInteractive={false} position="bottom-left" />
        <Background variant="dots" gap={16} size={1} color="#cbd5e1" />
        <Panel position="top-right" style={{ display: 'flex', gap: 8, margin: 12 }}>
          <Tooltip title="Fit View">
            <Button icon={<Maximize2 size={14} />} onClick={() => fitView({ padding: 0.2 })} />
          </Tooltip>
        </Panel>
      </ReactFlow>
    </div>
  );
}
