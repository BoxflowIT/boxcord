// Member Search Input - Search bar for filtering members

interface MemberSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function MemberSearch({
  value,
  onChange,
  placeholder = 'Sök efter namn eller e-post...'
}: MemberSearchProps) {
  return (
    <div className="px-4 py-2 border-b border-boxflow-border">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-boxflow-dark text-boxflow-light border border-boxflow-border rounded px-3 py-2 text-sm outline-none focus:border-boxflow-primary"
        autoFocus
      />
    </div>
  );
}
