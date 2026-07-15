import React, { useEffect, useState } from 'react';
import { Card, Select, Typography, Spin, Button, message, Modal, Divider } from 'antd';
import { FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import CollaborationDrawer from './components/CollaborationDrawer';
import useWorkspaceReports from './hooks/useWorkspaceReports';

const { Title, Text } = Typography;
const { Option } = Select;

const ReportsPanel = ({ projects, isViewOnly, canAdd }) => {
  const { reports, pagination, loading, generating, fetchReports, generateReport } = useWorkspaceReports();
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeReport, setActiveReport] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (selectedProject) fetchReports(selectedProject);
  }, [selectedProject, fetchReports]);

  const handleGenerateReport = async () => {
    if (!selectedProject) return;
    try {
      await generateReport(selectedProject);
      message.success({ content: 'Report generated successfully!', key: 'report' });
    } catch (error) {
      message.error({ content: error.response?.data?.error || 'Failed to generate report. Make sure you have at least 2 audits.', key: 'report' });
    }
  };

  return (
    <>
      <Card className="seo-glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>Executive ROI Reports</Title>
          <div style={{ display: 'flex', gap: 16 }}>
            <Select placeholder="Select a project" style={{ width: 250 }} onChange={setSelectedProject} value={selectedProject}>
              {projects.map(p => <Option key={p._id} value={p._id}>{p.name}</Option>)}
            </Select>
            {!isViewOnly && canAdd && (
              <Button type="primary" onClick={handleGenerateReport} disabled={!selectedProject || generating} loading={generating} icon={<FileText size={16} />} className="seo-glow-btn">
                Generate New Report
              </Button>
            )}
          </div>
        </div>

        {!selectedProject ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <FileText size={48} color="#ccc" style={{ marginBottom: 16 }} />
            <Text type="secondary" style={{ display: 'block' }}>Select a project to view its final executive reports</Text>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}><Spin size="large" /></div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Text type="secondary" style={{ display: 'block' }}>No reports found. Generate one to compare your latest audits.</Text>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {reports.map(report => (
              <Card
                key={report._id} size="small" className="seo-glass-panel"
                style={{ cursor: 'pointer', borderRadius: 8, borderLeft: '4px solid var(--accent-primary)' }}
                onClick={() => { setActiveReport(report); setModalVisible(true); }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Title level={5} style={{ margin: '0 0 4px 0' }}>{report.title}</Title>
                    <Text type="secondary">Generated on {new Date(report.createdAt).toLocaleDateString()}</Text>
                  </div>
                  <Button type="link" className="seo-glow-btn-secondary">Read Report</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Modal
        title={<Title level={4} style={{ margin: 0, fontWeight: 800 }}>{activeReport?.title || 'SEO Report'}</Title>}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[<Button key="close" onClick={() => setModalVisible(false)} className="seo-glow-btn-secondary">Close</Button>]}
        width={800}
      >
        <div className="seo-markdown-container" style={{ maxHeight: '45vh', overflowY: 'auto' }}>
          <ReactMarkdown>{activeReport?.content || 'No content available.'}</ReactMarkdown>
        </div>
        <Divider />
        <CollaborationDrawer
          targetType="Report"
          targetId={activeReport?._id}
          projectId={selectedProject}
          canWrite={!isViewOnly}
        />
      </Modal>
    </>
  );
};

export default ReportsPanel;
