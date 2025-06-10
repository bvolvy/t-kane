import React from 'react';
import { usePermissions } from '../../context/PermissionContext';
import { Shield, Lock } from 'lucide-react';

interface PermissionGuardProps {
  module: string;
  action?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showMessage?: boolean;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  module,
  action = 'view',
  children,
  fallback,
  showMessage = true
}) => {
  const { hasPermission, canAccess } = usePermissions();

  // Check if user can access the module
  if (!canAccess(module)) {
    if (fallback) return <>{fallback}</>;
    
    if (showMessage) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Lock className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Access Restricted</h3>
          <p className="text-gray-500">
            You don't have permission to access this section. Contact your administrator for access.
          </p>
        </div>
      );
    }
    
    return null;
  }

  // Check specific action permission
  if (!hasPermission(module, action)) {
    if (fallback) return <>{fallback}</>;
    
    if (showMessage) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Shield className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Insufficient Permissions</h3>
          <p className="text-gray-500">
            You don't have permission to {action} in this section.
          </p>
        </div>
      );
    }
    
    return null;
  }

  return <>{children}</>;
};

export default PermissionGuard;