// ============================================================================
// CHAT PAGE - Uses React Query for server data
// ============================================================================
// Workspaces/channels come from React Query hooks
// Zustand only holds currentWorkspace/currentChannel (UI state)
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { socketService } from '../services/socket';
import { useChatStore } from '../store/chat';
import { useWorkspaces, useChannels } from '../hooks/useQuery';
import Sidebar from '../components/Sidebar';
import ChannelView from '../components/ChannelView';
import DMView from '../components/DMView';
import WelcomeView from '../components/WelcomeView';
import MemberList from '../components/MemberList';
import ProfileModal from '../components/ProfileModal';
import SettingsModal from '../components/SettingsModal';
import { GlobalSearch } from '../components/GlobalSearch';

export default function Chat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setCurrentWorkspace, setCurrentChannel, currentWorkspace } =
    useChatStore();
  const initializedRef = useRef(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMemberList, setShowMemberList] = useState(true);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  // React Query hooks - single source of truth for server data
  const { data: workspaces = [] } = useWorkspaces();
  const { data: channels = [] } = useChannels(currentWorkspace?.id);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Connect to WebSocket
    socketService.connect();

    // Handle page refresh - disconnect socket BEFORE unload to prevent 400 errors
    const handleBeforeUnload = () => {
      socketService.disconnect();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Global search keyboard shortcut (Cmd+K or Ctrl+K)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('keydown', handleKeyDown);
      socketService.disconnect();
    };
  }, []);

  // Auto-select first workspace if none selected
  useEffect(() => {
    if (workspaces.length > 0 && !currentWorkspace) {
      setCurrentWorkspace(workspaces[0]);
    }
  }, [workspaces, currentWorkspace, setCurrentWorkspace]);

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
    <div className="flex h-screen overflow-hidden">
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
                } else {
                  // Navigate to DM (we'd need dmChannelId from result)
                  console.log('Navigate to DM:', result);
                }
                setShowGlobalSearch(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
