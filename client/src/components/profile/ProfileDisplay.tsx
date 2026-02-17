// Profile Display Component (non-editing view)
interface ProfileDisplayProps {
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  role: string;
  bio?: string | null;
  customStatus?: string | null;
}

export default function ProfileDisplay({
  firstName,
  lastName,
  email,
  role,
  bio,
  customStatus
}: ProfileDisplayProps) {
  return (
    <div className="space-y-4">
      {/* Name & Role */}
      <div>
        <h2 className="text-xl font-bold text-white">
          {firstName ?? ''} {lastName ?? ''}
        </h2>
        <p className="text-gray-400">{email}</p>
        <span className="inline-block mt-1 px-2 py-0.5 bg-boxflow-primary-20 text-boxflow-primary text-xs rounded-lg">
          {role}
        </span>
      </div>

      {/* Custom status */}
      {customStatus && (
        <p className="text-sm text-gray-400 italic">"{customStatus}"</p>
      )}

      {/* Bio */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-1">
          Om mig
        </h3>
        <p className="text-gray-300">{bio || 'Ingen bio'}</p>
      </div>
    </div>
  );
}
