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
    const scopes = ['pages_show_list', 'pages_read_engagement', 'pages_manage_metadata', 'pages_manage_ads', 'leads_retrieval', 'ads_read', 'business_management', 'pages_read_user_content'].join(',');
    
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
      return res.status(200).json({ success: true, data: { isConnected: false, integrations: [] } });
    }

    const { accessToken } = integration.config;
    
    // Fetch pages
    let activePages = [];
    try {
      const pagesRes = await axios.get(`https://graph.facebook.com/v18.0/me/accounts`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,access_token',
          limit: 100
        }
      });
      activePages = pagesRes.data.data || [];
    } catch (err) {
      console.error('Error fetching /me/accounts, continuing with manual pages:', err.message);
    }
    const disconnectedPages = integration.config.disconnectedPages || [];
    const manualPages = integration.config.pages || [];

    // Combine activePages from Graph API with manualPages
    const allPages = [...activePages];
    
    manualPages.forEach(mp => {
      if (!allPages.find(p => p.id === mp.pageId)) {
        allPages.push({ id: mp.pageId, name: mp.pageName });
      }
    });

    const integrations = allPages
      .filter(p => !disconnectedPages.includes(p.id))
      .map(p => ({
        pageId: p.id,
        pageName: p.name,
        integrationStatus: 'active',
        lastSyncAt: new Date()
      }));

    res.status(200).json({
      success: true,
      data: { isConnected: true, integrations }
    });
  } catch (error) {
    console.error('Fetch Facebook Pages Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Error fetching integrations" });
  }
};

exports.subscribePage = async (req, res, next) => {
  try {
    const companyId = req.companyId || (req.user && (req.user.agencyId || req.user.workspaceId || req.user.agency));
    const { pageId } = req.body;
    
    if (!pageId) return res.status(400).json({ success: false, message: 'pageId is required' });

    const integration = await Integration.findOne({ companyId, type: 'facebook_leads', isActive: true });
    if (!integration || !integration.config || !integration.config.accessToken) {
      return res.status(404).json({ success: false, message: 'Facebook integration not found' });
    }

    const { accessToken } = integration.config;
    
    // Get page access token
    let pageAccessToken = null;
    const manualPage = (integration.config.pages || []).find(p => p.pageId === pageId);
    
    if (manualPage && manualPage.accessToken && manualPage.accessToken !== accessToken) {
      pageAccessToken = manualPage.accessToken;
    } else {
      try {
        const pageRes = await axios.get(`https://graph.facebook.com/v18.0/${pageId}`, {
          params: { access_token: accessToken, fields: 'id,access_token' }
        });
        if (pageRes.data && pageRes.data.access_token) {
          pageAccessToken = pageRes.data.access_token;
        }
      } catch (e) {
        console.error('Error fetching page access token', e.message);
      }
    }
    
    if (!pageAccessToken) {
      return res.status(403).json({ success: false, message: 'Could not find page access token for the given page' });
    }

    // Subscribe page to webhook
    const subscribeRes = await axios.post(
      `https://graph.facebook.com/v18.0/${pageId}/subscribed_apps`,
      null,
      {
        params: {
          access_token: pageAccessToken,
          subscribed_fields: 'leadgen'
        }
      }
    );

    if (subscribeRes.data.success) {
      res.status(200).json({ success: true, message: 'Subscribed successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Failed to subscribe page', data: subscribeRes.data });
    }
  } catch (error) {
    console.error('Subscribe Page Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Failed to subscribe page', error: error.response?.data || error.message });
  }
};

exports.unsubscribePage = async (req, res, next) => {
  try {
    const companyId = req.companyId || (req.user && (req.user.agencyId || req.user.workspaceId || req.user.agency));
    const { pageId } = req.body;
    
    if (!pageId) return res.status(400).json({ success: false, message: 'pageId is required' });

    const integration = await Integration.findOne({ companyId, type: 'facebook_leads', isActive: true });
    if (!integration || !integration.config || !integration.config.accessToken) {
      return res.status(404).json({ success: false, message: 'Facebook integration not found' });
    }

    const { accessToken } = integration.config;
    
    let pageAccessToken = null;
    try {
      const pageRes = await axios.get(`https://graph.facebook.com/v18.0/${pageId}`, {
        params: { access_token: accessToken, fields: 'id,access_token' }
      });
      if (pageRes.data && pageRes.data.access_token) {
        pageAccessToken = pageRes.data.access_token;
      }
    } catch (e) {
      console.error('Error fetching page access token', e.message);
    }
    
    if (!pageAccessToken) {
      return res.status(403).json({ success: false, message: 'Could not find page access token for the given page' });
    }

    // Unsubscribe page
    await axios.delete(
      `https://graph.facebook.com/v18.0/${pageId}/subscribed_apps`,
      {
        params: { access_token: pageAccessToken }
      }
    );

    res.status(200).json({ success: true, message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Unsubscribe Page Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Failed to unsubscribe page', error: error.response?.data || error.message });
  }
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
  try {
    const companyId = req.companyId || (req.user && (req.user.agencyId || req.user.workspaceId || req.user.agency));
    const { pageId } = req.params;

    if (!pageId) {
      return res.status(400).json({ success: false, message: 'pageId is required' });
    }

    const Lead = require('../leads/lead.model');
    
    const leads = await Lead.find({ 
      companyId, 
      source: 'Facebook Lead Ads', 
      'customData.pageId': pageId 
    }).sort({ createdAt: -1 }).limit(50);

    const logs = leads.map(lead => ({
      status: 'success',
      message: `Successfully imported lead from Facebook Lead Ads`,
      leadgenId: lead.customData?.leadgenId || 'N/A',
      formName: lead.customData?.formName || 'Unknown Form',
      timestamp: lead.createdAt
    }));

    res.status(200).json({ success: true, data: { logs } });
  } catch (error) {
    console.error('Get Facebook Logs Error:', error);
    next(error);
  }
};

exports.syncLeads = async (req, res, next) => {
  try {
    const companyId = req.companyId || (req.user && (req.user.agencyId || req.user.workspaceId || req.user.agency));
    const { pageId, formIds } = req.body;
    
    if (!pageId) {
      return res.status(400).json({ success: false, message: 'pageId is required to sync leads' });
    }

    const integration = await Integration.findOne({ companyId, type: 'facebook_leads', isActive: true });
    if (!integration || !integration.config || !integration.config.accessToken) {
      return res.status(404).json({ success: false, message: 'Facebook integration not found or disconnected' });
    }

    const { accessToken } = integration.config;
    let targetAccessToken = accessToken;
    const manualPage = (integration.config.pages || []).find(p => p.pageId === pageId);
    let clientId = manualPage ? manualPage.clientId : null;

    if (manualPage && manualPage.accessToken && manualPage.accessToken !== accessToken) {
      targetAccessToken = manualPage.accessToken;
    } else if (pageId) {
      try {
        const pageRes = await axios.get(`https://graph.facebook.com/v18.0/${pageId}`, {
          params: { access_token: accessToken, fields: 'id,access_token' }
        });
        if (pageRes.data && pageRes.data.access_token) {
          targetAccessToken = pageRes.data.access_token;
        }
      } catch (err) {
        console.error('Error fetching page access token, falling back to user token', err.message);
      }
    }

    let forms = [];
    if (pageId) {
      try {
        const formsRes = await axios.get(`https://graph.facebook.com/v18.0/${pageId}/leadgen_forms`, {
          params: { access_token: targetAccessToken, limit: 100, fields: 'id,name' }
        });
        if (formsRes.data && formsRes.data.data) {
          forms = formsRes.data.data;
        }
      } catch (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to fetch forms for the page', 
          meta: { error: err.response?.data || err.message } 
        });
      }
    }

    if (formIds && Array.isArray(formIds) && formIds.length > 0) {
      forms = forms.filter(f => formIds.includes(f.id));
    }

    const Lead = require('../leads/lead.model');
    let formResults = [];
    let totalSynced = 0;
    let totalDuplicates = 0;

    for (const form of forms) {
      try {
        let hasNextPage = true;
        let url = `https://graph.facebook.com/v18.0/${form.id}/leads`;
        let leadsParams = { 
          access_token: targetAccessToken, 
          fields: 'id,created_time,ad_id,form_id,field_data,adset_id,campaign_id',
          limit: 500 
        };
        
        let syncedCount = 0;
        let duplicateCount = 0;

        while (hasNextPage) {
          const leadsRes = await axios.get(url, { params: leadsParams });
          
          if (leadsRes.data && leadsRes.data.data) {
            if (leadsRes.data.data.length === 0) {
              console.log(`No leads returned for form ${form.id} in this page`);
            } else {
              console.log(`Found ${leadsRes.data.data.length} leads for form ${form.id}`);
            }
            
            for (const fbLead of leadsRes.data.data) {
              const leadgenId = fbLead.id;
              
              const existing = await Lead.findOne({ 
                companyId, 
                'customData.leadgenId': leadgenId 
              });
              
              if (existing) {
                if (clientId && !existing.clientId) {
                  existing.clientId = clientId;
                  existing.isClientLead = true;
                  await existing.save();
                }
                duplicateCount++;
                continue;
              }
              
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
                clientId: clientId || null,
                isClientLead: !!clientId,
                createdBy: req.user ? req.user._id : null,
                fullName: fullName || 'Unknown',
                email,
                phoneNumber,
                companyName,
                source: 'Facebook Lead Ads',
                status: 'new',
                customData: {
                  leadgenId,
                  formId: form.id,
                  formName: form.name || 'Unknown Form',
                  pageId: pageId,
                  adId: fbLead.ad_id,
                  adSetId: fbLead.adset_id,
                  campaignId: fbLead.campaign_id,
                  createdTime: fbLead.created_time
                },
                activityLogs: [{ message: 'Imported from Facebook Lead Ads' }]
              });
              
              syncedCount++;
            }
            
            if (leadsRes.data.paging && leadsRes.data.paging.next) {
              url = leadsRes.data.paging.next;
              leadsParams = {}; // next url already contains tokens and params
            } else {
              hasNextPage = false;
            }
          } else {
            hasNextPage = false;
          }
        }
        
        formResults.push({
          formId: form.id,
          formName: form.name || 'Unknown Form',
          status: 'success',
          syncedCount,
          duplicateCount
        });
        totalSynced += syncedCount;
        totalDuplicates += duplicateCount;
        
      } catch (formLeadsErr) {
        formResults.push({
          formId: form.id,
          status: 'error',
          error: formLeadsErr.response?.data || formLeadsErr.message
        });
      }
    }
    
    // If we were syncing specific forms and they all failed, return a 400 error
    if (formIds && formIds.length > 0 && formResults.length > 0 && formResults.every(r => r.status === 'error')) {
      return res.status(400).json({
        success: false,
        message: 'Failed to retrieve leads',
        meta: {
          formIds,
          errors: formResults.map(r => r.error)
        }
      });
    }
    
    res.status(200).json({ 
      success: true, 
      data: { 
        syncedCount: totalSynced, 
        duplicateCount: totalDuplicates,
        forms: formResults
      } 
    });
  } catch (error) {
    console.error('Sync Leads Error:', error);
    next(error);
  }
};

// Asset Discovery Endpoints
exports.getAdAccounts = async (req, res, next) => {
  try {
    const companyId = req.companyId || (req.user && (req.user.agencyId || req.user.workspaceId || req.user.agency));
    const integration = await Integration.findOne({ companyId, type: 'facebook_leads', isActive: true });
    if (!integration) return res.status(404).json({ success: false, message: 'Integration not found' });

    const accountsRes = await axios.get(`https://graph.facebook.com/v18.0/me/adaccounts`, {
      params: { access_token: integration.config.accessToken, fields: 'id,name,account_id', limit: 100 }
    });
    res.status(200).json({ success: true, data: accountsRes.data.data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch Ad Accounts', error: error.response?.data });
  }
};

exports.getCampaigns = async (req, res, next) => {
  try {
    const companyId = req.companyId || (req.user && (req.user.agencyId || req.user.workspaceId || req.user.agency));
    const { adAccountId } = req.query;
    if (!adAccountId) return res.status(400).json({ success: false, message: 'adAccountId is required' });
    
    const integration = await Integration.findOne({ companyId, type: 'facebook_leads', isActive: true });
    if (!integration) return res.status(404).json({ success: false, message: 'Integration not found' });

    const campaignsRes = await axios.get(`https://graph.facebook.com/v18.0/${adAccountId}/campaigns`, {
      params: { access_token: integration.config.accessToken, fields: 'id,name,status', limit: 100 }
    });
    res.status(200).json({ success: true, data: campaignsRes.data.data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch Campaigns', error: error.response?.data });
  }
};

exports.getAdSets = async (req, res, next) => {
  try {
    const companyId = req.companyId || (req.user && (req.user.agencyId || req.user.workspaceId || req.user.agency));
    const { campaignId } = req.query;
    if (!campaignId) return res.status(400).json({ success: false, message: 'campaignId is required' });
    
    const integration = await Integration.findOne({ companyId, type: 'facebook_leads', isActive: true });
    if (!integration) return res.status(404).json({ success: false, message: 'Integration not found' });

    const adsetsRes = await axios.get(`https://graph.facebook.com/v18.0/${campaignId}/adsets`, {
      params: { access_token: integration.config.accessToken, fields: 'id,name,status', limit: 100 }
    });
    res.status(200).json({ success: true, data: adsetsRes.data.data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch Ad Sets', error: error.response?.data });
  }
};

exports.getAds = async (req, res, next) => {
  try {
    const companyId = req.companyId || (req.user && (req.user.agencyId || req.user.workspaceId || req.user.agency));
    const { adSetId } = req.query;
    if (!adSetId) return res.status(400).json({ success: false, message: 'adSetId is required' });
    
    const integration = await Integration.findOne({ companyId, type: 'facebook_leads', isActive: true });
    if (!integration) return res.status(404).json({ success: false, message: 'Integration not found' });

    const adsRes = await axios.get(`https://graph.facebook.com/v18.0/${adSetId}/ads`, {
      params: { access_token: integration.config.accessToken, fields: 'id,name,status', limit: 100 }
    });
    res.status(200).json({ success: true, data: adsRes.data.data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch Ads', error: error.response?.data });
  }
};

exports.getForms = async (req, res, next) => {
  try {
    const companyId = req.companyId || (req.user && (req.user.agencyId || req.user.workspaceId || req.user.agency));
    const { pageId } = req.query;
    if (!pageId) return res.status(400).json({ success: false, message: 'pageId is required' });
    
    const integration = await Integration.findOne({ companyId, type: 'facebook_leads', isActive: true });
    if (!integration) return res.status(404).json({ success: false, message: 'Integration not found' });

    let targetAccessToken = integration.config.accessToken;
    const manualPage = (integration.config.pages || []).find(p => p.pageId === pageId);
    
    if (manualPage && manualPage.accessToken) {
      targetAccessToken = manualPage.accessToken;
    } else {
      try {
        const pageRes = await axios.get(`https://graph.facebook.com/v18.0/${pageId}`, {
          params: { access_token: targetAccessToken, fields: 'id,access_token' }
        });
        if (pageRes.data && pageRes.data.access_token) {
          targetAccessToken = pageRes.data.access_token;
        }
      } catch (e) {
        console.error('Error fetching page access token', e.message);
      }
    }

    const formsRes = await axios.get(`https://graph.facebook.com/v18.0/${pageId}/leadgen_forms`, {
      params: { access_token: targetAccessToken, fields: 'id,name,status', limit: 100 }
    });
    res.status(200).json({ success: true, data: formsRes.data.data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch Lead Forms', error: error.response?.data });
  }
};

// Webhook Handlers
exports.verifyWebhook = (req, res) => {
  const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'bcc_seo_webhook_token_123';
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
};

exports.handleWebhook = async (req, res) => {
  const body = req.body;
  
  if (body.object === 'page') {
    res.status(200).send('EVENT_RECEIVED');
    
    for (const entry of body.entry) {
      const pageId = entry.id;
      for (const change of entry.changes) {
        if (change.field === 'leadgen') {
          const leadgenId = change.value.leadgen_id;
          const formId = change.value.form_id;
          const createdTime = change.value.created_time;
          
          try {
            // Find integration by pageId (pages array is currently empty in our schema upon creation, 
            // but we can search for an active integration which implies this server handles it.
            // A more robust way is to query the page using tokens from all active facebook_leads integrations,
            // or just use the first active one to query graph api and let facebook restrict it based on token)
            
            const integrations = await Integration.find({ type: 'facebook_leads', isActive: true });
            let validIntegration = null;
            let pageAccessToken = null;
            let clientId = null;
            
            for (const intg of integrations) {
              try {
                const manualPage = (intg.config.pages || []).find(p => p.pageId === pageId);
                if (manualPage && manualPage.accessToken) {
                  validIntegration = intg;
                  pageAccessToken = manualPage.accessToken;
                  clientId = manualPage.clientId;
                  break;
                }

                const pageRes = await axios.get(`https://graph.facebook.com/v18.0/${pageId}`, {
                  params: { access_token: intg.config.accessToken, fields: 'id,access_token' }
                });
                if (pageRes.data && pageRes.data.access_token) {
                  validIntegration = intg;
                  pageAccessToken = pageRes.data.access_token;
                  break;
                }
              } catch(e) {}
            }
            
            if (!validIntegration || !pageAccessToken) {
              console.error('Webhook Leadgen: Could not find valid integration or page access token for page', pageId);
              continue;
            }
            
            const Lead = require('../leads/lead.model');
            const companyId = validIntegration.companyId;
            
            const existing = await Lead.findOne({ companyId, 'customData.leadgenId': leadgenId });
            if (existing) {
              console.log('Webhook Leadgen: Duplicate lead skipped', leadgenId);
              continue;
            }
            
            const leadRes = await axios.get(`https://graph.facebook.com/v18.0/${leadgenId}`, {
              params: { access_token: pageAccessToken }
            });
            
            const fbLead = leadRes.data;
            let fullName = 'Facebook Lead (Webhook)';
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
              clientId: clientId || null,
              isClientLead: !!clientId,
              createdBy: validIntegration.companyId, // Or a system user ID
              fullName: fullName || 'Unknown',
              email,
              phoneNumber,
              companyName,
              source: 'Facebook Lead Ads',
              status: 'new',
              customData: {
                leadgenId,
                formId,
                pageId,
                adId: fbLead.ad_id,
                adSetId: fbLead.adset_id,
                campaignId: fbLead.campaign_id,
                createdTime: fbLead.created_time || createdTime
              },
              activityLogs: [{ message: 'Imported from Facebook Webhook' }]
            });
            
            console.log('Webhook Leadgen: Lead successfully created', leadgenId);
            
          } catch (error) {
            console.error('Webhook Leadgen Error:', error.response?.data || error.message);
          }
        }
      }
    }
  } else {
    res.sendStatus(404);
  }
};

exports.connectManualPage = async (req, res, next) => {
  try {
    const companyId = req.companyId || (req.user && (req.user.agencyId || req.user.workspaceId || req.user.agency));
    const { pageId } = req.body;
    
    if (!pageId) return res.status(400).json({ success: false, message: 'pageId is required' });

    const integration = await Integration.findOne({ companyId, type: 'facebook_leads', isActive: true });
    if (!integration || !integration.config || !integration.config.accessToken) {
      return res.status(404).json({ success: false, message: 'Facebook integration not found' });
    }

    const { accessToken } = integration.config;
    
    // Verify the page ID with the user's token
    const manualPageRes = await axios.get(`https://graph.facebook.com/v18.0/${pageId}`, {
      params: {
        access_token: accessToken,
        fields: 'id,name,access_token'
      }
    });

    const page = manualPageRes.data;
    if (!page || !page.id) {
      return res.status(400).json({ success: false, message: 'Invalid Page ID or missing permissions' });
    }

    const pageAccessToken = page.access_token || accessToken;

    // Subscribe to webhooks automatically
    try {
      await axios.post(
        `https://graph.facebook.com/v18.0/${page.id}/subscribed_apps`,
        null,
        {
          params: {
            access_token: pageAccessToken,
            subscribed_fields: 'leadgen'
          }
        }
      );
    } catch (subErr) {
      console.error('Failed to automatically subscribe page to leadgen webhook:', subErr.response?.data || subErr.message);
    }

    // Add to config.pages
    const pages = integration.config.pages || [];
    const exists = pages.find(p => p.pageId === page.id);
    if (!exists) {
      pages.push({
        pageId: page.id,
        pageName: page.name,
        accessToken: pageAccessToken,
        clientId: req.body.clientId || null,
        addedAt: new Date()
      });
      await Integration.findByIdAndUpdate(integration._id, {
        $set: { 'config.pages': pages }
      });
    }

    res.status(200).json({ success: true, message: 'Page connected successfully', data: page });
  } catch (error) {
    console.error('Connect Manual Page Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Failed to connect page', error: error.response?.data || error.message });
  }
};
