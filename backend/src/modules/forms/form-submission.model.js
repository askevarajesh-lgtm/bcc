const mongoose = require('mongoose');

const FormSubmissionSchema = new mongoose.Schema({
  formId: { type: mongoose.Schema.Types.ObjectId, ref: 'Form', required: true, index: true },
  name: { type: String, default: "" },
  email: { type: String, default: "", index: true },
  firstName: { type: String, default: "" }, // GHL Compatibility
  phone: { type: String, default: "" },
  details: { type: Map, of: String, default: {} }, // key-value maps of custom inputs
  submittedAt: { type: Date, default: Date.now, required: true },
  isDeleted: { type: Boolean, default: false, required: true }
}, { timestamps: true });

FormSubmissionSchema.index({ formId: 1, submittedAt: -1 });

module.exports = mongoose.model('FormSubmission', FormSubmissionSchema);
