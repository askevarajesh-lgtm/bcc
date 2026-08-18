require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const { buildAnalyticsDashboard } = require('./src/modules/analytics/services/metrics.service');
const gsc = require('./src/modules/analytics/sources/searchConsole.source');

async function run() {
  const breakdown = await gsc.getSearchBreakdown('https://askeva.io/', 'query', '2026-07-19', '2026-08-18', 20);
  console.log('Breakdown length:', breakdown.length);
  process.exit(0);
}
run().catch(console.error);
