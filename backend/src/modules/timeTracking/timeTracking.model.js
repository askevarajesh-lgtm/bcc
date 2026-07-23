const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // In M1 Labs, clients are often Users (Brand) or Companies
    required: false,
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: false,
  },
  moduleName: {
    type: String,
    required: false,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  date: {
    type: Date,
    required: true,
  },
  hours: {
    type: Number,
    required: true,
    min: 0,
  },
  isBillable: {
    type: Boolean,
    default: false,
  },
  tenantCompanyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, { timestamps: true });

timeEntrySchema.index({ employee: 1, date: -1 });
timeEntrySchema.index({ client: 1, date: -1 });
timeEntrySchema.index({ tenantCompanyId: 1 });

module.exports = mongoose.model('TimeEntry', timeEntrySchema);
