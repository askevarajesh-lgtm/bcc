const mongoose = require('mongoose');
const { FUNNEL_STATUS, STEP_TYPES, STEP_STATUS } = require('./funnel.constants');

const FunnelSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  status: { type: String, enum: Object.values(FUNNEL_STATUS), default: FUNNEL_STATUS.DRAFT, required: true },
  templateId: { type: mongoose.Schema.Types.ObjectId, default: null },
  organizationId: { type: mongoose.Schema.Types.ObjectId, default: null },
  faviconUrl: { type: String, default: "" },
  trackingPixels: {
    metaPixelId: { type: String, default: "" },
    ga4Id: { type: String, default: "" },
    customHeadCode: { type: String, default: "" }
  },
  publishedUrl: { type: String, default: "" },
  domainId: { type: mongoose.Schema.Types.ObjectId, ref: 'Domain', default: null },
  isDeleted: { type: Boolean, default: false, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId },
  updatedBy: { type: mongoose.Schema.Types.ObjectId }
}, { timestamps: true });

FunnelSchema.index({ workspaceId: 1, slug: 1 }, { unique: true });

const FunnelStepSchema = new mongoose.Schema({
  funnelId: { type: mongoose.Schema.Types.ObjectId, ref: 'FunnelModuleFunnel', required: true, index: true },
  stepOrder: { type: Number, default: 0, required: true },
  stepName: { type: String, required: true, trim: true },
  stepType: { type: String, enum: Object.values(STEP_TYPES), default: STEP_TYPES.LANDING, required: true },
  status: { type: String, enum: Object.values(STEP_STATUS), default: STEP_STATUS.DRAFT, required: true },
  pageId: { type: mongoose.Schema.Types.ObjectId, ref: 'FunnelPage', required: true },
  pageSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
  isDeleted: { type: Boolean, default: false, required: true }
}, { timestamps: true });

FunnelStepSchema.index({ funnelId: 1, stepOrder: 1 });

const FunnelAnalyticsSchema = new mongoose.Schema({
  funnelId: { type: mongoose.Schema.Types.ObjectId, ref: 'FunnelModuleFunnel', required: true, index: true },
  visitors: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 },
  submissions: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

const FunnelEventSchema = new mongoose.Schema({
  funnelId: { type: mongoose.Schema.Types.ObjectId, ref: 'FunnelModuleFunnel', required: true, index: true },
  stepId: { type: mongoose.Schema.Types.ObjectId, ref: 'FunnelModuleStep', required: true },
  eventType: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// Custom Page model for Funnels sharing the 'pages' collection
// Uses websiteId field to store funnelId to satisfy Page.js schema requirements without modifying it
const FunnelPageSchema = new mongoose.Schema({
  websiteId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, // We map funnelId here to satisfy shared collection
  title: { type: String, required: true, trim: true },
  path: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Draft', 'Published'], default: 'Draft', required: true },
  isHome: { type: Boolean, default: false, required: true },
  layoutJson: { type: mongoose.Schema.Types.Mixed, default: {} },
  html: { type: String, default: "" },
  css: { type: String, default: "" },
  isDeleted: { type: Boolean, default: false, required: true },
  pageType: { type: String, default: 'funnel' }
}, { timestamps: true });

FunnelPageSchema.index({ websiteId: 1, path: 1 }, { unique: true });

module.exports = {
  Funnel: mongoose.model('FunnelModuleFunnel', FunnelSchema, 'funnels'),
  FunnelStep: mongoose.model('FunnelModuleStep', FunnelStepSchema, 'funnel_steps'),
  FunnelAnalytics: mongoose.model('FunnelAnalytics', FunnelAnalyticsSchema, 'funnel_analytics'),
  FunnelEvent: mongoose.model('FunnelEvent', FunnelEventSchema, 'funnel_events'),
  FunnelPage: mongoose.model('FunnelPage', FunnelPageSchema, 'pages')
};
