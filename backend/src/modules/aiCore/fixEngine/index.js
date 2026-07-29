module.exports = {
  fixEngine: require('./fixEngine.service'),
  templates: require('./templates'),
  contracts: {
    fixResult: require('./contracts/fixResult.contract')
  },
  verification: {
    verificationEngine: require('./verification/verificationEngine.service'),
    verifierRegistry: require('./verification/verifierRegistry')
  }
};
