
module.exports = {
  getCompanyIntegrations: async () => ([]),
  hasIntegration: async () => false,
  resolveCompanyIntegrations: (company) => {
    return {
      email: false,
      whatsapp: false,
    };
  }
};
