const mongoose = require('mongoose');
require('dotenv').config();

const uri = 'mongodb+srv://askevarajesh_db_user:Lvh6bG5Ir6X8kHC6@bcc.hhhks6y.mongodb.net/bcc';

async function runAudits() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  try {
    const projectId = '6a83fd382cbf8b290943db07'; // Askeva
    const workspaceId = '6a7c361abdab9bedf9eb63f3'; // Bcc Admin

    console.log('1. Loading Agents...');
    const seoAuditorAgent = require('./src/modules/seoWorkspace/services/seoAuditorAgent.service');
    const technicalSeoAgent = require('./src/modules/seoWorkspace/services/technicalSeoAgent.service');
    const aeoAgent = require('./src/modules/seoWorkspace/services/aeoAgent.service');
    const geoAgent = require('./src/modules/seoWorkspace/services/geoAgent.service');
    const WorkspaceAgentOrchestrator = require('./src/modules/seoWorkspace/services/workspaceAgentOrchestrator.service');

    console.log('2. Running SEO Auditor (Performance)...');
    try {
      await seoAuditorAgent.run(projectId, workspaceId, {});
      console.log('✅ SEO Auditor complete.');
    } catch (e) {
      console.error('❌ SEO Auditor failed:', e.message);
    }

    console.log('3. Running Technical SEO Crawl...');
    try {
      await technicalSeoAgent.run(projectId, workspaceId, {});
      console.log('✅ Technical SEO Crawl complete.');
    } catch (e) {
      console.error('❌ Technical SEO Crawl failed:', e.message);
    }

    console.log('4. Running AEO Audit...');
    try {
      await aeoAgent.run(projectId, workspaceId, {});
      console.log('✅ AEO Audit complete.');
    } catch (e) {
      console.error('❌ AEO Audit failed:', e.message);
    }

    console.log('5. Running GEO Audit...');
    try {
      await geoAgent.run(projectId, workspaceId, {});
      console.log('✅ GEO Audit complete.');
    } catch (e) {
      console.error('❌ GEO Audit failed:', e.message);
    }

    console.log('6. Running Orchestrator (Keyword seeding & Rank Tracking)...');
    try {
      const orchestrator = new WorkspaceAgentOrchestrator();
      await orchestrator.runOrchestration(projectId, workspaceId);
      console.log('✅ Orchestrator complete.');
    } catch (e) {
      console.error('❌ Orchestrator failed:', e.message);
    }

    console.log('🎉 All audits triggered successfully!');
  } catch (error) {
    console.error('Global Error:', error);
  } finally {
    process.exit(0);
  }
}

runAudits();
