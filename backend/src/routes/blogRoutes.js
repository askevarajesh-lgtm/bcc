const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const authMiddleware = require('../middlewares/authMiddleware');

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

module.exports = router;
