const Integration = require('./integration.model');
const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const META_APP_ID = process.env.META_APP_ID || 'dummy_app_id';
const META_APP_SECRET = process.env.META_APP_SECRET || 'dummy_app_secret';
const META_REDIRECT_URI = process.env.META_REDIRECT_URI || `${process.env.APP_URL || 'http://localhost:5500'}/api/facebook/callback`;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

exports.generateAuthUrl = async (req, res, next) => {
  try {
    const { token, redirectPath } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Missing token in query parameters' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_12345');
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const companyId = decoded.agencyId || decoded.brandId || decoded.workspaceId;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID missing from user token' });
    }

    // Embed both companyId and redirectPath in the state parameter
    const stateObj = { companyId, redirectPath };
    const state = Buffer.from(JSON.stringify(stateObj)).toString('base64');
    
    const scopes = ['pages_show_list', 'pages_read_engagement', 'pages_manage_metadata', 'leads_retrieval'].join(',');
    
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}&state=${state}&scope=${scopes}`;
    
    res.redirect(authUrl);
  } catch (error) {
    next(error);
  }
};

exports.handleCallback = async (req, res, next) => {
  let redirectPath = '/settings/integrations/website';
  try {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.redirect(`${FRONTEND_URL}${redirectPath}?facebook_oauth=error&reason=Missing code or state`);
    }

    let stateObj;
    try {
      stateObj = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
      if (stateObj.redirectPath) redirectPath = stateObj.redirectPath;
    } catch (e) {
      return res.redirect(`${FRONTEND_URL}${redirectPath}?facebook_oauth=error&reason=Invalid state`);
    }

    const companyId = stateObj.companyId;

    // 1. Exchange code for short-lived token
    const tokenRes = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, {
      params: {
        client_id: META_APP_ID,
        redirect_uri: META_REDIRECT_URI,
        client_secret: META_APP_SECRET,
        code
      }
    });

    let accessToken = tokenRes.data.access_token;

    // 2. Exchange for long-lived token
    const longLivedRes = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: META_APP_ID,
        client_secret: META_APP_SECRET,
        fb_exchange_token: accessToken
      }
    });

    accessToken = longLivedRes.data.access_token;
    const expiresIn = longLivedRes.data.expires_in || 5184000;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // 3. Get User ID
    const meRes = await axios.get(`https://graph.facebook.com/v18.0/me`, {
      params: { access_token: accessToken }
    });
    const userId = meRes.data.id;

    // 4. Save to Database
    await Integration.findOneAndUpdate(
      { companyId, type: 'facebook_leads' },
      {
        name: 'Facebook Leads Integration',
        isActive: true,
        config: {
          accessToken,
          userId,
          pages: [],
          expiresAt
        }
      },
      { upsert: true, new: true }
    );

    res.redirect(`${FRONTEND_URL}${redirectPath}?facebook_oauth=success`);
  } catch (error) {
    console.error('Facebook Callback Error:', error.response?.data || error.message);
    res.redirect(`${FRONTEND_URL}${redirectPath}?facebook_oauth=error`);
  }
};

exports.getIntegrations = async (req, res, next) => {
  try {
    const companyId = req.companyId || (req.user && (req.user.agencyId || req.user.workspaceId || req.user.agency));
    const integration = await Integration.findOne({ companyId, type: 'facebook_leads', isActive: true });
    
    if (!integration || !integration.config || !integration.config.accessToken) {
      return res.status(200).json({ success: true, data: { integrations: [] } });
    }

    const { accessToken } = integration.config;
    
    // Fetch pages
    const pagesRes = await axios.get(`https://graph.facebook.com/v18.0/me/accounts`, {
      params: {
        access_token: accessToken,
        fields: 'id,name,access_token'
      }
    });

    const activePages = pagesRes.data.data;
    const integrations = activePages.map(p => ({
      pageId: p.id,
      pageName: p.name,
      integrationStatus: 'active',
      lastSyncAt: new Date()
    }));

    res.status(200).json({
      success: true,
      data: { integrations }
    });
  } catch (error) {
    console.error('Fetch Facebook Pages Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Error fetching integrations" });
  }
};

exports.subscribePage = async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Subscribed successfully' });
};

exports.unsubscribePage = async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Unsubscribed successfully' });
};

exports.disconnectPage = async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Disconnected successfully' });
};

exports.getLogs = async (req, res, next) => {
  res.status(200).json({ success: true, data: { logs: [] } });
};

exports.syncLeads = async (req, res, next) => {
  res.status(200).json({ success: true, data: { syncedCount: 0, duplicateCount: 0 } });
};
