const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const wordpressController = require('./wordpress.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

// All WordPress routes require authentication
router.use(authMiddleware);

// Connections
router.post('/test', wordpressController.testConnection);
router.post('/connect', wordpressController.connect);
router.get('/', wordpressController.getConnections);
router.get('/:id/counts', wordpressController.getCounts);
router.delete('/:id', wordpressController.deleteConnection);

// Pages
router.get('/:id/pages', wordpressController.getPages);
router.post('/:id/pages', wordpressController.createPage);
router.get('/:id/pages/:pageId', wordpressController.getPage);
router.put('/:id/pages/:pageId', wordpressController.updatePage);
router.delete('/:id/pages/:pageId', wordpressController.deletePage);
router.post('/:id/pages/:pageId/ai-edit', wordpressController.aiEditWordpressPage);
router.get('/:id/proxy-styles', wordpressController.proxyStyles);

// Posts
router.get('/:id/posts', wordpressController.getPosts);
router.post('/:id/posts', wordpressController.createPost);
router.get('/:id/posts/:postId', wordpressController.getPost);
router.put('/:id/posts/:postId', wordpressController.updatePost);
router.delete('/:id/posts/:postId', wordpressController.deletePost);

// Media
router.get('/:id/media', wordpressController.getMedia);
router.post('/:id/media', upload.single('file'), wordpressController.uploadMedia);
router.delete('/:id/media/:mediaId', wordpressController.deleteMedia);

// Taxonomies and Users
router.get('/:id/categories', wordpressController.getCategories);
router.get('/:id/tags', wordpressController.getTags);
router.get('/:id/authors', wordpressController.getAuthors);

// E-Commerce (WooCommerce)
router.get('/:id/products', wordpressController.getProducts);
router.post('/:id/products', wordpressController.createProduct);
router.put('/:id/products/:productId', wordpressController.updateProduct);
router.delete('/:id/products/:productId', wordpressController.deleteProduct);

router.get('/:id/orders', wordpressController.getOrders);
router.put('/:id/orders/:orderId/status', wordpressController.updateOrderStatus);

router.get('/:id/analytics', wordpressController.getStoreAnalytics);

module.exports = router;
