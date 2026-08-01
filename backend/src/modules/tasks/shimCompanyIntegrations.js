
const Integration = require("../integrations/integration.model");

module.exports = {
  getCompanyIntegrations: async () => ([]),
  hasIntegration: async () => false,
  resolveCompanyIntegrations: async (companyId) => {
    try {
      const integrations = await Integration.find({
        companyId: companyId,
        isActive: true
      });
      return {
        email: integrations.some(i => i.type === 'email'),
        whatsapp: integrations.some(i => i.type === 'whatsapp')
      };
    } catch (error) {
      return { email: false, whatsapp: false };
    }
  }
};
