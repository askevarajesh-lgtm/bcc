const Blog = require('./blog.model');
const BlogPost = require('./blog-post.model');
const BlogCategory = require('./blog-category.model');

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
    const { websiteId } = req.query;

    const query = { workspaceId, isDeleted: false };
    if (websiteId) {
      query.websiteId = websiteId;
    }

    const blogs = await Blog.find(query).sort({ updatedAt: -1 });

    const data = await Promise.all(blogs.map(async (blog) => {
      const postsCount = await BlogPost.countDocuments({ blogId: blog._id, isDeleted: false });
      
      // Calculate categories count
      const categoriesCount = await BlogCategory.countDocuments({ blogId: blog._id, isDeleted: false });

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

// Get Public Blog Details + Posts
exports.getPublicBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findOne({ _id: id, isDeleted: false, status: 'active' });
    if (!blog) {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }

    const posts = await BlogPost.find({ blogId: id, isDeleted: false, status: 'published' }).sort({ createdAt: -1 });
    const postsWithCategoryNames = await resolvePostCategoryNames(id, posts);
    res.json({
      success: true,
      data: {
        ...blog.toObject(),
        posts: postsWithCategoryNames
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get Public Blog Details + Posts by Slug
exports.getPublicBlogBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOne({ slug, isDeleted: false, status: 'active' });
    if (!blog) {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }

    const posts = await BlogPost.find({ blogId: blog._id, isDeleted: false, status: 'published' }).sort({ createdAt: -1 });
    const postsWithCategoryNames = await resolvePostCategoryNames(blog._id, posts);
    res.json({
      success: true,
      data: {
        ...blog.toObject(),
        posts: postsWithCategoryNames
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper: replace stored category id strings with their display names for public responses
async function resolvePostCategoryNames(blogId, posts) {
  const categoryDocs = await BlogCategory.find({ blogId, isDeleted: false });
  const idToName = new Map(categoryDocs.map(cat => [String(cat._id), cat.name]));

  return posts.map(post => {
    const plain = post.toObject();
    plain.categories = (plain.categories || []).map(catIdOrName => idToName.get(String(catIdOrName)) || catIdOrName);
    return plain;
  });
}

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
    const { title, content, status, categories, websiteId, storeId, excerpt, metaTitle, metaDescription, isFeatured, featuredImageUrl, faqs, html, css, layoutJson } = req.body;

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
      categories: categories || [],
      websiteId: websiteId && websiteId !== '—' ? websiteId : null,
      storeId: storeId && storeId !== '—' ? storeId : null,
      excerpt: excerpt || "",
      featuredImageUrl: featuredImageUrl || "",
      faqs: Array.isArray(faqs) ? faqs : [],
      metaTitle: metaTitle || "",
      metaDescription: metaDescription || "",
      isFeatured: !!isFeatured,
      html: html || "",
      css: css || "",
      layoutJson: layoutJson || {}
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
    const { title, content, status, categories, websiteId, storeId, excerpt, metaTitle, metaDescription, isFeatured, featuredImageUrl, faqs, html, css, layoutJson } = req.body;

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
    if (websiteId !== undefined) post.websiteId = websiteId && websiteId !== '—' ? websiteId : null;
    if (storeId !== undefined) post.storeId = storeId && storeId !== '—' ? storeId : null;
    if (excerpt !== undefined) post.excerpt = excerpt;
    if (featuredImageUrl !== undefined) post.featuredImageUrl = featuredImageUrl;
    if (faqs !== undefined) post.faqs = Array.isArray(faqs) ? faqs : [];
    if (metaTitle !== undefined) post.metaTitle = metaTitle;
    if (metaDescription !== undefined) post.metaDescription = metaDescription;
    if (isFeatured !== undefined) post.isFeatured = isFeatured;
    if (html !== undefined) post.html = html;
    if (css !== undefined) post.css = css;
    if (layoutJson !== undefined) post.layoutJson = layoutJson;

    const saved = await post.save();
    res.json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
};

// Get single Blog Post details (with parent blog context) — used by the GrapesJS builder
exports.getPostDetails = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const post = await BlogPost.findOne({ _id: postId, isDeleted: false });
    if (!post) {
      return res.status(404).json({ success: false, error: 'Blog post not found' });
    }

    const blog = await Blog.findOne({ _id: post.blogId, workspaceId: req.workspaceId, isDeleted: false });
    if (!blog) {
      return res.status(404).json({ success: false, error: 'Parent blog not found' });
    }

    res.json({
      success: true,
      data: {
        ...post.toObject(),
        blog: blog.toObject()
      }
    });
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

// Categories CRUD
exports.getCategories = async (req, res, next) => {
  try {
    const { blogId } = req.params;
    const categories = await BlogCategory.find({ blogId, isDeleted: false }).sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

exports.addCategory = async (req, res, next) => {
  try {
    const { blogId } = req.params;
    const { name, slug: customSlug, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Category name is required' });
    }

    const slug = customSlug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const slugExists = await BlogCategory.findOne({ blogId, slug, isDeleted: false });
    if (slugExists) {
      return res.status(400).json({ success: false, error: 'A category with that slug already exists' });
    }

    const category = new BlogCategory({
      blogId,
      name,
      slug,
      description: description || ""
    });

    const saved = await category.save();
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { name, slug: customSlug, description } = req.body;

    const category = await BlogCategory.findOne({ _id: categoryId, isDeleted: false });
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    if (name) category.name = name;
    if (customSlug) category.slug = customSlug;
    if (description !== undefined) category.description = description;

    const saved = await category.save();
    res.json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const category = await BlogCategory.findOne({ _id: categoryId, isDeleted: false });
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    category.isDeleted = true;
    await category.save();
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
};