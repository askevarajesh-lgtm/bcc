const mongoose = require('mongoose');

// Unified Package model.
// Replaces: AgencyPackage, ClientPackage, DirectClientPackage.
// Every existing field from the three legacy models is preserved exactly
// (same name, same type, same default). The only new field is `type`,
// which acts as the discriminator that used to be implied by the collection itself.
//
//   type: 'agency'       -> fields previously on AgencyPackage
//   type: 'client'       -> fields previously on ClientPackage
//   type: 'directClient' -> fields previously on DirectClientPackage
const PackageSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['agency', 'client', 'directClient']
  },

  // Shared fields (existed on all three legacy models)
  name: { type: String, required: true, trim: true },
  price: { type: String, default: '' },
  description: { type: String, default: '' },
  features: [{ type: String }],
  billingInterval: { type: String, enum: ['Monthly', 'Yearly', 'One Time'], default: 'Monthly' },

  // Fields previously only on AgencyPackage
  users: { type: Number },
  clients: { type: Number },
  active: { type: Number, default: 0 },

  // Field previously only on ClientPackage (required there, kept required for type === 'client')
  agencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function () { return this.type === 'client'; }
  },

  // Fields previously only on DirectClientPackage
  userCount: { type: Number, default: 5 },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function () { return this.type === 'directClient'; }
  }
}, { timestamps: true });

// Indexes to support filtering/sorting/scoping across all three former collections
PackageSchema.index({ type: 1 });
PackageSchema.index({ name: 1 });
PackageSchema.index({ createdAt: -1 });
PackageSchema.index({ type: 1, agencyId: 1 });
PackageSchema.index({ type: 1, createdBy: 1 });

module.exports = mongoose.model('Package', PackageSchema);
