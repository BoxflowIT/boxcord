// ============================================================================
// CHAT PAGE - Uses React Query for server data
// ============================================================================
// Workspaces/channels come from React Query hooks
// Zustand only holds currentWorkspace/currentChannel (UI state)
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { socketService } from '../services/socket';
import { useChatStore } from '../store/chat';
import { useWorkspaces, useChannels } from '../hooks/useQuery';
import Sidebar from '../components/Sidebar';
import ChannelView from '../components/ChannelView';
import DMView from '../components/DMView';
import WelcomeView from '../components/WelcomeView';
import MemberList from '../components/MemberList';
import ProfileModal from '../components/ProfileModal';

export default function Chat() {
  const navigate = useNavigate();
  const {
    setCurrentWorkspace,
    setCurrentChannel,
    currentWorkspace
  } = useChatStore();
  const initializedRef = useRef(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMemberList, setShowMemberList] = useState(true);

  // React Query hooks - single source of truth for server data
  const { data: workspaces = [] } = useWorkspaces();
  const { data: channels = [] } = useChannels(currentWorkspace?.id);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Connect to WebSocket
    socketService.connect();

    return () => {
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
  useEffect(() => {
    if (!currentWorkspace) return;
    
    const currentChannelInWorkspace = channels.find(
      (c) => c.id === useChatStore.getState().currentChannel?.id
    );
    
    if (channels.length > 0 && !currentChannelInWorkspace) {
      setCurrentChannel(channels[0]);
      navigate(`/chat/channels/${channels[0].id}`);
    }
  }, [channels, currentWorkspace, navigate, setCurrentChannel]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar onProfileClick={() => setShowProfile(true)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col bg-discord-dark">
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
    </div>
  );
}
