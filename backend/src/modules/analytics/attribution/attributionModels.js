/**
 * Attribution Engine — weighting models.
 *
 * Every function here is a pure, general-purpose implementation that takes a
 * chronologically-sorted touchpoint sequence `[{ channel, timestamp }, ...]`
 * for a single conversion (a Lead) and returns per-channel credit weights
 * that sum to 1. They work correctly for any sequence length.
 *
 * IMPORTANT — this is the real, current limitation, not glossed over: the
 * CRM only records ONE touchpoint per lead today (`Lead.source` at
 * `Lead.createdAt`), because no session-level/UTM touchpoint history is
 * captured yet (see touchpoints.util.js). With a single touchpoint, every
 * model below mathematically collapses to "100% credit to that one touch" —
 * that's the models working correctly on the data that exists, not a
 * shortcut. If multi-touch history is ever captured (see
 * touchpoints.util.js for the forward-compatible read path), these same
 * models will differentiate automatically with no changes needed here.
 */

/** Combines duplicate channel entries (e.g. two touches on the same channel) into one weight per channel. */
function collapseByChannel(rows) {
  const totals = new Map();
  for (const { channel, weight } of rows) {
    totals.set(channel, (totals.get(channel) || 0) + weight);
  }
  return Array.from(totals.entries()).map(([channel, weight]) => ({ channel, weight }));
}

function firstTouch(touchpoints) {
  const n = touchpoints.length;
  if (n === 0) return [];
  return collapseByChannel(touchpoints.map((tp, i) => ({ channel: tp.channel, weight: i === 0 ? 1 : 0 })).filter(r => r.weight > 0));
}

function lastTouch(touchpoints) {
  const n = touchpoints.length;
  if (n === 0) return [];
  return collapseByChannel(touchpoints.map((tp, i) => ({ channel: tp.channel, weight: i === n - 1 ? 1 : 0 })).filter(r => r.weight > 0));
}

function linear(touchpoints) {
  const n = touchpoints.length;
  if (n === 0) return [];
  const weight = 1 / n;
  return collapseByChannel(touchpoints.map(tp => ({ channel: tp.channel, weight })));
}

/** U-shaped: firstWeight to the first touch, lastWeight to the last, remainder split evenly across the middle. */
function positionBased(touchpoints, { firstWeight = 0.4, lastWeight = 0.4 } = {}) {
  const n = touchpoints.length;
  if (n === 0) return [];
  if (n === 1) return [{ channel: touchpoints[0].channel, weight: 1 }];
  if (n === 2) {
    return collapseByChannel(touchpoints.map(tp => ({ channel: tp.channel, weight: 0.5 })));
  }
  const middleWeight = Math.max(0, 1 - firstWeight - lastWeight);
  const middleCount = n - 2;
  const perMiddle = middleCount > 0 ? middleWeight / middleCount : 0;
  return collapseByChannel(touchpoints.map((tp, i) => {
    if (i === 0) return { channel: tp.channel, weight: firstWeight };
    if (i === n - 1) return { channel: tp.channel, weight: lastWeight };
    return { channel: tp.channel, weight: perMiddle };
  }));
}

/** Touchpoints closer to conversion get exponentially more credit (default 7-day half-life). */
function timeDecay(touchpoints, { halfLifeDays = 7 } = {}) {
  const n = touchpoints.length;
  if (n === 0) return [];
  if (n === 1) return [{ channel: touchpoints[0].channel, weight: 1 }];

  const lastTime = touchpoints[n - 1].timestamp.getTime();
  const rawScores = touchpoints.map(tp => {
    const ageDays = Math.max(0, (lastTime - tp.timestamp.getTime()) / (1000 * 60 * 60 * 24));
    return 2 ** (-ageDays / halfLifeDays);
  });
  const sum = rawScores.reduce((s, v) => s + v, 0) || 1;
  return collapseByChannel(touchpoints.map((tp, i) => ({ channel: tp.channel, weight: rawScores[i] / sum })));
}

const MODEL_FNS = { firstTouch, lastTouch, linear, positionBased, timeDecay };

const MODEL_META = [
  { key: 'firstTouch', label: 'First Touch', description: 'All credit goes to the first recorded touchpoint.' },
  { key: 'lastTouch', label: 'Last Touch', description: 'All credit goes to the touchpoint immediately before conversion.' },
  { key: 'linear', label: 'Linear', description: 'Credit is split evenly across every recorded touchpoint.' },
  { key: 'positionBased', label: 'Position Based (U-Shaped)', description: '40% to the first touch, 40% to the last touch, 20% split across any touches in between.' },
  { key: 'timeDecay', label: 'Time Decay', description: 'Touchpoints closer to conversion carry exponentially more credit (7-day half-life).' }
];

const MODEL_KEYS = MODEL_META.map(m => m.key);

module.exports = { MODEL_FNS, MODEL_META, MODEL_KEYS };
