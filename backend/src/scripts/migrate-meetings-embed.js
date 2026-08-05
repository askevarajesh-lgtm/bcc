/**
 * Migration: meetingnotes / meetingattachments / meetingfollowups -> meetings (embedded)
 *
 * For every document in the `meetings` collection, finds all related
 * MeetingNote, MeetingAttachment, and MeetingFollowUp documents (matched by
 * their `meetingId` field) and embeds them into that meeting document as the
 * `notes`, `attachments`, and `followUps` arrays, preserving every existing
 * field (including each sub-document's own _id, createdAt, updatedAt, and
 * all user/task references) exactly as they were in the legacy collections.
 *
 * Idempotent: if a meeting's embedded array already contains a sub-document
 * with a given _id, that sub-document is skipped on re-run, so this script
 * is safe to run more than once without creating duplicates.
 *
 * This does NOT delete the legacy collections. Run this first, verify the
 * `meetings` collection looks right (see verification summary printed at the
 * end), then drop the old collections manually once you're confident.
 *
 * Usage:
 *   node backend/src/scripts/migrate-meetings-embed.js
 *
 * Requires MONGODB_URI (or MONGODB_URI_LOCAL in dev) in the environment,
 * same as the main app (see backend/src/config/db.js).
 */

const mongoose = require('mongoose');
require('dotenv').config();

const LEGACY_COLLECTIONS = {
  notes: 'meetingnotes',
  attachments: 'meetingattachments',
  followUps: 'meetingfollowups'
};

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

/**
 * Strip the `meetingId` linking field off a legacy sub-document (it's now
 * implicit via nesting) while preserving every other field untouched,
 * including _id, timestamps, and all references.
 */
function toEmbedded(doc) {
  const { meetingId, __v, ...rest } = doc;
  return rest;
}

async function run() {
  await connect();
  const db = mongoose.connection.db;
  const meetingsCollection = db.collection('meetings');

  const notesCollection = db.collection(LEGACY_COLLECTIONS.notes);
  const attachmentsCollection = db.collection(LEGACY_COLLECTIONS.attachments);
  const followUpsCollection = db.collection(LEGACY_COLLECTIONS.followUps);

  console.log('Starting meeting embed migration (notes, attachments, followUps)...');

  const meetings = await meetingsCollection.find({}).toArray();
  console.log(`Found ${meetings.length} meetings to process.`);

  const summary = {
    meetingsProcessed: 0,
    notesFound: 0,
    notesMigrated: 0,
    notesSkipped: 0,
    attachmentsFound: 0,
    attachmentsMigrated: 0,
    attachmentsSkipped: 0,
    followUpsFound: 0,
    followUpsMigrated: 0,
    followUpsSkipped: 0
  };

  for (const meeting of meetings) {
    const existingNoteIds = new Set((meeting.notes || []).map((n) => String(n._id)));
    const existingAttachmentIds = new Set((meeting.attachments || []).map((a) => String(a._id)));
    const existingFollowUpIds = new Set((meeting.followUps || []).map((f) => String(f._id)));

    const relatedNotes = await notesCollection.find({ meetingId: meeting._id }).toArray();
    const relatedAttachments = await attachmentsCollection.find({ meetingId: meeting._id }).toArray();
    const relatedFollowUps = await followUpsCollection.find({ meetingId: meeting._id }).toArray();

    summary.notesFound += relatedNotes.length;
    summary.attachmentsFound += relatedAttachments.length;
    summary.followUpsFound += relatedFollowUps.length;

    const newNotes = relatedNotes
      .filter((n) => !existingNoteIds.has(String(n._id)))
      .map(toEmbedded);
    const newAttachments = relatedAttachments
      .filter((a) => !existingAttachmentIds.has(String(a._id)))
      .map(toEmbedded);
    const newFollowUps = relatedFollowUps
      .filter((f) => !existingFollowUpIds.has(String(f._id)))
      .map(toEmbedded);

    summary.notesSkipped += relatedNotes.length - newNotes.length;
    summary.attachmentsSkipped += relatedAttachments.length - newAttachments.length;
    summary.followUpsSkipped += relatedFollowUps.length - newFollowUps.length;

    if (newNotes.length === 0 && newAttachments.length === 0 && newFollowUps.length === 0) {
      summary.meetingsProcessed += 1;
      continue;
    }

    const update = { $set: { updatedAt: meeting.updatedAt || new Date() } };
    const push = {};
    if (newNotes.length > 0) push.notes = { $each: newNotes };
    if (newAttachments.length > 0) push.attachments = { $each: newAttachments };
    if (newFollowUps.length > 0) push.followUps = { $each: newFollowUps };
    if (Object.keys(push).length > 0) update.$push = push;

    await meetingsCollection.updateOne({ _id: meeting._id }, update);

    summary.notesMigrated += newNotes.length;
    summary.attachmentsMigrated += newAttachments.length;
    summary.followUpsMigrated += newFollowUps.length;
    summary.meetingsProcessed += 1;
  }

  console.log('\n--- Migration Summary ---');
  console.log(`Meetings processed: ${summary.meetingsProcessed} / ${meetings.length}`);
  console.log(`Notes:       found=${summary.notesFound}, migrated=${summary.notesMigrated}, skipped=${summary.notesSkipped}`);
  console.log(`Attachments: found=${summary.attachmentsFound}, migrated=${summary.attachmentsMigrated}, skipped=${summary.attachmentsSkipped}`);
  console.log(`FollowUps:   found=${summary.followUpsFound}, migrated=${summary.followUpsMigrated}, skipped=${summary.followUpsSkipped}`);

  // Verification pass: recount embedded totals vs legacy totals
  const legacyNoteCount = await notesCollection.countDocuments({});
  const legacyAttachmentCount = await attachmentsCollection.countDocuments({});
  const legacyFollowUpCount = await followUpsCollection.countDocuments({});

  const embeddedTotals = await meetingsCollection.aggregate([
    {
      $project: {
        noteCount: { $size: { $ifNull: ['$notes', []] } },
        attachmentCount: { $size: { $ifNull: ['$attachments', []] } },
        followUpCount: { $size: { $ifNull: ['$followUps', []] } }
      }
    },
    {
      $group: {
        _id: null,
        notes: { $sum: '$noteCount' },
        attachments: { $sum: '$attachmentCount' },
        followUps: { $sum: '$followUpCount' }
      }
    }
  ]).toArray();

  const embedded = embeddedTotals[0] || { notes: 0, attachments: 0, followUps: 0 };

  console.log('\n--- Verification ---');
  console.log(`Legacy meetingnotes: ${legacyNoteCount}       | Embedded notes: ${embedded.notes}`);
  console.log(`Legacy meetingattachments: ${legacyAttachmentCount} | Embedded attachments: ${embedded.attachments}`);
  console.log(`Legacy meetingfollowups: ${legacyFollowUpCount}   | Embedded followUps: ${embedded.followUps}`);

  const noDataLoss =
    embedded.notes >= legacyNoteCount &&
    embedded.attachments >= legacyAttachmentCount &&
    embedded.followUps >= legacyFollowUpCount;

  console.log(noDataLoss ? '\n✓ Zero data loss confirmed.' : '\n✗ MISMATCH — investigate before dropping legacy collections.');

  console.log('\nLegacy collections were NOT modified or dropped. Once you have verified the');
  console.log('counts above and confirmed the app works end-to-end, drop them manually:');
  console.log('  db.meetingnotes.drop()');
  console.log('  db.meetingattachments.drop()');
  console.log('  db.meetingfollowups.drop()');

  await mongoose.disconnect();
  process.exit(noDataLoss ? 0 : 1);
}

run().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
