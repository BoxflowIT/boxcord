/**
 * HelloFlow Intranet view — embedded landing page within Boxcord.
 *
 * SharePoint Online blocks iframe embedding via CSP (frame-ancestors),
 * so we show a branded portal page with a direct link that opens in a new tab.
 */

import { GlobeIcon } from '../ui/Icons';

const HELLOFLOW_URL = 'https://boxflow.sharepoint.com/sites/HelloFlow';

function BoxflowLogoLarge() {
  return (
    <svg width="72" height="72" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#0d9488" />
      <text
        x="50%"
        y="54%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="18"
        fontWeight="bold"
        fill="white"
        fontFamily="Arial, sans-serif"
      >
        BF
      </text>
    </svg>
  );
}

export default function HelloFlowView() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-boxflow-dark text-white px-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <BoxflowLogoLarge />
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold">HelloFlow Intranät</h1>
          <p className="text-gray-400 mt-2 text-sm">
            Boxflow SharePoint intranät — nyheter, dokument och resurser för
            teamet.
          </p>
        </div>

        {/* Open button */}
        <a
          href={HELLOFLOW_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-lg transition-colors"
        >
          <GlobeIcon size="md" />
          Öppna HelloFlow
        </a>

        <p className="text-xs text-gray-500">
          Öppnas i en ny flik — SharePoint tillåter inte inbäddning.
        </p>
      </div>
    </div>
  );
}
