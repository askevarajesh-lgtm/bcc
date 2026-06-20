const Blog = require('../models/Blog');
const BlogPost = require('../models/BlogPost');

// Create Blog
exports.createBlog = async (req, res, next) => {
  try {
    const { name, website, webstore, description, status } = req.body;
    const workspaceId = req.workspaceId;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Blog name is required' });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const slugExists = await Blog.findOne({ workspaceId, slug, isDeleted: false });
    if (slugExists) {
      return res.status(400).json({ success: false, error: 'A blog with that slug already exists' });
    }

    const blog = new Blog({
      workspaceId,
      name,
      slug,
      websiteId: website && website !== '—' ? website : null,
      storeId: webstore && webstore !== '—' ? webstore : null,
      description: description || "",
      status: status || 'active',
      createdBy: req.user?._id,
      updatedBy: req.user?._id
    });

    const saved = await blog.save();
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
};

// List Blogs
exports.getBlogs = async (req, res, next) => {
  try {
    const workspaceId = req.workspaceId;
    const blogs = await Blog.find({ workspaceId, isDeleted: false }).sort({ updatedAt: -1 });

    const data = await Promise.all(blogs.map(async (blog) => {
      const postsCount = await BlogPost.countDocuments({ blogId: blog._id, isDeleted: false });
      
      // Calculate unique categories count
      const categoriesResult = await BlogPost.aggregate([
        { $match: { blogId: blog._id, isDeleted: false } },
        { $unwind: '$categories' },
        { $group: { _id: '$categories' } },
        { $count: 'count' }
      ]);
      const categoriesCount = categoriesResult.length > 0 ? categoriesResult[0].count : 0;

      return {
        ...blog.toObject(),
        posts: postsCount,
        categories: categoriesCount,
        assignedTo: blog.websiteId ? 'Linked Website' : (blog.storeId ? 'Linked Store' : 'Any site / store'),
        publicUrl: `/blog/${blog.slug}`
      };
    }));

    res.json({ success: true, data: data });
  } catch (error) {
    next(error);
  }
};

// Get Blog Details + Posts
exports.getBlogDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findOne({ _id: id, workspaceId: req.workspaceId, isDeleted: false });
    if (!blog) {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }

    const posts = await BlogPost.find({ blogId: id, isDeleted: false }).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: {
        ...blog.toObject(),
        posts
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update Blog Settings
exports.updateBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, website, webstore, status, postsPerPage } = req.body;

    const blog = await Blog.findOne({ _id: id, workspaceId: req.workspaceId, isDeleted: false });
    if (!blog) {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }

    if (name) blog.name = name;
    if (website !== undefined) blog.websiteId = website && website !== '—' ? website : null;
    if (webstore !== undefined) blog.storeId = webstore && webstore !== '—' ? webstore : null;
    if (status) blog.status = status;
    if (postsPerPage !== undefined) blog.postsPerPage = Number(postsPerPage);
    blog.updatedBy = req.user?._id;

    const saved = await blog.save();
    res.json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
};

// Delete Blog
exports.deleteBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findOne({ _id: id, workspaceId: req.workspaceId, isDeleted: false });
    if (!blog) {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }

    blog.isDeleted = true;
    blog.updatedBy = req.user?._id;
    await blog.save();

    res.json({ success: true, message: 'Blog deleted' });
  } catch (error) {
    next(error);
  }
};

// Blog Posts CRUD
exports.getPosts = async (req, res, next) => {
  try {
    const { blogId } = req.params;
    const posts = await BlogPost.find({ blogId, isDeleted: false }).sort({ createdAt: -1 });
    res.json({ success: true, data: posts });
  } catch (error) {
    next(error);
  }
};

exports.addPost = async (req, res, next) => {
  try {
    const { blogId } = req.params;
    const { title, content, status, categories } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Post title is required' });
    }

    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const slugExists = await BlogPost.findOne({ blogId, slug, isDeleted: false });
    if (slugExists) {
      return res.status(400).json({ success: false, error: 'A post with that slug already exists in this blog' });
    }

    const post = new BlogPost({
      blogId,
      title,
      slug,
      content: content || "",
      status: status || 'draft',
      categories: categories || []
    });

    const saved = await post.save();
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
};

exports.updatePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { title, content, status, categories } = req.body;

    const post = await BlogPost.findOne({ _id: postId, isDeleted: false });
    if (!post) {
      return res.status(404).json({ success: false, error: 'Blog post not found' });
    }

    if (title) {
      post.title = title;
      post.slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }
    if (content !== undefined) post.content = content;
    if (status) post.status = status;
    if (categories) post.categories = categories;

    const saved = await post.save();
    res.json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const post = await BlogPost.findOne({ _id: postId, isDeleted: false });
    if (!post) {
      return res.status(404).json({ success: false, error: 'Blog post not found' });
    }

    post.isDeleted = true;
    await post.save();
    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    next(error);
  }
};
