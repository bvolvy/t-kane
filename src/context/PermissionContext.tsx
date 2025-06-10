import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useAppContext } from './AppContext';
import { Permission } from '../types';

interface PermissionContextType {
  hasPermission: (module: string, action: string) => boolean;
  canAccess: (module: string) => boolean;
  isOwner: () => boolean;
  isAdmin: () => boolean;
  getUserPermissions: () => Permission[];
  getAccessibleModules: () => string[];
}

const PermissionContext = createContext<PermissionContextType>({
  hasPermission: () => false,
  canAccess: () => false,
  isOwner: () => false,
  isAdmin: () => false,
  getUserPermissions: () => [],
  getAccessibleModules: () => [],
});

export const PermissionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { state: authState } = useAuth();
  const { state: appState } = useAppContext();

  const isOwner = (): boolean => {
    return authState.user?.role === 'owner' || 
           authState.organization?.adminId === authState.user?.id;
  };

  const isAdmin = (): boolean => {
    return authState.user?.role === 'admin' || isOwner();
  };

  const getUserPermissions = (): Permission[] => {
    if (isOwner()) {
      // Owner has all permissions
      return [
        { module: 'clients', actions: ['view', 'create', 'edit', 'delete'] },
        { module: 'grills', actions: ['view', 'create', 'edit', 'delete'] },
        { module: 'loans', actions: ['view', 'create', 'edit', 'delete'] },
        { module: 'tontine', actions: ['view', 'create', 'edit', 'delete'] },
        { module: 'transactions', actions: ['view', 'create', 'edit', 'delete'] },
        { module: 'reports', actions: ['view', 'create'] },
        { module: 'settings', actions: ['view', 'edit'] },
      ];
    }

    // Find user's permissions from organization members
    const member = appState.organizationMembers.find(
      m => m.email === authState.user?.email
    );

    return member?.permissions || [];
  };

  const hasPermission = (module: string, action: string): boolean => {
    if (isOwner()) return true;

    const permissions = getUserPermissions();
    const modulePermission = permissions.find(p => p.module === module);
    
    return modulePermission?.actions.includes(action as any) || false;
  };

  const canAccess = (module: string): boolean => {
    if (isOwner()) return true;

    const permissions = getUserPermissions();
    return permissions.some(p => p.module === module && p.actions.length > 0);
  };

  const getAccessibleModules = (): string[] => {
    if (isOwner()) {
      return ['clients', 'grills', 'loans', 'tontine', 'transactions', 'reports', 'settings'];
    }

    const permissions = getUserPermissions();
    return permissions
      .filter(p => p.actions.length > 0)
      .map(p => p.module);
  };

  return (
    <PermissionContext.Provider value={{
      hasPermission,
      canAccess,
      isOwner,
      isAdmin,
      getUserPermissions,
      getAccessibleModules,
    }}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};