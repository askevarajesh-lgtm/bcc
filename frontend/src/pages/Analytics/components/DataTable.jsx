import React, { useMemo, useState } from 'react';
import { Typography, Card, Table, Popover, Button, Checkbox, message } from 'antd';
import { motion } from 'framer-motion';
import { Download, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { exportRowsAsCsv } from '../utils/csvExport';

const { Title, Text } = Typography;

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

/**
 * Enterprise table shell: adds column-visibility toggling, CSV export, and
 * optional text search (applied client-side across `searchableFields`) on
 * top of antd Table's built-in sorting/filtering/pagination — without
 * every consuming table re-implementing that chrome.
 */
const DataTable = ({
  title,
  subtitle,
  columns,
  dataSource,
  rowKey,
  searchTerm = '',
  searchableFields = [],
  exportFilename,
  emptyMessage = 'No data for this range yet.',
  onRowClick,
  pageSize = 10
}) => {
  const [hiddenColumnKeys, setHiddenColumnKeys] = useState(() => new Set());

  const filteredData = useMemo(() => {
    if (!searchTerm || searchableFields.length === 0) return dataSource;
    const term = searchTerm.toLowerCase();
    return dataSource.filter(row => searchableFields.some(field => String(row[field] ?? '').toLowerCase().includes(term)));
  }, [dataSource, searchTerm, searchableFields]);

  const visibleColumns = useMemo(
    () => columns.filter(col => !hiddenColumnKeys.has(col.key)),
    [columns, hiddenColumnKeys]
  );

  const toggleColumn = (key) => {
    setHiddenColumnKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleExport = () => {
    if (!filteredData.length) return message.warning('No rows to export');
    exportRowsAsCsv({
      filename: exportFilename || title || 'table-data',
      headers: columns.filter(c => c.key !== 'actions').map(c => ({ key: c.dataIndex || c.key, label: c.title })),
      rows: filteredData
    });
    message.success('CSV exported');
  };

  return (
    <motion.div variants={itemVariants}>
      <Card
        title={
          <div style={{ paddingTop: 8 }}>
            <Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</Title>
            {subtitle && <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>{subtitle}</Text>}
          </div>
        }
        extra={
          <div style={{ display: 'flex', gap: 8 }}>
            <Popover
              trigger="click"
              placement="bottomRight"
              content={
                <div style={{ minWidth: 180 }}>
                  <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>SHOW COLUMNS</Text>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                    {columns.map(col => (
                      <Checkbox
                        key={col.key}
                        checked={!hiddenColumnKeys.has(col.key)}
                        onChange={() => toggleColumn(col.key)}
                      >
                        {col.title}
                      </Checkbox>
                    ))}
                  </div>
                </div>
              }
            >
              <Button size="small" icon={<SlidersHorizontal size={14} />} aria-label="Toggle column visibility" style={{ borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                Columns <ChevronDown size={12} />
              </Button>
            </Popover>
            <Button size="small" icon={<Download size={14} />} onClick={handleExport} aria-label={`Export ${title} as CSV`} style={{ borderRadius: 8, fontWeight: 600 }}>
              Export CSV
            </Button>
          </div>
        }
        className="glassmorphism"
        style={{ borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={visibleColumns}
          dataSource={filteredData}
          rowKey={rowKey}
          size="middle"
          scroll={{ x: 'max-content' }}
          pagination={{ defaultPageSize: pageSize, showSizeChanger: true, pageSizeOptions: ['5', '10', '20', '50'], hideOnSinglePage: true }}
          locale={{ emptyText: emptyMessage }}
          rowClassName={() => (onRowClick ? 'hover-bg clickable-row' : 'hover-bg')}
          onRow={onRowClick ? (record) => ({
            onClick: () => onRowClick(record),
            tabIndex: 0,
            role: 'button',
            'aria-label': 'View details',
            onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick(record); } }
          }) : undefined}
        />
      </Card>
    </motion.div>
  );
};

export default DataTable;
