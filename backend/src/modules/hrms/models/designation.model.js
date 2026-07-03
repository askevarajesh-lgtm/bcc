const mongoose = require("mongoose");

const designationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HRDepartment",
      required: true,
    },
    tenantCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    level: {
      type: Number, // e.g., 1 for entry level, higher for management
      default: 1,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

designationSchema.index({ tenantCompanyId: 1, title: 1, departmentId: 1 }, { unique: true });

module.exports = mongoose.model("HRDesignation", designationSchema);
