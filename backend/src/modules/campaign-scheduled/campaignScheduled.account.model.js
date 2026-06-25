const mongoose = require("mongoose");

const campaignScheduledAccountSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    clientCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClientCompany",
      default: null,
      index: true,
    },
    id: { type: String, required: true, index: true },
    platform: {
      type: String,
      required: true,
      enum: ["facebook", "instagram", "linkedin", "youtube", "google_business", "pinterest"],
    },
    page_id: { type: String, default: null },
    page_name: { type: String, default: null },
    ig_user_id: { type: String, default: null },
    username: { type: String, default: null },
    access_token: { type: String, required: true },
    refresh_token: { type: String, default: null },
    youtube_client_id: { type: String, default: null },
    youtube_client_secret: { type: String, default: null },
    gbp_account_id: { type: String, default: null },
    gbp_location_id: { type: String, default: null },
    business_name: { type: String, default: null },
    address: { type: String, default: null },
    phone: { type: String, default: null },
    category: { type: String, default: null },
    token_type: { type: String, default: "page" },
    expires_at: { type: Number, default: null },
    connected_at: { type: String, required: true },
  },
  { timestamps: true },
);

campaignScheduledAccountSchema.index(
  { companyId: 1, clientCompanyId: 1, id: 1 },
  { unique: true },
);

module.exports = mongoose.model(
  "CampaignScheduledAccount",
  campaignScheduledAccountSchema,
);
