import React, { useRef } from 'react';
import { Typography, Card, Dropdown, Button, message } from 'antd';
import { motion } from 'framer-motion';
import { Download, ChevronDown } from 'lucide-react';
import { exportChartAsPng } from '../utils/chartExport';
import { exportRowsAsCsv } from '../utils/csvExport';

const { Title, Text } = Typography;

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

/**
 * Wraps a chart with a consistent header + export toolbar (PNG of the
 * rendered chart, CSV of its underlying data). `exportRows`/`exportHeaders`
 * are optional — omit them to hide the CSV option for charts with no
 * tabular equivalent.
 */
const ChartCard = ({ title, subtitle, height = 320, isEmpty, emptyState, children, exportFilename, exportRows, exportHeaders, extra }) => {
  const containerRef = useRef(null);

  const menuItems = [
    { key: 'png', label: 'Export as PNG' },
    ...(exportRows ? [{ key: 'csv', label: 'Export data as CSV' }] : [])
  ];

  const handleMenuClick = async ({ key }) => {
    if (key === 'png') {
      const ok = await exportChartAsPng(containerRef.current, exportFilename || title || 'chart');
      if (ok) message.success('Chart exported'); else message.error('Nothing to export yet');
    } else if (key === 'csv' && exportRows) {
      exportRowsAsCsv({ filename: exportFilename || title || 'chart-data', headers: exportHeaders, rows: exportRows });
      message.success('CSV exported');
    }
  };

  return (
    <motion.div variants={itemVariants} style={{ height: '100%' }}>
      <Card
        title={
          <div style={{ paddingTop: 8 }}>
            <Title level={5} style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</Title>
            {subtitle && <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>{subtitle}</Text>}
          </div>
        }
        extra={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {extra}
            <Dropdown menu={{ items: menuItems, onClick: handleMenuClick }} trigger={['click']}>
              <Button
                size="small"
                icon={<Download size={14} />}
                aria-label={`Export options for ${title}`}
                style={{ borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                Export <ChevronDown size={12} />
              </Button>
            </Dropdown>
          </div>
        }
        className="glassmorphism"
        style={{ 
          borderRadius: 20, 
          height: '100%', 
          border: '1px solid var(--border-color)', 
          boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
          background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)'
        }}
        bodyStyle={{ padding: 24 }}
      >
        <div ref={containerRef} style={{ height }}>
          {isEmpty ? emptyState : children}
        </div>
      </Card>
    </motion.div>
  );
};

export default ChartCard;
