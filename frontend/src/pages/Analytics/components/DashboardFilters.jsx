import React from 'react';
import { Select, DatePicker, Button, Input, Tooltip, Typography } from 'antd';
import { RotateCw, Download, Search, Info } from 'lucide-react';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Text } = Typography;

const RANGE_PRESETS = {
  'Last 7 days': [dayjs().subtract(6, 'day'), dayjs()],
  'Last 30 days': [dayjs().subtract(29, 'day'), dayjs()],
  'Last 90 days': [dayjs().subtract(89, 'day'), dayjs()],
  'Month to date': [dayjs().startOf('month'), dayjs()],
};

const DashboardFilters = React.memo(function DashboardFilters({
  clients,
  selectedClient,
  onClientChange,
  dateRange,
  onDateRangeChange,
  searchTerm,
  onSearchChange,
  onRefresh,
  refreshing,
  onExport,
  showExport,
  previousDateRange
}) {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
      <Select
        value={selectedClient}
        onChange={onClientChange}
        showSearch
        optionFilterProp="children"
        filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
        style={{ width: 200, fontWeight: 600 }}
        size="large"
        aria-label="Select client"
      >
        <Option value="All Clients">All Clients</Option>
        {clients.map(c => <Option key={c._id} value={c._id}>{c.name}</Option>)}
      </Select>

      <RangePicker
        value={dateRange}
        onChange={onDateRangeChange}
        presets={Object.entries(RANGE_PRESETS).map(([label, value]) => ({ label, value }))}
        allowClear={false}
        style={{ borderRadius: 8, height: 40, borderColor: 'var(--border-color)', background: 'var(--bg-secondary)', fontWeight: 600 }}
        aria-label="Select date range"
      />

      {previousDateRange && (
        <Tooltip title={`Trends compare this range against ${previousDateRange.start} → ${previousDateRange.end} (the immediately preceding period of equal length).`}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-tertiary)', cursor: 'help' }}>
            <Info size={14} />
            <Text type="secondary" style={{ fontSize: 12 }}>vs previous period</Text>
          </span>
        </Tooltip>
      )}

      <Input
        placeholder="Search pages, channels, devices…"
        prefix={<Search size={14} style={{ color: 'var(--text-tertiary)' }} />}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        allowClear
        style={{ width: 220, height: 40, borderRadius: 8 }}
        aria-label="Search dashboard tables"
      />

      <Tooltip title="Refresh data">
        <Button
          icon={<RotateCw size={16} className={refreshing ? 'spin-icon' : ''} />}
          onClick={onRefresh}
          loading={refreshing}
          size="large"
          aria-label="Refresh analytics data"
          style={{ borderRadius: 8, height: 40, fontWeight: 600 }}
        />
      </Tooltip>

      {showExport && (
        <Button
          type="primary"
          icon={<Download size={16} />}
          onClick={onExport}
          size="large"
          aria-label="Export KPI summary as CSV"
          style={{ borderRadius: 8, height: 40, background: 'var(--accent-primary)', color: '#fff', border: 'none', boxShadow: 'var(--shadow-md)', fontWeight: 600 }}
        >
          Export
        </Button>
      )}
    </div>
  );
});

export default DashboardFilters;
