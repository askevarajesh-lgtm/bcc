const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: false }, // Optional for migrated organizations
  role: { 
    type: String, 
    required: true,
    enum: [
      'supreme_super_admin',
      'commander_admin',
      'agency_super_admin',
      'agency_manager',
      'agency_client',
      'brand_super_admin',
      'brand_manager',
      'user'
    ]
  },
  companyName: { type: String, default: null },
  industry: { type: String, default: 'General' },
  isActive: { type: Boolean, default: true },
  status: { type: String, enum: ['active', 'suspended', 'trial', 'churned'], default: 'active' },
  
  modules: {
    chatgpt: { type: Boolean, default: false },
    canva: { type: Boolean, default: false }
  },
  
  // Relationships
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  departmentName: { type: String, default: null },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  customRoleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', default: null },
  roleName: { type: String, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Agency Specific Fields
  logo: { type: String, default: null },
  domain: { type: String, default: null },
  contactEmail: { type: String, default: null },
  supportPhone: { type: String, default: null },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'AgencyPackage', default: null },
  allowedUsers: { type: Number, default: 5 },
  mrr: { type: Number, default: 0 },

  // Brand Specific Fields
  isDirect: { type: Boolean, default: false },
  packageName: { type: String, default: null },
  features: [{ type: String }],
  ga4PropertyId: { type: String, default: null }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password helper
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
