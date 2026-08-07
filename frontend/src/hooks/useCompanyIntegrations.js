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
    integrationsList.some(
      (integration) => integration.type === type && integration.isActive
    ) && isEntitled(type);

  return {
    integrationsList,
    isLoading,
    isPlatformAdmin,
    entitledTypes,
    isEntitled,
    hasActive,
  };
}