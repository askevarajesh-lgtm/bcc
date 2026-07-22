const mongoose = require("mongoose");

const integrationSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null, // null for platform-level integrations
    },
    type: {
      type: String,
      enum: ["whatsapp", "sms", "email", "ekta", "ivr", "website", "meta_ads", "payment", "facebook_leads"],
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    config: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      // For WhatsApp: { backendUrl, apiToken, templates: [{ id, name, variables }] }
      // For SendPulse: { clientId, clientSecret, fromEmail, fromName }
      // For IVR (e.g. Exotel-style): { accountSid, subdomain, accountRegion, apiKey, apiToken, exoPhoneNumber }
      // For Meta Ads: { accessToken, userId, selectedAdAccounts: [{ id, name }], expiresAt }
    },
  },
  {
    timestamps: true,
  },
);

integrationSchema.index({ companyId: 1, type: 1 });

module.exports = mongoose.model("Integration", integrationSchema);
