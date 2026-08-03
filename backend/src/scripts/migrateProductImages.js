/**
 * One-time migration: Product.images  [String]  ->  [{ url: String, altText: '' }]
 *
 * Run this BEFORE deploying the ContentAI Product Writer / Alt Text Generator
 * changes (product.model.js was updated to the new shape as part of that work).
 *
 * Known readers audited before this script was written (per
 * content-ai-platform-architecture.md's "Open items" §):
 *   - backend/src/modules/stores/store.controller.js:323 — `product.images = images`
 *     passthrough setter on product update. Callers (frontend product-edit UI,
 *     any API integration) must send `[{url, altText}]` after this migration
 *     runs, not bare URL strings. No such frontend UI existed in this codebase
 *     at the time of this migration (Product had no edit-images UI), so this
 *     is a lower-risk gap than it would be with a live UI already depending
 *     on the old shape — still flagged here so it isn't silently forgotten.
 *   - backend/src/modules/seoWorkspace/services/storeSeoAgent.service.js —
 *     only checks `images` existence/`$size`, unaffected by element shape.
 *
 * Usage:  node backend/src/scripts/migrateProductImages.js
 * Requires MONGO_URI in the environment, same as the main app.
 */
const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('migrateProductImages: no MONGO_URI/MONGODB_URI in environment.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const products = db.collection('products');

  const cursor = products.find({ images: { $type: 'array' } });
  let scanned = 0;
  let migrated = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    scanned += 1;

    const needsMigration = Array.isArray(doc.images) && doc.images.some((img) => typeof img === 'string');
    if (!needsMigration) continue;

    const newImages = doc.images.map((img) => {
      if (typeof img === 'string') return { url: img, altText: '' };
      if (img && typeof img === 'object' && img.url) return { url: img.url, altText: img.altText || '' };
      return null;
    }).filter(Boolean);

    await products.updateOne({ _id: doc._id }, { $set: { images: newImages } });
    migrated += 1;
  }

  console.log(`migrateProductImages: scanned ${scanned} products, migrated ${migrated}.`);
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error('migrateProductImages failed:', error);
  process.exit(1);
});
