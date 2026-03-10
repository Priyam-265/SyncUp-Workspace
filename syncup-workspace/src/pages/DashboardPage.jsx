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
import { users as mockUsers, channels as initialChannels, messages as initialMessages } from '../data/mockData';

// Sample workspaces for dashboard
const sampleWorkspaces = [
  { id: 1, name: 'Acme Corporation', icon: '🏢', abbr: 'AC', color: 'from-blue-500 to-cyan-500' },
  { id: 2, name: 'Startup Labs', icon: '🚀', abbr: 'SL', color: 'from-purple-500 to-pink-500' },
];

const DashboardPage = () => {
  const navigate = useNavigate();
  const { workspaceId, channelId, userId } = useParams();
  const { darkMode, toggleDarkMode, currentUser, logout } = useTheme();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [channels, setChannels] = useState(initialChannels);
  const [isCreateChannelModalOpen, setCreateChannelModalOpen] = useState(false);
  const [isCreateDmModalOpen, setCreateDmModalOpen] = useState(false);
  const [isAddMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState(sampleWorkspaces[0]);

  // Build the current user from ThemeContext — if user signed up as "Ramu", this shows "Ramu"
  const appUser = {
    id: currentUser.id || 6,
    name: currentUser.displayName || currentUser.name || 'You',
    avatar: currentUser.avatar || (currentUser.displayName || 'Y').substring(0, 2).toUpperCase(),
    color: currentUser.color || 'from-pink-500 to-rose-500',
    status: currentUser.status || 'online',
  };

  // Build full user list = mock users + current user (replace user 6 "John Doe" with actual logged-in user)
  const allUsers = [
    ...mockUsers.filter(u => u.id !== 6),
    { ...appUser },
  ];

  useEffect(() => {
    // Match workspace from URL
    const wsId = parseInt(workspaceId) || 1;
    const ws = sampleWorkspaces.find(w => w.id === wsId) || sampleWorkspaces[0];
    setActiveWorkspace(ws);
  }, [workspaceId]);

  useEffect(() => {
    let chat = null;
    if (channelId) {
      chat = channels.find(c => c.id === parseInt(channelId));
      if (chat) setActiveChat({ type: 'channel', ...chat });
    } else if (userId) {
      chat = allUsers.find(u => u.id === parseInt(userId));
      if (chat) setActiveChat({ type: 'dm', ...chat });
    }
  }, [channelId, userId, channels]);

  useEffect(() => {
    if (activeChat) {
      const messageData = initialMessages[activeChat.type]?.[activeChat.id] || [];
      const populatedMessages = messageData.map(msg => {
        const user = allUsers.find(u => u.id === msg.userId) || {};
        return {
          ...msg,
          name: user.name || 'Unknown',
          avatar: user.avatar || '??',
          color: user.color || 'from-slate-500 to-slate-600',
          status: user.status || 'offline',
          // Ensure reactions have toggle tracking
          reactions: Object.fromEntries(
            Object.entries(msg.reactions || {}).map(([emoji, count]) => [emoji, { count, userReacted: false }])
          )
        };
      });
      setMessages(populatedMessages);
    } else {
      setMessages([]);
    }
  }, [activeChat, currentUser]);

  const handleSendMessage = (text) => {
    if (text.trim() && activeChat) {
      const newMessage = {
        id: Date.now(),
        userId: appUser.id,
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reactions: {},
        name: appUser.name,
        avatar: appUser.avatar,
        color: appUser.color,
        status: appUser.status,
      };
      setMessages(prevMessages => [...prevMessages, newMessage]);
    }
  };

  // Toggle reaction: add if not reacted, remove if already reacted
  const handleReaction = (messageId, emoji) => {
    setMessages(currentMessages =>
      currentMessages.map(msg => {
        if (msg.id === messageId) {
          const newReactions = { ...msg.reactions };
          if (newReactions[emoji]) {
            if (newReactions[emoji].userReacted) {
              newReactions[emoji] = {
                count: Math.max(0, newReactions[emoji].count - 1),
                userReacted: false,
              };
              if (newReactions[emoji].count === 0) {
                delete newReactions[emoji];
              }
            } else {
              newReactions[emoji] = {
                count: newReactions[emoji].count + 1,
                userReacted: true,
              };
            }
          } else {
            newReactions[emoji] = { count: 1, userReacted: true };
          }
          return { ...msg, reactions: newReactions };
        }
        return msg;
      })
    );
  };

  const handleSelectChannel = (channel) => {
    navigate(`/dashboard/${activeWorkspace.id}/channel/${channel.id}`);
  };

  const handleSelectUser = (user) => {
    navigate(`/dashboard/${activeWorkspace.id}/dm/${user.id}`);
  };

  const handleCreateChannel = (channelName, isPrivate) => {
    const newChannel = {
      id: channels.length + 1,
      name: channelName.toLowerCase().replace(/\s+/g, '-'),
      private: isPrivate,
      unread: 0,
      memberCount: 1
    };
    setChannels(prevChannels => [...prevChannels, newChannel]);
    setCreateChannelModalOpen(false);
    navigate(`/dashboard/${activeWorkspace.id}/channel/${newChannel.id}`);
  };

  const handleCreateDm = (user) => {
    setCreateDmModalOpen(false);
    navigate(`/dashboard/${activeWorkspace.id}/dm/${user.id}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSwitchWorkspace = (ws) => {
    setActiveWorkspace(ws);
    navigate(`/dashboard/${ws.id}/channel/1`);
  };

  return (
    <div className="h-screen flex">
      {/* Workspace Switcher Bar */}
      <div className="w-[72px] bg-slate-900 dark:bg-[#1a1e25] flex flex-col items-center py-4 gap-3 border-r border-slate-800 dark:border-[#76ABAE]/10">
        {sampleWorkspaces.map((ws) => (
          <button
            key={ws.id}
            onClick={() => handleSwitchWorkspace(ws)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-lg transition-all hover:rounded-xl ${
              activeWorkspace.id === ws.id
                ? `bg-gradient-to-br ${ws.color} ring-2 ring-white/30`
                : 'bg-slate-700 dark:bg-[#31363F] hover:bg-gradient-to-br hover:' + ws.color + ' opacity-60 hover:opacity-100'
            }`}
            title={ws.name}
          >
            {ws.abbr}
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
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => handleSelectChannel(channel)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all group ${
                    activeChat && activeChat.type === 'channel' && activeChat.id === channel.id
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
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                      {channel.unread}
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