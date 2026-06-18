import React from 'react';
import { Loader2 } from 'lucide-react';
import { useRole } from '../../hooks/useRole';
import { ProtectedPage } from './ProtectedPage';

interface RequirePermissionProps {
  permission: string;
  children: React.ReactNode;
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({
  permission,
  children,
}) => {
  const { loading, can } = useRole();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-navy-dark/40">
        <Loader2 className="w-8 h-8 animate-spin mr-3 text-orange-burnt" />
        <span className="font-display text-sm">Verifying permissions...</span>
      </div>
    );
  }

  return (
    <ProtectedPage hasAccess={can(permission)}>
      {children}
    </ProtectedPage>
  );
};

export default RequirePermission;
