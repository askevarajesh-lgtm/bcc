/**
 * Generic CSV export — builds a CSV from column headers + row objects and
 * triggers a browser download. Used by every table/chart's "Export CSV"
 * action so the format and escaping logic lives in exactly one place.
 */
function escapeCsvCell(value) {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportRowsAsCsv({ filename, headers, rows }) {
  const headerLine = headers.map(h => escapeCsvCell(h.label)).join(',');
  const dataLines = rows.map(row => headers.map(h => escapeCsvCell(row[h.key])).join(','));
  const csv = [headerLine, ...dataLines].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportDetailedReportAsCsv({ filename, data }) {
  let csvContent = ""; // Empty string, no BOM or sep= needed unless specifically requested by Excel, but standard text/csv is safer.
  
  const addTable = (title, headers, rows) => {
    csvContent += `"${title}"\n`;
    csvContent += headers.map(h => `"${h.label}"`).join(',') + '\n';
    rows.forEach(row => {
      csvContent += headers.map(h => {
        const val = row[h.key];
        return val === null || val === undefined ? '' : `"${String(val).replace(/"/g, '""')}"`;
      }).join(',') + '\n';
    });
    csvContent += '\n\n'; // Add spacing between tables
  };

  // Section 1: Overview KPIs
  addTable('Overview Metrics', 
    [{key: 'metric', label: 'Metric'}, {key: 'value', label: 'Value'}, {key: 'trend', label: 'Trend vs previous'}],
    [
      { metric: 'Clicks', value: data.metrics?.clicks, trend: data.metrics?.clicksTrend },
      { metric: 'Impressions', value: data.metrics?.impressions, trend: data.metrics?.impressionsTrend },
      { metric: 'CTR', value: data.metrics?.ctr, trend: data.metrics?.ctrTrend },
      { metric: 'Avg Position', value: data.metrics?.averagePosition, trend: data.metrics?.averagePositionTrend }
    ]
  );

  // Section 2: Performance - Pages
  if (data.gscPerformance?.pages?.length > 0) {
    addTable('All Pages Performance', 
      [{key: 'url', label: 'Page URL'}, {key: 'clicks', label: 'Clicks'}, {key: 'impressions', label: 'Impressions'}],
      data.gscPerformance.pages.map(p => ({ url: p.dimension, clicks: p.clicks, impressions: p.impressions }))
    );
  }

  // Section 3: Performance - Queries
  if (data.gscPerformance?.queries?.length > 0) {
    addTable('All Search Queries Performance', 
      [{key: 'query', label: 'Search Query'}, {key: 'clicks', label: 'Clicks'}, {key: 'impressions', label: 'Impressions'}],
      data.gscPerformance.queries.map(q => ({ query: q.dimension, clicks: q.clicks, impressions: q.impressions }))
    );
  }

  // Section 4: Performance - Countries
  if (data.gscPerformance?.countries?.length > 0) {
    addTable('Countries', 
      [{key: 'country', label: 'Country'}, {key: 'clicks', label: 'Clicks'}, {key: 'impressions', label: 'Impressions'}],
      data.gscPerformance.countries.map(c => ({ country: c.dimension, clicks: c.clicks, impressions: c.impressions }))
    );
  }

  // Section 5: Performance - Devices
  if (data.gscPerformance?.devices?.length > 0) {
    addTable('Devices', 
      [{key: 'device', label: 'Device'}, {key: 'clicks', label: 'Clicks'}, {key: 'impressions', label: 'Impressions'}],
      data.gscPerformance.devices.map(d => ({ device: d.dimension, clicks: d.clicks, impressions: d.impressions }))
    );
  }

  // Section 6: Insights - Trending Pages
  if (data.gscInsights?.pages?.trendingUp?.length > 0) {
    addTable('Trending Up Pages (Insights)', 
      [{key: 'url', label: 'Page URL'}, {key: 'clicks', label: 'Clicks'}, {key: 'growth', label: 'Growth'}],
      data.gscInsights.pages.trendingUp.map(p => ({ url: p.dimension, clicks: p.clicks, growth: `+${p.percent}%` }))
    );
  }

  // Section 7: Insights - Trending Queries
  if (data.gscInsights?.queries?.trendingUp?.length > 0) {
    addTable('Trending Up Queries (Insights)', 
      [{key: 'query', label: 'Search Query'}, {key: 'clicks', label: 'Clicks'}, {key: 'growth', label: 'Growth'}],
      data.gscInsights.queries.trendingUp.map(q => ({ query: q.dimension, clicks: q.clicks, growth: `+${q.percent}%` }))
    );
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
