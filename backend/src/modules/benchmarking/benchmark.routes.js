const express = require('express');
const router = express.Router();
const benchmarkController = require('./benchmark.controller');
const protect = require('../../middlewares/authMiddleware');

router.use(protect);

router.get('/dashboard', benchmarkController.getClientBenchmarkData);
router.get('/table', benchmarkController.getBenchmarkTableData);
router.get('/industries', benchmarkController.getIndustries);
router.post('/sync', benchmarkController.syncBenchmarks);
router.post('/', benchmarkController.createBenchmark);

module.exports = router;
