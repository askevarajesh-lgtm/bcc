export const exportToCSV = (data, columns, filename) => {
  if (!data || data.length === 0) return;

  const header = columns.map((col) => col.title).join(",");
  
  const rows = data.map((record) => {
    return columns.map((col) => {
      let value;
      if (col.getValue) {
        value = col.getValue(record);
      } else if (col.dataIndex) {
        value = Array.isArray(col.dataIndex)
          ? col.dataIndex.reduce((acc, curr) => acc && acc[curr], record)
          : record[col.dataIndex];
      } else {
        value = record[col.key];
      }
      
      // Escape commas and quotes for CSV
      if (value === null || value === undefined) {
        return '""';
      }
      const stringValue = String(value);
      return `"${stringValue.replace(/"/g, '""')}"`;
    }).join(",");
  });

  const csvContent = [header, ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
