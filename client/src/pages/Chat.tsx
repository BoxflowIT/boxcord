// Chat Page - Main Layout
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
    setWorkspaces,
    setChannels,
    setCurrentWorkspace,
    setCurrentChannel,
    currentWorkspace
  } = useChatStore();
  const initializedRef = useRef(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMemberList, setShowMemberList] = useState(true);

  // React Query hooks for auto caching and deduplication
  const { data: workspaces } = useWorkspaces();
  const { data: channels } = useChannels(currentWorkspace?.id);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Connect to WebSocket
    socketService.connect();

    return () => {
      socketService.disconnect();
    };
  }, []);

  // Update store when workspaces load from cache/API
  useEffect(() => {
    if (workspaces) {
      setWorkspaces(workspaces);
      // Auto-select first workspace if none selected
      if (workspaces.length > 0 && !currentWorkspace) {
        setCurrentWorkspace(workspaces[0]);
      }
    }
  }, [workspaces, currentWorkspace, setWorkspaces, setCurrentWorkspace]);

  useEffect(() => {
    // Update store when channels load from cache/API
    if (channels) {
      setChannels(channels);
      // Auto-select first channel only if none selected or current channel not in workspace
      const currentChannelInWorkspace = channels.find(
        (c) => c.id === useChatStore.getState().currentChannel?.id
      );
      if (channels.length > 0 && !currentChannelInWorkspace) {
        setCurrentChannel(channels[0]);
        navigate(`/chat/channels/${channels[0].id}`);
      }
    }
  }, [channels, navigate, setChannels, setCurrentChannel]);

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
