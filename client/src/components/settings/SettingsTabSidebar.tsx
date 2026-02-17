// Reusable Settings Tab Sidebar Component

type SettingsTab = 'notifications' | 'appearance' | 'about';

interface SettingsTabSidebarProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

const tabs: { id: SettingsTab; label: string }[] = [
  { id: 'notifications', label: 'Notifications' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'about', label: 'About' }
];

export default function SettingsTabSidebar({
  activeTab,
  onTabChange
}: SettingsTabSidebarProps) {
  return (
    <div className="w-64 bg-boxflow-darker flex-shrink-0 overflow-y-auto border-r border-boxflow-darkest">
      <div className="p-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2">
          Settings
        </h2>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-full text-left px-3 py-2 rounded mb-1 transition-colors ${
              activeTab === tab.id
                ? 'bg-[#404249] text-white font-medium rounded-lg'
                : 'text-[#b5bac1] hover:bg-[#404249]/50 hover:text-white rounded-lg'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export type { SettingsTab };
export { tabs };
