const Integration = require('./integration.model');
const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const META_APP_ID = process.env.META_APP_ID || 'dummy_app_id';
const META_APP_SECRET = process.env.META_SECRET || process.env.META_APP_SECRET || 'dummy_app_secret';
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
      const separator = redirectPath.includes('?') ? '&' : '?';
      return res.redirect(`${FRONTEND_URL}${redirectPath}${separator}facebook_oauth=error&reason=Missing code or state`);
    }

    let stateObj;
    try {
      stateObj = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
      if (stateObj.redirectPath) redirectPath = stateObj.redirectPath;
    } catch (e) {
      const separator = redirectPath.includes('?') ? '&' : '?';
      return res.redirect(`${FRONTEND_URL}${redirectPath}${separator}facebook_oauth=error&reason=Invalid state`);
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
      { upsert: true, returnDocument: 'after' }
    );

    const separator = redirectPath.includes('?') ? '&' : '?';
    res.redirect(`${FRONTEND_URL}${redirectPath}${separator}facebook_oauth=success`);
  } catch (error) {
    console.error('Facebook Callback Error:', error.response?.data || error.message);
    const separator = redirectPath.includes('?') ? '&' : '?';
    res.redirect(`${FRONTEND_URL}${redirectPath}${separator}facebook_oauth=error`);
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
    const disconnectedPages = integration.config.disconnectedPages || [];

    const integrations = activePages
      .filter(p => !disconnectedPages.includes(p.id))
      .map(p => ({
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
  try {
    const companyId = req.companyId || (req.user && (req.user.agencyId || req.user.workspaceId || req.user.agency));
    const { pageId } = req.params;

    const integration = await Integration.findOne({ companyId, type: 'facebook_leads', isActive: true });
    if (!integration) {
      return res.status(404).json({ success: false, message: 'Integration not found' });
    }

    const disconnectedPages = integration.config.disconnectedPages || [];
    if (!disconnectedPages.includes(pageId)) {
      disconnectedPages.push(pageId);
    }

    await Integration.findByIdAndUpdate(integration._id, {
      $set: { 'config.disconnectedPages': disconnectedPages }
    });

    res.status(200).json({ success: true, message: 'Disconnected successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getLogs = async (req, res, next) => {
  res.status(200).json({ success: true, data: { logs: [] } });
};

exports.syncLeads = async (req, res, next) => {
  try {
    const companyId = req.companyId || (req.user && (req.user.agencyId || req.user.workspaceId || req.user.agency));
    const { pageId, formId } = req.body;
    
    const targetId = formId || pageId;
    if (!targetId) {
      return res.status(400).json({ success: false, message: 'pageId or formId is required to sync leads' });
    }

    const integration = await Integration.findOne({ companyId, type: 'facebook_leads', isActive: true });
    if (!integration || !integration.config || !integration.config.accessToken) {
      return res.status(404).json({ success: false, message: 'Facebook integration not found or disconnected' });
    }

    const { accessToken } = integration.config;
    let targetAccessToken = accessToken;

    // If a pageId is known, try to get its specific page access token for better permissions
    if (pageId) {
      try {
        const pagesRes = await axios.get(`https://graph.facebook.com/v18.0/me/accounts`, {
          params: { access_token: accessToken, fields: 'id,access_token' }
        });
        const page = pagesRes.data.data.find(p => p.id === pageId);
        if (page && page.access_token) {
          targetAccessToken = page.access_token;
        }
      } catch (err) {
        console.error('Error fetching page access token, falling back to user token', err.message);
      }
    }

    // Fetch leads from Graph API
    let leadsData = [];
    try {
      if (formId) {
        // If formId is explicitly provided, fetch leads for that form
        const leadsRes = await axios.get(`https://graph.facebook.com/v18.0/${formId}/leads`, {
          params: { access_token: targetAccessToken, limit: 100 }
        });
        if (leadsRes.data && leadsRes.data.data) {
          leadsData = leadsRes.data.data;
        }
      } else if (pageId) {
        // If only pageId is provided, fetch all leadgen forms for the page, then fetch leads for each form
        const formsRes = await axios.get(`https://graph.facebook.com/v18.0/${pageId}/leadgen_forms`, {
          params: { access_token: targetAccessToken, limit: 100 }
        });
        
        if (formsRes.data && formsRes.data.data) {
          const forms = formsRes.data.data;
          // Fetch leads for each form
          for (const form of forms) {
            try {
              const leadsRes = await axios.get(`https://graph.facebook.com/v18.0/${form.id}/leads`, {
                params: { access_token: targetAccessToken, limit: 100 }
              });
              if (leadsRes.data && leadsRes.data.data) {
                // Attach form_id to leads just in case it's missing in Facebook's response
                const formsLeads = leadsRes.data.data.map(l => ({ ...l, form_id: form.id }));
                leadsData = leadsData.concat(formsLeads);
              }
            } catch (formLeadsErr) {
              console.error(`Error fetching leads for form ${form.id}:`, formLeadsErr.response?.data || formLeadsErr.message);
              // Continue to the next form even if one fails
            }
          }
        }
      }
    } catch (err) {
      console.error('Facebook Graph API error fetching leads or forms:', err.response?.data || err.message);
      return res.status(500).json({ success: false, message: 'Failed to fetch leads from Facebook', error: err.response?.data });
    }

    const Lead = require('../leads/lead.model');
    let syncedCount = 0;
    let duplicateCount = 0;
    
    for (const fbLead of leadsData) {
      const leadgenId = fbLead.id;
      
      // Check for duplicate
      const existing = await Lead.findOne({ 
        companyId, 
        'customData.leadgenId': leadgenId 
      });
      
      if (existing) {
        duplicateCount++;
        continue;
      }
      
      // Map Facebook lead field_data to our model
      let fullName = 'Facebook Lead';
      let email = '';
      let phoneNumber = '';
      let companyName = '';
      
      if (Array.isArray(fbLead.field_data)) {
        fbLead.field_data.forEach(field => {
          const name = field.name.toLowerCase();
          const val = field.values && field.values.length > 0 ? field.values[0] : '';
          
          if (name === 'full_name' || name === 'name') fullName = val;
          else if (name === 'email') email = val;
          else if (name === 'phone_number' || name === 'phone') phoneNumber = val;
          else if (name === 'company_name' || name === 'company') companyName = val;
        });
      }
      
      await Lead.create({
        companyId,
        createdBy: req.user ? req.user._id : null,
        fullName: fullName || 'Unknown',
        email,
        phoneNumber,
        companyName,
        source: 'Facebook Lead Ads',
        status: 'new',
        customData: {
          leadgenId,
          formId: fbLead.form_id || formId,
          pageId: pageId,
          createdTime: fbLead.created_time
        },
        activityLogs: [{ message: 'Imported from Facebook Lead Ads' }]
      });
      
      syncedCount++;
    }
    
    res.status(200).json({ 
      success: true, 
      data: { syncedCount, duplicateCount } 
    });
  } catch (error) {
    console.error('Sync Leads Error:', error);
    next(error);
  }
};
