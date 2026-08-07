const { IndustryBenchmark, ClientBenchmark } = require('./benchmark.model');
const mongoose = require('mongoose');



// Function to fetch benchmarking data for a specific client or aggregated for all clients
const getClientBenchmarkData = async (user, clientId, industryName = 'All Industries') => {
    if (!clientId) {
        return { clientData: null, industryData: null };
    }

    if (clientId === 'all') {
        const isAgency = ['agency_super_admin', 'agency_manager'].includes(user.role);
        const User = require('../auth/user.model');
        const isSuperAdmin = ['commander_admin', 'supreme_super_admin'].includes(user.role);
        
        let validBrandIds = [];
        if (isSuperAdmin) {
            const allClients = await User.find({
                $or: [
                    { role: { $in: ['agency_super_admin', 'agency_manager'] } },
                    { role: { $in: ['brand_super_admin', 'brand_manager', 'agency_client'] }, isDirect: true }
                ]
            }).select('_id');
            validBrandIds = allClients.map(c => c._id);
        } else {
            const brandQuery = { role: { $in: ['brand_super_admin', 'brand_manager', 'agency_client'] } };
            if (isAgency) {
                brandQuery.agencyId = user.agencyId || user._id;
            } else {
                brandQuery.isDirect = true;
            }
            const validBrands = await User.find(brandQuery).select('_id');
            validBrandIds = validBrands.map(b => b._id);
        }

        const clients = await ClientBenchmark.find({ clientId: { $in: validBrandIds } });
        
        if (!clients.length) {
             const targetIndustry = industryName !== 'All Industries' ? industryName : 'General';
             const industryData = await IndustryBenchmark.findOne({ industryName: targetIndustry });
             return {
                 clientData: null,
                 industryData: industryData || { industryName: targetIndustry, avgMos: 0, avgSeo: 0, avgAds: 0, avgSocial: 0, avgLeads: 0, avgContent: 0, avgCx: 0 }
             };
        }

        const avg = (key) => Math.round(clients.reduce((acc, curr) => acc + (curr.metrics[key] || 0), 0) / clients.length);
        const avgPerc = (key) => Math.round(clients.reduce((acc, curr) => acc + (curr.percentiles[key] || 0), 0) / clients.length);

        const aggregatedClientData = {
            clientId: { companyName: 'All Clients', industry: 'Multiple' },
            industryName: 'General',
            metrics: {
                mos: avg('mos'), seo: avg('seo'), social: avg('social'), 
                ads: avg('ads'), leads: avg('leads'), content: avg('content'), cx: avg('cx')
            },
            percentiles: {
                mos: avgPerc('mos'), seo: avgPerc('seo'), social: avgPerc('social'),
                ads: avgPerc('ads'), leads: avgPerc('leads'), content: avgPerc('content'), cx: avgPerc('cx')
            }
        };

        const targetIndustry = industryName !== 'All Industries' ? industryName : 'General';
        const industryData = await IndustryBenchmark.findOne({ industryName: targetIndustry });
        
        return {
            clientData: aggregatedClientData,
            industryData: industryData || { industryName: targetIndustry, avgMos: 0, avgSeo: 0, avgAds: 0, avgSocial: 0, avgLeads: 0, avgContent: 0, avgCx: 0 }
        };
    }

    let clientBench = await ClientBenchmark.findOne({ clientId }).populate('clientId', 'name companyName industry');
    
    // Determine the industry to compare against
    const targetIndustry = (industryName && industryName !== 'All Industries') ? industryName : (clientBench?.industryName || 'General');
    const industryData = await IndustryBenchmark.findOne({ industryName: targetIndustry });

    return {
        clientData: clientBench || null,
        industryData: industryData || { industryName: targetIndustry, avgMos: 0, avgSeo: 0, avgAds: 0, avgSocial: 0, avgLeads: 0, avgContent: 0, avgCx: 0 }
    };
};

const getBenchmarkTableData = async (user, industryName = 'All Industries') => {
    const isAgency = ['agency_super_admin', 'agency_manager'].includes(user.role);
    const User = require('../auth/user.model');
    const isSuperAdmin = ['commander_admin', 'supreme_super_admin'].includes(user.role);
    
    let validBrandIds = [];
    if (isSuperAdmin) {
        const allClients = await User.find({
            $or: [
                { role: { $in: ['agency_super_admin', 'agency_manager'] } },
                { role: { $in: ['brand_super_admin', 'brand_manager', 'agency_client'] }, isDirect: true }
            ]
        }).select('_id');
        validBrandIds = allClients.map(c => c._id);
    } else {
        const brandQuery = { role: { $in: ['brand_super_admin', 'brand_manager', 'agency_client'] } };
        if (isAgency) {
            brandQuery.agencyId = user.agencyId || user._id;
        } else {
            brandQuery.isDirect = true;
        }
        const validBrands = await User.find(brandQuery).select('_id');
        validBrandIds = validBrands.map(b => b._id);
    }

    const query = { clientId: { $in: validBrandIds } };
    const clients = await ClientBenchmark.find(query).populate('clientId', 'name companyName industry');

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

// Scheduler function (to be called by cron or manually)
const calculateAndAggregateBenchmarks = async () => {
    console.log('Starting benchmarking aggregation...');
    const { MosScoreHistory } = require('../mos/mos.model');
    const mongoose = require('mongoose');
    
    // Fetch latest month's MosScoreHistory for all clients
    const monthYear = new Date().toISOString().substring(0, 7);
    const recentScores = await MosScoreHistory.find({ monthYear }).populate('clientId', 'industry companyName name');
    
    const industryStats = {};

    for (const score of recentScores) {
        if (!score.clientId) continue;
        
        const clientId = score.clientId._id;
        const industryName = score.clientId.industry || 'General';
        
        // Ensure industry array exists
        if (!industryStats[industryName]) {
            industryStats[industryName] = { clients: [], mos: [], seo: [], social: [], ads: [], leads: [], content: [], cx: [] };
        }
        
        // Map Mos Signals to Benchmark Metrics
        const metrics = {
            mos: score.overallMos || 0,
            seo: score.signals.seo || 0,
            social: score.signals.social || 0,
            ads: score.signals.ads || 0,
            leads: score.signals.leads || 0,
            content: score.signals.website || 0, // Using website signal as a proxy for content right now
            cx: score.signals.cx || 0
        };

        industryStats[industryName].mos.push(metrics.mos);
        industryStats[industryName].seo.push(metrics.seo);
        industryStats[industryName].social.push(metrics.social);
        industryStats[industryName].ads.push(metrics.ads);
        industryStats[industryName].leads.push(metrics.leads);
        industryStats[industryName].content.push(metrics.content);
        industryStats[industryName].cx.push(metrics.cx);
        industryStats[industryName].clients.push({ clientId, metrics });
    }

    // Process and update DB
    for (const [industry, data] of Object.entries(industryStats)) {
        // Calculate industry averages
        const avg = (arr) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
        const avgMos = avg(data.mos);
        const avgSeo = avg(data.seo);
        const avgSocial = avg(data.social);
        const avgAds = avg(data.ads);
        const avgLeads = avg(data.leads);
        const avgContent = avg(data.content);
        const avgCx = avg(data.cx);

        // Update IndustryBenchmark
        await IndustryBenchmark.findOneAndUpdate(
            { industryName: industry },
            { avgMos, avgSeo, avgSocial, avgAds, avgLeads, avgContent, avgCx, lastUpdated: new Date() },
            { upsert: true, returnDocument: 'after' }
        );

        // Calculate percentiles for each client and update ClientBenchmark
        const calcPercentile = (score, arr) => {
            if (arr.length === 0) return 0;
            const lower = arr.filter(v => v < score).length;
            const equal = arr.filter(v => v === score).length;
            return Math.round(((lower + (0.5 * equal)) / arr.length) * 100);
        };

        for (const client of data.clients) {
            const percentiles = {
                mos: calcPercentile(client.metrics.mos, data.mos),
                seo: calcPercentile(client.metrics.seo, data.seo),
                social: calcPercentile(client.metrics.social, data.social),
                ads: calcPercentile(client.metrics.ads, data.ads),
                leads: calcPercentile(client.metrics.leads, data.leads),
                content: calcPercentile(client.metrics.content, data.content),
                cx: calcPercentile(client.metrics.cx, data.cx),
            };

            await ClientBenchmark.findOneAndUpdate(
                { clientId: client.clientId },
                { industryName: industry, metrics: client.metrics, percentiles, lastUpdated: new Date() },
                { upsert: true }
            );
        }
    }
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
