const mongoose = require('mongoose');

const strategySchema = new mongoose.Schema(
  {
    agency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agency',
      required: true,
      unique: true // One strategy document per agency to act as a cached dashboard state
    },
    metrics: {
      activeObjectives: { type: Number, default: 0 },
      activeObjectivesChange: { type: Number, default: 0 },
      keyResultsTracked: { type: Number, default: 0 },
      keyResultsChange: { type: Number, default: 0 },
      onTrack: { type: Number, default: 0 },
      onTrackPercent: { type: Number, default: 0 },
      atRisk: { type: Number, default: 0 },
      plannedSpend: { type: Number, default: 0 } // in millions/lakhs or raw value
    },
    objectives: [
      {
        title: String,
        client: String,
        owner: String,
        progress: Number, // 0-100
        status: { type: String, enum: ['ON TRACK', 'AT RISK', 'BEHIND', 'COMPLETED'] },
        quarter: String,
        keyResults: [
          {
            title: String,
            current: Number,
            target: Number,
            unit: String
          }
        ]
      }
    ],
    channelMaturity: {
      seo: { type: Number, default: 0 },
      paid: { type: Number, default: 0 },
      content: { type: Number, default: 0 },
      social: { type: Number, default: 0 },
      crm: { type: Number, default: 0 },
      website: { type: Number, default: 0 },
      sla: { type: Number, default: 0 }
    },
    insights: {
      bestOpportunity: String,
      biggestRisk: String,
      recommendedAction: String,
      expectedImpact: String,
      confidenceScore: Number
    },
    roadmap: [
      {
        initiative: String,
        client: String,
        channel: String,
        owner: String,
        phase: String, // Build, Launch, Plan
        timeline: String,
        deps: Number,
        status: { type: String, enum: ['IN PROGRESS', 'PLANNING', 'AT RISK', 'COMPLETED'] }
      }
    ],
    investment: [
      {
        month: String, // e.g., 'Jun', 'Jul', 'Aug'
        seo: Number,
        paid: Number,
        content: Number,
        social: Number
      }
    ],
    briefs: [
      {
        title: String,
        client: String,
        owner: String,
        status: { type: String, enum: ['APPROVED', 'IN REVIEW', 'DRAFT'] },
        updatedAt: String
      }
    ],
    risks: [
      {
        title: String,
        client: String,
        owner: String,
        impact: String,
        level: { type: String, enum: ['HIGH RISK', 'MED RISK', 'LOW RISK'] },
        reason: String
      }
    ],
    lastGenerated: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Strategy', strategySchema);
