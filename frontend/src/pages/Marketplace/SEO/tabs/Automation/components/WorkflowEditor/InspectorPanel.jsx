import React from 'react';
import { Typography, Form, Input, Select, Button, Divider } from 'antd';

const { Title, Text } = Typography;

export default function InspectorPanel({ selectedNode, setNodes }) {
  if (!selectedNode) {
    return (
      <div className="workflow-inspector" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        Select a node to inspect
      </div>
    );
  }

  const handleUpdate = (key, value) => {
    setNodes(nds => 
      nds.map(n => {
        if (n.id === selectedNode.id) {
          return {
            ...n,
            data: {
              ...n.data,
              [key]: value
            }
          };
        }
        return n;
      })
    );
  };

  return (
    <div className="workflow-inspector">
      <Title level={5} style={{ margin: 0 }}>Properties</Title>
      <Text type="secondary" style={{ fontSize: 12 }}>{selectedNode.id}</Text>
      <Divider style={{ margin: '12px 0' }} />
      
      <Form layout="vertical">
        <Form.Item label="Label">
          <Input 
            value={selectedNode.data?.label || ''} 
            onChange={(e) => handleUpdate('label', e.target.value)}
          />
        </Form.Item>
        
        {selectedNode.data?.type === 'condition' && (
          <Form.Item label="Expression">
            <Input.TextArea 
              value={selectedNode.data?.expression || ''} 
              onChange={(e) => handleUpdate('expression', e.target.value)}
              placeholder="e.g. project.rank < 10"
            />
          </Form.Item>
        )}

        {selectedNode.data?.type === 'action' && (
          <Form.Item label="Action ID">
            <Select 
              value={selectedNode.data?.actionId || ''} 
              onChange={(val) => handleUpdate('actionId', val)}
              options={[
                { value: 'send_email', label: 'Send Email' },
                { value: 'update_db', label: 'Update DB' },
                { value: 'create_audit', label: 'Create Audit' }
              ]}
            />
          </Form.Item>
        )}

        <Button type="primary" block style={{ marginTop: 16 }}>Save Node Configuration</Button>
      </Form>
    </div>
  );
}
