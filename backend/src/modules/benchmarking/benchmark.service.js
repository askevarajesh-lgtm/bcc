const { IndustryBenchmark, ClientBenchmark } = require('./benchmark.model');
const mongoose = require('mongoose');

// Mock data generator for testing if no data exists
const generateMockData = async () => {
    // This is to quickly seed some industries if none exist
    const count = await IndustryBenchmark.countDocuments();
    if (count === 0) {
        await IndustryBenchmark.insertMany([
            { industryName: 'Real Estate', avgMos: 68, avgSeo: 65, avgAds: 70, avgSocial: 60, avgLeads: 72, avgContent: 68, avgCx: 70 },
            { industryName: 'Consumer Electronics', avgMos: 72, avgSeo: 75, avgAds: 78, avgSocial: 80, avgLeads: 70, avgContent: 75, avgCx: 65 },
            { industryName: 'Mobility', avgMos: 65, avgSeo: 60, avgAds: 65, avgSocial: 70, avgLeads: 68, avgContent: 62, avgCx: 60 },
            { industryName: 'Beauty', avgMos: 74, avgSeo: 78, avgAds: 75, avgSocial: 85, avgLeads: 72, avgContent: 80, avgCx: 70 },
            { industryName: 'Fintech', avgMos: 70, avgSeo: 72, avgAds: 68, avgSocial: 65, avgLeads: 75, avgContent: 70, avgCx: 72 },
            { industryName: 'E-Commerce', avgMos: 76, avgSeo: 80, avgAds: 78, avgSocial: 75, avgLeads: 74, avgContent: 76, avgCx: 70 },
            { industryName: 'Q-Commerce', avgMos: 71, avgSeo: 68, avgAds: 72, avgSocial: 70, avgLeads: 75, avgContent: 65, avgCx: 68 },
            { industryName: 'Retail', avgMos: 69, avgSeo: 65, avgAds: 70, avgSocial: 68, avgLeads: 66, avgContent: 70, avgCx: 65 },
            { industryName: 'Hospitality', avgMos: 67, avgSeo: 70, avgAds: 65, avgSocial: 75, avgLeads: 68, avgContent: 65, avgCx: 70 },
            { industryName: 'Services', avgMos: 63, avgSeo: 60, avgAds: 62, avgSocial: 65, avgLeads: 64, avgContent: 60, avgCx: 68 },
            { industryName: 'D2C', avgMos: 68, avgSeo: 70, avgAds: 72, avgSocial: 75, avgLeads: 65, avgContent: 70, avgCx: 68 },
            { industryName: 'General', avgMos: 60, avgSeo: 60, avgAds: 60, avgSocial: 60, avgLeads: 60, avgContent: 60, avgCx: 60 }
        ]);
    }
}

// Function to fetch benchmarking data for a specific client
const getClientBenchmarkData = async (clientId, industryName = 'All Industries') => {
    await generateMockData(); // Ensure we have industries

    // We can fetch from ClientBenchmark if precalculated, or we fetch the MOS score directly.
    // For now, let's look for the ClientBenchmark
    let clientBench = await ClientBenchmark.findOne({ clientId }).populate('clientId', 'name companyName industry');
    
    if (!clientBench) {
        // Fallback: If not precalculated, we can generate a temporary one on the fly or just return defaults
        // In a real scenario, this would trigger the sync service for this client
        clientBench = {
            clientId: { name: 'Client', companyName: 'Client Co', industry: 'General' },
            industryName: 'General',
            percentiles: { mos: 50, seo: 50, ads: 50, social: 50, leads: 50, content: 50, cx: 50 },
            metrics: { mos: 60, seo: 60, ads: 60, social: 60, leads: 60, content: 60, cx: 60 },
            historicalSnapshots: []
        };
    }

    // Determine the industry to compare against
    const targetIndustry = (industryName && industryName !== 'All Industries') ? industryName : (clientBench.industryName || clientBench.clientId.industry || 'General');
    const industryData = await IndustryBenchmark.findOne({ industryName: targetIndustry });

    return {
        clientData: clientBench,
        industryData: industryData || { industryName: targetIndustry, avgMos: 50, avgSeo: 50, avgAds: 50, avgSocial: 50, avgLeads: 50, avgContent: 50, avgCx: 50 }
    };
};

const getBenchmarkTableData = async (agencyId, industryName = 'All Industries') => {
    // Get all clients for this agency (or all if not filtered, but we should scope it)
    // Fetch from ClientBenchmark where agency matches (we might need to join User to check agencyId)
    // For now, let's fetch all ClientBenchmarks and join the User to filter
    const query = {};
    const clients = await ClientBenchmark.find(query).populate({
        path: 'clientId',
        match: agencyId ? { agencyId: new mongoose.Types.ObjectId(agencyId) } : {},
        select: 'name companyName industry'
    });

    const filteredClients = clients.filter(c => c.clientId != null);

    // If an industry is selected, filter by it
    let result = filteredClients;
    if (industryName && industryName !== 'All Industries') {
        result = result.filter(c => (c.industryName === industryName || c.clientId.industry === industryName));
    }

    // Get all industry averages to calculate differences
    const industries = await IndustryBenchmark.find({});
    const industryMap = industries.reduce((acc, curr) => {
        acc[curr.industryName] = curr;
        return acc;
    }, {});

    return result.map(c => {
        const ind = c.industryName || c.clientId.industry || 'General';
        const indAvg = industryMap[ind]?.avgMos || 0;
        return {
            id: c._id,
            client: c.clientId.companyName || c.clientId.name,
            industry: ind,
            mos: c.metrics.mos,
            avg: indAvg,
            diff: c.metrics.mos - indAvg,
            seoRank: c.percentiles.seo,
            adsRank: c.percentiles.ads,
            socialRank: c.percentiles.social
        };
    });
};

const getIndustriesList = async () => {
    const industries = await IndustryBenchmark.find({}).select('industryName');
    return industries.map(i => i.industryName);
};

// Scheduler function (to be called by cron)
const calculateAndAggregateBenchmarks = async () => {
    console.log('Starting benchmarking aggregation...');
    // In a full implementation, this would:
    // 1. Fetch all clients
    // 2. Fetch their latest MosScoreHistory
    // 3. Update ClientBenchmark documents
    // 4. Group by industry and update IndustryBenchmark documents
    console.log('Benchmarking aggregation completed.');
};

const createClientBenchmark = async (clientId, benchmarkData) => {
    const { industryName, metrics, percentiles } = benchmarkData;

    let clientBench = await ClientBenchmark.findOne({ clientId });
    
    if (clientBench) {
        // Update
        if (industryName) clientBench.industryName = industryName;
        if (metrics) clientBench.metrics = { ...clientBench.metrics, ...metrics };
        if (percentiles) clientBench.percentiles = { ...clientBench.percentiles, ...percentiles };
        clientBench.lastUpdated = new Date();
    } else {
        // Create
        clientBench = new ClientBenchmark({
            clientId,
            industryName: industryName || 'General',
            metrics: metrics || {},
            percentiles: percentiles || {}
        });
    }

    await clientBench.save();
    return clientBench;
};

module.exports = {
    getClientBenchmarkData,
    getBenchmarkTableData,
    getIndustriesList,
    calculateAndAggregateBenchmarks,
    createClientBenchmark
};
