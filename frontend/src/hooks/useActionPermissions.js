/**
 * useActionPermissions hook
 * Checks if the current user has permission to perform a specific action on a given path.
 * Updated to Default-Allow model as per user request.
 */
import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function useActionPermissions(path) {
  const { user } = useAuth();

  const hasPermission = useCallback((action) => {
    return true; // Default-Allow all actions
  }, [user]);

  return { 
    hasPermission,
    canAdd: hasPermission('create'),
    canEdit: hasPermission('edit'),
    canDelete: hasPermission('delete'),
    canView: hasPermission('view')
  };
}

export default useActionPermissions;
