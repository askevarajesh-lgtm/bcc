const mongoose = require('mongoose');

const semrushCacheSchema = new mongoose.Schema({
  queryKey: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '24h' // Cache expires after 24 hours
  }
});

const SemrushCache = mongoose.model('SemrushCache', semrushCacheSchema);

module.exports = SemrushCache;
