const mongoose = require("mongoose");

const notepadSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      comment: "User who owns this note",
    },
    noteDate: {
      type: Date,
      required: true,
      index: true,
      comment:
        "Date for which this note is created (only date part, time is ignored)",
    },
    content: {
      type: String,
      required: true,
      trim: true,
      comment: "Note content",
    },
    createdAt: {
      type: Date,
      default: Date.now,
      comment: "When the note was created",
    },
    updatedAt: {
      type: Date,
      default: Date.now,
      comment: "When the note was last updated",
    },
    isEditable: {
      type: Boolean,
      default: true,
      comment: "Whether the note can still be edited (false after 25 hours)",
    },
    editExpiresAt: {
      type: Date,
      required: function () {
        // Only require if this is a new document (will be set by pre-save hook)
        return this.isNew;
      },
      comment: "Timestamp when editing expires (25 hours after creation)",
    },
  },
  {
    timestamps: true,
  },
);

// Compound index to ensure one note per user per day
notepadSchema.index({ userId: 1, noteDate: 1 }, { unique: true });

// Pre-save hook to set editExpiresAt (25 hours from creation)
// Use 'validate' hook to ensure editExpiresAt is set before validation
notepadSchema.pre("validate", function () {
  // If this is a new document and editExpiresAt is not set, set it to 25 hours from now
  if (this.isNew && !this.editExpiresAt) {
    this.editExpiresAt = new Date(Date.now() + 25 * 60 * 60 * 1000);
  }
});

// Pre-save hook to update isEditable and updatedAt
notepadSchema.pre("save", function () {
  // For existing documents, ensure editExpiresAt exists (for notes created before this field was added)
  if (!this.isNew && !this.editExpiresAt && this.createdAt) {
    // Calculate from createdAt if editExpiresAt is missing
    this.editExpiresAt = new Date(
      this.createdAt.getTime() + 25 * 60 * 60 * 1000,
    );
  }
  // Update isEditable based on current time
  if (this.editExpiresAt) {
    this.isEditable = new Date() < this.editExpiresAt;
  }
  this.updatedAt = new Date();
});

// Method to check if note is editable
notepadSchema.methods.checkEditable = function () {
  return new Date() < this.editExpiresAt;
};

// Static method to get today's note for a user
notepadSchema.statics.getTodayNote = async function (userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return await this.findOne({
    userId,
    noteDate: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    },
  });
};

// Static method to check if user has note for today
notepadSchema.statics.hasTodayNote = async function (userId) {
  const note = await this.getTodayNote(userId);
  return !!note;
};

module.exports = mongoose.model("Notepad", notepadSchema);
