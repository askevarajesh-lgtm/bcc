/**
 * Converts a real Lead document into the touchpoint sequence the
 * Attribution Engine consumes.
 *
 * Current data reality: the CRM captures exactly one recorded touchpoint
 * per lead — `Lead.source` (a free-text channel string) at `Lead.createdAt`.
 * There is no UTM/session/referrer-chain capture anywhere in this
 * codebase's lead-ingestion path (forms, integrations, manual entry), so a
 * true multi-touch sequence cannot be reconstructed for existing data.
 *
 * Forward-compatible path: if a lead's `customData.touchpoints` is ever
 * populated (e.g. by a future landing-page/UTM capture that writes an
 * array of `{ channel|source, timestamp|at|date }` entries into the
 * existing `customData` Mixed field), this reads it and uses the real
 * multi-touch history instead — no engine changes required.
 */
const { normalizeChannel } = require('../utils/channelBucket');

function parseCustomTouchpoints(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const parsed = raw
    .map(tp => {
      if (!tp || typeof tp !== 'object') return null;
      const channel = normalizeChannel(tp.channel || tp.source);
      const rawDate = tp.timestamp || tp.at || tp.date;
      const timestamp = rawDate ? new Date(rawDate) : null;
      if (!timestamp || Number.isNaN(timestamp.getTime())) return null;
      return { channel, timestamp };
    })
    .filter(Boolean)
    .sort((a, b) => a.timestamp - b.timestamp);

  return parsed.length > 0 ? parsed : null;
}

/** Builds the chronologically-sorted touchpoint sequence for one lead. */
function buildTouchpoints(lead) {
  const custom = parseCustomTouchpoints(lead?.customData?.touchpoints);
  if (custom) return custom;

  return [{ channel: normalizeChannel(lead.source), timestamp: lead.createdAt }];
}

module.exports = { buildTouchpoints };
