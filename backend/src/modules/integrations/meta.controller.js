const Integration = require('./integration.model');
const axios = require('axios');
const mongoose = require('mongoose');

const META_APP_ID = process.env.META_APP_ID || 'dummy_app_id';
const META_APP_SECRET = process.env.META_APP_SECRET || 'dummy_app_secret';
const META_REDIRECT_URI = process.env.META_REDIRECT_URI || `${process.env.APP_URL || 'http://localhost:5500'}/api/integrations/meta/callback`;

exports.generateAuthUrl = async (req, res, next) => {
  try {
    const agencyId = req.companyId || (req.user && (req.user.agencyId || req.user.workspaceId || req.user.agency));
    if (!agencyId) {
      return res.status(400).json({ success: false, message: 'Agency ID missing from user token' });
    }

    const state = agencyId.toString(); // Pass agencyId in state to map callback
    const scopes = ['ads_management', 'ads_read', 'business_management'].join(',');
    
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}&state=${state}&scope=${scopes}`;
    
    res.status(200).json({ success: true, url: authUrl });
  } catch (error) {
    next(error);
  }
};

exports.handleCallback = async (req, res, next) => {
  try {
    const { code, state: agencyId } = req.query;
    
    if (!code || !agencyId) {
      return res.status(400).json({ success: false, message: 'Missing code or state from Meta callback' });
    }

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

    // 2. Exchange for long-lived token (60 days)
    const longLivedRes = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: META_APP_ID,
        client_secret: META_APP_SECRET,
        fb_exchange_token: accessToken
      }
    });

    accessToken = longLivedRes.data.access_token;
    const expiresIn = longLivedRes.data.expires_in || 5184000; // 60 days
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // 3. Get User ID
    const meRes = await axios.get(`https://graph.facebook.com/v18.0/me`, {
      params: { access_token: accessToken }
    });
    const userId = meRes.data.id;

    // 4. Save to Database
    await Integration.findOneAndUpdate(
      { companyId: agencyId, type: 'meta_ads' },
      {
        name: 'Meta Ads Integration',
        isActive: true,
        config: {
          accessToken,
          userId,
          selectedAdAccounts: [],
          expiresAt
        }
      },
      { upsert: true, new: true }
    );

    // Redirect back to frontend settings or performance ads dashboard
    // In production, this should be the frontend URL. For now, redirecting to root or settings
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/agency/settings`);
  } catch (error) {
    console.error('Meta Callback Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Meta Authentication Failed' });
  }
};

exports.getAdAccounts = async (req, res, next) => {
  try {
    const agencyId = req.companyId || (req.user && (req.user.agencyId || req.user.workspaceId || req.user.agency));
    const integration = await Integration.findOne({ companyId: agencyId, type: 'meta_ads', isActive: true });
    
    if (!integration || !integration.config || !integration.config.accessToken) {
      return res.status(404).json({ success: false, message: 'Meta Ads integration not found or disconnected' });
    }

    const { accessToken, userId } = integration.config;
    
    // Fetch Ad Accounts
    const accountsRes = await axios.get(`https://graph.facebook.com/v18.0/${userId}/adaccounts`, {
      params: {
        access_token: accessToken,
        fields: 'id,name,account_status,currency,timezone_name'
      }
    });

    res.status(200).json({
      success: true,
      data: accountsRes.data.data
    });
  } catch (error) {
    console.error('Fetch Ad Accounts Error:', error.response?.data || error.message);
    next(error);
  }
};

exports.saveSelectedAdAccounts = async (req, res, next) => {
  try {
    const agencyId = req.companyId || (req.user && (req.user.agencyId || req.user.workspaceId || req.user.agency));
    const { selectedAdAccounts } = req.body; // array of { id, name }

    if (!Array.isArray(selectedAdAccounts)) {
      return res.status(400).json({ success: false, message: 'selectedAdAccounts must be an array' });
    }

    const integration = await Integration.findOne({ companyId: agencyId, type: 'meta_ads' });
    if (!integration) {
      return res.status(404).json({ success: false, message: 'Meta Ads integration not found' });
    }

    integration.config = {
      ...integration.config,
      selectedAdAccounts
    };
    
    await integration.save();

    res.status(200).json({
      success: true,
      message: 'Ad accounts saved successfully',
      data: integration
    });
  } catch (error) {
    next(error);
  }
};
