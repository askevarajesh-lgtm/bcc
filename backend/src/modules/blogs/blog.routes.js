const express = require('express');
const router = express.Router();
const blogController = require('./blog.controller');
const blogSeoAgentController = require('./blogSeoAgent.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

// Public Blog Endpoint
router.get('/:id/public', blogController.getPublicBlog);
router.get('/slug/:slug/public', blogController.getPublicBlogBySlug);

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
router.get('/posts/:postId', blogController.getPostDetails);
router.put('/posts/:postId', blogController.updatePost);
router.delete('/posts/:postId', blogController.deletePost);

// Blog Post AI Edit
router.post('/:blogId/posts/:postId/ai-edit', blogController.aiEditPost);

// Blog Categories CRUD
router.get('/:blogId/categories', blogController.getCategories);
router.post('/:blogId/categories', blogController.addCategory);
router.put('/categories/:categoryId', blogController.updateCategory);
router.delete('/categories/:categoryId', blogController.deleteCategory);

router.post('/:blogId/posts/:postId/seo-agent/run', blogSeoAgentController.runBlogSeoAgent);
router.put('/:blogId/posts/:postId/seo-agent/:runId/approve', blogSeoAgentController.approveBlogSeoFindings);
router.put('/:blogId/posts/:postId/seo-agent/:runId/reject', blogSeoAgentController.rejectBlogSeoFindings);
router.get('/:blogId/posts/:postId/seo-agent/history', blogSeoAgentController.getBlogSeoExecutionHistory);

module.exports = router;