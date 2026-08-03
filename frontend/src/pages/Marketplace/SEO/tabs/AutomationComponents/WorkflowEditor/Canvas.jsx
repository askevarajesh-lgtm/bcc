import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  addEdge,
  useReactFlow,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CustomNode from './CustomNode';
import { Button, Tooltip } from 'antd';
import { Maximize2, LayoutGrid, RotateCcw } from 'lucide-react';

const nodeTypes = {
  custom: CustomNode,
};

export default function Canvas({ nodes, edges, setNodes, setEdges, onSelectNode }) {
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition, fitView } = useReactFlow();

  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => {
      let updated = [...nds];
      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          updated = updated.map(n => n.id === change.id ? { ...n, position: change.position } : n);
        } else if (change.type === 'remove') {
          updated = updated.filter(n => n.id !== change.id);
        } else if (change.type === 'select') {
          updated = updated.map(n => n.id === change.id ? { ...n, selected: change.selected } : n);
        }
      }
      return updated;
    });
  }, [setNodes]);

  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => {
      let updated = [...eds];
      for (const change of changes) {
        if (change.type === 'remove') {
          updated = updated.filter(e => e.id !== change.id);
        }
      }
      return updated;
    });
  }, [setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const rawData = event.dataTransfer.getData('application/reactflow');
      if (!rawData) return;

      let nodePayload = {};
      try {
        nodePayload = JSON.parse(rawData);
      } catch (e) {
        nodePayload = { type: rawData, label: `${rawData} node` };
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        type: 'custom',
        position,
        data: {
          label: nodePayload.label || 'New Node',
          subtitle: nodePayload.subtitle || '',
          type: nodePayload.type || 'action',
          subtype: nodePayload.subtype || 'generic',
          config: {},
          retryPolicy: { maxRetries: 3, backoffMs: 1000 }
        },
      };

      setNodes((nds) => nds.concat(newNode));
      onSelectNode(newNode);
    },
    [screenToFlowPosition, setNodes, onSelectNode]
  );

  const onNodeClick = (_, node) => {
    onSelectNode(node);
  };

  const onPaneClick = () => {
    onSelectNode(null);
  };

  return (
    <div className="workflow-canvas" ref={reactFlowWrapper} style={{ flex: 1, height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
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
        <Controls />
        <MiniMap 
          nodeStrokeWidth={3} 
          style={{ background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}
        />
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
