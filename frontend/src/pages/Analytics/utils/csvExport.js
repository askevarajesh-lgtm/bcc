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
