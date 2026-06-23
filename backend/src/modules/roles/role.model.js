const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  roleName: { type: String, required: true },
  roleKey: { type: String },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', default: null },
  brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Role', RoleSchema);
