const resolveCompanyIntegrations = async (companyId) => {
  return {
    whatsapp: true,
    sms: true,
    email: true,
    website: true,
  };
};

module.exports = { resolveCompanyIntegrations };
