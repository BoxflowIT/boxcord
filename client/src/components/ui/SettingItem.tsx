// Setting item layout component
interface SettingItemProps {
  title: string;
  description: string;
  control: React.ReactNode;
}

export default function SettingItem({
  title,
  description,
  control
}: SettingItemProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <h3 className="text-white font-semibold mb-1">{title}</h3>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
      <div className="ml-4">{control}</div>
    </div>
  );
}
