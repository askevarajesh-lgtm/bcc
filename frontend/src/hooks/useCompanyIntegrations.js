import { useGetIntegrationsQuery } from '../api/integrationApi';

export default function useCompanyIntegrations() {
  const { data, isLoading } = useGetIntegrationsQuery();
  
  const integrationsList = data?.data?.integrations || [];
  
  const whatsappIntegration = integrationsList.find(i => i.type === 'whatsapp' && i.isActive);
  const emailIntegration = integrationsList.find(i => i.type === 'email' && i.isActive);

  return { 
    integrations: integrationsList, 
    isLoading,
    whatsapp: !!whatsappIntegration,
    email: !!emailIntegration
  };
}
