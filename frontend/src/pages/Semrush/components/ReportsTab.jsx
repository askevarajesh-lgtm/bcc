import React, { useRef, useState } from 'react';
import { Card, Typography, Button, Row, Col, message } from 'antd';
import { FilePdfOutlined, FileExcelOutlined, DownloadOutlined } from '@ant-design/icons';
import { useOutletContext } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import PDFReportTemplate from './PDFReportTemplate';

const { Title, Text } = Typography;

const ReportsTab = () => {
  const { project, projectData } = useOutletContext();
  const [generating, setGenerating] = useState(false);
  const pdfRef = useRef(null);

  const handleExportPDF = async () => {
    if (!pdfRef.current) return;
    
    try {
      setGenerating(true);
      message.loading({ content: 'Generating PDF Report...', key: 'pdfGen' });
      
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${project.domain.replace(/\./g, '_')}_SEO_Report.pdf`);
      
      message.success({ content: 'Report generated successfully!', key: 'pdfGen', duration: 3 });
    } catch (error) {
      console.error('PDF Generation failed:', error);
      message.error({ content: 'Failed to generate report.', key: 'pdfGen', duration: 3 });
    } finally {
      setGenerating(false);
    }
  };

  const reports = [
    { title: 'Full SEO Report', desc: 'Comprehensive domain overview, organic keywords, and backlinks.', icon: <FilePdfOutlined style={{ color: '#f5222d' }} /> },
    { title: 'Organic Research Report', desc: 'Keyword rankings, positions, and intent distribution.', icon: <FileExcelOutlined style={{ color: '#52c41a' }} /> },
    { title: 'Backlink Audit Report', desc: 'Toxic links, referring domains, and anchor texts.', icon: <FileExcelOutlined style={{ color: '#52c41a' }} /> },
    { title: 'Site Health Report', desc: 'Technical SEO issues, errors, warnings, and crawlability.', icon: <FilePdfOutlined style={{ color: '#f5222d' }} /> },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Reports</Title>
        <Text type="secondary">Generate and export professional reports for {project?.domain}.</Text>
      </div>

      <Row gutter={[24, 24]}>
        {reports.map((report, idx) => (
          <Col span={12} key={idx}>
            <Card hoverable>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ fontSize: 32 }}>{report.icon}</div>
                <div style={{ flex: 1 }}>
                  <Title level={5} style={{ margin: 0, marginBottom: 4 }}>{report.title}</Title>
                  <Text type="secondary">{report.desc}</Text>
                  <div style={{ marginTop: 16 }}>
                    <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportPDF} loading={generating}>Generate Report</Button>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Hidden container for PDF generation template */}
      <div style={{ position: 'absolute', top: -9999, left: -9999, opacity: 0, zIndex: -1, overflow: 'hidden' }}>
        <PDFReportTemplate ref={pdfRef} project={project} projectData={projectData} />
      </div>
    </div>
  );
};

export default ReportsTab;
