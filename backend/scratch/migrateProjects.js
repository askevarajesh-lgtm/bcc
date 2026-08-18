const mongoose = require('mongoose');
require('dotenv').config();

const uri = 'mongodb+srv://askevarajesh_db_user:Lvh6bG5Ir6X8kHC6@bcc.hhhks6y.mongodb.net/bcc';

async function migrateAnalyticsProjects() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  try {
    const workspaceProjects = await db.collection('workspace_projects').find({ isDeleted: false }).toArray();
    
    if (workspaceProjects.length === 0) {
      console.log('No workspace projects found to migrate.');
      return;
    }

    const analyticsCollection = db.collection('analytics_projects');

    for (const project of workspaceProjects) {
      const existing = await analyticsCollection.findOne({ domain: project.domain, companyId: project.companyId });
      
      if (!existing) {
        await analyticsCollection.insertOne({
          companyId: project.companyId,
          clientId: project.clientId,
          createdBy: project.createdBy,
          domain: project.domain,
          name: project.name,
          credentials: {
            ga4PropertyId: project.credentials?.ga4PropertyId || '',
            gscServiceAccount: project.credentials?.gscServiceAccount || ''
          },
          isActive: project.isActive,
          isDeleted: project.isDeleted,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`Migrated ${project.domain} to analytics_projects.`);
      } else {
        console.log(`Skipped ${project.domain} (already exists).`);
      }
    }
    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    process.exit(0);
  }
}

migrateAnalyticsProjects();
