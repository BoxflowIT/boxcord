// Reusable Role Selector Component (for admins)
import { RoleBadge, type UserRole } from './RoleBadge';
import { cn } from '../../utils/classNames';

interface RoleSelectorProps {
  currentRole: UserRole;
  onChange: (role: UserRole) => void;
  disabled?: boolean;
  canChangeRole?: boolean;
}

const roles: UserRole[] = ['MEMBER', 'ADMIN', 'OWNER'];

export function RoleSelector({
  currentRole,
  onChange,
  disabled = false,
  canChangeRole = true
}: RoleSelectorProps) {
  if (!canChangeRole) {
    return (
      <div>
        <label className="label-base">Roll</label>
        <div className="mt-2">
          <RoleBadge role={currentRole} size="md" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="label-base">Roll</label>
      <div className="flex-row mt-2">
        {roles.map((role) => (
          <button
            key={role}
            onClick={() => onChange(role)}
            disabled={disabled}
            className={cn(
              'px-4 py-2 rounded-lg border transition-colors',
              currentRole === role
                ? 'bg-boxflow-primary text-white border-boxflow-primary'
                : 'bg-boxflow-darker text-boxflow-muted border-boxflow-border hover:bg-boxflow-hover'
            )}
          >
            <RoleBadge role={role} />
          </button>
        ))}
      </div>
    </div>
  );
}
