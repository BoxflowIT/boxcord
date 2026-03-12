// ============================================================================
// CHAT PAGE - Uses React Query for server data
// ============================================================================
// Workspaces/channels come from React Query hooks
// Zustand only holds currentWorkspace/currentChannel (UI state)
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { socketService } from '../services/socket';
import { voiceService } from '../services/voice.service';
import { useVoiceStore } from '../store/voiceStore';
import { useAuthStore } from '../store/auth';
import { useChatStore } from '../store/chat';
import { useDMCallStore } from '../store/dmCallStore';
import { useWorkspaces, useChannels } from '../hooks/useQuery';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import Sidebar from '../components/Sidebar';
import ChannelView from '../components/ChannelView';
import DMView from '../components/DMView';
import WelcomeView from '../components/WelcomeView';
import IntegrationView from '../components/integrations/IntegrationView';
import HelloFlowView from '../components/integrations/HelloFlowView';
import MemberList from '../components/MemberList';
import ProfileModal from '../components/ProfileModal';
import SettingsModal from '../components/SettingsModal';
import { GlobalSearch } from '../components/GlobalSearch';
import { DMCallOverlay } from '../components/dm/DMCallOverlay';
import { stopRingingSound, playVoiceLeaveSound } from '../utils/voiceSound';
import { toast } from '../store/notification';
import { UpdateBanner } from '../components/UpdateBanner';
import { getElectronAPI } from '../utils/platform';

export default function Chat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setCurrentWorkspace, setCurrentChannel, currentWorkspace } =
    useChatStore();
  const {
    acceptCall,
    rejectCall,
    endCall,
    channelId: dmCallChannelId
  } = useDMCallStore();
  const initializedRef = useRef(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMemberList, setShowMemberList] = useState(true);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  // React Query hooks - single source of truth for server data
  const { data: workspaces = [] } = useWorkspaces();
  const { data: channels = [] } = useChannels(currentWorkspace?.id);

  // Navigate to next/previous channel
  const navigateChannel = (direction: 'next' | 'prev') => {
    if (!currentWorkspace || channels.length === 0) return;

    const currentPath = location.pathname;
    const channelMatch = currentPath.match(/\/chat\/channels\/([^/]+)/);

    if (channelMatch) {
      const currentChannelId = channelMatch[1];
      const currentIndex = channels.findIndex((c) => c.id === currentChannelId);

      if (currentIndex !== -1) {
        let nextIndex;
        if (direction === 'next') {
          nextIndex = (currentIndex + 1) % channels.length;
        } else {
          nextIndex =
            currentIndex === 0 ? channels.length - 1 : currentIndex - 1;
        }

        const nextChannel = channels[nextIndex];
        setCurrentChannel(nextChannel);
        navigate(`/chat/channels/${nextChannel.id}`);
      }
    } else if (channels.length > 0) {
      // Not currently in a channel, go to first channel
      const firstChannel =
        direction === 'next' ? channels[0] : channels[channels.length - 1];
      setCurrentChannel(firstChannel);
      navigate(`/chat/channels/${firstChannel.id}`);
    }
  };

  // Keyboard shortcuts with expanded handlers
  useKeyboardShortcuts({
    onToggleSettings: () => setShowSettings((prev) => !prev),
    onSearch: () => setShowGlobalSearch(true),
    onNextChannel: () => navigateChannel('next'),
    onPrevChannel: () => navigateChannel('prev')
  });

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Connect to WebSocket
    socketService.connect();

    // Handle page refresh - cleanup voice and disconnect socket BEFORE unload
    const handleBeforeUnload = () => {
      // Leave voice channel if connected (silent - NetworkError expected)
      const { isConnected } = useVoiceStore.getState();
      if (isConnected) {
        voiceService.leaveChannel().catch(() => {
          // Silently ignore - NetworkError is expected during page unload
        });
      }

      // CRITICAL: Cleanup stale sessions on server using fetch with keepalive
      // keepalive ensures request completes even after page unloads
      const token = useAuthStore.getState().token;
      if (token) {
        fetch('/api/v1/voice/users/me/sessions', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
          keepalive: true // Ensures request completes even after page closes
        }).catch(() => {
          // Ignore errors during unload
        });
      }

      socketService.disconnect();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      socketService.disconnect();
    };
  }, []);

  // Desktop: navigate to channel/DM when notification is clicked
  useEffect(() => {
    const api = getElectronAPI();
    if (!api) return;

    return api.onNotificationClicked((tag) => {
      if (tag.startsWith('channel-')) {
        navigate(`/chat/channels/${tag.slice('channel-'.length)}`);
      } else if (tag.startsWith('dm-')) {
        navigate(`/chat/dm/${tag.slice('dm-'.length)}`);
      }
    });
  }, [navigate]);

  // Auto-select first workspace if none selected
  useEffect(() => {
    if (workspaces.length > 0 && !currentWorkspace) {
      setCurrentWorkspace(workspaces[0]);
    }
  }, [workspaces, currentWorkspace, setCurrentWorkspace]);

  // Handle Microsoft 365 OAuth redirect params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('microsoft_connected') === 'true') {
      toast.success('Microsoft 365 ansluten!');
      window.history.replaceState({}, '', window.location.pathname);
    }
    const msError = params.get('microsoft_error');
    if (msError) {
      toast.error(`Microsoft 365-fel: ${decodeURIComponent(msError)}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Auto-select first channel when workspace changes
  // BUT respect the current URL if it points to a valid channel/DM
  useEffect(() => {
    if (!currentWorkspace) return;

    // Check if URL already has a channel/DM - don't redirect away
    const urlMatch = location.pathname.match(/\/chat\/(channels|dm)\/([^/]+)/);
    if (urlMatch) {
      const [, type, urlChannelId] = urlMatch;

      // For channels, verify it exists in current workspace
      if (type === 'channels') {
        const channelExists = channels.find((c) => c.id === urlChannelId);
        if (channelExists) {
          // URL is valid, sync state if needed
          if (useChatStore.getState().currentChannel?.id !== urlChannelId) {
            setCurrentChannel(channelExists);
          }
          return; // Don't redirect
        }
      } else if (type === 'dm') {
        // DM routes are valid, don't redirect
        return;
      }
    }

    // No valid URL channel - auto-select first channel
    const currentChannelInWorkspace = channels.find(
      (c) => c.id === useChatStore.getState().currentChannel?.id
    );

    if (channels.length > 0 && !currentChannelInWorkspace) {
      setCurrentChannel(channels[0]);
      navigate(`/chat/channels/${channels[0].id}`);
    }
  }, [
    channels,
    currentWorkspace,
    navigate,
    setCurrentChannel,
    location.pathname
  ]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <UpdateBanner />
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <Sidebar
          onProfileClick={() => setShowProfile(true)}
          onSettingsClick={() => setShowSettings(true)}
        />

        {/* Main content */}
        <div className="flex-1 flex flex-col bg-boxflow-dark">
          <Routes>
            <Route
              path="channels/:channelId"
              element={
                <ChannelView
                  onToggleMemberList={() => setShowMemberList(!showMemberList)}
                />
              }
            />
            <Route path="dm/:channelId" element={<DMView />} />
            <Route path="site/helloflow" element={<HelloFlowView />} />
            <Route path="integrations/:type" element={<IntegrationView />} />
            <Route path="*" element={<WelcomeView />} />
          </Routes>
        </div>

        {/* Member List */}
        {showMemberList && <MemberList />}

        {/* Profile Modal */}
        <ProfileModal
          isOpen={showProfile}
          onClose={() => setShowProfile(false)}
        />

        {/* Settings Modal */}
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />

        {/* Global Search */}
        {showGlobalSearch && (
          <div className="fixed inset-0 bg-black/70 flex items-start justify-center pt-20 z-50">
            <div className="w-full max-w-2xl">
              <GlobalSearch
                onClose={() => setShowGlobalSearch(false)}
                onResultClick={(result) => {
                  if (result.type === 'channel') {
                    navigate(`/chat/channels/${result.channel?.id}`);
                  }
                  setShowGlobalSearch(false);
                }}
              />
            </div>
          </div>
        )}

        {/* Global DM Call Overlay - Shows everywhere when a call is active */}
        <DMCallOverlay
          onAccept={async () => {
            acceptCall();
            // Join WebRTC call via voice service
            await voiceService.joinChannel(dmCallChannelId || '');
          }}
          onReject={() => {
            // Play hangup sound and stop ringing
            playVoiceLeaveSound();
            stopRingingSound();
            rejectCall();
            // Clean up voice state
            voiceService.leaveChannel();
          }}
          onEndCall={() => {
            // Play hangup sound
            playVoiceLeaveSound();
            stopRingingSound();
            endCall();
            voiceService.leaveChannel();
          }}
        />
      </div>
    </div>
  );
}
