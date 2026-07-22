const resolveCompanyIntegrations = (companyId) => {
  return {
    whatsapp: true,
    sms: true,
    email: true,
    website: true,
    payment: true,
  };
};

module.exports = { resolveCompanyIntegrations };
