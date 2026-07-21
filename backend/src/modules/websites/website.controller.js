const Website = require('./website.model');
const Page = require('./page.model');
const Template = require('../templates/template.model');
const Blog = require('../blogs/blog.model');
const unzipper = require('unzipper');
const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');
const cloudinary = require('../../config/cloudinary');

function detectThemeFromContent(htmlContents, cssContents) {
  let fontFamily = null;
  let primaryColor = null;

  // 1) A linked Google Font is the strongest signal of the site's intended font
  for (const html of htmlContents) {
    const fontLinkMatch = html.match(/fonts\.googleapis\.com\/css2?\?family=([^"'&]+)/i);
    if (fontLinkMatch) {
      fontFamily = decodeURIComponent(fontLinkMatch[1]).split(':')[0].replace(/\+/g, ' ');
      break;
    }
  }

  const combinedCss = cssContents.join('\n');

  // 2) Otherwise fall back to the first non-generic font-family declared in the CSS
  if (!fontFamily) {
    const generic = ['sans-serif', 'serif', 'monospace', 'arial', 'helvetica', 'times new roman', 'inherit', 'initial'];
    const fontFamilyMatches = combinedCss.matchAll(/font-family\s*:\s*['"]?([A-Za-z0-9 ]+)['"]?/gi);
    for (const m of fontFamilyMatches) {
      const candidate = m[1].trim();
      if (candidate && !generic.includes(candidate.toLowerCase())) {
        fontFamily = candidate;
        break;
      }
    }
  }

  // 3) An explicit CSS custom property (--primary, --brand-color, etc.) is the strongest color signal
  const varMatch = combinedCss.match(/--(?:primary|brand|theme|accent|main)[a-z-]*\s*:\s*(#[0-9a-fA-F]{3,6})/i);
  if (varMatch) {
    primaryColor = varMatch[1];
  } else {
    // 4) Otherwise use the most frequently used non-grayscale hex color in the CSS
    const hexMatches = combinedCss.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) || [];
    const counts = {};
    for (const hex of hexMatches) {
      const normalized = hex.toLowerCase();
      const [r, g, b] = normalized.length === 4
        ? [normalized[1], normalized[2], normalized[3]].map(c => parseInt(c + c, 16))
        : [normalized.slice(1, 3), normalized.slice(3, 5), normalized.slice(5, 7)].map(c => parseInt(c, 16));
      const isGrayscale = (Math.max(r, g, b) - Math.min(r, g, b)) < 15; // catches whites/blacks/grays
      if (isGrayscale) continue;
      counts[normalized] = (counts[normalized] || 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) primaryColor = sorted[0][0];
  }

  return { fontFamily, primaryColor };
}

// Wrapper used during template zip extraction, where files are still on local disk.
function detectThemeFromTemplateFiles(htmlFiles, cssFiles) {
  const htmlContents = htmlFiles.map(f => {
    try { return fs.readFileSync(f, 'utf8'); } catch (e) { return ''; }
  });
  const cssContents = cssFiles.map(f => {
    try { return fs.readFileSync(f, 'utf8'); } catch (e) { return ''; }
  });
  return detectThemeFromContent(htmlContents, cssContents);
}

// Wrapper used to re-detect theme for an already-published website: its pages'
// `html` field is stored directly in Mongo, but the CSS it links to (uploaded
// during template import) lives on Cloudinary, so it has to be fetched.
async function detectThemeFromPublishedPages(pages) {
  const htmlContents = pages.map(p => p.html || '');

  const cssUrls = new Set();
  for (const html of htmlContents) {
    const linkMatches = html.matchAll(/<link[^>]+href=["']([^"']+\.css)["'][^>]*>/gi);
    for (const m of linkMatches) cssUrls.add(m[1]);
  }

  const cssContents = [];
  for (const url of cssUrls) {
    try {
      const response = await axios.get(url, { responseType: 'text', timeout: 10000 });
      cssContents.push(typeof response.data === 'string' ? response.data : '');
    } catch (e) {
      // Skip any CSS file that fails to download rather than failing the whole detection
    }
  }

  return detectThemeFromContent(htmlContents, cssContents);
}

// Create Website
exports.createWebsite = async (req, res, next) => {
  try {
    const { name, description, type, industry, businessBrief, tone, templateName } = req.body;
    const workspaceId = req.workspaceId;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Website name is required' });
    }

    const website = new Website({
      workspaceId,
      name,
      description: description || "",
      status: 'Draft',
      createdBy: req.user?._id,
      updatedBy: req.user?._id
    });

    const savedWebsite = await website.save();

    // Initialize default pages
    let newPages = [];
    
    // If template is provided, extract zip and read all html
    if (type === 'template' && templateName) {
      const templateRecord = await Template.findOne({ name: templateName, isDeleted: false });
      if (templateRecord && templateRecord.zipUrl) {
        const tempBaseDir = path.join(os.tmpdir(), 'extracted_templates');
        if (!fs.existsSync(tempBaseDir)) fs.mkdirSync(tempBaseDir, { recursive: true });
        
        const extractSessionId = templateRecord._id.toString() + '-' + Date.now();
        const extractedDir = path.join(tempBaseDir, extractSessionId);
        const zipPath = path.join(tempBaseDir, `${extractSessionId}.zip`);

        try {
          // Determine if it's a Cloudinary URL or local path (for backward compatibility)
          const isCloudinary = templateRecord.zipUrl.startsWith('http');
          
          if (isCloudinary) {
            // Extract public ID from Cloudinary URL reliably using regex
            let publicId = templateRecord.zipUrl;
            const regex = /\/(?:upload|authenticated)(?:\/s--[a-zA-Z0-9_-]+--)?(?:\/v\d+)?\/(.+)$/;
            const match = templateRecord.zipUrl.match(regex);
            if (match && match[1]) {
              publicId = match[1];
            }

            // Generate an authenticated download URL
            const downloadUrl = cloudinary.utils.private_download_url(publicId, '', {
              resource_type: 'raw',
              type: 'authenticated'
            });

            const response = await axios({
              method: 'GET',
              url: downloadUrl,
              responseType: 'stream'
            });
            
            await new Promise((resolve, reject) => {
              const writer = fs.createWriteStream(zipPath);
              response.data.pipe(writer);
              writer.on('finish', resolve);
              writer.on('error', reject);
            });
          } else {
            // Local fallback
            const localZipPath = path.join(__dirname, '..', '..', templateRecord.zipUrl);
            if (fs.existsSync(localZipPath)) {
              fs.copyFileSync(localZipPath, zipPath);
            } else {
              throw new Error("Local template zip not found");
            }
          }

          // Extract
          fs.mkdirSync(extractedDir, { recursive: true });
          await fs.createReadStream(zipPath)
            .pipe(unzipper.Extract({ path: extractedDir }))
            .promise();

          // Helper to recursively find all files
          const findFiles = (dir, fileList = []) => {
            if (!fs.existsSync(dir)) return fileList;
            const files = fs.readdirSync(dir);
            for (const file of files) {
              const filePath = path.join(dir, file);
              if (fs.statSync(filePath).isDirectory()) {
                findFiles(filePath, fileList);
              } else {
                fileList.push(filePath);
              }
            }
            return fileList;
          };

          const allFiles = findFiles(extractedDir);
          const htmlFiles = [];
          const assetFiles = [];
          
          for (const file of allFiles) {
            if (file.toLowerCase().endsWith('.html')) {
              htmlFiles.push(file);
            } else {
              assetFiles.push(file);
            }
          }

          // Auto-detect the template's font/brand color and save it as the website's
          // theme, so anything reading website.theme (e.g. the blog embed) matches the
          // imported design instead of the schema's generic Inter/blue defaults.
          const cssFiles = assetFiles.filter(f => f.toLowerCase().endsWith('.css'));
          const detectedTheme = detectThemeFromTemplateFiles(htmlFiles, cssFiles);
          if (detectedTheme.fontFamily || detectedTheme.primaryColor) {
            savedWebsite.theme = {
              fontFamily: detectedTheme.fontFamily || savedWebsite.theme.fontFamily,
              primaryColor: detectedTheme.primaryColor || savedWebsite.theme.primaryColor
            };
            await savedWebsite.save();
          }

          const assetUrlMap = {}; // Maps relative path to Cloudinary URL

          // Upload assets sequentially to avoid overwhelming Cloudinary API
          for (const filePath of assetFiles) {
            let relDir = path.relative(extractedDir, filePath).replace(/\\/g, '/');
            
            let resourceType = 'auto';
            if (filePath.endsWith('.css') || filePath.endsWith('.js')) resourceType = 'raw';
            
            try {
              const result = await cloudinary.uploader.upload(filePath, {
                folder: `websites/${savedWebsite._id}`,
                use_filename: true,
                unique_filename: true,
                resource_type: resourceType
              });
              assetUrlMap[relDir] = result.secure_url;
            } catch (uploadErr) {
              console.error(`Failed to upload ${relDir}:`, uploadErr);
            }
          }

          for (const filePath of htmlFiles) {
            let htmlContent = fs.readFileSync(filePath, 'utf8');
            const fileDir = path.dirname(filePath);
            
            // Rewrite src and href to Cloudinary URLs
            htmlContent = htmlContent.replace(/(src|href)=["'](?!http|\/\/|data:|#|mailto:|tel:)([^"']+)["']/gi, (match, attr, pathStr) => {
              // If it's a link to another html file, rewrite it to a clean path
              if (attr.toLowerCase() === 'href' && pathStr.toLowerCase().endsWith('.html')) {
                const cleanName = pathStr.split('/').pop().replace(/\.html$/i, '').toLowerCase();
                return `href="/${cleanName === 'index' ? 'home' : cleanName}"`;
              }
              
              // Resolve asset relative to extraction dir
              const absoluteAssetPath = path.resolve(fileDir, pathStr);
              const relToExtracted = path.relative(extractedDir, absoluteAssetPath).replace(/\\/g, '/');
              
              if (assetUrlMap[relToExtracted]) {
                return `${attr}="${assetUrlMap[relToExtracted]}"`;
              }
              
              return match; // Keep original if not uploaded
            });

            // Rewrite url('...') in inline styles
            htmlContent = htmlContent.replace(/url\(['"]?(?!http|\/\/|data:)([^'"\)]+)['"]?\)/gi, (match, pathStr) => {
              const absoluteAssetPath = path.resolve(fileDir, pathStr);
              const relToExtracted = path.relative(extractedDir, absoluteAssetPath).replace(/\\/g, '/');
              
              if (assetUrlMap[relToExtracted]) {
                return `url('${assetUrlMap[relToExtracted]}')`;
              }
              return match;
            });

            const fileName = path.basename(filePath);
            const isHome = fileName.toLowerCase() === 'index.html';
            const pageName = fileName.replace(/\.html$/i, '');
            const pagePath = isHome ? '/home' : `/${pageName.toLowerCase()}`;
            const pageTitle = pageName.charAt(0).toUpperCase() + pageName.slice(1);

            const newPage = new Page({
              websiteId: savedWebsite._id,
              title: isHome ? 'Home' : pageTitle,
              path: pagePath,
              status: 'Draft',
              isHome,
              html: htmlContent,
              css: '', // CSS is linked via <link> tags from Cloudinary now
              layoutJson: { sections: [] }
            });
            await newPage.save();
            newPages.push(newPage);
          }
          
          // Safeguard: If no index.html was found in the template, force the first page to be Home
          if (newPages.length > 0 && !newPages.some(p => p.isHome)) {
            newPages[0].isHome = true;
            newPages[0].path = '/home';
            newPages[0].title = 'Home';
            await newPages[0].save();
          }

          // Clean up temp files
          fs.rmSync(extractedDir, { recursive: true, force: true });
          fs.unlinkSync(zipPath);

        } catch (zipErr) {
          console.error("Error processing template zip:", zipErr);
        }
      }
    }

    // If no template or extraction failed, create default home page
    if (newPages.length === 0) {
      const homePage = new Page({
        websiteId: savedWebsite._id,
        title: 'Home',
        path: '/home',
        status: 'Draft',
        isHome: true,
        html: '<div style="padding: 50px; text-align: center; font-family: Inter, sans-serif;"><h1>Welcome to your new site</h1></div>',
        css: '',
        layoutJson: {
          sections: [
            { type: 'hero', content: { headline: `Welcome to ${name}`, subheadline: description || 'Built with AI' } }
          ]
        }
      });
      await homePage.save();
      newPages.push(homePage);

      if (type === 'ai') {
        const contactPage = new Page({
          websiteId: savedWebsite._id,
          title: 'Contact',
          path: '/contact',
          status: 'Draft',
          isHome: false,
          html: '<div style="padding: 50px; text-align: center;"><h1>Contact Us</h1></div>',
          layoutJson: {
            sections: [
              { type: 'contact-form', content: { title: 'Contact Us', subtitle: `Get in touch with ${name}` } }
            ]
          }
        });
        await contactPage.save();
        newPages.push(contactPage);
      }
    }

    res.status(201).json({
      success: true,
      data: {
        ...savedWebsite.toObject(),
        pages: newPages.map(p => ({ _id: p._id, title: p.title, path: p.path, status: p.status, isHome: p.isHome }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// List Websites
exports.getWebsites = async (req, res, next) => {
  try {
    const workspaceId = req.workspaceId;
    const { search, page = 1, limit = 10, sortBy = 'updatedAt:desc' } = req.query;

    const query = { workspaceId, isDeleted: false };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sortObj = {};
    const [field, order] = sortBy.split(':');
    sortObj[field] = order === 'asc' ? 1 : -1;

    const total = await Website.countDocuments(query);
    const websites = await Website.find(query)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Map pages count and blogs count onto websites
    const data = await Promise.all(websites.map(async (web) => {
      const pagesCount = await Page.countDocuments({ websiteId: web._id, isDeleted: false });
      const blogsCount = await Blog.countDocuments({ websiteId: web._id, isDeleted: false });
      return {
        ...web.toObject(),
        pagesCount,
        blogsCount
      };
    }));

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get Website details + Pages
exports.getWebsiteDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const website = await Website.findOne({ _id: id, workspaceId: req.workspaceId, isDeleted: false });
    if (!website) {
      return res.status(404).json({ success: false, error: 'Website not found' });
    }

    const pages = await Page.find({ websiteId: id, isDeleted: false }).sort({ createdAt: 1 });

    res.json({
      success: true,
      data: {
        ...website.toObject(),
        pages
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single Page details
exports.getPage = async (req, res, next) => {
  try {
    const { websiteId, pageId } = req.params;
    
    // Optional: Check if website belongs to workspace
    const website = await Website.findOne({ _id: websiteId, workspaceId: req.workspaceId, isDeleted: false });
    if (!website) {
      return res.status(404).json({ success: false, error: 'Website not found' });
    }

    const page = await Page.findOne({ _id: pageId, websiteId, isDeleted: false });
    if (!page) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }

    res.json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
};

// Update Website Settings
exports.updateWebsite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, status, faviconUrl, trackingPixels, chatWidgetId, pages, theme } = req.body;

    const website = await Website.findOne({ _id: id, workspaceId: req.workspaceId, isDeleted: false });
    if (!website) {
      return res.status(404).json({ success: false, error: 'Website not found' });
    }

    if (name) website.name = name;
    if (description !== undefined) website.description = description;
    if (status) website.status = status;
    if (faviconUrl !== undefined) website.faviconUrl = faviconUrl;
    if (chatWidgetId !== undefined) website.chatWidgetId = chatWidgetId;
    if (trackingPixels) {
      website.trackingPixels = { ...website.trackingPixels, ...trackingPixels };
    }
    if (theme) {
      website.theme = { ...(website.theme?.toObject ? website.theme.toObject() : website.theme), ...theme };
    }
    website.updatedBy = req.user?._id;

    const saved = await website.save();

    // Synchronize pages if provided
    let finalPages = [];
    if (pages && Array.isArray(pages)) {
      const existingPages = await Page.find({ websiteId: id });
      const incomingPageIds = pages.filter(p => p._id && !p._id.toString().startsWith('temp-')).map(p => p._id.toString());
      
      // HARD DELETE missing pages
      for (const ep of existingPages) {
        if (!incomingPageIds.includes(ep._id.toString())) {
          await Page.deleteOne({ _id: ep._id });
        }
      }

      // CREATE or UPDATE incoming pages
      for (const p of pages) {
        if (!p._id || p._id.toString().startsWith('temp-')) {
          // CREATE
          const newPage = new Page({
            websiteId: id,
            title: p.title,
            path: p.path,
            status: p.status || 'Draft',
            isHome: p.isHome || false,
            layoutJson: p.layoutJson || { sections: [] },
            html: p.html || '',
            css: p.css || '',
            customHeadCode: p.customHeadCode || '',
            customBodyCode: p.customBodyCode || ''
          });
          const savedPage = await newPage.save();
          finalPages.push(savedPage);
        } else {
          // UPDATE
          const updatedPage = await Page.findOneAndUpdate(
            { _id: p._id, websiteId: id },
            {
              $set: {
                title: p.title,
                path: p.path,
                status: p.status,
                isHome: p.isHome,
                customHeadCode: p.customHeadCode || '',
                customBodyCode: p.customBodyCode || ''
              }
            },
            { new: true }
          );
          if (updatedPage) finalPages.push(updatedPage);
        }
      }
      
      // Sort pages by creation date for consistency
      finalPages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      // Update the response payload to include the updated pages
      return res.json({ 
        success: true, 
        data: {
          ...saved.toObject(),
          pages: finalPages
        } 
      });
    }

    res.json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
};

// Delete Website
exports.deleteWebsite = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const website = await Website.findOneAndDelete({ _id: id, workspaceId: req.workspaceId });
    if (!website) {
      return res.status(404).json({ success: false, error: 'Website not found' });
    }

    // Hard delete associated pages
    await Page.deleteMany({ websiteId: id });

    res.json({ success: true, message: 'Website and pages deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Clone Website
exports.cloneWebsite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const originalWebsite = await Website.findOne({ _id: id, workspaceId: req.workspaceId, isDeleted: false });
    
    if (!originalWebsite) {
      return res.status(404).json({ success: false, error: 'Website not found' });
    }

    const clonedWebsite = new Website({
      workspaceId: req.workspaceId,
      name: `${originalWebsite.name} (Clone)`,
      description: originalWebsite.description,
      type: originalWebsite.type,
      status: 'Draft',
      createdBy: req.user?._id || originalWebsite.createdBy,
      updatedBy: req.user?._id || originalWebsite.createdBy,
      faviconUrl: originalWebsite.faviconUrl,
      trackingPixels: originalWebsite.trackingPixels,
      chatWidgetId: originalWebsite.chatWidgetId
    });

    const savedWebsite = await clonedWebsite.save();

    const originalPages = await Page.find({ websiteId: id, isDeleted: false });
    const clonedPages = originalPages.map(p => ({
      websiteId: savedWebsite._id,
      title: p.title,
      path: p.path,
      status: p.status,
      isHome: p.isHome,
      layoutJson: p.layoutJson,
      html: p.html,
      css: p.css
    }));

    if (clonedPages.length > 0) {
      await Page.insertMany(clonedPages);
    }

    res.status(201).json({ success: true, data: savedWebsite, message: 'Website cloned successfully' });
  } catch (error) {
    next(error);
  }
};

// Re-detect and save a website's theme from its already-saved pages. Mainly for
// websites created before automatic theme detection existed on template import,
// so their blog embeds (and anything else reading website.theme) can be brought
// in line with the site's real design without having to recreate the website.
exports.syncWebsiteTheme = async (req, res, next) => {
  try {
    const { id } = req.params;
    const website = await Website.findOne({ _id: id, workspaceId: req.workspaceId, isDeleted: false });
    if (!website) {
      return res.status(404).json({ success: false, error: 'Website not found' });
    }

    const pages = await Page.find({ websiteId: id, isDeleted: false });
    if (pages.length === 0) {
      return res.status(400).json({ success: false, error: 'This website has no pages to detect a theme from' });
    }

    const detected = await detectThemeFromPublishedPages(pages);
    if (!detected.fontFamily && !detected.primaryColor) {
      return res.status(200).json({ success: true, data: website, message: 'No distinct font or brand color could be detected from this site\'s pages' });
    }

    website.theme = {
      fontFamily: detected.fontFamily || website.theme.fontFamily,
      primaryColor: detected.primaryColor || website.theme.primaryColor
    };
    website.updatedBy = req.user?._id;
    const saved = await website.save();

    res.json({ success: true, data: saved, message: 'Theme synced from site pages' });
  } catch (error) {
    next(error);
  }
};

// Add Page to Website
exports.addPage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, path } = req.body;

    if (!title || !path) {
      return res.status(400).json({ success: false, error: 'Page title and path are required' });
    }

    const website = await Website.findOne({ _id: id, workspaceId: req.workspaceId, isDeleted: false });
    if (!website) {
      return res.status(404).json({ success: false, error: 'Website not found' });
    }

    // Check path format and existence
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const pathExists = await Page.findOne({ websiteId: id, path: cleanPath, isDeleted: false });
    if (pathExists) {
      return res.status(400).json({ success: false, error: 'Page path already exists for this website' });
    }

    const page = new Page({
      websiteId: id,
      title,
      path: cleanPath,
      status: 'Draft',
      isHome: false
    });

    const savedPage = await page.save();
    res.status(201).json({ success: true, data: savedPage });
  } catch (error) {
    next(error);
  }
};

// Duplicate Website Page
exports.duplicatePage = async (req, res, next) => {
  try {
    const { websiteId, pageId } = req.params;

    const page = await Page.findOne({ _id: pageId, websiteId, isDeleted: false });
    if (!page) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }

    let newPath = `${page.path}-copy`;
    let pathExists = true;
    let counter = 1;

    while (pathExists) {
      const check = await Page.findOne({ websiteId, path: newPath, isDeleted: false });
      if (!check) {
        pathExists = false;
      } else {
        newPath = `${page.path}-copy-${counter}`;
        counter++;
      }
    }

    const duplicated = new Page({
      websiteId,
      title: `${page.title} (Copy)`,
      path: newPath,
      status: 'Draft',
      isHome: false,
      layoutJson: page.layoutJson,
      html: page.html,
      css: page.css,
      customHeadCode: page.customHeadCode,
      customBodyCode: page.customBodyCode
    });

    const saved = await duplicated.save();
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
};

// Update Page
exports.updatePage = async (req, res, next) => {
  try {
    const { websiteId, pageId } = req.params;
    const { title, path, layoutJson, html, css, status, customHeadCode, customBodyCode } = req.body;

    const page = await Page.findOne({ _id: pageId, websiteId, isDeleted: false });
    if (!page) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }

    if (title) page.title = title;
    if (path) {
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      if (cleanPath !== page.path) {
        const pathExists = await Page.findOne({ websiteId, path: cleanPath, isDeleted: false });
        if (pathExists) {
          return res.status(400).json({ success: false, error: 'Page path already exists for this website' });
        }
        page.path = cleanPath;
      }
    }
    if (layoutJson !== undefined) page.layoutJson = layoutJson;
    if (html !== undefined) page.html = html;
    if (css !== undefined) page.css = css;
    if (status) page.status = status;
    if (customHeadCode !== undefined) page.customHeadCode = customHeadCode;
    if (customBodyCode !== undefined) page.customBodyCode = customBodyCode;

    const saved = await page.save();
    res.json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
};

// Delete Page
exports.deletePage = async (req, res, next) => {
  try {
    const { websiteId, pageId } = req.params;

    const page = await Page.findOne({ _id: pageId, websiteId, isDeleted: false });
    if (!page) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }

    if (page.isHome) {
      return res.status(400).json({ success: false, error: 'Cannot delete the home page' });
    }

    page.isDeleted = true;
    await page.save();

    res.json({ success: true, message: 'Page deleted successfully' });
  } catch (error) {
    next(error);
  }
};