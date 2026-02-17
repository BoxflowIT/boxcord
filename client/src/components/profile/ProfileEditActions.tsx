// Profile Edit Actions (Save/Cancel/Edit buttons)
interface ProfileEditActionsProps {
  editing: boolean;
  saving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function ProfileEditActions({
  editing,
  saving,
  onEdit,
  onSave,
  onCancel
}: ProfileEditActionsProps) {
  return (
    <div className="flex gap-2">
      {editing ? (
        <>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-discord-darker hover:bg-discord-darkest text-white rounded"
          >
            Avbryt
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-[#5865f2] to-[#4752c4] hover:from-[#4752c4] hover:to-[#3c44a8] text-white rounded-lg shadow-lg shadow-[#5865f2]/25 disabled:opacity-50 transition-all"
          >
            {saving ? 'Sparar...' : 'Spara'}
          </button>
        </>
      ) : (
        <button
          onClick={onEdit}
          className="flex-1 px-4 py-2 bg-gradient-to-r from-[#5865f2] to-[#4752c4] hover:from-[#4752c4] hover:to-[#3c44a8] text-white rounded-lg shadow-lg shadow-[#5865f2]/25 transition-all"
        >
          Redigera profil
        </button>
      )}
    </div>
  );
}
