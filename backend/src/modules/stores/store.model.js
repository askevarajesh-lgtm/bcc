const mongoose = require('mongoose');

const StoreSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  storeName: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Draft', 'Active'], default: 'Draft', required: true },
  description: { type: String, default: "" },
  currency: { type: String, default: 'INR', required: true },
  contactEmail: { type: String, default: "" },
  seoTitle: { type: String, default: "" },
  seoDescription: { type: String, default: "" },
  ogImageUrl: { type: String, default: "" },
  faviconUrl: { type: String, default: "" },
  trackingPixels: {
    metaPixelId: { type: String, default: "" },
    ga4Id: { type: String, default: "" },
    gtmId: { type: String, default: "" },
    tiktokPixelId: { type: String, default: "" },
    customHeadCode: { type: String, default: "" },
    customBodyCode: { type: String, default: "" }
  },
  frontendDesign: {
    themeAccentColor: { type: String, default: "#1f2937" },
    storeLayout: { type: String, default: "Minimal" },
    logoStyle: { type: String, default: "Wordmark" }
  },
  policies: {
    salesTaxRate: { type: Number, default: 7.5000, required: true },
    checkoutFooterNote: { type: String, default: "" },
    shippingInformation: { type: String, default: "" },
    refundPolicy: { type: String, default: "" },
    privacyPolicy: { type: String, default: "" }
  },
  payments: {
    checkoutGateway: { type: String, default: "workspace" },
    stripeOverride: {
      publicKey: { type: String, default: "" },
      secretKey: { type: String, default: "" }
    }
  },
  emailSender: {
    useCustomSender: { type: Boolean, default: false, required: true },
    fromEmail: { type: String, default: "" },
    fromName: { type: String, default: "" },
    replyTo: { type: String, default: "" }
  },
  chatWidgetId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatWidget', default: null },
  domainId: { type: mongoose.Schema.Types.ObjectId, ref: 'Domain', default: null },
  isDeleted: { type: Boolean, default: false, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId },
  updatedBy: { type: mongoose.Schema.Types.ObjectId }
}, { timestamps: true });

StoreSchema.index({ workspaceId: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('Store', StoreSchema);
