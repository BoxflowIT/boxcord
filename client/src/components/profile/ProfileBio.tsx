// Profile Bio Component
interface ProfileBioProps {
  bio?: string | null;
  editing: boolean;
  onBioChange: (value: string) => void;
}

export default function ProfileBio({
  bio,
  editing,
  onBioChange
}: ProfileBioProps) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-400 uppercase mb-1">
        Om mig
      </h3>
      {editing ? (
        <textarea
          value={bio ?? ''}
          onChange={(e) => onBioChange(e.target.value)}
          placeholder="Skriv något om dig själv..."
          className="w-full px-3 py-2 bg-discord-darkest rounded text-white resize-none"
          rows={3}
          maxLength={500}
        />
      ) : (
        <p className="text-gray-300">{bio || 'Ingen bio'}</p>
      )}
    </div>
  );
}
