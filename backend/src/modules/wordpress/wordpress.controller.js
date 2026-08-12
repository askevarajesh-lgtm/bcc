const WordPressConnection = require('./wordpress.model');
const wordpressService = require('./wordpress.service');
const { encrypt } = require('../../utils/crypto');
const { getClaudeClient } = require('../websites/services/websiteAiGeneration.service');

/**
 * Test a WordPress connection credentials.
 */
exports.testConnection = async (req, res) => {
  try {
    const { apiUrl, username, password } = req.body;

    if (!apiUrl || !username || !password) {
      return res.status(400).json({ success: false, message: 'Missing required fields: apiUrl, username, password.' });
    }

    // Clean URL
    const cleanApiUrl = apiUrl.replace(/\/$/, '');

    const result = await wordpressService.testConnection(cleanApiUrl, username, password);

    return res.status(200).json({
      success: true,
      message: 'Connection successful',
      data: result.data
    });
  } catch (error) {
    console.error('WordPress testConnection error:', error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Create or Update a WordPress Connection
 */
exports.connect = async (req, res) => {
  try {
    const { name, websiteUrl, apiUrl, username, password } = req.body;
    const { workspaceId, companyId } = req;

    if (!name || !websiteUrl || !apiUrl || !username || !password) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    const cleanApiUrl = apiUrl.replace(/\/$/, '');

    // Validate credentials first before saving
    await wordpressService.testConnection(cleanApiUrl, username, password);

    // Encrypt password
    const encryptedCredentials = encrypt(password);
    if (!encryptedCredentials) {
      return res.status(500).json({ success: false, message: 'Failed to encrypt credentials securely.' });
    }

    const connection = new WordPressConnection({
      workspaceId,
      agencyId: req.user?.agencyId || companyId,
      brandId: req.user?.brandId,
      name,
      websiteUrl,
      apiUrl: cleanApiUrl,
      authType: 'application_password',
      username,
      credentials: encryptedCredentials,
      status: 'Connected',
      lastConnectionCheck: new Date(),
      createdBy: req.user?._id
    });

    await connection.save();

    const responseData = connection.toObject();
    delete responseData.credentials; // NEVER send credentials back

    return res.status(201).json({ success: true, data: responseData, message: 'WordPress site connected successfully.' });
  } catch (error) {
    console.error('WordPress connect error:', error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Get all connections for the tenant
 */
exports.getConnections = async (req, res) => {
  try {
    const { workspaceId } = req;
    
    const connections = await WordPressConnection.find({ workspaceId, isDeleted: false })
                                                 .select('-credentials') // Exclude credentials
                                                 .sort({ createdAt: -1 });
                                                 
    return res.status(200).json({ success: true, data: connections });
  } catch (error) {
    console.error('WordPress getConnections error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching connections.' });
  }
};

/**
 * Get pages and blogs count for a specific connection
 */
exports.getCounts = async (req, res) => {
  try {
    const { id } = req.params;
    const { workspaceId } = req;
    
    const connection = await WordPressConnection.findOne({ _id: id, workspaceId, isDeleted: false });
    if (!connection) return res.status(404).json({ success: false, message: 'Connection not found.' });
    
    let pagesCount = '-';
    let blogsCount = '-';
    
    try {
      const pagesRes = await wordpressService.getPages(connection, { per_page: 1 });
      const postsRes = await wordpressService.getPosts(connection, { per_page: 1 });
      pagesCount = pagesRes.total;
      blogsCount = postsRes.total;
    } catch (err) {
      console.error(`Failed to fetch counts for WP connection ${connection._id}:`, err.message);
    }
    
    return res.status(200).json({ success: true, pagesCount, blogsCount });
  } catch (error) {
    console.error('WordPress getCounts error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching counts.' });
  }
};

/**
 * Delete connection
 */
exports.deleteConnection = async (req, res) => {
  try {
    const { id } = req.params;
    const { workspaceId } = req;

    const connection = await WordPressConnection.findOneAndUpdate(
      { _id: id, workspaceId },
      { isDeleted: true },
      { new: true }
    );

    if (!connection) {
      return res.status(404).json({ success: false, message: 'Connection not found.' });
    }

    return res.status(200).json({ success: true, message: 'Connection deleted successfully.' });
  } catch (error) {
    console.error('WordPress deleteConnection error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting connection.' });
  }
};

// --- Pages Management ---

/**
 * Get pages from connected WordPress site
 */
exports.getPages = async (req, res) => {
  try {
    const { id } = req.params;
    const { workspaceId } = req;

    const connection = await WordPressConnection.findOne({ _id: id, workspaceId, isDeleted: false });
    if (!connection) {
      return res.status(404).json({ success: false, message: 'Connection not found.' });
    }

    const params = { status: 'any', context: 'edit', ...req.query };
    const result = await wordpressService.getPages(connection, params);

    return res.status(200).json({ success: true, data: result.data, total: result.total, totalPages: result.totalPages });
  } catch (error) {
    console.error('WordPress getPages error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error fetching pages.' });
  }
};

/**
 * Get a specific page
 */
exports.getPage = async (req, res) => {
  try {
    const { id, pageId } = req.params;
    const { workspaceId } = req;

    const connection = await WordPressConnection.findOne({ _id: id, workspaceId, isDeleted: false });
    if (!connection) return res.status(404).json({ success: false, message: 'Connection not found.' });

    const page = await wordpressService.getPage(connection, pageId);
    return res.status(200).json({ success: true, data: page });
  } catch (error) {
    console.error('WordPress getPage error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error fetching page.' });
  }
};

/**
 * Create a new page
 */
exports.createPage = async (req, res) => {
  try {
    const { id } = req.params;
    const { workspaceId } = req;

    const connection = await WordPressConnection.findOne({ _id: id, workspaceId, isDeleted: false });
    if (!connection) return res.status(404).json({ success: false, message: 'Connection not found.' });

    const page = await wordpressService.createPage(connection, req.body);
    return res.status(201).json({ success: true, data: page });
  } catch (error) {
    console.error('WordPress createPage error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error creating page.' });
  }
};

/**
 * Update an existing page
 */
exports.updatePage = async (req, res) => {
  try {
    const { id, pageId } = req.params;
    const { workspaceId } = req;

    const connection = await WordPressConnection.findOne({ _id: id, workspaceId, isDeleted: false });
    if (!connection) return res.status(404).json({ success: false, message: 'Connection not found.' });

    const page = await wordpressService.updatePage(connection, pageId, req.body);
    return res.status(200).json({ success: true, data: page });
  } catch (error) {
    console.error('WordPress updatePage error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error updating page.' });
  }
};

/**
 * Delete a page
 */
exports.deletePage = async (req, res) => {
  try {
    const { id, pageId } = req.params;
    const { force } = req.query;
    const { workspaceId } = req;

    const connection = await WordPressConnection.findOne({ _id: id, workspaceId, isDeleted: false });
    if (!connection) return res.status(404).json({ success: false, message: 'Connection not found.' });

    const result = await wordpressService.deletePage(connection, pageId, force === 'true');
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('WordPress deletePage error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error deleting page.' });
  }
};

/**
 * AI Edit a WordPress page
 */
exports.aiEditWordpressPage = async (req, res) => {
  try {
    const { id, pageId } = req.params;
    const { prompt, currentHtml } = req.body;
    const { workspaceId, user } = req;

    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt is required.' });
    }

    const connection = await WordPressConnection.findOne({ _id: id, workspaceId, isDeleted: false });
    if (!connection) return res.status(404).json({ success: false, message: 'Connection not found.' });

    let finalHtml = currentHtml;
    
    if (finalHtml === undefined) {
      // 1. Fetch current page if not provided in body
      const page = await wordpressService.getPage(connection, pageId);
      if (!page) {
        return res.status(404).json({ success: false, message: 'Page not found.' });
      }
      finalHtml = page.content?.rendered || '';
    }
    
    // 2. Setup AI client
    const { client, model } = await getClaudeClient(workspaceId, user);
    
    // 3. System prompt focused purely on returning raw modified HTML for the WP editor
    const systemPrompt = `You are an expert web developer and copywriter editing an existing WordPress page content.
The user wants to make a change based on their prompt.
You must return the updated raw HTML content ONLY.
Do NOT wrap the output in markdown code blocks like \`\`\`html.
Do NOT include <html>, <head>, or <body> tags. Just the raw HTML content that goes inside the WordPress editor.
Do NOT include any explanations or conversational text.`;

    // 4. User prompt
    const userPrompt = `Here is the current HTML content of the WordPress page:

${finalHtml}

User's requested change:
${prompt}

Please provide the fully updated HTML content.`;

    // 5. Call LLM
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 4000
    });
    
    let updatedHtml = completion.choices[0].message.content.trim();
    
    // Sanitize slightly to remove markdown ticks if the model stubbornly adds them
    if (updatedHtml.startsWith('\`\`\`html')) {
      updatedHtml = updatedHtml.replace(/^\`\`\`html\n?/, '');
    }
    if (updatedHtml.startsWith('\`\`\`')) {
      updatedHtml = updatedHtml.replace(/^\`\`\`\n?/, '');
    }
    if (updatedHtml.endsWith('\`\`\`')) {
      updatedHtml = updatedHtml.replace(/\n?\`\`\`$/, '');
    }
    updatedHtml = updatedHtml.trim();

    // 6. Push back to WordPress
    const updatedPage = await wordpressService.updatePage(connection, pageId, { content: updatedHtml });

    return res.status(200).json({ success: true, data: updatedPage });
  } catch (error) {
    console.error('WordPress aiEditWordpressPage error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error editing page with AI.' });
  }
};

// --- Posts Management ---

/**
 * Get posts from connected WordPress site
 */
exports.getPosts = async (req, res) => {
  try {
    const { id } = req.params;
    const { workspaceId } = req;

    const connection = await WordPressConnection.findOne({ _id: id, workspaceId, isDeleted: false });
    if (!connection) {
      return res.status(404).json({ success: false, message: 'Connection not found.' });
    }

    const params = { status: 'any', context: 'edit', ...req.query };
    const result = await wordpressService.getPosts(connection, params);

    return res.status(200).json({ success: true, data: result.data, total: result.total, totalPages: result.totalPages });
  } catch (error) {
    console.error('WordPress getPosts error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error fetching posts.' });
  }
};

/**
 * Get a specific post
 */
exports.getPost = async (req, res) => {
  try {
    const { id, postId } = req.params;
    const { workspaceId } = req;

    const connection = await WordPressConnection.findOne({ _id: id, workspaceId, isDeleted: false });
    if (!connection) return res.status(404).json({ success: false, message: 'Connection not found.' });

    const post = await wordpressService.getPost(connection, postId);
    return res.status(200).json({ success: true, data: post });
  } catch (error) {
    console.error('WordPress getPost error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error fetching post.' });
  }
};

/**
 * Create a new post
 */
exports.createPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { workspaceId } = req;

    const connection = await WordPressConnection.findOne({ _id: id, workspaceId, isDeleted: false });
    if (!connection) return res.status(404).json({ success: false, message: 'Connection not found.' });

    const post = await wordpressService.createPost(connection, req.body);
    return res.status(201).json({ success: true, data: post });
  } catch (error) {
    console.error('WordPress createPost error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error creating post.' });
  }
};

/**
 * Update an existing post
 */
exports.updatePost = async (req, res) => {
  try {
    const { id, postId } = req.params;
    const { workspaceId } = req;

    const connection = await WordPressConnection.findOne({ _id: id, workspaceId, isDeleted: false });
    if (!connection) return res.status(404).json({ success: false, message: 'Connection not found.' });

    const post = await wordpressService.updatePost(connection, postId, req.body);
    return res.status(200).json({ success: true, data: post });
  } catch (error) {
    console.error('WordPress updatePost error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error updating post.' });
  }
};

/**
 * Delete a post
 */
exports.deletePost = async (req, res) => {
  try {
    const { id, postId } = req.params;
    const { force } = req.query;
    const { workspaceId } = req;

    const connection = await WordPressConnection.findOne({ _id: id, workspaceId, isDeleted: false });
    if (!connection) return res.status(404).json({ success: false, message: 'Connection not found.' });

    const result = await wordpressService.deletePost(connection, postId, force === 'true');
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('WordPress deletePost error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error deleting post.' });
  }
};

// --- Media Management ---

/**
 * Get media items from connected WordPress site
 */
exports.getMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const { workspaceId } = req;

    const connection = await WordPressConnection.findOne({ _id: id, workspaceId, isDeleted: false });
    if (!connection) {
      return res.status(404).json({ success: false, message: 'Connection not found.' });
    }

    const params = { per_page: 100, ...req.query };
    const result = await wordpressService.getMedia(connection, params);

    return res.status(200).json({ success: true, data: result.data, total: result.total, totalPages: result.totalPages });
  } catch (error) {
    console.error('WordPress getMedia error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error fetching media.' });
  }
};

/**
 * Delete a media item
 */
exports.deleteMedia = async (req, res) => {
  try {
    const { id, mediaId } = req.params;
    const { force } = req.query;
    const { workspaceId } = req;

    const connection = await WordPressConnection.findOne({ _id: id, workspaceId, isDeleted: false });
    if (!connection) return res.status(404).json({ success: false, message: 'Connection not found.' });

    // Default force=true for media as trash is often unsupported for media
    const result = await wordpressService.deleteMedia(connection, mediaId, force !== 'false');
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('WordPress deleteMedia error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error deleting media.' });
  }
};

/**
 * Upload a media item
 */
exports.uploadMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const { workspaceId } = req;

    const connection = await WordPressConnection.findOne({ _id: id, workspaceId, isDeleted: false });
    if (!connection) return res.status(404).json({ success: false, message: 'Connection not found.' });

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const result = await wordpressService.uploadMedia(connection, req.file.buffer, req.file.originalname, req.file.mimetype);
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('WordPress uploadMedia error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error uploading media.' });
  }
};

// --- Taxonomies and Users ---

exports.getCategories = async (req, res) => {
  try {
    const { id } = req.params;
    const { workspaceId } = req;
    
    const connection = await WordPressConnection.findOne({ _id: id, workspaceId, isDeleted: false });
    if (!connection) return res.status(404).json({ success: false, message: 'Connection not found.' });

    const categories = await wordpressService.getCategories(connection);
    return res.status(200).json({ success: true, data: categories });
  } catch (error) {
    console.error('WordPress getCategories error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching categories.', error: error.message });
  }
};

exports.getTags = async (req, res) => {
  try {
    const { id } = req.params;
    const { workspaceId } = req;
    
    const connection = await WordPressConnection.findOne({ _id: id, workspaceId, isDeleted: false });
    if (!connection) return res.status(404).json({ success: false, message: 'Connection not found.' });

    const tags = await wordpressService.getTags(connection);
    return res.status(200).json({ success: true, data: tags });
  } catch (error) {
    console.error('WordPress getTags error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching tags.', error: error.message });
  }
};

exports.getAuthors = async (req, res) => {
  try {
    const { id } = req.params;
    const { workspaceId } = req;
    
    const connection = await WordPressConnection.findOne({ _id: id, workspaceId, isDeleted: false });
    if (!connection) return res.status(404).json({ success: false, message: 'Connection not found.' });

    const authors = await wordpressService.getAuthors(connection);
    return res.status(200).json({ success: true, data: authors });
  } catch (error) {
    console.error('WordPress getAuthors error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching authors.', error: error.message });
  }
};

// --- E-Commerce (WooCommerce) ---

exports.getProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { workspaceId } = req;
    const connection = await WordPressConnection.findOne({ _id: id, workspaceId, isDeleted: false });
    if (!connection) return res.status(404).json({ success: false, message: 'Connection not found.' });

    const params = { status: 'any', ...req.query };
    const result = await wordpressService.getProducts(connection, params);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('WooCommerce getProducts error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching products. Ensure WooCommerce is installed.', error: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { workspaceId } = req;
    const connection = await WordPressConnection.findOne({ _id: id, workspaceId, isDeleted: false });
    if (!connection) return res.status(404).json({ success: false, message: 'Connection not found.' });

    const product = await wordpressService.createProduct(connection, req.body);
    return res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error('WooCommerce createProduct error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating product.', error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id, productId } = req.params;
    const { workspaceId } = req;
    const connection = await WordPressConnection.findOne({ _id: id, workspaceId, isDeleted: false });
    if (!connection) return res.status(404).json({ success: false, message: 'Connection not found.' });

    const product = await wordpressService.updateProduct(connection, productId, req.body);
    return res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error('WooCommerce updateProduct error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating product.', error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id, productId } = req.params;
    const { workspaceId } = req;
    const connection = await WordPressConnection.findOne({ _id: id, workspaceId, isDeleted: false });
    if (!connection) return res.status(404).json({ success: false, message: 'Connection not found.' });

    const result = await wordpressService.deleteProduct(connection, productId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('WooCommerce deleteProduct error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting product.', error: error.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const { workspaceId } = req;
    const connection = await WordPressConnection.findOne({ _id: id, workspaceId, isDeleted: false });
    if (!connection) return res.status(404).json({ success: false, message: 'Connection not found.' });

    const params = { status: 'any', ...req.query };
    const result = await wordpressService.getOrders(connection, params);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('WooCommerce getOrders error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching orders. Ensure WooCommerce is installed.', error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id, orderId } = req.params;
    const { workspaceId } = req;
    const { status } = req.body;
    const connection = await WordPressConnection.findOne({ _id: id, workspaceId, isDeleted: false });
    if (!connection) return res.status(404).json({ success: false, message: 'Connection not found.' });

    const order = await wordpressService.updateOrderStatus(connection, orderId, status);
    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('WooCommerce updateOrderStatus error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating order status.', error: error.message });
  }
};

exports.getStoreAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { workspaceId } = req;
    const connection = await WordPressConnection.findOne({ _id: id, workspaceId, isDeleted: false });
    if (!connection) return res.status(404).json({ success: false, message: 'Connection not found.' });

    const analytics = await wordpressService.getStoreAnalytics(connection);
    return res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    // If WooCommerce is not installed or API is unreachable, handle gracefully without crashing
    console.error('WooCommerce getStoreAnalytics error (may not be installed):', error.message);
    return res.status(200).json({ success: false, message: 'WooCommerce not available', data: [] });
  }
};

