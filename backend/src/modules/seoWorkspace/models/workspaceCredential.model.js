const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../../../utils/crypto');

const WorkspaceCredentialSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkspaceProject',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  provider: {
    type: String,
    required: true,
    enum: [
      'google_search_console',
      'google_analytics_4',
      'google_indexing',
      'bing_webmaster',
      'google_business_profile',
      'slack',
      'teams',
      'discord',
      'telegram',
      'email_smtp',
      'sendpulse',
      'webhook_hmac',
      'jira',
      'clickup',
      'asana',
      'trello',
      'github',
      'gitlab',
      'cloudflare',
      'aws',
      'azure',
      'gcp',
      'custom_api_key',
      'custom_oauth2',
      'custom_headers'
    ],
    index: true
  },
  authType: {
    type: String,
    required: true,
    enum: ['api_key', 'oauth2', 'bearer_token', 'basic_auth', 'hmac_secret', 'custom_headers'],
    default: 'api_key'
  },
  encryptedData: {
    type: String,
    required: true
  },
  maskedPreview: {
    type: String,
    default: '••••••••'
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'revoked', 'error', 'pending_verification'],
    default: 'active',
    index: true
  },
  lastVerifiedAt: {
    type: Date,
    default: null
  },
  verificationError: {
    type: String,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  lastRotatedAt: {
    type: Date,
    default: Date.now
  },
  rotationIntervalDays: {
    type: Number,
    default: 0 // 0 means manual rotation
  },
  lastUsedAt: {
    type: Date,
    default: null
  },
  usageCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

WorkspaceCredentialSchema.index({ projectId: 1, provider: 1 });
WorkspaceCredentialSchema.index({ projectId: 1, name: 1 });

// Helper to mask secret strings safely
function maskSecret(val) {
  if (!val || typeof val !== 'string') return '••••••••';
  if (val.length <= 8) return '••••' + val.slice(-2);
  return val.slice(0, 3) + '••••••••' + val.slice(-4);
}

// Method to set credential payload with encryption
WorkspaceCredentialSchema.methods.setCredentials = function(credentialsObj) {
  const jsonStr = JSON.stringify(credentialsObj || {});
  this.encryptedData = encrypt(jsonStr);

  const candidateKey = credentialsObj.apiKey || credentialsObj.token || credentialsObj.accessToken || credentialsObj.secret || credentialsObj.password || '';
  this.maskedPreview = maskSecret(candidateKey);
};

// Method to retrieve decrypted credentials
WorkspaceCredentialSchema.methods.getCredentials = function() {
  if (!this.encryptedData) return {};
  try {
    const decrypted = decrypt(this.encryptedData);
    if (!decrypted) return {};
    return JSON.parse(decrypted);
  } catch (err) {
    console.error(`Failed to decrypt credentials for ${this._id}:`, err.message);
    return {};
  }
};

// Safe JSON serialization excluding encryptedData
WorkspaceCredentialSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.encryptedData;
  return obj;
};

module.exports = mongoose.model('WorkspaceCredential', WorkspaceCredentialSchema);
