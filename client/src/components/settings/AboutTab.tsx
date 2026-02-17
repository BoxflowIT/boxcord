// About Tab Component

export default function AboutTab() {
  return (
    <div className="space-y-6">
      <div className="text-gray-400">
        <h3 className="text-white font-semibold mb-4 text-xl">Boxcord</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-300">Version</p>
            <p className="text-sm">1.0.0</p>
          </div>
          <div className="border-t border-discord-darkest pt-4">
            <p className="text-sm font-semibold text-gray-300 mb-2">
              Privacy & Security
            </p>
            <ul className="text-sm space-y-2 list-disc list-inside">
              <li>Messages are encrypted in transit (TLS)</li>
              <li>Your online status is visible to workspace members</li>
              <li>Message history is stored securely</li>
              <li>Authentication via AWS Cognito</li>
            </ul>
          </div>
          <div className="border-t border-discord-darkest pt-4">
            <p className="text-sm font-semibold text-gray-300 mb-2">
              Technology Stack
            </p>
            <ul className="text-sm space-y-1">
              <li>• React + TypeScript</li>
              <li>• Socket.IO for real-time messaging</li>
              <li>• TanStack Query for data management</li>
              <li>• Tailwind CSS for styling</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
