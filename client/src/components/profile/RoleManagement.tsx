interface RoleManagementProps {
  userId: string;
  currentRole: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'USER';
  onChangeRole: (role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF') => void;
  isChanging: boolean;
}

/**
 * Role management section for admin users
 * Only visible for SUPER_ADMIN users viewing other profiles
 */
export default function RoleManagement({
  currentRole,
  onChangeRole,
  isChanging
}: RoleManagementProps) {
  return (
    <div className="pt-4 border-t border-discord-darkest">
      <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
        Rollhantering
      </h3>
      <div className="space-y-2">
        <p className="text-sm text-gray-400 mb-2">
          Nuvarande roll:{' '}
          <span className="text-white font-semibold">{currentRole}</span>
        </p>
        <div className="flex gap-2">
          {currentRole !== 'STAFF' && (
            <button
              onClick={() => onChangeRole('STAFF')}
              disabled={isChanging}
              className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded disabled:opacity-50"
            >
              Gör till Staff
            </button>
          )}
          {currentRole !== 'ADMIN' && (
            <button
              onClick={() => onChangeRole('ADMIN')}
              disabled={isChanging}
              className="flex-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded disabled:opacity-50"
            >
              Gör till Admin
            </button>
          )}
          {currentRole !== 'SUPER_ADMIN' && (
            <button
              onClick={() => onChangeRole('SUPER_ADMIN')}
              disabled={isChanging}
              className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded disabled:opacity-50"
            >
              Gör till Super Admin
            </button>
          )}
        </div>
        {isChanging && (
          <p className="text-xs text-gray-400 italic">Ändrar roll...</p>
        )}
      </div>
    </div>
  );
}
