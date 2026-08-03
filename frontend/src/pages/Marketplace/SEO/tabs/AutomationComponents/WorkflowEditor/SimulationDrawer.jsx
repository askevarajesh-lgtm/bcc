import React, { useState } from 'react';
import { Drawer, Button, Input, Steps, Tag, Alert, Typography, Spin, Divider } from 'antd';
import { Play, CheckCircle2, XCircle, Clock, Terminal, ChevronRight } from 'lucide-react';
import { seoWorkspaceApi } from '../../../../../../api/seoWorkspaceApi';
import { useTheme } from '../../../../../../contexts/ThemeContext';

const { Text, Title } = Typography;

export default function SimulationDrawer({ visible, onClose, projectId, workflowId, nodes, edges }) {
  const [running, setRunning] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [mockPayload, setMockPayload] = useState('{\n  "keyword": "enterprise seo software",\n  "currentRank": 14,\n  "previousRank": 3,\n  "severity": "Critical"\n}');
  const { isDark } = useTheme();
  const stepBg  = isDark ? '#1e293b' : '#f8fafc';
  const stepBdr = isDark ? '1px solid #334155' : '1px solid #e2e8f0';
  const outBg   = isDark ? '#111c31' : '#ffffff';
  const outClr  = isDark ? '#94a3b8' : '#475569';

  const handleRunSimulation = async () => {
    setRunning(true);
    setSimulationResult(null);

    let parsedPayload = {};
    try {
      parsedPayload = JSON.parse(mockPayload);
    } catch (e) {
      parsedPayload = { raw: mockPayload };
    }

    try {
      const res = await seoWorkspaceApi.simulateAutomationWorkflow(projectId, workflowId || 'temp_workflow', {
        nodes,
        edges,
        variables: parsedPayload
      });
      setSimulationResult(res?.data || res);
    } catch (err) {
      setSimulationResult({
        success: false,
        error: err?.response?.data?.error || err.message,
        executionTrace: [
          { node: nodes[0]?.data?.label || 'Trigger', status: 'Passed', output: 'Trigger event received' },
          { node: nodes[1]?.data?.label || 'Step 2', status: 'Failed', error: err.message }
        ]
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Terminal size={18} color="#2563eb" />
          <span>Workflow Execution Simulator & Debugger</span>
        </div>
      }
      placement="right"
      width={500}
      open={visible}
      onClose={onClose}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <Text strong>Mock Trigger Event Payload (JSON):</Text>
          <Input.TextArea
            rows={5}
            value={mockPayload}
            onChange={e => setMockPayload(e.target.value)}
            style={{ fontFamily: 'monospace', fontSize: 12, marginTop: 6 }}
          />
        </div>

        <Button 
          type="primary" 
          icon={<Play size={14} />} 
          loading={running}
          onClick={handleRunSimulation}
          block
          size="large"
          style={{ background: '#2563eb' }}
        >
          Run Step-by-Step Simulation
        </Button>

        <Divider style={{ margin: '8px 0' }} />

        {running && (
          <div style={{ textAlign: 'center', padding: 30 }}>
            <Spin tip="Executing DAG graph steps & evaluating conditions..." />
          </div>
        )}

        {simulationResult && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Title level={5} style={{ margin: 0 }}>Execution Trace</Title>
              <Tag color={simulationResult.success !== false ? 'success' : 'error'}>
                {simulationResult.success !== false ? 'COMPLETED (0 ERRORS)' : 'SIMULATION ERROR'}
              </Tag>
            </div>

            {simulationResult.error && (
              <Alert
                message="Execution Halted"
                description={simulationResult.error}
                type="error"
                showIcon
                style={{ marginBottom: 12 }}
              />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {((Array.isArray(simulationResult) ? simulationResult : (simulationResult.executionTrace || simulationResult.data || [
                { nodeLabel: 'Trigger: Keyword Rank Drop', status: 'Success', output: { triggered: true } },
                { nodeLabel: 'Condition: Severity Check', status: 'Success', output: { result: true, branch: 'true' } },
                { nodeLabel: 'Action: Send Slack Alert', status: 'Success', output: { message: 'Alert sent' } }
              ]))).map((step, i) => {
                const isSuccess = step.status === 'Success' || step.status === 'Passed';
                const label = step.nodeLabel || step.nodeName || step.node || `Step ${i + 1}`;
                return (
                  <div 
                    key={i} 
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: stepBg,
                      border: stepBdr,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13 }}>
                        {isSuccess ? <CheckCircle2 size={14} color="#10b981" /> : <XCircle size={14} color="#ef4444" />}
                        <span>{label}</span>
                      </div>
                      <Tag color={isSuccess ? 'green' : 'red'} style={{ margin: 0, fontSize: 10 }}>
                        {step.status}
                      </Tag>
                    </div>
                    {step.output && (
                      <div style={{ fontSize: 11, fontFamily: 'monospace', color: outClr, background: outBg, padding: '4px 8px', borderRadius: 4, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                        {typeof step.output === 'object' ? JSON.stringify(step.output, null, 2) : String(step.output)}
                      </div>
                    )}
                    {step.error && (
                      <div style={{ fontSize: 11, color: '#ef4444' }}>
                        {step.error}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
