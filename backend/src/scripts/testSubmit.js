const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

(async () => {
  try {
    await mongoose.connect('mongodb://askevarajesh_db_user:Lvh6bG5Ir6X8kHC6@ac-wo2gqd5-shard-00-00.hhhks6y.mongodb.net:27017,ac-wo2gqd5-shard-00-01.hhhks6y.mongodb.net:27017,ac-wo2gqd5-shard-00-02.hhhks6y.mongodb.net:27017/bcc?ssl=true&replicaSet=atlas-scq3ph-shard-0&authSource=admin&retryWrites=true&w=majority');
    
    const User = require('./src/modules/auth/user.model.js');
    const PerformanceScorecard = require('./src/modules/hrms/models/performanceScorecard.model.js');
    const performanceScorecardService = require('./src/modules/hrms/performanceScorecard.service.js');
    
    const dravit = await User.findOne({ name: 'Dravit' });
    
    if (!dravit) {
      console.log('Dravit not found');
      process.exit(1);
    }
    
    console.log('Dravit:', { id: dravit._id, companyId: dravit.adminId });
    
    const selfAssessmentData = {
      month: 7,
      year: 2026,
      evaluationDate: new Date().toISOString(),
      performanceCategories: {
        officeTimeLogIn: { self: "A" },
        attendance: { self: "A" },
        commitmentTowardsWork: { self: "A" },
        discipline: { self: "A" },
        teamWork: { self: "A" },
        innovation: { self: "A" },
        dailyReportSubmission: { self: "A" },
        workConsistency: { self: "B" },
        workEvaluation: { self: "A" }
      }
    };
    
    const result = await performanceScorecardService.submitSelfAssessment(
      selfAssessmentData,
      dravit.adminId,
      dravit._id
    );
    
    console.log("Success!", result);
  } catch (err) {
    console.error("ERROR:", err.message);
    console.error("STACK:", err.stack);
  }
  process.exit(0);
})();
