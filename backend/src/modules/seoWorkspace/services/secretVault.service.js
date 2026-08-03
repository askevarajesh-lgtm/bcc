const WorkspaceCredential = require('../models/workspaceCredential.model');
const WorkspaceAuditLog = require('../models/workspaceAuditLog.model');
const axios = require('axios');

class SecretVaultService {
  /**
   * Store or update a secret credential
   */
  async storeCredential(projectId, { name, provider, authType, credentials, rotationIntervalDays, metadata, userId, reqIp }) {
    let cred = await WorkspaceCredential.findOne({ projectId, name });
    const isNew = !cred;

    if (!cred) {
      cred = new WorkspaceCredential({
        projectId,
        name,
        provider,
        authType: authType || 'api_key',
        createdBy: userId,
        rotationIntervalDays: Number(rotationIntervalDays) || 0,
        metadata: metadata || {}
      });
    } else {
      cred.provider = provider || cred.provider;
      cred.authType = authType || cred.authType;
      cred.rotationIntervalDays = rotationIntervalDays !== undefined ? Number(rotationIntervalDays) : cred.rotationIntervalDays;
      cred.metadata = { ...cred.metadata, ...(metadata || {}) };
      cred.lastRotatedAt = new Date();
      cred.status = 'active';
      cred.verificationError = null;
    }

    cred.setCredentials(credentials);
    await cred.save();

    // Audit log
    await this._logAudit(projectId, userId, isNew ? 'CREATE_SECRET' : 'UPDATE_SECRET', {
      credentialId: cred._id,
      name: cred.name,
      provider: cred.provider,
      authType: cred.authType,
      ip: reqIp
    });

    return cred.toSafeObject();
  }

  /**
   * Retrieve decrypted credentials for internal service/node execution
   */
  async getDecryptedCredential(projectId, identifier, userId = null) {
    const query = { projectId };
    if (typeof identifier === 'string' && identifier.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = identifier;
    } else {
      query.name = identifier;
    }

    const cred = await WorkspaceCredential.findOne(query);
    if (!cred) {
      throw new Error(`Credential not found: ${identifier}`);
    }

    if (cred.status === 'revoked' || cred.status === 'expired') {
      throw new Error(`Credential '${cred.name}' is ${cred.status}`);
    }

    // Check expiration
    if (cred.expiresAt && new Date() > cred.expiresAt) {
      cred.status = 'expired';
      await cred.save();
      throw new Error(`Credential '${cred.name}' has expired`);
    }

    // Auto-refresh OAuth if refresh token exists and expired
    const decrypted = cred.getCredentials();
    if (cred.authType === 'oauth2' && decrypted.refreshToken && decrypted.expiresAt && Date.now() > (decrypted.expiresAt - 60000)) {
      await this.refreshOAuthToken(cred, decrypted);
    }

    // Update usage telemetry
    cred.lastUsedAt = new Date();
    cred.usageCount = (cred.usageCount || 0) + 1;
    await cred.save();

    if (userId) {
      await this._logAudit(projectId, userId, 'ACCESS_SECRET', {
        credentialId: cred._id,
        name: cred.name,
        provider: cred.provider
      });
    }

    return cred.getCredentials();
  }

  /**
   * List credentials safely with masked values
   */
  async listCredentials(projectId, { page = 1, limit = 50, provider, status, search }) {
    const filter = { projectId };
    if (provider) filter.provider = provider;
    if (status) filter.status = status;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await WorkspaceCredential.countDocuments(filter);
    const list = await WorkspaceCredential.find(filter)
      .select('-encryptedData')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return {
      items: list,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    };
  }

  /**
   * Delete / Revoke a credential
   */
  async deleteCredential(projectId, credentialId, userId, reqIp) {
    const cred = await WorkspaceCredential.findOneAndDelete({ _id: credentialId, projectId });
    if (!cred) throw new Error('Credential not found');

    await this._logAudit(projectId, userId, 'DELETE_SECRET', {
      credentialId: cred._id,
      name: cred.name,
      provider: cred.provider,
      ip: reqIp
    });

    return { success: true, deletedId: credentialId };
  }

  /**
   * Test / Verify credential connectivity against provider
   */
  async verifyCredential(projectId, credentialId) {
    const cred = await WorkspaceCredential.findOne({ _id: credentialId, projectId });
    if (!cred) throw new Error('Credential not found');

    const data = cred.getCredentials();
    let isValid = false;
    let errorMsg = null;

    try {
      switch (cred.provider) {
        case 'slack': {
          const webhookUrl = data.webhookUrl || data.url;
          if (!webhookUrl) throw new Error('No webhookUrl found');
          isValid = webhookUrl.startsWith('https://hooks.slack.com/');
          break;
        }
        case 'discord': {
          const webhookUrl = data.webhookUrl || data.url;
          if (!webhookUrl) throw new Error('No webhookUrl found');
          isValid = webhookUrl.startsWith('https://discord.com/api/webhooks/');
          break;
        }
        case 'telegram': {
          const botToken = data.botToken || data.apiKey;
          if (!botToken) throw new Error('No botToken found');
          const res = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`, { timeout: 8000 });
          isValid = res.data && res.data.ok;
          break;
        }
        case 'cloudflare': {
          const apiToken = data.apiToken || data.apiKey;
          if (!apiToken) throw new Error('No apiToken found');
          const res = await axios.get('https://api.cloudflare.com/client/v4/user/tokens/verify', {
            headers: { Authorization: `Bearer ${apiToken}` },
            timeout: 8000
          });
          isValid = res.data && res.data.success;
          break;
        }
        case 'github': {
          const token = data.token || data.apiKey;
          if (!token) throw new Error('No GitHub token found');
          const res = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `token ${token}`, 'User-Agent': 'BCC-SEO-Workspace' },
            timeout: 8000
          });
          isValid = res.status === 200;
          break;
        }
        default: {
          isValid = Boolean(data.apiKey || data.token || data.accessToken || data.secret || data.webhookUrl);
          break;
        }
      }
    } catch (err) {
      isValid = false;
      errorMsg = err.response?.data?.message || err.message;
    }

    cred.lastVerifiedAt = new Date();
    cred.status = isValid ? 'active' : 'error';
    cred.verificationError = errorMsg;
    await cred.save();

    return {
      isValid,
      status: cred.status,
      lastVerifiedAt: cred.lastVerifiedAt,
      error: errorMsg
    };
  }

  /**
   * OAuth Token Refresh handler
   */
  async refreshOAuthToken(cred, decryptedData) {
    // Provider specific refresh endpoints
    try {
      if (cred.provider === 'google_search_console' || cred.provider === 'google_analytics_4' || cred.provider === 'google_indexing') {
        const res = await axios.post('https://oauth2.googleapis.com/token', {
          client_id: decryptedData.clientId || process.env.GOOGLE_CLIENT_ID,
          client_secret: decryptedData.clientSecret || process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: decryptedData.refreshToken,
          grant_type: 'refresh_token'
        });

        if (res.data?.access_token) {
          decryptedData.accessToken = res.data.access_token;
          decryptedData.expiresAt = Date.now() + (res.data.expires_in * 1000);
          cred.setCredentials(decryptedData);
          await cred.save();
        }
      }
    } catch (err) {
      console.error(`OAuth refresh failed for credential ${cred._id}:`, err.message);
      cred.status = 'error';
      cred.verificationError = `OAuth Refresh Failed: ${err.message}`;
      await cred.save();
    }
  }

  async _logAudit(projectId, userId, action, details) {
    try {
      await WorkspaceAuditLog.create({
        projectId,
        targetType: 'SecretCredential',
        targetId: details.credentialId || null,
        actor: userId ? { userId } : { system: true },
        action,
        metadata: details
      });
    } catch (e) {
      console.warn('Failed to record secret audit log:', e.message);
    }
  }
}

module.exports = new SecretVaultService();
