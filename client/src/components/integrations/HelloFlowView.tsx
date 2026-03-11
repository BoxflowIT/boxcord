/**
 * HelloFlow Intranet view — embedded within Boxcord.
 *
 * Desktop app: renders SharePoint inside a <webview> tag (bypasses CSP).
 * Web browser: shows a branded landing page with a link (CSP blocks iframes).
 */

import { GlobeIcon } from '../ui/Icons';
import { useDesktop } from '../../hooks/useDesktop';

const HELLOFLOW_URL = 'https://boxflow.sharepoint.com/sites/HelloFlow';

function BoxflowLogoLarge() {
  return (
    <img
      src="/logo-128.png"
      alt="Boxflow"
      width={72}
      height={72}
      className="rounded-lg"
    />
  );
}

/** Desktop: embedded SharePoint via <webview> */
function EmbeddedView() {
  return (
    <div className="flex-1 flex flex-col bg-boxflow-dark">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-700">
        <GlobeIcon size="md" />
        <span className="font-medium text-white">HelloFlow Intranät</span>
      </div>
      {/* Electron <webview> — bypasses CSP frame-ancestors */}
      <webview
        src={HELLOFLOW_URL}
        className="flex-1"
        partition="persist:microsoft"
        // @ts-expect-error Electron webview attribute, React warns about non-boolean
        allowpopups="true"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

/** Web browser: landing page with external link */
function LinkView() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-boxflow-dark text-white px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <BoxflowLogoLarge />
        </div>
        <div>
          <h1 className="text-2xl font-bold">HelloFlow Intranät</h1>
          <p className="text-gray-400 mt-2 text-sm">
            Boxflow SharePoint intranät — nyheter, dokument och resurser för
            teamet.
          </p>
        </div>
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
          Öppnas i en ny flik — SharePoint tillåter inte inbäddning i
          webbläsare. Ladda ner Boxcord Desktop för inbäddad vy.
        </p>
      </div>
    </div>
  );
}

export default function HelloFlowView() {
  const { canEmbed } = useDesktop();
  return canEmbed ? <EmbeddedView /> : <LinkView />;
}
