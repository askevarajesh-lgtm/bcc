/**
 * useActionPermissions hook
 * Checks if the current user has permission to perform a specific action on a given path.
 * In this project, permissions are role-based via the AuthContext.
 */
import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const ADMIN_ROLES = ['super_admin', 'admin', 'commander_admin', 'operations_head', 'digital_marketing_manager'];

export function useActionPermissions(path) {
  const { user } = useAuth();
  const userRole = user?.role || '';

  const hasPermission = useCallback((action) => {
    // Admins have all permissions
    if (ADMIN_ROLES.includes(userRole)) return true;
    // For other roles, allow view actions by default
    if (typeof action === 'string' && action.startsWith('view')) return true;
    // Allow edit/create for non-intern full-time users
    if (user?.type === 'intern') return false;
    return true;
  }, [userRole, user]);

  return { 
    hasPermission,
    canAdd: hasPermission('create'),
    canEdit: hasPermission('edit'),
    canDelete: hasPermission('delete'),
    canView: hasPermission('view')
  };
}

export default useActionPermissions;
