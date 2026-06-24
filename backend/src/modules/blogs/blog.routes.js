const express = require('express');
const router = express.Router();
const blogController = require('./blog.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

// Public Blog Endpoint
router.get('/:id/public', blogController.getPublicBlog);

router.use(authMiddleware);

// Blog CRUD
router.get('/', blogController.getBlogs);
router.post('/', blogController.createBlog);
router.get('/:id', blogController.getBlogDetails);
router.put('/:id', blogController.updateBlog);
router.delete('/:id', blogController.deleteBlog);

// Blog Posts CRUD
router.get('/:blogId/posts', blogController.getPosts);
router.post('/:blogId/posts', blogController.addPost);
router.put('/posts/:postId', blogController.updatePost);
router.delete('/posts/:postId', blogController.deletePost);

// Blog Categories CRUD
router.get('/:blogId/categories', blogController.getCategories);
router.post('/:blogId/categories', blogController.addCategory);
router.put('/categories/:categoryId', blogController.updateCategory);
router.delete('/categories/:categoryId', blogController.deleteCategory);

module.exports = router;
