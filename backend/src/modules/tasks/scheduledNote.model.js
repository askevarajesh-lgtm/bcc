const mongoose = require("mongoose");

const scheduledNoteSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
      index: true,
    },
    notes: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

scheduledNoteSchema.index({ companyId: 1, scheduledDate: 1 });

module.exports = mongoose.model("ScheduledNote", scheduledNoteSchema);
