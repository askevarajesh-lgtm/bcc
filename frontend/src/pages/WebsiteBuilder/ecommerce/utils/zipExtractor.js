import JSZip from 'jszip';

export const extractTemplateZip = async (file) => {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);
  
  const pages = {};
  const assets = {};

  const filePromises = [];

  loadedZip.forEach((relativePath, zipEntry) => {
    if (zipEntry.dir) return;

    if (relativePath.endsWith('.html') || relativePath.endsWith('.htm')) {
      filePromises.push(
        zipEntry.async('string').then(content => {
          let name = relativePath.split('/').pop().replace(/\.html?$/, '');
          // Basic role detection from filename
          let role = 'Other';
          const lowerName = name.toLowerCase();
          if (lowerName === 'index' || lowerName === 'home') {
            name = 'Home';
            role = 'Home';
          } else if (lowerName.includes('list') || lowerName === 'products' || lowerName === 'shop') {
            name = 'Product Listing';
            role = 'Product Listing';
          } else if (lowerName.includes('detail') || lowerName.includes('single')) {
            name = 'Product Detail';
            role = 'Product Detail';
          } else if (lowerName === 'cart') {
            name = 'Cart';
            role = 'Cart';
          } else if (lowerName === 'checkout') {
            name = 'Checkout';
            role = 'Checkout';
          } else if (lowerName === 'contact') {
            name = 'Contact';
            role = 'Contact';
          } else {
            name = name.charAt(0).toUpperCase() + name.slice(1);
          }

          pages[relativePath] = {
            id: relativePath,
            name,
            role,
            html: content,
            css: '',
            mapping: {}
          };
        })
      );
    } else {
      // Store asset
      // For MVP, we'll store binary files as base64 and text as string.
      // This is memory heavy but required for local MVP without a real backend file server.
      const isText = relativePath.endsWith('.css') || relativePath.endsWith('.js') || relativePath.endsWith('.json') || relativePath.endsWith('.svg');
      filePromises.push(
        zipEntry.async(isText ? 'string' : 'base64').then(content => {
          assets[relativePath] = {
            type: isText ? 'text' : 'base64',
            content: content,
            ext: relativePath.split('.').pop()
          };
        })
      );
    }
  });

  await Promise.all(filePromises);

  return { pages, assets };
};

export const resolveAssetUrls = (html, assets) => {
  if (!html) return html;
  let resolvedHtml = html;
  
  Object.keys(assets).forEach(assetPath => {
    const asset = assets[assetPath];
    let replacement = '';
    
    if (asset.type === 'text') {
      if (asset.ext === 'css') {
        replacement = `data:text/css;charset=utf-8,${encodeURIComponent(asset.content)}`;
      } else if (asset.ext === 'js') {
        replacement = `data:text/javascript;charset=utf-8,${encodeURIComponent(asset.content)}`;
      } else if (asset.ext === 'svg') {
        replacement = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(asset.content)}`;
      }
    } else {
      // base64 images
      const mime = asset.ext === 'jpg' ? 'jpeg' : asset.ext;
      replacement = `data:image/${mime};base64,${asset.content}`;
    }
    
    if (replacement) {
      // Replace relative paths in html. Very simple replace for MVP.
      // E.g., src="img/logo.png" -> src="data:..."
      // Using regex to match href="..." or src="..."
      const regex = new RegExp(`(src|href)=["']([^"']*?${assetPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})["']`, 'gi');
      resolvedHtml = resolvedHtml.replace(regex, `$1="${replacement}"`);
    }
  });

  return resolvedHtml;
};
