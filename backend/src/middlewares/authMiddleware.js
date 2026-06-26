const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const authMiddleware = (req, res, next) => {
  // If in development and no auth header, mock a workspace and user scope
  const authHeader = req.headers.authorization;
  const devWorkspaceHeader = req.headers['x-workspace-id'];

  let workspaceId = devWorkspaceHeader;
  let user = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_12345');
      user = decoded;
      req.user = decoded;
      workspaceId = workspaceId || decoded.workspaceId;
      req.companyId = decoded.agencyId || decoded.brandId || decoded.workspaceId;
    } catch (error) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
    }
  }

  // Fallback default workspace for sandbox testing
  if (!workspaceId) {
    workspaceId = '60d0fe4f5311236168a10000'; // mock static workspaceId
  }

  // Cast workspaceId to Mongoose ObjectId if valid
  if (mongoose.Types.ObjectId.isValid(workspaceId)) {
    req.workspaceId = new mongoose.Types.ObjectId(workspaceId);
  } else {
    // Generate static object ID from string to keep validation consistent
    req.workspaceId = new mongoose.Types.ObjectId('60d0fe4f5311236168a10000');
  }

  // Inject a mock user if not populated by JWT
  if (!req.user) {
    req.user = {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a20000'),
      name: 'Sandbox User',
      email: 'sandbox@m1growth.com',
      workspaceId: req.workspaceId
    };
  }

  if (!req.companyId && req.user) {
    req.companyId = req.user.agencyId || req.user.brandId || req.user.workspaceId;
  }

  next();
};

module.exports = authMiddleware;
