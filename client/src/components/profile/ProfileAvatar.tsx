// Profile Avatar Component with edit functionality
import { useImageUpload } from '../../hooks/useImageUpload';

interface ProfileAvatarProps {
  avatarUrl?: string | null;
  firstName?: string | null;
  email: string;
  editing: boolean;
  presence?: {
    status: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';
  };
  onAvatarChange: (url: string) => void;
  onRemoveAvatar: () => void;
}

const STATUS_COLORS = {
  ONLINE: 'bg-green-500',
  AWAY: 'bg-yellow-500',
  BUSY: 'bg-red-500',
  OFFLINE: 'bg-gray-500'
};

export default function ProfileAvatar({
  avatarUrl,
  firstName,
  email,
  editing,
  presence,
  onAvatarChange,
  onRemoveAvatar
}: ProfileAvatarProps) {
  const { uploading, handleFileInput } = useImageUpload({
    maxSizeMB: 5
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = await handleFileInput(e);
    if (url) {
      onAvatarChange(url);
    }
  };

  const displayInitial = firstName?.charAt(0) ?? email.charAt(0) ?? '?';

  return (
    <div className="relative -mt-12 mb-4 group">
      <div className="profile-avatar-large relative overflow-hidden">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          displayInitial
        )}

        {/* Edit overlay */}
        {editing && (
          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
            <label
              htmlFor="avatar-upload"
              className="cursor-pointer text-white text-center w-full h-full flex flex-col items-center justify-center"
            >
              <svg
                className="w-12 h-12 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-sm font-bold">
                {uploading ? 'Laddar...' : 'Klicka för att byta bild'}
              </span>
            </label>
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Remove button */}
      {editing && avatarUrl && (
        <button
          onClick={onRemoveAvatar}
          className="absolute top-0 right-0 flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors z-10"
          title="Ta bort bild"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}

      {/* Status badge */}
      {presence && (
        <div
          className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-discord-dark ${STATUS_COLORS[presence.status] ?? STATUS_COLORS.OFFLINE}`}
        />
      )}
    </div>
  );
}
