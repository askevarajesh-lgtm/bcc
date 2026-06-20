const Website = require('../models/Website');
const Page = require('../models/Page');
const Template = require('../models/Template');
const unzipper = require('unzipper');
const fs = require('fs');
const path = require('path');

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
        try {
          const zipPath = path.join(__dirname, '..', '..', templateRecord.zipUrl);
          const extractedDir = path.join(__dirname, '..', '..', 'uploads', 'extracted_templates', templateRecord._id.toString());
          const publicBaseUrl = `/uploads/extracted_templates/${templateRecord._id.toString()}`;

          // Extract if not already extracted
          if (!fs.existsSync(extractedDir) && fs.existsSync(zipPath)) {
            fs.mkdirSync(extractedDir, { recursive: true });
            await fs.createReadStream(zipPath)
              .pipe(unzipper.Extract({ path: extractedDir }))
              .promise();
          }

          // Helper to recursively find all HTML files
          const findHtmlFiles = (dir, fileList = []) => {
            if (!fs.existsSync(dir)) return fileList;
            const files = fs.readdirSync(dir);
            for (const file of files) {
              const filePath = path.join(dir, file);
              if (fs.statSync(filePath).isDirectory()) {
                findHtmlFiles(filePath, fileList);
              } else if (filePath.toLowerCase().endsWith('.html')) {
                fileList.push(filePath);
              }
            }
            return fileList;
          };

          const htmlFiles = findHtmlFiles(extractedDir);

          for (const filePath of htmlFiles) {
            let htmlContent = fs.readFileSync(filePath, 'utf8');
            
            // Calculate the relative path from extraction root to this file's directory
            const fileDir = path.dirname(filePath);
            let relDir = path.relative(extractedDir, fileDir).replace(/\\/g, '/');
            if (relDir && !relDir.endsWith('/')) relDir += '/';
            
            const fileBaseUrl = `${publicBaseUrl}/${relDir}`;

            // Rewrite src and href to absolute URLs
            htmlContent = htmlContent.replace(/(src|href)=["'](?!http|\/\/|data:|#|mailto:|tel:)([^"']+)["']/gi, (match, attr, pathStr) => {
              // If it's a link to another html file, rewrite it to a clean path
              if (attr.toLowerCase() === 'href' && pathStr.toLowerCase().endsWith('.html')) {
                const cleanName = pathStr.split('/').pop().replace(/\.html$/i, '').toLowerCase();
                return `href="/${cleanName === 'index' ? 'home' : cleanName}"`;
              }
              // Otherwise, it's an asset (css, js, img)
              return `${attr}="${fileBaseUrl}${pathStr}"`;
            });

            // Rewrite url('...') in inline styles
            htmlContent = htmlContent.replace(/url\(['"]?(?!http|\/\/|data:)([^'"\)]+)['"]?\)/gi, (match, pathStr) => {
              return `url('${fileBaseUrl}${pathStr}')`;
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
              css: '', // CSS is linked via <link> tags now, no need to inject raw css string
              layoutJson: { sections: [] }
            });
            await newPage.save();
            newPages.push(newPage);
          }
        } catch (zipErr) {
          console.error("Error reading/extracting zip template:", zipErr);
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

    // Map pages count onto websites
    const data = await Promise.all(websites.map(async (web) => {
      const pagesCount = await Page.countDocuments({ websiteId: web._id, isDeleted: false });
      return {
        ...web.toObject(),
        pagesCount
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
    const { name, description, status, faviconUrl, trackingPixels, chatWidgetId } = req.body;

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
    website.updatedBy = req.user?._id;

    const saved = await website.save();
    res.json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
};

// Delete Website
exports.deleteWebsite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const website = await Website.findOne({ _id: id, workspaceId: req.workspaceId, isDeleted: false });
    if (!website) {
      return res.status(404).json({ success: false, error: 'Website not found' });
    }

    website.isDeleted = true;
    website.updatedBy = req.user?._id;
    await website.save();

    // Soft delete associated pages
    await Page.updateMany({ websiteId: id }, { isDeleted: true });

    res.json({ success: true, message: 'Website and pages deleted successfully' });
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
      layoutJson: page.layoutJson
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
    const { title, path, layoutJson, html, css, status } = req.body;

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
