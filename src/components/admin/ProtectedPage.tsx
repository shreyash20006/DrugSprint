import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

interface ProtectedPageProps {
  children: React.ReactNode;
  hasAccess: boolean;
  title?: string;
  description?: string;
}

export const ProtectedPage: React.FC<ProtectedPageProps> = ({
  children,
  hasAccess,
  title = 'Access Restricted',
  description,
}) => {
  const navigate = useNavigate();

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-orange-burnt/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-orange-burnt" />
          </div>
          <h1 className="font-display font-extrabold text-2xl text-navy-dark mb-2">
            🔒 {title}
          </h1>
          <p className="text-sm text-navy-dark/60 font-sans mb-4">
            You don&apos;t have permission to access this page.
          </p>
          {description ? (
            <p className="text-xs text-navy-dark/50 font-sans mb-8 whitespace-pre-line">
              {description}
            </p>
          ) : (
            <div className="mb-8" />
          )}
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="px-6 py-3 bg-orange-burnt hover:bg-orange-burnt/90 text-white rounded-lg font-display text-sm font-bold transition-all shadow-md shadow-orange-burnt/15"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedPage;
