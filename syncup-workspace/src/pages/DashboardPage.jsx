import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Hash, Lock, Settings, MoreVertical, Plus, ChevronDown, Moon, Sun, LogOut, X, UserPlus
} from 'lucide-react';
import SearchBar from '../components/SearchBar';
import DirectMessageList from '../components/DirectMessageList';
import ChatView from '../components/ChatView';
import CreateChannelModal from '../components/CreateChannelModal';
import CreateDirectMessageModal from '../components/CreateDirectMessageModal';
import AddMemberModal from '../components/AddMemberModal';
import { useTheme } from '../context/ThemeContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { messageAPI, channelAPI } from '../services/api';
import { socketService } from '../services/socket';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { workspaceId, channelId, userId } = useParams();
  const { darkMode, toggleDarkMode, currentUser, logout } = useTheme();
  const { workspaces, fetchWorkspaces } = useWorkspace();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [channels, setChannels] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isCreateChannelModalOpen, setCreateChannelModalOpen] = useState(false);
  const [isCreateDmModalOpen, setCreateDmModalOpen] = useState(false);
  const [isAddMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState(null);

  useEffect(() => {
    if (workspaces.length === 0) fetchWorkspaces();
  }, [fetchWorkspaces, workspaces.length]);

  useEffect(() => {
    if (workspaces.length > 0) {
      const ws = workspaces.find(w => w._id === workspaceId) || workspaces[0];
      if (ws) {
        setActiveWorkspace(ws);
        setChannels(ws.channels || []);
        
        if (!currentUser) return; // Prevent crash when currentUser is not loaded

        const appUser = {
          id: currentUser._id,
          name: currentUser.displayName || currentUser.firstName || currentUser.fullName || 'You',
          avatar: currentUser.avatar || (currentUser.displayName || currentUser.fullName || 'Y').substring(0, 2).toUpperCase(),
          color: currentUser.color || 'from-pink-500 to-rose-500',
          status: currentUser.status || 'online',
        };

        const mappedMembers = (ws.members || []).map(m => {
          if (m._id === currentUser._id) return appUser;
          return {
            id: m._id,
            name: m.fullName || m.displayName || m.email,
            avatar: m.avatar || 'U',
            color: 'from-blue-500 to-cyan-500',
            status: m.status || 'online',
          };
        });

        if (!mappedMembers.find(m => m.id === appUser.id)) {
           mappedMembers.push(appUser);
        }
        setAllUsers(mappedMembers);
      }
    }
  }, [workspaceId, workspaces, currentUser]);

  useEffect(() => {
    if (!activeWorkspace || !currentUser) return;
    
    socketService.connect();
    socketService.joinWorkspace(activeWorkspace._id);
    socketService.emit('user-online', { userId: currentUser._id, workspaceId: activeWorkspace._id });

    const onPresenceChange = ({ userId, status }) => {
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
    };

    socketService.on('user-status-changed', onPresenceChange);

    return () => {
      socketService.emit('user-offline', { userId: currentUser._id, workspaceId: activeWorkspace._id });
      socketService.leaveWorkspace(activeWorkspace._id);
      socketService.off('user-status-changed', onPresenceChange);
    };
  }, [activeWorkspace, currentUser]);

  useEffect(() => {
    let chat = null;
    if (channelId && channels.length > 0) {
      chat = channels.find(c => c._id === channelId) || channels[0];
      if (chat) Object.assign(chat, { isPrivate: chat.isPrivate, inviteCode: chat.inviteCode });
      if (chat) setActiveChat({ type: 'channel', ...chat, id: chat._id, memberCount: chat.members?.length || 1 });
    } else if (userId && allUsers.length > 0) {
      chat = allUsers.find(u => u.id === userId);
      if (chat) setActiveChat({ type: 'dm', ...chat });
    } else if (channels.length > 0 && !channelId && !userId && activeWorkspace) {
      navigate(`/dashboard/${activeWorkspace._id}/channel/${channels[0]._id}`, { replace: true });
    }
  }, [channelId, userId, channels, allUsers, activeWorkspace, navigate]);

  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }
    
    // Clear messages temporarily to show crisp load
    const fetchMsgs = async () => {
      try {
        let targetId = null;

        if (activeChat.type === 'channel') {
           targetId = activeChat.id;
        } else if (activeChat.type === 'dm') {
          const dmRes = await channelAPI.getOrCreateDm(activeWorkspace._id, activeChat.id);
          activeChat.channelId = dmRes._id;
          targetId = dmRes._id;
          
          socketService.joinChannel(targetId);
          setChannels(prev => {
            if (!prev.find(c => c._id === targetId)) {
               return [...prev, { ...dmRes, unread: 0 }];
            }
            return prev;
          });
        }

        if (targetId) {
          const res = await messageAPI.getMessages(targetId);
          const mapped = res.messages.reverse().map(msg => ({
            id: msg._id,
            userId: msg.sender._id,
            text: msg.text,
            time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            reactions: {}, 
            name: msg.sender.fullName || msg.sender.email,
            avatar: msg.sender.avatar || 'U',
            color: 'from-blue-500 to-cyan-500',
          }));
          setMessages(mapped);
          
          // Clear any unread notifications on opening this channel
          setChannels(prev => prev.map(c => String(c._id) === String(targetId) ? { ...c, unread: 0 } : c));
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
        setMessages([]);
      }
    };
    fetchMsgs();
  }, [activeChat]);

  // Handle global socket subscriptions
  useEffect(() => {
    socketService.connect();
    
    // Join *ALL* channels we are part of so we get backgrounds notifications
    channels.forEach(ch => socketService.joinChannel(ch._id));

    const onNewMessage = (msg) => {
      const msgChannelId = typeof msg.channel === 'object' ? msg.channel._id : msg.channel;
      const activeChatId = activeChat?._id || activeChat?.id;

      if (String(msgChannelId) === String(activeChatId)) {
        setMessages(prev => [...prev, {
          id: msg._id,
          userId: msg.sender?._id || msg.sender,
          text: msg.text,
          time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          reactions: {},
          name: msg.sender?.fullName || msg.sender?.email || 'Unknown',
          avatar: msg.sender?.avatar || 'U',
          color: 'from-blue-500 to-cyan-500',
        }]);
      } else {
        // We received a message for a background channel! Increment its unread badge.
        setChannels(prev => prev.map(c => 
          String(c._id) === String(msgChannelId)
            ? { ...c, unread: (c.unread || 0) + 1 }
            : c
        ));
      }
    };

    socketService.on('new-message', onNewMessage);

    return () => {
      socketService.off('new-message', onNewMessage);
      channels.forEach(ch => socketService.leaveChannel(ch._id));
    };
  }, [activeChat, channels]);

  const handleSendMessage = async (text) => {
    if (text.trim() && activeChat) {
      try {
        const targetId = activeChat.type === 'channel' ? activeChat.id : activeChat.channelId;
        if (targetId) {
           await messageAPI.sendMessage(targetId, text);
        }
      } catch (err) {
        console.error('Failed to send message:', err);
      }
    }
  };

  const handleReaction = (messageId, emoji) => {
    // Basic local state update for now, ideally persist to backend
  };

  const handleSelectChannel = (channel) => {
    navigate(`/dashboard/${activeWorkspace._id}/channel/${channel._id}`);
  };

  const handleSelectUser = (user) => {
    navigate(`/dashboard/${activeWorkspace._id}/dm/${user.id}`);
  };

  const handleCreateChannel = async (channelName, isPrivate) => {
    try {
      if (!activeWorkspace) return;
      const data = await channelAPI.create(activeWorkspace._id, {
        name: channelName,
        isPrivate
      });
      // Update local state directly to be snappy
      setChannels(prev => [...prev, data]);
      setCreateChannelModalOpen(false);
      navigate(`/dashboard/${activeWorkspace._id}/channel/${data._id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinChannel = async (inviteCode) => {
    try {
      if (!activeWorkspace) return;
      const data = await channelAPI.joinByCode(inviteCode);
      
      if (!channels.find(c => c._id === data._id)) {
        setChannels(prev => [...prev, data]);
      }
      setCreateChannelModalOpen(false);
      navigate(`/dashboard/${activeWorkspace._id}/channel/${data._id}`);
    } catch (err) {
      console.error('Failed to join channel:', err);
      alert('Failed to join channel. Make sure the code is correct.');
    }
  };

  const handleCreateDm = (user) => {
    setCreateDmModalOpen(false);
    navigate(`/dashboard/${activeWorkspace._id}/dm/${user.id}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSwitchWorkspace = (ws) => {
    setActiveWorkspace(ws);
    navigate(`/dashboard/${ws._id}`);
  };

  if (!activeWorkspace || !currentUser) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100 dark:bg-[#222831]">
        <div className="w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  const appUser = allUsers.find(u => u.id === currentUser._id) || {
    id: currentUser._id, name: currentUser.fullName || currentUser.displayName || 'You', avatar: 'U', color: 'from-blue-500 to-cyan-500', status: 'online'
  };

  return (
    <div className="h-screen flex">
      {/* Workspace Switcher Bar */}
      <div className="w-[72px] bg-slate-900 dark:bg-[#1a1e25] flex flex-col items-center py-4 gap-3 border-r border-slate-800 dark:border-[#76ABAE]/10">
        {/* Back to Workspaces */}
        <button
          onClick={() => navigate('/workspaces')}
          className="w-12 h-12 rounded-2xl bg-slate-800 dark:bg-[#31363F] hover:bg-slate-700 dark:hover:bg-[#76ABAE]/20 flex items-center justify-center transition-all hover:rounded-xl mb-1 group"
          title="Back to Workspaces"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-400 dark:text-[#76ABAE] group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="w-8 border-t border-slate-600 dark:border-[#76ABAE]/20 my-1"></div>
        {workspaces.map((ws) => (
          <button
            key={ws._id}
            onClick={() => handleSwitchWorkspace(ws)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-lg transition-all hover:rounded-xl ${
              activeWorkspace._id === ws._id
                ? `bg-gradient-to-br from-blue-500 to-cyan-500 ring-2 ring-white/30`
                : 'bg-slate-700 dark:bg-[#31363F] hover:bg-gradient-to-br hover:from-blue-500 hover:to-cyan-500 opacity-60 hover:opacity-100'
            }`}
            title={ws.name}
          >
            {(ws.icon || ws.name.substring(0, 2)).toUpperCase()}
          </button>
        ))}
        <div className="w-8 border-t border-slate-600 dark:border-[#76ABAE]/20 my-1"></div>
        <button
          onClick={() => navigate('/workspaces')}
          className="w-12 h-12 rounded-2xl bg-slate-800 dark:bg-[#31363F] hover:bg-slate-700 dark:hover:bg-[#76ABAE]/20 flex items-center justify-center transition-all hover:rounded-xl"
        >
          <Plus className="w-5 h-5 text-slate-400 dark:text-[#76ABAE]" />
        </button>
      </div>

      {/* Left Sidebar - Channels */}
      <div className="w-64 bg-blue-600 dark:bg-[#222831] flex flex-col border-r border-blue-500/50 dark:border-[#76ABAE]/20 transition-colors duration-500">
        {/* Workspace Header */}
        <div className="p-3 border-b border-blue-500/50 dark:border-[#76ABAE]/20">
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{activeWorkspace.icon}</span>
              <div className="text-left">
                <div className="text-white font-bold text-sm truncate max-w-[140px]">{activeWorkspace.name}</div>
                <div className="text-blue-200 dark:text-[#EEEEEE]/50 text-xs">{allUsers.length} members</div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-blue-200 dark:text-[#EEEEEE]/50" />
          </div>
          {/* Add Member Button */}
          <button
            onClick={() => setAddMemberModalOpen(true)}
            className="w-full mt-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/30 dark:bg-[#76ABAE]/20 hover:bg-blue-500/50 dark:hover:bg-[#76ABAE]/30 rounded-xl transition-colors text-white dark:text-[#76ABAE] text-sm font-semibold"
          >
            <UserPlus className="w-4 h-4" />
            Add Member
          </button>
        </div>
        {/* Search */}
        <div className="p-3">
          <SearchBar />
        </div>
        {/* Channels List */}
        <div className="flex-1 overflow-y-auto px-2">
          <div className="mb-4">
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2 text-blue-200 dark:text-[#EEEEEE]/50 text-xs font-semibold">
                <ChevronDown className="w-3 h-3" />
                <span>CHANNELS</span>
              </div>
              <button onClick={() => setCreateChannelModalOpen(true)} className="w-5 h-5 hover:bg-blue-500 dark:hover:bg-[#31363F] rounded flex items-center justify-center transition-colors">
                <Plus className="w-3 h-3 text-blue-200 dark:text-[#EEEEEE]/50" />
              </button>
            </div>
            <div className="space-y-0.5">
              {channels.filter(c => !c.name.startsWith('DM-')).map((channel) => (
                <button
                  key={channel._id}
                  onClick={() => handleSelectChannel(channel)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all group ${
                    activeChat && activeChat.type === 'channel' && activeChat.id === channel._id
                      ? 'bg-blue-500 dark:bg-[#76ABAE]/30 text-white'
                      : 'text-blue-100 dark:text-[#EEEEEE]/70 hover:bg-blue-500/60 dark:hover:bg-[#31363F]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {channel.private ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <Hash className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">{channel.name}</span>
                  </div>
                  {channel.unread > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                      {channel.unread > 9 ? '9+' : channel.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          {/* Direct Messages */}
          <div className="mb-4">
            <DirectMessageList
              users={allUsers.filter(u => u.id !== appUser.id)}
              onSelectUser={handleSelectUser}
              activeChat={activeChat}
              onOpenCreateDmModal={() => setCreateDmModalOpen(true)}
            />
          </div>
        </div>
        {/* User Profile Footer */}
        <div className="p-3 border-t border-blue-500/50 dark:border-[#76ABAE]/20">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-3 p-2 hover:bg-blue-500/60 dark:hover:bg-[#31363F] rounded-lg transition-colors group"
            >
              <div className="relative">
                <div className={`w-9 h-9 bg-gradient-to-br ${appUser.color} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
                  {appUser.avatar}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-blue-600 dark:border-[#222831] rounded-full"></div>
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-white text-sm font-semibold truncate">{appUser.name}</div>
                <div className="text-blue-200 dark:text-[#EEEEEE]/50 text-xs">{appUser.status}</div>
              </div>
              <MoreVertical className="w-4 h-4 text-blue-200 dark:text-[#EEEEEE]/50 group-hover:text-white transition-colors flex-shrink-0" />
            </button>
            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white/90 dark:bg-[#31363F]/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-200/50 dark:border-[#76ABAE]/20 overflow-hidden z-30">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-[#222831]/60 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-600 dark:text-[#EEEEEE]/50" />
                  <span className="text-sm font-medium text-slate-900 dark:text-[#EEEEEE]">Settings</span>
                </button>
                <button
                  onClick={() => { toggleDarkMode(); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-[#222831]/60 transition-colors"
                >
                  {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-slate-600 dark:text-[#EEEEEE]/50" />}
                  <span className="text-sm font-medium text-slate-900 dark:text-[#EEEEEE]">
                    {darkMode ? 'Light Mode' : 'Dark Mode'}
                  </span>
                </button>
                <div className="border-t border-slate-200/50 dark:border-[#76ABAE]/20"></div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <ChatView
        chatDetails={activeChat}
        messages={messages}
        onSendMessage={handleSendMessage}
        onReaction={handleReaction}
        currentUser={appUser}
      />

      {/* Modals */}
      <CreateChannelModal
        isOpen={isCreateChannelModalOpen}
        onClose={() => setCreateChannelModalOpen(false)}
        onCreateChannel={handleCreateChannel}
        onJoinChannel={handleJoinChannel}
      />
      <CreateDirectMessageModal
        isOpen={isCreateDmModalOpen}
        onClose={() => setCreateDmModalOpen(false)}
        users={allUsers.filter(u => u.id !== appUser.id)}
        onSelectUser={handleCreateDm}
      />
      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setAddMemberModalOpen(false)}
        workspaceId={activeWorkspace._id}
      />

      {/* Right Sidebar - Online Users */}
      <div className="w-64 bg-slate-50 dark:bg-[#222831] border-l border-slate-200 dark:border-[#76ABAE]/20 overflow-y-auto transition-colors duration-500">
        <div className="p-4">
          <h3 className="text-xs font-bold text-slate-500 dark:text-[#EEEEEE]/50 uppercase tracking-wider mb-4">
            Online — {allUsers.filter(u => u.status === 'online').length}
          </h3>
          <div className="space-y-2">
            {allUsers.filter(u => u.status === 'online').map((user) => (
              <button
                key={user.id}
                className="w-full flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-[#31363F] rounded-lg transition-colors group"
              >
                <div className="relative">
                  <div className={`w-9 h-9 bg-gradient-to-br ${user.color} rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                    {user.avatar}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-slate-50 dark:border-[#222831] rounded-full"></div>
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-[#EEEEEE] truncate">
                  {user.name}
                </span>
              </button>
            ))}
          </div>
          <h3 className="text-xs font-bold text-slate-500 dark:text-[#EEEEEE]/50 uppercase tracking-wider mb-4 mt-6">
            Away — {allUsers.filter(u => u.status === 'away').length}
          </h3>
          <div className="space-y-2">
            {allUsers.filter(u => u.status === 'away').map((user) => (
              <button
                key={user.id}
                className="w-full flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-[#31363F] rounded-lg transition-colors group"
              >
                <div className="relative">
                  <div className={`w-9 h-9 bg-gradient-to-br ${user.color} rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg opacity-60`}>
                    {user.avatar}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-yellow-500 border-2 border-slate-50 dark:border-[#222831] rounded-full"></div>
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-[#EEEEEE] opacity-60 truncate">
                  {user.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;