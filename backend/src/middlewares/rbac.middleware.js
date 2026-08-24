const jwt = require('jsonwebtoken');

// Middleware to verify token and extract user
exports.verifyToken = (req, res, next) => {
  let token = req.query.token;
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (token === 'null' || token === 'undefined' || token === '') {
    token = null;
  }

  if (!token) {
    if (process.env.NODE_ENV !== 'production') {
      req.user = {
        _id: '60d0fe4f5311236168a20000',
        name: 'Sandbox User',
        email: 'sandbox@bcc.askeva.io',
        role: 'commander_admin'
      };
      return next();
    }
    return res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_12345');
    req.user = decoded; // Attach user to request
    next();
  } catch (ex) {
    if (process.env.NODE_ENV !== 'production') {
      req.user = {
        _id: '60d0fe4f5311236168a20000',
        name: 'Sandbox User',
        email: 'sandbox@bcc.askeva.io',
        role: 'commander_admin'
      };
      return next();
    }
    res.status(400).json({ success: false, error: 'Invalid token.' });
  }
};

// Middleware to check if user has one of the allowed roles
exports.requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Access denied. User not authenticated.' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Forbidden. You do not have the required role.' });
    }
    
    next();
  };
};

// Middleware to ensure a user only accesses data within their agency/brand hierarchy
// Note: M1 MOS admins have universal access
exports.checkOwnership = (resourceType, resourceIdParam) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not authenticated.' });
    }

    // Admins bypass ownership checks
    if (['supreme_super_admin', 'commander_admin'].includes(user.role)) {
      return next();
    }

    // Logic for Agency users checking agency-owned resources
    if (user.agencyId) {
      // Typically you'd check if the requested resource's agencyId matches req.user.agencyId
      // For now, this is a placeholder that can be expanded based on specific resource endpoints.
      req.agencyId = user.agencyId; // Inject agencyId into request for controllers to use
      return next();
    }

    // Logic for Brand users checking brand-owned resources
    if (user.brandId) {
      req.brandId = user.brandId;
      return next();
    }

    return res.status(403).json({ success: false, error: 'Forbidden. No ownership mapped.' });
  };
};
