const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: [
      'supreme_super_admin', 
      'admin', 
      'agency_super_admin', 
      'agency_manager', 
      'agency_client', 
      'brand_super_admin', 
      'brand_manager', 
      'brand_team_user'
    ], 
    required: true 
  },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', default: null },
  brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', default: null },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, default: null }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password helper
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
