import React, { useRef, useState } from 'react';
import { Card, Typography, Button, Row, Col, message } from 'antd';
import { FilePdfOutlined, FileExcelOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { useOutletContext } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import PDFReportTemplate from './PDFReportTemplate';

const { Title, Text } = Typography;

const checkMap = {
  2: "sitemap.xml file has format errors",
  6: "multiple canonical URLs",
  8: "pages don't have meta descriptions",
  13: "duplicate title tags",
  15: "duplicate meta descriptions",
  39: "pages returned 4XX status code",
  101: "broken internal images",
  103: "unminified JavaScript and CSS files",
  106: "pages have low text-HTML ratio",
  110: "HTTP URLs in sitemap.xml for HTTPS site",
  112: "images don't have alt attributes",
  125: "pages don't have an h1 heading",
  132: "pages don't have enough text within the title tags",
  135: "links have no anchor text",
  137: "links have non-descriptive anchor text",
  205: "pages have only one incoming internal link",
  213: "URLs with a permanent redirect",
  216: "subdomains don't support HSTS",
  217: "issue with blocked external resource in robots.txt"
};
const getIssueName = (id) => checkMap[id] || `Site Audit Issue #${id}`;

const ReportsTab = () => {
  const { project, projectData, triggerRefresh } = useOutletContext();
  const [generating, setGenerating] = useState(false);
  const pdfRef = useRef(null);
  
  const isRefreshing = projectData?.activeJob && ['QUEUED', 'RUNNING'].includes(projectData.activeJob.status);

  const handleExportPDF = () => {
    try {
      setGenerating(true);
      message.loading({ content: 'Generating PDF Report...', key: 'pdfGen' });

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const data = projectData?.overview || {};
      const backlinks = projectData?.backlinksOverview || {};
      const health = projectData?.siteHealth || {};
      const keywords = projectData?.organicKeywords || [];

      const formatNumber = (num) => {
        if (!num && num !== 0) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return Number(num).toLocaleString();
      };

      // Header
      pdf.setFontSize(24);
      pdf.setTextColor(17, 24, 39);
      pdf.text('SEO Performance Report', 14, 22);

      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      pdf.text(`Prepared for ${project?.domain || 'Unknown Domain'}`, 14, 30);
      pdf.text(`Generated On ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, 140, 30);

      pdf.setDrawColor(240, 240, 240);
      pdf.line(14, 35, 196, 35);

      // Executive Summary
      pdf.setFontSize(16);
      pdf.setTextColor(55, 65, 81);
      pdf.text('Executive Summary', 14, 45);

      autoTable(pdf, {
        startY: 50,
        head: [['Authority Score', 'Organic Traffic', 'Organic Keywords', 'Paid Keywords']],
        body: [[
            String(backlinks.score || data['Rank'] || '0'),
            formatNumber(data['Organic Traffic']),
            formatNumber(data['Organic Keywords']),
            formatNumber(data['Adwords Traffic'])
        ]],
        theme: 'grid',
        headStyles: { fillColor: [248, 250, 252], textColor: [107, 114, 128], halign: 'center' },
        bodyStyles: { halign: 'center', fontSize: 14, fontStyle: 'bold', textColor: [15, 23, 42] },
        alternateRowStyles: { fillColor: [255, 255, 255] }
      });

      let nextY = pdf.lastAutoTable.finalY + 15;

      // Backlinks Profile
      pdf.setFontSize(14);
      pdf.setTextColor(55, 65, 81);
      pdf.text('Backlink Profile', 14, nextY);
      
      autoTable(pdf, {
        startY: nextY + 5,
        head: [['Total Backlinks', 'Ref. Domains', 'Follow Links']],
        body: [[
            formatNumber(backlinks.total || backlinks.backlinks),
            formatNumber(backlinks.backlinksDetails?.referringDomains || 0),
            formatNumber(backlinks.backlinksDetails?.follow || 0)
        ]],
        theme: 'grid',
        headStyles: { fillColor: [248, 250, 252], textColor: [107, 114, 128], halign: 'center' },
        bodyStyles: { halign: 'center', fontSize: 12, fontStyle: 'bold', textColor: [15, 23, 42] },
        margin: { right: 105 } // Left side
      });

      const leftTableY = pdf.lastAutoTable.finalY;

      // Site Health
      pdf.text('Site Health', 110, nextY);
      autoTable(pdf, {
        startY: nextY + 5,
        head: [['Health Score', 'Passed Checks', 'Issues']],
        body: [[
            `${health.overallScore ?? 'N/A'}`,
            formatNumber(health.siteHealthDetails?.healthy || 0),
            formatNumber((health.siteHealthDetails?.errors?.length || 0) + (health.siteHealthDetails?.warnings?.length || 0))
        ]],
        theme: 'grid',
        headStyles: { fillColor: [248, 250, 252], textColor: [107, 114, 128], halign: 'center' },
        bodyStyles: { halign: 'center', fontSize: 12, fontStyle: 'bold', textColor: [15, 23, 42] },
        margin: { left: 110 } // Right side
      });

      const rightTableY = pdf.lastAutoTable.finalY;
      nextY = Math.max(leftTableY, rightTableY) + 15;

      // Top Organic Keywords Table
      pdf.setFontSize(16);
      pdf.setTextColor(55, 65, 81);
      pdf.text('Top Organic Keywords', 14, nextY);

      const topKeywords = keywords.slice(0, 20);
      const keywordsRows = topKeywords.map(k => [
        k.keyword || '',
        k.position || '-',
        formatNumber(k.searchVolume),
        k.keywordDifficulty || '-',
        k.cpc || '-'
      ]);

      if (keywordsRows.length > 0) {
          autoTable(pdf, {
            startY: nextY + 5,
            head: [['Keyword', 'Position', 'Search Volume', 'KD %', 'CPC ($)']],
            body: keywordsRows,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] },
            styles: { fontSize: 10 }
          });
          nextY = pdf.lastAutoTable.finalY + 15;
      } else {
          pdf.setFontSize(10);
          pdf.text('No organic keyword data available for this domain.', 14, nextY + 10);
          nextY += 20;
      }

      // Position Tracking
      const trackingRankings = projectData?.positionTracking?.data?.rankings || [];
      if (trackingRankings.length > 0) {
        pdf.setFontSize(16);
        pdf.setTextColor(55, 65, 81);
        pdf.text('Position Tracking', 14, nextY);
        
        const trackingRows = trackingRankings.slice(0, 20).map(k => [
          k.keyword || '',
          k.position || '-',
          formatNumber(k.searchVolume),
          k.difficulty || '-'
        ]);

        autoTable(pdf, {
          startY: nextY + 5,
          head: [['Keyword', 'Current Position', 'Search Volume', 'Difficulty %']],
          body: trackingRows,
          theme: 'grid',
          headStyles: { fillColor: [114, 46, 209] }, // Purple
          styles: { fontSize: 10 }
        });
        nextY = pdf.lastAutoTable.finalY + 15;
      }

      // Competitor Analysis
      const competitors = projectData?.overview?.competitors || [];
      if (competitors.length > 0) {
        pdf.setFontSize(16);
        pdf.setTextColor(55, 65, 81);
        pdf.text('Main Competitors', 14, nextY);
        
        const compRows = competitors.slice(0, 15).map(c => [
          c.domain || '',
          formatNumber(c.competitorRelevance || 0),
          formatNumber(c.commonKeywords || 0),
          formatNumber(c.organicKeywords || 0)
        ]);

        autoTable(pdf, {
          startY: nextY + 5,
          head: [['Competitor Domain', 'Relevance Score', 'Common Keywords', 'Total Keywords']],
          body: compRows,
          theme: 'grid',
          headStyles: { fillColor: [250, 140, 22] }, // Orange
          styles: { fontSize: 10 }
        });
      }

      pdf.save(`${project?.domain?.replace(/\./g, '_') || 'project'}_SEO_Report.pdf`);
      
      message.success({ content: 'Report generated successfully!', key: 'pdfGen', duration: 3 });
    } catch (error) {
      console.error('PDF Generation failed:', error);
      message.error({ content: 'Failed to generate report.', key: 'pdfGen', duration: 3 });
    } finally {
      setGenerating(false);
    }
  };

  const handleExportCSV = (id) => {
    let data = [];
    let filename = '';

    if (id === 'organic') {
       data = projectData?.organicKeywordsData || [];
       filename = `${project.domain.replace(/\./g, '_')}_Organic_Research.csv`;
    }

    if (data.length === 0) {
        message.warning({ content: 'No data available for this report.' });
        return;
    }

    // Convert to CSV
    const convertToCSV = (arr) => {
      const keys = Object.keys(arr[0]);
      const csvData = arr.map(row => 
         keys.map(k => {
           let cell = row[k] === null || row[k] === undefined ? '' : row[k];
           cell = String(cell).replace(/"/g, '""');
           return `"${cell}"`;
         }).join(',')
      );
      return [keys.join(','), ...csvData].join('\n');
    };

    try {
        const csvContent = convertToCSV(data);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        message.success({ content: 'Report generated successfully!', duration: 3 });
    } catch (e) {
        console.error('CSV Generation failed:', e);
        message.error({ content: 'Failed to generate report.' });
    }
  };

  const handleExportBacklinkPDF = () => {
    try {
      setGenerating(true);
      message.loading({ content: 'Generating Backlink Report...', key: 'pdfGen' });

      const pdf = new jsPDF({
        orientation: 'l', // Landscape for the table
        unit: 'mm',
        format: 'a4',
      });

      const backlinks = projectData?.backlinksOverview || {};
      const rawBacklinks = backlinks.rawBacklinks || [];

      const formatNumber = (num) => {
        if (!num && num !== 0) return '0';
        return Number(num).toLocaleString();
      };

      // Header
      pdf.setFontSize(24);
      pdf.setTextColor(17, 24, 39);
      pdf.text('Backlink Audit Report', 14, 22);

      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      pdf.text(`Prepared for ${project?.domain || 'Unknown Domain'}`, 14, 30);
      pdf.text(`Generated On ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, 220, 30);

      pdf.setDrawColor(240, 240, 240);
      pdf.line(14, 35, 283, 35);

      // Summary Stats
      autoTable(pdf, {
        startY: 40,
        head: [['Total Backlinks', 'Authority Score', 'Referring Domains', 'Follow', 'Nofollow']],
        body: [[
            formatNumber(backlinks.total || backlinks.backlinks),
            String(backlinks.score || '0'),
            formatNumber(backlinks.referringDomains || 0),
            formatNumber(backlinks.follow || 0),
            formatNumber(backlinks.nofollow || 0)
        ]],
        theme: 'grid',
        headStyles: { fillColor: [248, 250, 252], textColor: [107, 114, 128], halign: 'center' },
        bodyStyles: { halign: 'center', fontSize: 14, fontStyle: 'bold', textColor: [15, 23, 42] },
        alternateRowStyles: { fillColor: [255, 255, 255] }
      });

      let nextY = pdf.lastAutoTable.finalY + 15;

      // Table of Backlinks
      pdf.setFontSize(16);
      pdf.setTextColor(55, 65, 81);
      pdf.text('Top Backlinks', 14, nextY);

      const tableColumn = ["Page AS", "Source URL", "Target URL", "Anchor", "Follow", "First Seen"];
      const tableRows = [];
      
      const topBacklinks = rawBacklinks.slice(0, 100); // Prevent massive PDF sizes
      
      topBacklinks.forEach(r => {
        const rowData = [
          r.page_as || r.pageAs || '-',
          r.source_url || '-',
          r.target_url || '-',
          r.anchor || '-',
          r.isFollow === false ? 'No' : 'Yes',
          r.first_seen ? new Date(r.first_seen * 1000).toLocaleDateString() : '-'
        ];
        tableRows.push(rowData);
      });

      if (tableRows.length > 0) {
        autoTable(pdf, {
          startY: nextY + 5,
          head: [tableColumn],
          body: tableRows,
          theme: 'grid',
          headStyles: { fillColor: [82, 196, 26] }, // Green color from theme
          styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
          columnStyles: {
            1: { cellWidth: 70 },
            2: { cellWidth: 70 },
            3: { cellWidth: 40 }
          }
        });
      } else {
        pdf.setFontSize(10);
        pdf.text('No backlink data available.', 14, nextY + 10);
      }

      pdf.save(`${project?.domain?.replace(/\./g, '_') || 'project'}_Backlink_Audit.pdf`);
      
      message.success({ content: 'Report generated successfully!', key: 'pdfGen', duration: 3 });
    } catch (error) {
      console.error('PDF Generation failed:', error);
      message.error({ content: 'Failed to generate report.', key: 'pdfGen', duration: 3 });
    } finally {
      setGenerating(false);
    }
  };

  const handleExportHealthPDF = () => {
    try {
      setGenerating(true);
      message.loading({ content: 'Generating Site Health Report...', key: 'pdfGen' });

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const health = projectData?.siteHealth || {};
      const auditData = health.rawData || {};
      
      const formatNumber = (num) => {
        if (!num && num !== 0) return '0';
        return Number(num).toLocaleString();
      };

      const errorsData = Array.isArray(auditData.errors) ? auditData.errors : [];
      const warningsData = Array.isArray(auditData.warnings) ? auditData.warnings : [];
      const noticesData = Array.isArray(auditData.notices) ? auditData.notices : [];

      const errorsCount = errorsData.reduce((acc, curr) => acc + curr.count, 0);
      const warningsCount = warningsData.reduce((acc, curr) => acc + curr.count, 0);
      const noticesCount = noticesData.reduce((acc, curr) => acc + curr.count, 0);

      // Header
      pdf.setFontSize(24);
      pdf.setTextColor(17, 24, 39);
      pdf.text('Site Health Report', 14, 22);

      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      pdf.text(`Prepared for ${project?.domain || 'Unknown Domain'}`, 14, 30);
      pdf.text(`Generated On ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, 140, 30);

      pdf.setDrawColor(240, 240, 240);
      pdf.line(14, 35, 196, 35);

      // Executive Summary
      autoTable(pdf, {
        startY: 40,
        head: [['Health Score', 'Passed Checks', 'Errors', 'Warnings']],
        body: [[
            `${health.overallScore ?? 'N/A'}`,
            formatNumber(auditData.healthy || 0),
            formatNumber(errorsCount),
            formatNumber(warningsCount)
        ]],
        theme: 'grid',
        headStyles: { fillColor: [248, 250, 252], textColor: [107, 114, 128], halign: 'center' },
        bodyStyles: { halign: 'center', fontSize: 16, fontStyle: 'bold', textColor: [15, 23, 42] }
      });

      let nextY = pdf.lastAutoTable.finalY + 15;

      const addIssueTable = (title, data, color) => {
        const issues = data.map(d => ({ name: getIssueName(d.id), count: d.count })).filter(d => d.count > 0).sort((a, b) => b.count - a.count);
        
        if (issues.length > 0) {
          pdf.setFontSize(16);
          pdf.setTextColor(55, 65, 81);
          pdf.text(title, 14, nextY);
          
          autoTable(pdf, {
            startY: nextY + 5,
            head: [['Issue Description', 'Pages Affected']],
            body: issues.map(i => [i.name, formatNumber(i.count)]),
            theme: 'grid',
            headStyles: { fillColor: color },
            styles: { fontSize: 10 }
          });
          nextY = pdf.lastAutoTable.finalY + 15;
        }
      };

      // Tables for Errors, Warnings, Notices
      addIssueTable('Top Errors', errorsData, [239, 68, 68]); // Red
      addIssueTable('Top Warnings', warningsData, [245, 158, 11]); // Orange
      addIssueTable('Top Notices', noticesData, [59, 130, 246]); // Blue

      if (errorsCount === 0 && warningsCount === 0) {
        pdf.setFontSize(12);
        pdf.setTextColor(16, 185, 129); // Green
        pdf.text('Great job! No major errors or warnings found.', 14, nextY);
      }

      pdf.save(`${project?.domain?.replace(/\./g, '_') || 'project'}_Site_Health.pdf`);
      
      message.success({ content: 'Report generated successfully!', key: 'pdfGen', duration: 3 });
    } catch (error) {
      console.error('PDF Generation failed:', error);
      message.error({ content: 'Failed to generate report.', key: 'pdfGen', duration: 3 });
    } finally {
      setGenerating(false);
    }
  };

  const reports = [
    { id: 'full-seo', title: 'Full SEO Report', type: 'pdf', desc: 'Comprehensive domain overview, organic keywords, and backlinks.', icon: <FilePdfOutlined style={{ color: '#f5222d' }} /> },
    { id: 'health', title: 'Site Health Report', type: 'pdf_health', desc: 'Technical SEO issues, errors, warnings, and crawlability.', icon: <FilePdfOutlined style={{ color: '#f5222d' }} /> },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Reports</Title>
          <Text type="secondary">Generate and export professional reports for {project?.domain}.</Text>
        </div>
        <Button 
          type="primary" 
          icon={<ReloadOutlined spin={isRefreshing} />} 
          onClick={triggerRefresh} 
          loading={isRefreshing}
          style={{ borderRadius: 8, fontWeight: 600, background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Report Data'}
        </Button>
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
                    <Button 
                        type="primary" 
                        icon={<DownloadOutlined />} 
                        onClick={() => {
                          if (report.type === 'csv') handleExportCSV(report.id);
                          else if (report.type === 'pdf_backlink') handleExportBacklinkPDF();
                          else if (report.type === 'pdf_health') handleExportHealthPDF();
                          else handleExportPDF();
                        }} 
                        loading={generating}
                    >
                        Generate Report
                    </Button>
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
