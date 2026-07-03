const mongoose = require("mongoose");

const trainingSchema = new mongoose.Schema(
  {
    tenantCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    materials: [
      {
        name: String,
        url: String,
        type: { type: String, enum: ["Video", "Document", "Link"] }
      }
    ],
    mandatoryFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "HRDepartment",
      }
    ],
    enrolledEmployees: [
      {
        employeeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        status: {
          type: String,
          enum: ["Not Started", "In Progress", "Completed"],
          default: "Not Started"
        },
        progress: { type: Number, default: 0 }, // 0 to 100
        completedAt: Date
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }
  },
  {
    timestamps: true,
  }
);

trainingSchema.index({ tenantCompanyId: 1 });

module.exports = mongoose.model("Training", trainingSchema);
