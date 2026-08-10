const axios = require('axios');
const { decrypt } = require('../../utils/crypto');

/**
 * Creates an Axios instance pre-configured for a specific WordPress connection.
 */
const createWordPressClient = (connection) => {
  const password = decrypt(connection.credentials);
  if (!password) {
    throw new Error('Failed to decrypt WordPress credentials');
  }

  const token = Buffer.from(`${connection.username}:${password}`).toString('base64');

  const client = axios.create({
    baseURL: connection.apiUrl,
    timeout: 15000, // 15 seconds timeout
    headers: {
      'Authorization': `Basic ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  // Basic error interceptor
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      let customError = new Error('WordPress API Error');
      if (error.response) {
        // The request was made and the server responded with a status code
        customError.status = error.response.status;
        customError.data = error.response.data;
        customError.message = `WordPress API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
      } else if (error.request) {
        // The request was made but no response was received
        customError.status = 503;
        customError.message = 'WordPress site is unreachable or connection timed out.';
      } else {
        // Something happened in setting up the request
        customError.status = 500;
        customError.message = error.message;
      }
      return Promise.reject(customError);
    }
  );

  return client;
};

/**
 * Test a WordPress connection credentials and URL.
 */
exports.testConnection = async (apiUrl, username, password) => {
  const token = Buffer.from(`${username}:${password}`).toString('base64');
  
  try {
    const response = await axios.get(`${apiUrl}/wp/v2/users/me`, {
      timeout: 10000,
      headers: {
        'Authorization': `Basic ${token}`,
        'Accept': 'application/json'
      }
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    if (error.response) {
      if (error.response.status === 401 || error.response.status === 403) {
        throw new Error('Authentication failed. Check your Application Password and Username.');
      }
      throw new Error(`WordPress API returned status ${error.response.status}`);
    } else if (error.request) {
      throw new Error('WordPress API is unreachable. Check the URL and ensure the REST API is enabled.');
    }
    throw error;
  }
};

// --- Pages ---

exports.getPages = async (connection, params = {}) => {
  const client = createWordPressClient(connection);
  const response = await client.get('/wp/v2/pages', { params });
  return {
    data: response.data,
    total: parseInt(response.headers['x-wp-total'] || 0, 10),
    totalPages: parseInt(response.headers['x-wp-totalpages'] || 0, 10)
  };
};

exports.getPage = async (connection, pageId) => {
  const client = createWordPressClient(connection);
  const response = await client.get(`/wp/v2/pages/${pageId}?context=edit`);
  return response.data;
};

exports.createPage = async (connection, data) => {
  const client = createWordPressClient(connection);
  const response = await client.post('/wp/v2/pages', data);
  return response.data;
};

exports.updatePage = async (connection, pageId, data) => {
  const client = createWordPressClient(connection);
  const response = await client.post(`/wp/v2/pages/${pageId}`, data);
  return response.data;
};

exports.deletePage = async (connection, pageId, force = false) => {
  const client = createWordPressClient(connection);
  const response = await client.delete(`/wp/v2/pages/${pageId}${force ? '?force=true' : ''}`);
  return response.data;
};

// --- Posts ---

exports.getPosts = async (connection, params = {}) => {
  const client = createWordPressClient(connection);
  const response = await client.get('/wp/v2/posts', { params });
  return {
    data: response.data,
    total: parseInt(response.headers['x-wp-total'] || 0, 10),
    totalPages: parseInt(response.headers['x-wp-totalpages'] || 0, 10)
  };
};

exports.getPost = async (connection, postId) => {
  const client = createWordPressClient(connection);
  const response = await client.get(`/wp/v2/posts/${postId}?context=edit`);
  return response.data;
};

exports.createPost = async (connection, data) => {
  const client = createWordPressClient(connection);
  const response = await client.post('/wp/v2/posts', data);
  return response.data;
};

exports.updatePost = async (connection, postId, data) => {
  const client = createWordPressClient(connection);
  const response = await client.post(`/wp/v2/posts/${postId}`, data);
  return response.data;
};

exports.deletePost = async (connection, postId, force = false) => {
  const client = createWordPressClient(connection);
  const response = await client.delete(`/wp/v2/posts/${postId}${force ? '?force=true' : ''}`);
  return response.data;
};

// --- Media ---

exports.getMedia = async (connection, params = {}) => {
  const client = createWordPressClient(connection);
  const response = await client.get('/wp/v2/media', { params });
  return {
    data: response.data,
    total: parseInt(response.headers['x-wp-total'] || 0, 10),
    totalPages: parseInt(response.headers['x-wp-totalpages'] || 0, 10)
  };
};

exports.deleteMedia = async (connection, mediaId, force = true) => {
  const client = createWordPressClient(connection);
  // WordPress usually requires force=true to delete media directly
  const response = await client.delete(`/wp/v2/media/${mediaId}${force ? '?force=true' : ''}`);
  return response.data;
};

exports.uploadMedia = async (connection, fileData, filename, contentType) => {
  const client = createWordPressClient(connection);
  
  const response = await client.post('/wp/v2/media', fileData, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
  return response.data;
};

// --- Taxonomies and Users ---

exports.getCategories = async (connection, params = {}) => {
  const client = createWordPressClient(connection);
  const response = await client.get('/wp/v2/categories', { params: { per_page: 100, ...params } });
  return response.data;
};

exports.getTags = async (connection, params = {}) => {
  const client = createWordPressClient(connection);
  const response = await client.get('/wp/v2/tags', { params: { per_page: 100, ...params } });
  return response.data;
};

exports.getAuthors = async (connection, params = {}) => {
  const client = createWordPressClient(connection);
  const response = await client.get('/wp/v2/users', { params: { per_page: 100, ...params } });
  return response.data;
};

// --- E-Commerce (WooCommerce) ---

exports.getProducts = async (connection, params = {}) => {
  const client = createWordPressClient(connection);
  const response = await client.get('/wc/v3/products', { params });
  return {
    data: response.data,
    total: parseInt(response.headers['x-wp-total'] || 0, 10),
    totalPages: parseInt(response.headers['x-wp-totalpages'] || 0, 10)
  };
};

exports.createProduct = async (connection, data) => {
  const client = createWordPressClient(connection);
  const response = await client.post('/wc/v3/products', data);
  return response.data;
};

exports.updateProduct = async (connection, productId, data) => {
  const client = createWordPressClient(connection);
  const response = await client.put(`/wc/v3/products/${productId}`, data);
  return response.data;
};

exports.deleteProduct = async (connection, productId, force = true) => {
  const client = createWordPressClient(connection);
  const response = await client.delete(`/wc/v3/products/${productId}${force ? '?force=true' : ''}`);
  return response.data;
};

exports.getOrders = async (connection, params = {}) => {
  const client = createWordPressClient(connection);
  const response = await client.get('/wc/v3/orders', { params });
  return {
    data: response.data,
    total: parseInt(response.headers['x-wp-total'] || 0, 10),
    totalPages: parseInt(response.headers['x-wp-totalpages'] || 0, 10)
  };
};

exports.updateOrderStatus = async (connection, orderId, status) => {
  const client = createWordPressClient(connection);
  const response = await client.put(`/wc/v3/orders/${orderId}`, { status });
  return response.data;
};

exports.getStoreAnalytics = async (connection) => {
  const client = createWordPressClient(connection);
  // WooCommerce sales report
  const response = await client.get('/wc/v3/reports/sales', { params: { date_min: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString() } });
  return response.data;
};

exports.createWordPressClient = createWordPressClient;
