const benchmarkService = require('./benchmark.service');

exports.getClientBenchmarkData = async (req, res, next) => {
    try {
        const clientId = req.query.clientId || req.user._id; // Default to self if no client provided
        const industryName = req.query.industry;
        
        const data = await benchmarkService.getClientBenchmarkData(clientId, industryName);
        
        res.status(200).json({
            status: 'success',
            data
        });
    } catch (error) {
        next(error);
    }
};

exports.getBenchmarkTableData = async (req, res, next) => {
    try {
        // agencyId can be extracted from req.user if it's an agency manager
        const agencyId = (req.user.role === 'agency_manager' || req.user.role === 'agency_super_admin') ? req.user._id : req.user.agencyId;
        const industryName = req.query.industry;
        
        const data = await benchmarkService.getBenchmarkTableData(agencyId, industryName);
        
        res.status(200).json({
            status: 'success',
            data
        });
    } catch (error) {
        next(error);
    }
};

exports.getIndustries = async (req, res, next) => {
    try {
        const data = await benchmarkService.getIndustriesList();
        
        res.status(200).json({
            status: 'success',
            data
        });
    } catch (error) {
        next(error);
    }
};

exports.createBenchmark = async (req, res, next) => {
    try {
        const clientId = req.body.clientId;
        if (!clientId) {
            return res.status(400).json({ status: 'error', message: 'clientId is required' });
        }
        
        const data = await benchmarkService.createClientBenchmark(clientId, req.body);
        
        res.status(201).json({
            status: 'success',
            message: 'Benchmark created/updated successfully',
            data
        });
    } catch (error) {
        next(error);
    }
};
