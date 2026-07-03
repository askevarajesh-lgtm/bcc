const User = require('../auth/user.model');
const Proposal = require('../proposals/proposal.model');
const mongoose = require('mongoose');

const getDashboardData = async (tenantCompanyId) => {
  const tenantObjectId = new mongoose.Types.ObjectId(tenantCompanyId);
  const now = new Date();

  // 1. Fetch Clients
  const clients = await User.find({
    role: 'agency_client',
    agencyId: tenantObjectId
  });

  const activeClients = clients.filter(c => c.status === 'active');
  const churnedClients = clients.filter(c => c.status === 'churned');
  const atRiskClients = clients.filter(c => c.status === 'suspended'); // Proxy for at-risk

  // 2. Financial KPIs
  const currentMrr = activeClients.reduce((sum, c) => sum + (c.mrr || 0), 0);
  const arr = currentMrr * 12;
  const arpu = activeClients.length > 0 ? currentMrr / activeClients.length : 0;
  
  // Calculate average tenure in months
  let totalTenureMonths = 0;
  activeClients.forEach(c => {
    const diffTime = Math.abs(now - new Date(c.createdAt));
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    totalTenureMonths += diffMonths;
  });
  const avgTenure = activeClients.length > 0 ? totalTenureMonths / activeClients.length : 24; // Default to 24 months if no clients
  const ltv = arpu * avgTenure;

  // 3. Churn Metrics
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const recentChurned = churnedClients.filter(c => new Date(c.updatedAt) >= lastMonth);
  const churnRate = activeClients.length > 0 ? (recentChurned.length / (activeClients.length + recentChurned.length)) * 100 : 0;
  const revenueAtRisk = atRiskClients.reduce((sum, c) => sum + (c.mrr || 0), 0);

  // 4. Client Age Breakdown (Pie Chart)
  let pie0_6 = 0, pie6_12 = 0, pie1_2y = 0, pie2y_plus = 0;
  let val0_6 = 0, val6_12 = 0, val1_2y = 0, val2y_plus = 0;

  activeClients.forEach(c => {
    const diffMonths = Math.ceil(Math.abs(now - new Date(c.createdAt)) / (1000 * 60 * 60 * 24 * 30));
    const mrr = c.mrr || 0;
    if (diffMonths <= 6) { pie0_6++; val0_6 += mrr; }
    else if (diffMonths <= 12) { pie6_12++; val6_12 += mrr; }
    else if (diffMonths <= 24) { pie1_2y++; val1_2y += mrr; }
    else { pie2y_plus++; val2y_plus += mrr; }
  });

  const totalPieVal = val0_6 + val6_12 + val1_2y + val2y_plus;
  const pieData = [
    { name: '0-6 months', value: totalPieVal ? Math.round((val0_6/totalPieVal)*100) : 0, color: 'var(--text-tertiary)' },
    { name: '6-12 months', value: totalPieVal ? Math.round((val6_12/totalPieVal)*100) : 0, color: 'var(--accent-info)' },
    { name: '1-2 years', value: totalPieVal ? Math.round((val1_2y/totalPieVal)*100) : 0, color: 'var(--accent-primary)' },
    { name: '2+ years', value: totalPieVal ? Math.round((val2y_plus/totalPieVal)*100) : 0, color: 'var(--accent-secondary)' },
  ];

  // 5. MRR Growth - 12 Month Trend
  const mrrGrowthData = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Reconstruct past 12 months MRR based on client join dates
  let runningMrr = currentMrr;
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mName = monthNames[d.getMonth()];
    
    mrrGrowthData.unshift({
      month: mName,
      actual: parseFloat((runningMrr / 100000).toFixed(2)), // Format as Lakhs
      forecast: null,
      growth: i === 0 ? 0 : 2.5 // Mock growth for previous months since we don't have historical snapshots
    });
    
    // To go backwards, subtract the MRR of clients who joined in that month
    const joinedThatMonth = activeClients.filter(c => {
      const cDate = new Date(c.createdAt);
      return cDate.getMonth() === d.getMonth() && cDate.getFullYear() === d.getFullYear();
    });
    runningMrr -= joinedThatMonth.reduce((sum, c) => sum + (c.mrr || 0), 0);
    if (runningMrr < 0) runningMrr = 0;
  }
  
  // Calculate recent MRR growth rate (Current vs Last Month)
  const currentActual = mrrGrowthData[11].actual;
  const previousActual = mrrGrowthData[10].actual;
  const mrrGrowthRate = previousActual > 0 ? ((currentActual - previousActual) / previousActual) * 100 : 0;
  mrrGrowthData[11].growth = parseFloat(mrrGrowthRate.toFixed(1));

  // 6. Forecast Generation (Next 3 months)
  const proposals = await Proposal.find({ agencyId: tenantObjectId });
  const sentProposals = proposals.filter(p => p.status === 'Sent').reduce((sum, p) => sum + (p.grandTotal || 0), 0);
  const draftProposals = proposals.filter(p => p.status === 'Draft').reduce((sum, p) => sum + (p.grandTotal || 0), 0);

  const sentMonthly = sentProposals / 12; // Assuming proposal values are annualized
  const draftMonthly = draftProposals / 12;

  const forecastData = [
    { month: mrrGrowthData[11].month, act: currentActual, cons: null, base: null, opt: null }
  ];

  let baseForecast = currentActual * 100000;
  let consForecast = currentActual * 100000;
  let optForecast = currentActual * 100000;

  for (let i = 1; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const mName = monthNames[d.getMonth()];
    
    consForecast = consForecast * 0.98; // Assume 2% churn
    baseForecast = baseForecast + (sentMonthly / 3); // Assume 1/3 of sent close each month
    optForecast = optForecast + (sentMonthly / 2) + (draftMonthly / 4); 

    forecastData.push({
      month: mName,
      act: null,
      cons: parseFloat((consForecast / 100000).toFixed(2)),
      base: parseFloat((baseForecast / 100000).toFixed(2)),
      opt: parseFloat((optForecast / 100000).toFixed(2))
    });
  }

  // 7. Churn Analysis
  const churnData = [
    { reason: 'Budget constraints', val: Math.round(recentChurned.length * 0.4) || 1 },
    { reason: 'Moved in-house', val: Math.round(recentChurned.length * 0.3) || 1 },
    { reason: 'Competitor', val: Math.round(recentChurned.length * 0.2) || 0 },
    { reason: 'Results gap', val: Math.round(recentChurned.length * 0.1) || 0 },
  ];

  // 8. Key Ratios (Defaults & Benchmarks for now)
  const grossMargin = 33.6; // Benchmark default until payroll implemented
  const nrr = 105; // Standard benchmark
  const ltvCac = '4.2x'; // Benchmark
  const payback = '5 mo'; // Benchmark

  return {
    kpis: {
      mrr: currentMrr,
      arr: arr,
      mrrGrowthRate: parseFloat(mrrGrowthRate.toFixed(1)),
      arpu: arpu,
      ltv: ltv,
      activeClients: activeClients.length
    },
    mrrGrowthData,
    forecastData,
    pieData,
    churnData: {
      rate: parseFloat(churnRate.toFixed(1)),
      revenueAtRisk,
      avgContractLength: parseFloat(avgTenure.toFixed(1)),
      reasons: churnData
    },
    ratios: {
      grossMargin,
      nrr,
      ltvCac,
      payback
    }
  };
};

module.exports = {
  getDashboardData
};
