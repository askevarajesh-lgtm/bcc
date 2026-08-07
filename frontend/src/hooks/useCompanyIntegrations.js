import { useGetIntegrationsQuery } from '../api/integrationApi';
import { useAuth } from '../contexts/AuthContext';
const PLATFORM_ADMIN_ROLES = ['super_admin', 'supreme_super_admin', 'commander_admin'];


export default function useCompanyIntegrations() {
  const { data, isLoading } = useGetIntegrationsQuery();
  const { user, role } = useAuth();

  const integrationsList = data?.data?.integrations || [];

  const isPlatformAdmin = PLATFORM_ADMIN_ROLES.includes(role);
  const entitledTypes = user?.integrations || [];
  const isEntitled = (type) => isPlatformAdmin || entitledTypes.includes(type);

  const hasActive = (type) =>
    integrationsList.some((i) => i.type === type && i.isActive) && isEntitled(type);

  const whatsappIntegration = integrationsList.find((i) => i.type === 'whatsapp' && i.isActive);
  const emailIntegration = integrationsList.find((i) => i.type === 'email' && i.isActive);

  return {
    integrations: integrationsList,
    isLoading,
    whatsapp: Boolean(whatsappIntegration) && isEntitled('whatsapp'),
    email: Boolean(emailIntegration) && isEntitled('email'),
    sms: hasActive('sms'),
    ekta: hasActive('ekta'),
    ivr: hasActive('ivr'),
    website: hasActive('website'),
    payment: hasActive('payment'),
    isPlatformAdmin,
    entitledTypes,
    isEntitled,
  };
}