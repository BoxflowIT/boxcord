// Chat Page - Main Layout
import { useEffect, useRef, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { useChatStore } from '../store/chat';
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

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Connect to WebSocket
    socketService.connect();

    // Initialize user (ensures user exists + has workspace access)
    api
      .initUser()
      .then(() => {
        // Load workspaces
        return api.getWorkspaces();
      })
      .then((ws) => {
        setWorkspaces(ws);
        // Auto-select first workspace
        if (ws.length > 0) {
          setCurrentWorkspace(ws[0]);
        }
      })
      .catch(console.error);

    return () => {
      socketService.disconnect();
    };
  }, [setWorkspaces, setCurrentWorkspace]);

  useEffect(() => {
    // Load channels when workspace changes
    if (currentWorkspace) {
      api
        .getChannels(currentWorkspace.id)
        .then((ch) => {
          setChannels(ch);
          // Auto-select first channel ONLY if no channel is currently selected
          // or if the current channel is not in this workspace
          const currentChannelInWorkspace = ch.find(
            (c) => c.id === useChatStore.getState().currentChannel?.id
          );
          if (ch.length > 0 && !currentChannelInWorkspace) {
            setCurrentChannel(ch[0]);
            navigate(`/chat/channels/${ch[0].id}`);
          }
        })
        .catch(console.error);
    }
  }, [currentWorkspace, navigate, setChannels, setCurrentChannel]);

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
