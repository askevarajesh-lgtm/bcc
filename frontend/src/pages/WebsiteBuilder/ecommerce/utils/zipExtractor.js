import JSZip from 'jszip';

export const processZipFile = async (file) => {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);
  
  const pages = {};
  const assets = {};

  const filePromises = [];
  
  // Find common root directory to strip it
  const paths = Object.keys(loadedZip.files).filter(p => !loadedZip.files[p].dir && !p.includes('__MACOSX') && !p.includes('.DS_Store'));
  let commonPrefix = '';
  if (paths.length > 0) {
    const splitPaths = paths.map(p => p.split('/'));
    const firstPath = splitPaths[0];
    let i = 0;
    while (i < firstPath.length - 1) { 
      const folder = firstPath[i];
      if (splitPaths.every(p => p[i] === folder)) {
        commonPrefix += folder + '/';
        i++;
      } else {
        break;
      }
    }
  }

  loadedZip.forEach((originalPath, zipEntry) => {
    if (zipEntry.dir || originalPath.includes('__MACOSX') || originalPath.includes('.DS_Store')) return;

    let relativePath = originalPath;
    if (commonPrefix && originalPath.startsWith(commonPrefix)) {
      relativePath = originalPath.substring(commonPrefix.length);
    }

    if (relativePath.endsWith('.html') || relativePath.endsWith('.htm')) {
      filePromises.push(
        zipEntry.async('string').then(content => {
          // SANITIZATION: Strip inline script tags to prevent XSS / execution in preview
          const sanitizedContent = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

          let fileName = relativePath.split('/').pop();
          let baseName = fileName.replace(/\.html?$/, '');
          let lowerName = baseName.toLowerCase();
          
          let role = 'Other';
          let name = baseName.charAt(0).toUpperCase() + baseName.slice(1);

          if (lowerName === 'index' || lowerName === 'home' || lowerName === 'main') {
            role = 'Home';
            name = 'Home';
          } else if (lowerName.includes('list') || lowerName.includes('shop') || lowerName === 'products') {
            role = 'Product Listing';
            name = 'Product Listing';
          } else if (lowerName.includes('detail') || lowerName.includes('single') || lowerName === 'product') {
            role = 'Product Detail';
            name = 'Product Detail';
          } else if (lowerName.includes('cart')) {
            role = 'Cart';
            name = 'Cart';
          } else if (lowerName.includes('checkout')) {
            role = 'Checkout';
            name = 'Checkout';
          } else if (lowerName.includes('contact')) {
            role = 'Contact';
            name = 'Contact';
          }

          pages[relativePath] = {
            id: relativePath,
            path: relativePath,
            fileName: fileName,
            name: name,
            role: role,
            html: sanitizedContent,
            css: '',
            mapping: {},
            metadata: {}
          };
        })
      );
    } else {
      // Store asset
      const isText = relativePath.endsWith('.css') || relativePath.endsWith('.js') || relativePath.endsWith('.json') || relativePath.endsWith('.svg');
      filePromises.push(
        zipEntry.async(isText ? 'string' : 'base64').then(content => {
          assets[relativePath] = {
            type: isText ? 'text' : 'base64',
            content: content,
            ext: relativePath.split('.').pop().toLowerCase()
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
  
  // Sort by length descending to replace most specific paths first
  const assetPaths = Object.keys(assets).sort((a, b) => b.length - a.length);

  assetPaths.forEach(assetPath => {
    const asset = assets[assetPath];
    let replacement = '';
    
    // Do not inject JS as executable script inside React preview
    if (asset.ext === 'js') {
      replacement = '#'; // Neutralize
    } else if (asset.type === 'text') {
      if (asset.ext === 'css') {
        replacement = `data:text/css;charset=utf-8,${encodeURIComponent(asset.content)}`;
      } else if (asset.ext === 'svg') {
        replacement = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(asset.content)}`;
      } else if (asset.ext === 'json') {
        replacement = `data:application/json;charset=utf-8,${encodeURIComponent(asset.content)}`;
      }
    } else {
      // base64 media
      let mime = asset.ext;
      if (asset.ext === 'jpg') mime = 'jpeg';
      if (['woff', 'woff2', 'ttf', 'otf'].includes(asset.ext)) {
        mime = `font/${asset.ext}`;
      } else if (['mp4', 'webm'].includes(asset.ext)) {
        mime = `video/${asset.ext}`;
      } else {
        mime = `image/${mime}`;
      }
      replacement = `data:${mime};base64,${asset.content}`;
    }
    
    if (replacement && replacement !== '#') {
      // Advanced replace: handles src="", href="", CSS url(...), and various relative path prefixes
      const escapedPath = assetPath.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      
      const regexPatterns = [
        new RegExp(`src=['"]([^'"]*?)(${escapedPath})([?#][^'"]*)?['"]`, 'g'),
        new RegExp(`href=['"]([^'"]*?)(${escapedPath})([?#][^'"]*)?['"]`, 'g'),
        new RegExp(`url\\(['"]?([^'"]*?)(${escapedPath})([?#][^'"]*)?['"]?\\)`, 'g'),
        new RegExp(`srcset=['"]([^'"]*?)(${escapedPath})([^'"]*)['"]`, 'g')
      ];

      regexPatterns.forEach(regex => {
        resolvedHtml = resolvedHtml.replace(regex, (match, prefix, path, suffix) => {
          if (match.startsWith('src=')) return `src="${replacement}"`;
          if (match.startsWith('href=')) return `href="${replacement}"`;
          if (match.startsWith('url(')) return `url("${replacement}")`;
          if (match.startsWith('srcset=')) return `srcset="${replacement}${suffix || ''}"`; // srcset is tricky, MVP simple replacement
          return match;
        });
      });
    } else if (replacement === '#') {
      // Neutralize JS
      const escapedPath = assetPath.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const jsRegex = new RegExp(`src=['"]([^'"]*?)(${escapedPath})['"]`, 'g');
      resolvedHtml = resolvedHtml.replace(jsRegex, `src="#"`);
    }
  });

  return resolvedHtml;
};
