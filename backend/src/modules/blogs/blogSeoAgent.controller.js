/**
 * Blog SEO Agent — controller wiring.
 *
 * Thin pass-through to `seoWorkspace/services/blogSeoAgent.service.js` (own
 * prompt, own execution history, own logs, retry, human approval, shared
 * memory integration — see that file's header). No UI consumes these
 * endpoints yet, same "route exists, nothing renders it" pattern already
 * established for `websiteSeoAgent.controller.js` and the other agents in
 * `seoWorkspace.controller.js`.
 *
 * Reuses the same tenant-scoping shape `blog.controller.js#getPostDetails`
 * already applies (look up the post, then confirm its parent Blog belongs
 * to `req.workspaceId`) rather than writing a second auth check.
 */
const Blog = require('./blog.model');
const BlogPost = require('./blog-post.model');
const blogSeoAgent = require('../seoWorkspace/services/blogSeoAgent.service');

async function loadAuthorizedPost(req) {
  const { blogId, postId } = req.params;

  const blog = await Blog.findOne({ _id: blogId, workspaceId: req.workspaceId, isDeleted: false });
  if (!blog) return { blog: null, post: null };

  const post = await BlogPost.findOne({ _id: postId, blogId, isDeleted: false });
  return { blog, post };
}

exports.runBlogSeoAgent = async (req, res) => {
  try {
    const { blogId, postId } = req.params;
    const { blog, post } = await loadAuthorizedPost(req);
    if (!blog) return res.status(404).json({ success: false, error: 'Blog not found' });
    if (!post) return res.status(404).json({ success: false, error: 'Blog post not found' });

    const workspaceId = req.workspaceId;
    const result = await blogSeoAgent.run(postId, blogId, workspaceId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[runBlogSeoAgent] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.approveBlogSeoFindings = async (req, res) => {
  try {
    const { postId, runId } = req.params;
    const { blog, post } = await loadAuthorizedPost(req);
    if (!blog) return res.status(404).json({ success: false, error: 'Blog not found' });
    if (!post) return res.status(404).json({ success: false, error: 'Blog post not found' });

    const result = await blogSeoAgent.approveFindings(runId, postId, req.user._id);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[approveBlogSeoFindings] Error:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.rejectBlogSeoFindings = async (req, res) => {
  try {
    const { postId, runId } = req.params;
    const { reason } = req.body;
    const { blog, post } = await loadAuthorizedPost(req);
    if (!blog) return res.status(404).json({ success: false, error: 'Blog not found' });
    if (!post) return res.status(404).json({ success: false, error: 'Blog post not found' });

    const result = await blogSeoAgent.rejectFindings(runId, postId, req.user._id, reason);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[rejectBlogSeoFindings] Error:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getBlogSeoExecutionHistory = async (req, res) => {
  try {
    const { postId } = req.params;
    const { blog, post } = await loadAuthorizedPost(req);
    if (!blog) return res.status(404).json({ success: false, error: 'Blog not found' });
    if (!post) return res.status(404).json({ success: false, error: 'Blog post not found' });

    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
    const history = await blogSeoAgent.getExecutionHistory(postId, limit);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[getBlogSeoExecutionHistory] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
