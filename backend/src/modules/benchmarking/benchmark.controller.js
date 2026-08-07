const benchmarkService = require('./benchmark.service');

exports.getClientBenchmarkData = async (req, res, next) => {
    try {
        let clientId = req.query.clientId;
        if (!clientId) {
            clientId = req.user._id;
        }
        
        const industryName = req.query.industry;
        
        const data = await benchmarkService.getClientBenchmarkData(req.user, clientId, industryName);
        
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
        const industryName = req.query.industry;
        
        const data = await benchmarkService.getBenchmarkTableData(req.user, industryName);
        
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

exports.syncBenchmarks = async (req, res, next) => {
    try {
        await benchmarkService.calculateAndAggregateBenchmarks();
        res.status(200).json({
            status: 'success',
            message: 'Benchmarks recalculated successfully'
        });
    } catch (error) {
        next(error);
    }
};
