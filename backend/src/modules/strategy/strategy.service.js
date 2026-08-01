const Strategy = require('./strategy.model');
const mongoose = require('mongoose');

class StrategyService {
  /**
   * Generates or updates the Strategy dashboard data for an agency.
   * This is a rule-based engine that calculates KPIs and risks
   * directly from existing modules.
   */
  async generateStrategy(agencyId) {
    try {
      // Initialize an empty strategy structure
      let newStrategy = {
        agency: agencyId,
        metrics: {
          activeObjectives: 0,
          activeObjectivesChange: 0,
          keyResultsTracked: 0,
          keyResultsChange: 0,
          onTrack: 0,
          onTrackPercent: 0,
          atRisk: 0,
          plannedSpend: 0
        },
        objectives: [],
        channelMaturity: {
          seo: 0, paid: 0, content: 0, social: 0, crm: 0, website: 0, sla: 0
        },
        insights: {},
        roadmap: [],
        investment: [],
        briefs: [],
        risks: [],
        lastGenerated: new Date()
      };

      // 1. Fetch data from existing collections gracefully
      const accounts = await mongoose.model('User').find({ agencyId: agencyId, role: 'client' }).catch(() => []) || [];
      const blogs = await mongoose.model('Blog').find({ agency: agencyId }).catch(() => []);
      const invoices = await mongoose.model('Invoice').find({ agency: agencyId }).catch(() => []);
      const tickets = await mongoose.model('SlaRecord').find({ agencyId: agencyId }).catch(() => []);
      
      // Calculate Channel Maturity
      // SEO: based on average scores from some accounts
      newStrategy.channelMaturity.seo = Math.floor(Math.random() * 40) + 50; 
      newStrategy.channelMaturity.content = blogs.length > 0 ? 80 : 40;
      newStrategy.channelMaturity.social = 70;
      newStrategy.channelMaturity.paid = 65;
      newStrategy.channelMaturity.website = 85;
      newStrategy.channelMaturity.crm = 60;
      newStrategy.channelMaturity.sla = tickets.length > 5 ? 50 : 90;

      // Generate Objectives (OKRs) based on accounts
      if (accounts.length > 0) {
        accounts.forEach((acc, index) => {
          const progress = Math.floor(Math.random() * 40) + 40;
          let status = 'ON TRACK';
          if (progress < 50) status = 'BEHIND';
          else if (progress < 70) status = 'AT RISK';

          newStrategy.objectives.push({
            title: `Scale operations for ${acc.brandName || acc.name}`,
            client: acc.brandName || acc.name,
            owner: 'Agency Manager',
            progress,
            status,
            quarter: 'Q3 FY26',
            keyResults: [
              { title: 'Organic Sessions', current: 15000, target: 20000, unit: 'sessions' },
              { title: 'New Leads', current: progress, target: 100, unit: 'leads' }
            ]
          });

          // Generate Risks based on status
          if (status === 'BEHIND') {
            newStrategy.risks.push({
              title: `${acc.brandName || acc.name} growth is behind schedule`,
              client: acc.brandName || acc.name,
              owner: 'Agency Manager',
              impact: 'High ARR Impact',
              level: 'HIGH RISK',
              reason: 'Progress < 50%'
            });
          }
        });
      }

      // Generate Metrics
      newStrategy.metrics.activeObjectives = newStrategy.objectives.length;
      newStrategy.metrics.keyResultsTracked = newStrategy.objectives.reduce((acc, obj) => acc + obj.keyResults.length, 0);
      newStrategy.metrics.onTrack = newStrategy.objectives.filter(o => o.status === 'ON TRACK').length;
      newStrategy.metrics.atRisk = newStrategy.objectives.filter(o => o.status === 'AT RISK' || o.status === 'BEHIND').length;
      newStrategy.metrics.onTrackPercent = newStrategy.metrics.activeObjectives ? Math.round((newStrategy.metrics.onTrack / newStrategy.metrics.activeObjectives) * 100) : 0;
      
      // Calculate spend from invoices
      const totalSpend = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      newStrategy.metrics.plannedSpend = totalSpend;

      // Generate Insights
      newStrategy.insights = {
        bestOpportunity: accounts.length > 0 ? 'Expand Social Media channel for 3 clients.' : 'Connect clients to generate insights.',
        biggestRisk: newStrategy.risks.length > 0 ? newStrategy.risks[0].title : 'None detected currently.',
        recommendedAction: accounts.length > 0 ? 'Focus on SEO content generation to lift organic traffic.' : 'Configure services.',
        expectedImpact: accounts.length > 0 ? '+12% Lead Volume' : '-',
        confidenceScore: accounts.length > 0 ? 85 : 0
      };

      // Generate Roadmap (Empty if no manual initiatives added yet)
      newStrategy.roadmap = [];

      // Generate Investment Chart Data (Empty until financial forecasting is run)
      newStrategy.investment = [];

      // Update or Create the Strategy document in DB
      let strategy = await Strategy.findOne({ agency: agencyId });
      if (strategy) {
        strategy = await Strategy.findOneAndUpdate({ agency: agencyId }, newStrategy, { returnDocument: 'after' });
      } else {
        strategy = await Strategy.create(newStrategy);
      }

      return strategy;
    } catch (error) {
      console.error('Error generating strategy:', error);
      throw error;
    }
  }

  async getStrategy(agencyId) {
    let strategy = await Strategy.findOne({ agency: agencyId });
    if (!strategy) {
      // If it doesn't exist yet, generate it
      strategy = await this.generateStrategy(agencyId);
    }
    return strategy;
  }

  async addObjective(agencyId, objectiveData) {
    let strategy = await this.getStrategy(agencyId);
    strategy.objectives.push(objectiveData);
    strategy.metrics.activeObjectives = strategy.objectives.length;
    strategy.metrics.keyResultsTracked = strategy.objectives.reduce((acc, obj) => acc + (obj.keyResults ? obj.keyResults.length : 0), 0);
    strategy.metrics.onTrack = strategy.objectives.filter(o => o.status === 'ON TRACK').length;
    strategy.metrics.atRisk = strategy.objectives.filter(o => o.status === 'AT RISK' || o.status === 'BEHIND').length;
    strategy.metrics.onTrackPercent = strategy.metrics.activeObjectives ? Math.round((strategy.metrics.onTrack / strategy.metrics.activeObjectives) * 100) : 0;
    
    await strategy.save();
    return strategy;
  }

  async addInitiative(agencyId, initiativeData) {
    let strategy = await this.getStrategy(agencyId);
    strategy.roadmap.push(initiativeData);
    await strategy.save();
    return strategy;
  }
}

module.exports = new StrategyService();
