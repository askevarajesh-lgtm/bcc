const mongoose = require("mongoose");

const seoSchema = new mongoose.Schema(
  {
    // Company reference (tenant company)
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      comment: "Reference to the tenant company",
    },

    // Client/Company reference (optional - can be linked to a client if needed)
    clientCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      comment: "Optional reference to the client company",
    },

    // Basic Information
    websiteLink: {
      type: String,
      required: true,
      trim: true,
      comment: "Website URL to be optimized",
    },
    websiteAuditScreenshot: {
      type: String,
      default: null,
      trim: true,
      comment: "URL/path to website audit screenshot",
    },
    keywords: {
      type: String,
      default: null,
      trim: true,
      comment: "Target keywords for SEO",
    },
    secondaryKeywords: {
      type: String,
      default: null,
      trim: true,
      comment: "Secondary/additional keywords for SEO",
    },

    // SEO Services (Checkboxes)
    contentWork: {
      type: Boolean,
      default: false,
      comment: "Content work service included",
    },
    onpageSeo: {
      type: Boolean,
      default: false,
      comment: "On-page SEO service included",
    },
    technicalSeo: {
      type: Boolean,
      default: false,
      comment: "Technical SEO service included",
    },
    localSeo: {
      type: Boolean,
      default: false,
      comment: "Local SEO service included",
    },
    keywordResearch: {
      type: Boolean,
      default: false,
      comment: "Keyword research service included",
    },
    offPageSeo: {
      type: Boolean,
      default: false,
      comment: "Off-page SEO service included",
    },

    // Off-page SEO Details
    profileLinkOffPageSeo: {
      type: String,
      default: null,
      trim: true,
      comment: "Profile link for off-page SEO",
    },
    googleSheetLinks: {
      type: [String],
      default: [],
      comment: "Array of Google Sheet links",
    },
    offPageSeoCount: {
      type: Number,
      default: 0,
      min: 0,
      comment: "Count of off-page SEO activities",
    },

    // Weekly Reports SEO Details
    profileLinkWeeklyReports: {
      type: String,
      default: null,
      trim: true,
      comment: "Profile link for weekly reports SEO",
    },
    googleSheetLinksWeeklyReports: {
      type: [String],
      default: [],
      comment: "Array of Google Sheet links for weekly reports",
    },
    weeklyReportsSeoCount: {
      type: Number,
      default: 0,
      min: 0,
      comment: "Count of weekly reports SEO activities",
    },

    // Credentials
    credentialsFile: {
      type: String,
      default: null,
      trim: true,
      comment: "URL/path to uploaded credentials file",
    },
    credentialsFileName: {
      type: String,
      default: null,
      trim: true,
      comment: "Original filename of credentials file",
    },

    // Task reference (created when SEO work is created)
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
      comment: "Reference to the task created for this SEO work",
    },

    // Work Updates - Array of work update entries
    workUpdates: [
      {
        workType: {
          type: String,
          enum: [
            "contentWork",
            "onpageSeo",
            "technicalSeo",
            "localSeo",
            "keywordResearch",
            "offPageSeo",
          ],
          required: true,
          comment: "Type of work/service completed",
        },
        completedWork: {
          type: String,
          required: true,
          trim: true,
          comment: "Description of completed work",
        },
        screenshots: [
          {
            url: {
              type: String,
              required: true,
              trim: true,
            },
            fileName: {
              type: String,
              default: null,
            },
            uploadedAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
        offPageBacklinkCount: {
          type: Number,
          default: null,
          min: 0,
          comment:
            "Number of off-page backlinks (optional, only for off-page SEO work updates)",
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Tracking
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      comment: "User who created this SEO entry",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      comment: "User who last updated this SEO entry",
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
seoSchema.index({ clientCompanyId: 1 });
seoSchema.index({ companyId: 1 });
seoSchema.index({ createdBy: 1 });
seoSchema.index({ taskId: 1 });

module.exports = mongoose.model("SEO", seoSchema);
