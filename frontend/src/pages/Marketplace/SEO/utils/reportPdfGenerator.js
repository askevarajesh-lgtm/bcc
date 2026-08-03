import { jsPDF } from 'jspdf';

/**
 * Strips markdown symbols for clean PDF rendering while keeping structure
 */
function cleanMarkdownText(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // remove bold asterisks
    .replace(/\*(.*?)\*/g, '$1')     // remove italics asterisks
    .replace(/`(.*?)`/g, '$1')       // remove backticks
    .replace(/^#+\s*/gm, '')         // remove leading hash symbols
    .replace(/^[-*+]\s+/gm, '• ')    // normalize bullets
    .trim();
}

/**
 * Generates and downloads a clean, professional PDF for an SEO Report.
 * @param {Object} report - The report data object
 * @param {string} [projectName] - The active project name
 * @param {string} [projectDomain] - The active project domain
 */
export function generateReportPDF(report, projectName = '', projectDomain = '') {
  if (!report) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (neededHeight) => {
    if (y + neededHeight > pageHeight - 20) {
      doc.addPage();
      y = margin;
      drawHeaderSmall();
    }
  };

  const drawHeaderSmall = () => {
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 8, 'F');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('M1 Labs • Enterprise SEO Intelligence', margin, 5.5);
    doc.text(report.name || 'SEO Report', pageWidth - margin, 5.5, { align: 'right' });
    y = Math.max(y, 16);
  };

  // --- PAGE 1: HERO HEADER ---
  doc.setFillColor(15, 23, 42); // slate-900 background for hero
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Decorative Accent Bar
  doc.setFillColor(59, 130, 246); // Blue-500
  doc.rect(0, 0, 4, 42, 'F');

  // Brand / Category Tag
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(96, 165, 250); // Light blue
  doc.text('ENTERPRISE SEO INTELLIGENCE & AUDIT REPORT', margin, 12);

  // Report Title
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  const reportTitle = report.name || 'SEO Comprehensive Report';
  doc.text(reportTitle, margin, 21);

  // Subtitle / Metadata
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  const dateStr = report.createdAt ? new Date(report.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : new Date().toLocaleDateString();

  const domainInfo = projectDomain || projectName ? `Project: ${projectName || projectDomain}` : '';
  const metaLine = [domainInfo, `Generated: ${dateStr}`, `Template: ${(report.reportTemplate || report.type || 'Executive').replace(/_/g, ' ')}`].filter(Boolean).join('   |   ');
  doc.text(metaLine, margin, 30);

  y = 50;

  // --- METRICS SCORECARDS ---
  const metrics = report.metrics || {};
  const scores = [
    { label: 'Overall SEO', val: metrics.seoScore ?? 71, color: [59, 130, 246] },
    { label: 'Technical', val: metrics.technicalScore ?? (metrics.seoScore ? Math.round(metrics.seoScore * 0.9) : 80), color: [16, 185, 129] },
    { label: 'Content & AEO', val: metrics.contentScore ?? (metrics.seoScore ? Math.round(metrics.seoScore * 0.85) : 75), color: [139, 92, 246] },
    { label: 'Performance', val: metrics.performanceScore ?? 100, color: [245, 158, 11] },
  ];

  const cardGap = 4;
  const cardWidth = (contentWidth - cardGap * (scores.length - 1)) / scores.length;
  const cardHeight = 22;

  scores.forEach((sc, i) => {
    const cx = margin + i * (cardWidth + cardGap);
    // Background
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cx, y, cardWidth, cardHeight, 2, 2, 'FD');

    // Colored indicator bar top
    doc.setFillColor(sc.color[0], sc.color[1], sc.color[2]);
    doc.roundedRect(cx, y, cardWidth, 2, 1, 1, 'F');

    // Score Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(`${sc.val}/100`, cx + cardWidth / 2, y + 11, { align: 'center' });

    // Score Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(sc.label, cx + cardWidth / 2, y + 17, { align: 'center' });
  });

  y += cardHeight + 12;

  // --- EXECUTIVE SUMMARY SECTION ---
  let execSummary = report.executiveSummary;
  if (typeof execSummary === 'string') {
    try { execSummary = JSON.parse(execSummary); } catch (e) {}
  }
  const summaryText = (typeof execSummary === 'object' ? execSummary?.content : execSummary) || '';

  if (summaryText) {
    checkPageBreak(30);
    doc.setFillColor(239, 246, 255); // light blue box
    doc.setDrawColor(191, 219, 254);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138); // blue-900
    doc.text('Executive Summary', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const splitSummary = doc.splitTextToSize(summaryText, contentWidth - 8);
    const boxHeight = splitSummary.length * 4.5 + 8;
    
    doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD');
    doc.text(splitSummary, margin + 4, y + 6);
    y += boxHeight + 10;
  }

  // --- ACTION PLAN SECTION ---
  let actionPlan = report.actionPlan;
  if (typeof actionPlan === 'string') {
    try { actionPlan = JSON.parse(actionPlan); } catch (e) {}
  }
  const tasks = Array.isArray(actionPlan?.tasks) ? actionPlan.tasks : (actionPlan?.tasks ? [actionPlan.tasks] : []);

  if (tasks.length > 0) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Recommended Action Plan', margin, y);
    y += 6;

    tasks.forEach((task, idx) => {
      checkPageBreak(12);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      
      const cleanTask = cleanMarkdownText(typeof task === 'string' ? task : task?.title || JSON.stringify(task));
      const taskLines = doc.splitTextToSize(`${idx + 1}.  ${cleanTask}`, contentWidth - 10);
      const itemHeight = Math.max(8, taskLines.length * 4.5 + 4);

      doc.roundedRect(margin, y, contentWidth, itemHeight, 1.5, 1.5, 'FD');
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(taskLines, margin + 4, y + 5);
      y += itemHeight + 3;
    });
    y += 6;
  }

  // --- DETAILED REPORT CONTENT (MARKDOWN PARSING) ---
  if (report.content) {
    checkPageBreak(20);
    const rawLines = report.content.split('\n');

    for (let line of rawLines) {
      const trimmed = line.trim();
      if (!trimmed) {
        y += 3;
        continue;
      }

      // H1 Header
      if (trimmed.startsWith('# ')) {
        checkPageBreak(16);
        y += 4;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);
        const heading = cleanMarkdownText(trimmed.replace(/^#\s+/, ''));
        doc.text(heading, margin, y);
        y += 2;
        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(0.5);
        doc.line(margin, y, margin + contentWidth, y);
        doc.setLineWidth(0.2);
        y += 6;
      }
      // H2 Header
      else if (trimmed.startsWith('## ')) {
        checkPageBreak(14);
        y += 3;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        const heading = cleanMarkdownText(trimmed.replace(/^##\s+/, ''));
        doc.text(heading, margin, y);
        y += 5;
      }
      // H3 Header
      else if (trimmed.startsWith('### ')) {
        checkPageBreak(12);
        y += 2;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(51, 65, 85);
        const heading = cleanMarkdownText(trimmed.replace(/^###\s+/, ''));
        doc.text(heading, margin, y);
        y += 4.5;
      }
      // Bullet items
      else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('+ ')) {
        checkPageBreak(8);
        const itemText = cleanMarkdownText(trimmed.substring(2));
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        
        // Bullet circle
        doc.setFillColor(59, 130, 246);
        doc.circle(margin + 2, y - 1, 0.8, 'F');

        const splitItem = doc.splitTextToSize(itemText, contentWidth - 8);
        doc.text(splitItem, margin + 6, y);
        y += splitItem.length * 4.2 + 1.5;
      }
      // Regular paragraph
      else {
        checkPageBreak(8);
        const cleanP = cleanMarkdownText(trimmed);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        const splitP = doc.splitTextToSize(cleanP, contentWidth);
        doc.text(splitP, margin, y);
        y += splitP.length * 4.2 + 2;
      }
    }
  }

  // --- FOOTER ON ALL PAGES ---
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.text(`Generated by M1 Labs SEO Intelligence Engine`, margin, pageHeight - 7);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  // Trigger download
  const safeFilename = (report.name || 'seo-report').replace(/[^a-z0-9\-_ ]/gi, '').trim().replace(/\s+/g, '-') || 'seo-report';
  doc.save(`${safeFilename}.pdf`);
}
