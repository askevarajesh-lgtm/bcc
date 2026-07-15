import React, { useState } from 'react';
import { Card, Select, Typography, Switch } from 'antd';
import { Settings as SettingsIcon } from 'lucide-react';

const { Title, Text } = Typography;
const { Option } = Select;

const SettingsPanel = ({ projects, updateSettings, canEdit }) => {
  const [selectedProject, setSelectedProject] = useState(null);
  const project = projects.find(p => p._id === selectedProject);

  const handleUpdate = (settings) => updateSettings(selectedProject, settings);

  return (
    <Card className="seo-glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>Project Settings & Autopilot</Title>
        <Select placeholder="Select a project" style={{ width: 250 }} onChange={setSelectedProject} value={selectedProject}>
          {projects.map(p => <Option key={p._id} value={p._id}>{p.name}</Option>)}
        </Select>
      </div>

      {!selectedProject ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <SettingsIcon size={48} color="#ccc" style={{ marginBottom: 16 }} />
          <Text type="secondary" style={{ display: 'block' }}>Select a project to configure settings</Text>
        </div>
      ) : (
        <div style={{ maxWidth: 600 }}>
          <Card size="small" title="Autopilot Mode" className="seo-glass-panel" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>Enable Autopilot</Text>
                <br />
                <Text type="secondary">When enabled, the AI will continuously monitor rankings and automatically generate implementation tasks if rankings drop.</Text>
              </div>
              <Switch
                disabled={!canEdit}
                checked={project?.settings?.autopilot}
                onChange={(checked) => handleUpdate({ ...project.settings, autopilot: checked })}
              />
            </div>

            {project?.settings?.autopilot && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed var(--border-color)' }}>
                <Text strong>Check Frequency</Text>
                <Select
                  disabled={!canEdit}
                  value={project?.settings?.frequency || 'weekly'}
                  onChange={(val) => handleUpdate({ ...project.settings, frequency: val })}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  <Option value="daily">Daily</Option>
                  <Option value="weekly">Weekly</Option>
                </Select>
              </div>
            )}
          </Card>
        </div>
      )}
    </Card>
  );
};

export default SettingsPanel;
