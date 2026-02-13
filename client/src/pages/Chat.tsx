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

  // React Query hooks - automatisk caching och deduplicering
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

  // Uppdatera store när workspaces laddas från cache/API
  useEffect(() => {
    if (workspaces) {
      setWorkspaces(workspaces);
      // Auto-select first workspace om ingen är vald
      if (workspaces.length > 0 && !currentWorkspace) {
        setCurrentWorkspace(workspaces[0]);
      }
    }
  }, [workspaces, currentWorkspace, setWorkspaces, setCurrentWorkspace]);

  useEffect(() => {
    // Uppdatera store när channels laddas från cache/API
    if (channels) {
      setChannels(channels);
      // Auto-select first channel ONLY if no channel is currently selected
      // or if the current channel is not in this workspace
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
