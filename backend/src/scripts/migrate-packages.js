/**
 * Migration: agencypackages / clientpackages / directclientpackages -> packages
 *
 * Copies every document from the three legacy collections into the new unified
 * `packages` collection, preserving _id, all existing fields, createdAt and
 * updatedAt exactly, and stamping a `type` field based on which collection the
 * document came from:
 *
 *   agencypackages       -> type: "agency"
 *   clientpackages        -> type: "client"
 *   directclientpackages -> type: "directClient"
 *
 * Idempotent: documents already present in `packages` (matched by _id) are
 * skipped on re-run, so this script is safe to run more than once.
 *
 * This does NOT delete the legacy collections. Run this first, verify the
 * `packages` collection looks right, then run the cleanup step separately
 * (drop the old collections) once you're confident.
 *
 * Usage:
 *   node backend/src/scripts/migrate-packages.js
 *
 * Requires MONGODB_URI (or MONGODB_URI_LOCAL in dev) in the environment,
 * same as the main app (see backend/src/config/db.js).
 */

const mongoose = require('mongoose');
require('dotenv').config();

const LEGACY_COLLECTIONS = [
  { name: 'agencypackages', type: 'agency' },
  { name: 'clientpackages', type: 'client' },
  { name: 'directclientpackages', type: 'directClient' }
];

async function connect() {
  const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'local';
  const uri = isDev
    ? (process.env.MONGODB_URI_LOCAL || process.env.MONGODB_URI)
    : (process.env.MONGODB_URI || process.env.MONGO_URI);

  if (!uri) {
    console.error('No MONGODB_URI (or MONGODB_URI_LOCAL) found in environment.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(`Connected to MongoDB: ${mongoose.connection.host}/${mongoose.connection.name}`);
}

async function migrateCollection(db, { name, type }, targetCollection) {
  const sourceCollection = db.collection(name);
  const docs = await sourceCollection.find({}).toArray();

  if (docs.length === 0) {
    console.log(`  ${name}: 0 documents found, nothing to migrate.`);
    return { found: 0, migrated: 0, skipped: 0 };
  }

  // Skip any _id already present in `packages` (idempotency on re-run)
  const existingIds = new Set(
    (await targetCollection.find({ _id: { $in: docs.map((d) => d._id) } }, { projection: { _id: 1 } }).toArray())
      .map((d) => String(d._id))
  );

  const toInsert = docs
    .filter((d) => !existingIds.has(String(d._id)))
    .map((d) => ({ ...d, type }));

  let migrated = 0;
  if (toInsert.length > 0) {
    const result = await targetCollection.insertMany(toInsert, { ordered: false });
    migrated = result.insertedCount;
  }

  const skipped = docs.length - toInsert.length;
  console.log(`  ${name}: ${docs.length} found, ${migrated} migrated, ${skipped} already present (skipped)`);
  return { found: docs.length, migrated, skipped };
}

async function run() {
  await connect();
  const db = mongoose.connection.db;
  const targetCollection = db.collection('packages');

  console.log('Starting package migration into unified `packages` collection...');

  const summary = [];
  for (const legacy of LEGACY_COLLECTIONS) {
    const result = await migrateCollection(db, legacy, targetCollection);
    summary.push({ ...legacy, ...result });
  }

  const totalFound = summary.reduce((sum, s) => sum + s.found, 0);
  const totalMigrated = summary.reduce((sum, s) => sum + s.migrated, 0);
  const totalSkipped = summary.reduce((sum, s) => sum + s.skipped, 0);
  const totalInPackages = await targetCollection.countDocuments({});

  console.log('\n--- Migration Summary ---');
  summary.forEach((s) => {
    console.log(`${s.name} (type: ${s.type}): found=${s.found}, migrated=${s.migrated}, skipped=${s.skipped}`);
  });
  console.log(`TOTAL: found=${totalFound}, migrated=${totalMigrated}, skipped=${totalSkipped}`);
  console.log(`packages collection now has ${totalInPackages} documents total.`);
  console.log('\nLegacy collections were NOT modified or dropped. Verify the data above, then drop them manually once confirmed:');
  console.log('  db.agencypackages.drop()');
  console.log('  db.clientpackages.drop()');
  console.log('  db.directclientpackages.drop()');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
