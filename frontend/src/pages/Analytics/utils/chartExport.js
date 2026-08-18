/**
 * Exports a Recharts container (which renders to an inline <svg>) as a PNG,
 * using native browser APIs only (XMLSerializer + canvas) — no extra
 * dependency like html2canvas is installed in this project, and this
 * approach works for any SVG-based chart without one.
 */
export function exportChartAsPng(containerEl, filename) {
  if (!containerEl) return false;
  const svg = containerEl.querySelector('svg');
  if (!svg) return false;

  const clone = svg.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const bbox = svg.getBoundingClientRect();
  const width = bbox.width || svg.viewBox?.baseVal?.width || 800;
  const height = bbox.height || svg.viewBox?.baseVal?.height || 400;

  // Resolve CSS custom-property colors (var(--accent-primary) etc.) to their
  // computed values, since an exported PNG has no access to the page's
  // stylesheet/theme once it's a standalone image.
  const computed = getComputedStyle(document.documentElement);
  let svgString = new XMLSerializer().serializeToString(clone);
  svgString = svgString.replace(/var\((--[a-z0-9-]+)\)/gi, (match, varName) => {
    const resolved = computed.getPropertyValue(varName);
    return resolved ? resolved.trim() : '#94a3b8';
  });

  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = 2; // export at 2x for crisp PNGs
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = computed.getPropertyValue('--bg-secondary')?.trim() || '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        const pngUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(pngUrl);
        resolve(true);
      }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(false); };
    img.src = url;
  });
}
