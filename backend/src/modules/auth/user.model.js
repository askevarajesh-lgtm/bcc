const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  companyName: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  modules: {
    chatgpt: { type: Boolean, default: false },
    canva: { type: Boolean, default: false }
  },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
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
