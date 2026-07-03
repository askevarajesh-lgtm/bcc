const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    tenantCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String, // e.g. "MacBook Pro M2"
      required: true,
      trim: true,
    },
    assetType: {
      type: String,
      enum: ["Laptop", "Desktop", "Mobile", "SIM", "Monitor", "Keyboard", "Mouse", "Software License", "Other"],
      required: true,
    },
    serialNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ["Available", "Assigned", "Under Repair", "Retired"],
      default: "Available",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    assignmentDate: {
      type: Date,
    },
    returnDate: {
      type: Date,
    },
    history: [
      {
        employeeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        assignedAt: Date,
        returnedAt: Date,
        notes: String
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

assetSchema.index({ tenantCompanyId: 1, status: 1 });
assetSchema.index({ tenantCompanyId: 1, assignedTo: 1 });

module.exports = mongoose.model("Asset", assetSchema);
