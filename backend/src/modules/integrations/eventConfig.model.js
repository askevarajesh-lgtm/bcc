const mongoose = require("mongoose");

const eventConfigSchema = new mongoose.Schema(
  {
    integrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Integration",
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },
    eventType: {
      type: String,
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
    whatsappTemplate: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    emailTemplate: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    autoSend: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

eventConfigSchema.index({ integrationId: 1, eventType: 1 }, { unique: true });

module.exports = mongoose.model("EventConfig", eventConfigSchema);
