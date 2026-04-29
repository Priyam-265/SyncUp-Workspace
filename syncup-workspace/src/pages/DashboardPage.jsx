import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Hash, Lock, Settings, MoreVertical, Plus, ChevronDown, Moon, Sun, LogOut, UserPlus, Copy, Check
} from 'lucide-react';
import SearchBar from '../components/SearchBar';
import DirectMessageList from '../components/DirectMessageList';
import ChatView from '../components/ChatView';
import CreateChannelModal from '../components/CreateChannelModal';
import CreateDirectMessageModal from '../components/CreateDirectMessageModal';
import AddMemberModal from '../components/AddMemberModal';
import UserAvatar from '../components/UserAvatar';
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
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Refs to avoid stale closures and prevent re-render loops
  const dmChannelIdRef = useRef(null);
  const currentTargetIdRef = useRef(null);
  const prevChannelId = useRef(null);
  const prevUserId = useRef(null);
  const prevJoinedChannelRef = useRef(null);

  // Effect 1: Fetch workspaces
  useEffect(() => {
    if (workspaces.length === 0) fetchWorkspaces();
  }, [fetchWorkspaces, workspaces.length]);

  // Effect 2: Setup workspace, channels, users
  useEffect(() => {
    if (workspaces.length > 0 && currentUser) {
      const ws = workspaces.find(w => w._id === workspaceId) || workspaces[0];
      if (ws) {
        setActiveWorkspace(ws);
        // Merge channels from workspace but preserve existing unread counts
        setChannels(prev => {
          const newChannels = ws.channels || [];
          if (prev.length === 0) return newChannels;
          // Carry forward unread counts from previous state
          const unreadMap = {};
          prev.forEach(c => { if (c.unread) unreadMap[c._id] = c.unread; });
          return newChannels.map(c => ({ ...c, unread: unreadMap[c._id] || 0 }));
        });

        const appUser = {
          id: currentUser._id,
          name: currentUser.displayName || currentUser.fullName || 'You',
          avatar: (currentUser.displayName || currentUser.fullName || 'Y').substring(0, 2).toUpperCase(),
          avatarUrl: currentUser.avatar || '',
          color: 'from-pink-500 to-rose-500',
          status: currentUser.status || 'online',
        };

        const mappedMembers = (ws.members || []).map(m => {
          if (m._id === currentUser._id) return appUser;
          const isUrl = m.avatar && (m.avatar.startsWith('http') || m.avatar.startsWith('data:'));
          return {
            id: m._id,
            name: m.fullName || m.displayName || m.email,
            avatar: isUrl ? (m.fullName || 'U').substring(0, 2).toUpperCase() : (m.avatar || (m.fullName || 'U').substring(0, 2).toUpperCase()),
            avatarUrl: isUrl ? m.avatar : '',
            color: 'from-blue-500 to-cyan-500',
            status: m.status || 'offline',
          };
        });

        if (!mappedMembers.find(m => m.id === appUser.id)) {
          mappedMembers.push(appUser);
        }
        setAllUsers(mappedMembers);
      }
    }
  }, [workspaceId, workspaces, currentUser]);

  // Effect 3: Socket connection for workspace
  useEffect(() => {
    if (!activeWorkspace || !currentUser) return;
    socketService.connect();
    socketService.emit('join-workspace', { workspaceId: activeWorkspace._id, userId: currentUser._id });
    socketService.emit('user-online', { userId: currentUser._id, workspaceId: activeWorkspace._id });

    const onPresenceChange = ({ userId: uid, status }) => {
      setAllUsers(prev => prev.map(u => u.id === uid ? { ...u, status } : u));
    };
    socketService.on('user-status-changed', onPresenceChange);

    return () => {
      socketService.emit('user-offline', { userId: currentUser._id, workspaceId: activeWorkspace._id });
      socketService.leaveWorkspace(activeWorkspace._id);
      socketService.off('user-status-changed', onPresenceChange);
    };
  }, [activeWorkspace?._id, currentUser?._id]);

  // Effect 4: Set activeChat from URL (NO message fetching here)
  useEffect(() => {
    if (channelId && channels.length > 0) {
      const ch = channels.find(c => c._id === channelId);
      if (ch) {
        setActiveChat({ type: 'channel', ...ch, id: ch._id, memberCount: ch.members?.length || 1 });
        dmChannelIdRef.current = null;
      }
    } else if (userId && allUsers.length > 0) {
      const user = allUsers.find(u => u.id === userId);
      if (user) {
        setActiveChat({ type: 'dm', ...user });
      }
    } else if (channels.length > 0 && !channelId && !userId && activeWorkspace) {
      navigate(`/dashboard/${activeWorkspace._id}/channel/${channels[0]._id}`, { replace: true });
    }
  }, [channelId, userId, channels.length, allUsers.length, activeWorkspace?._id]);

  // Effect 5: Fetch messages when URL params change (KEY FIX for flicker)
  useEffect(() => {
    if (!activeWorkspace || !currentUser) return;
    if (!channelId && !userId) return;

    // Prevent re-fetch if params haven't actually changed
    if (prevChannelId.current === channelId && prevUserId.current === userId) return;
    prevChannelId.current = channelId;
    prevUserId.current = userId;

    // Clear messages immediately to prevent stale content flash
    setMessages([]);

    // Leave previous channel room
    if (prevJoinedChannelRef.current) {
      socketService.leaveChannel(prevJoinedChannelRef.current);
    }

    let cancelled = false;

    const fetchMessages = async () => {
      try {
        let targetId = null;

        if (channelId) {
          targetId = channelId;
          dmChannelIdRef.current = null;
        } else if (userId) {
          const dmRes = await channelAPI.getOrCreateDm(activeWorkspace._id, userId);
          if (cancelled) return;
          targetId = dmRes._id;
          dmChannelIdRef.current = targetId;
        }

        if (cancelled) return;
        currentTargetIdRef.current = targetId;

        if (targetId) {
          // Join the new channel room for real-time
          socketService.joinChannel(targetId);
          prevJoinedChannelRef.current = targetId;

          const res = await messageAPI.getMessages(targetId);
          if (cancelled) return;
          const mapped = (res.messages || []).reverse().map(msg => mapMessage(msg, currentUser._id));
          setMessages(mapped);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
        if (!cancelled) setMessages([]);
      }
    };

    fetchMessages();
    return () => { cancelled = true; };
  }, [channelId, userId, activeWorkspace?._id, currentUser?._id]);

  // Effect 6: Socket listeners for real-time messages, deletions, reactions
  // Also join ALL channels so we receive background messages for unread counts
  useEffect(() => {
    if (!activeWorkspace) return;
    socketService.connect();

    // Join all workspace channels for background unread notifications
    channels.forEach(ch => socketService.joinChannel(ch._id));

    const onNewMessage = (msg) => {
      const msgChId = typeof msg.channel === 'object' ? msg.channel._id : msg.channel;
      const curTarget = currentTargetIdRef.current;

      if (String(msgChId) === String(curTarget)) {
        setMessages(prev => {
          // Deduplicate
          if (prev.some(m => m.id === msg._id)) return prev;
          return [...prev, mapMessage(msg, currentUser?._id)];
        });
      } else {
        setChannels(prev => prev.map(c =>
          String(c._id) === String(msgChId) ? { ...c, unread: (c.unread || 0) + 1 } : c
        ));
        
        // Also track unread for Direct Messages (if the message came from a user)
        const senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
        if (senderId) {
          setAllUsers(prev => prev.map(u => 
            String(u.id) === String(senderId) ? { ...u, unread: (u.unread || 0) + 1 } : u
          ));
        }
      }
    };

    const onMessageDeleted = ({ messageId }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    };

    const onReactionUpdated = ({ messageId, reactions }) => {
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, reactions: formatReactions(reactions, currentUser?._id) } : m
      ));
    };

    socketService.on('new-message', onNewMessage);
    socketService.on('message-deleted', onMessageDeleted);
    socketService.on('reaction-updated', onReactionUpdated);

    return () => {
      socketService.off('new-message', onNewMessage);
      socketService.off('message-deleted', onMessageDeleted);
      socketService.off('reaction-updated', onReactionUpdated);
    };
  }, [channels.length, activeWorkspace?._id, currentUser?._id]);

  const handleSendMessage = useCallback(async (text) => {
    if (!text.trim()) return;
    try {
      const targetId = channelId || dmChannelIdRef.current;
      if (targetId) {
        await messageAPI.sendMessage(targetId, text);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  }, [channelId]);

  const handleReaction = useCallback(async (messageId, emoji) => {
    try {
      const res = await messageAPI.toggleReaction(messageId, emoji);
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, reactions: formatReactions(res.reactions, currentUser?._id) } : m
      ));
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    }
  }, [currentUser?._id]);

  const handleDeleteMessage = useCallback(async (messageId) => {
    try {
      await messageAPI.deleteMessage(messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  }, []);

  const handleSelectChannel = (channel) => {
    setChannels(prev => prev.map(c => String(c._id) === String(channel._id) ? { ...c, unread: 0 } : c));
    prevChannelId.current = null; // force re-fetch
    prevUserId.current = null;
    navigate(`/dashboard/${activeWorkspace._id}/channel/${channel._id}`);
  };

  const handleSelectUser = (user) => {
    setAllUsers(prev => prev.map(u => String(u.id) === String(user.id) ? { ...u, unread: 0 } : u));
    prevChannelId.current = null;
    prevUserId.current = null;
    navigate(`/dashboard/${activeWorkspace._id}/dm/${user.id}`);
  };

  const handleCreateChannel = async (channelName, isPrivate) => {
    try {
      if (!activeWorkspace) return;
      const data = await channelAPI.create(activeWorkspace._id, { name: channelName, isPrivate });
      setChannels(prev => [...prev, data]);
      setCreateChannelModalOpen(false);
      prevChannelId.current = null;
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
      prevChannelId.current = null;
      navigate(`/dashboard/${activeWorkspace._id}/channel/${data._id}`);
    } catch (err) {
      console.error('Failed to join channel:', err);
      alert('Failed to join channel. Make sure the code is correct.');
    }
  };

  const handleShowInvite = (code) => {
    setShowInviteCode(code);
    setCopiedInvite(false);
  };

  const handleCopyInviteCode = () => {
    if (showInviteCode) {
      navigator.clipboard.writeText(showInviteCode);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    }
  };

  const handleCreateDm = (user) => {
    setCreateDmModalOpen(false);
    prevUserId.current = null;
    navigate(`/dashboard/${activeWorkspace._id}/dm/${user.id}`);
  };

  const handleLogout = () => { logout(); navigate('/login'); };
  const handleSwitchWorkspace = (ws) => {
    prevChannelId.current = null;
    prevUserId.current = null;
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
    id: currentUser._id, name: currentUser.fullName || 'You', avatar: 'U', color: 'from-blue-500 to-cyan-500', status: 'online'
  };

  return (
    <div className="h-screen flex">
      {/* Workspace Switcher Bar */}
      <div className="w-[72px] bg-slate-900 dark:bg-[#1a1e25] flex flex-col items-center py-4 gap-3 border-r border-slate-800 dark:border-[#76ABAE]/10">
        <button onClick={() => navigate('/workspaces')} className="w-12 h-12 rounded-2xl bg-slate-800 dark:bg-[#31363F] hover:bg-slate-700 dark:hover:bg-[#76ABAE]/20 flex items-center justify-center transition-all hover:rounded-xl mb-1 group" title="Back to Workspaces">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-400 dark:text-[#76ABAE] group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="w-8 border-t border-slate-600 dark:border-[#76ABAE]/20 my-1"></div>
        {workspaces.map((ws) => (
          <button key={ws._id} onClick={() => handleSwitchWorkspace(ws)} className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-lg transition-all hover:rounded-xl ${activeWorkspace._id === ws._id ? 'bg-gradient-to-br from-blue-500 to-cyan-500 ring-2 ring-white/30' : 'bg-slate-700 dark:bg-[#31363F] hover:bg-gradient-to-br hover:from-blue-500 hover:to-cyan-500 opacity-60 hover:opacity-100'}`} title={ws.name}>
            {(ws.icon || ws.name.substring(0, 2)).toUpperCase()}
          </button>
        ))}
        <div className="w-8 border-t border-slate-600 dark:border-[#76ABAE]/20 my-1"></div>
        <button onClick={() => navigate('/workspaces')} className="w-12 h-12 rounded-2xl bg-slate-800 dark:bg-[#31363F] hover:bg-slate-700 dark:hover:bg-[#76ABAE]/20 flex items-center justify-center transition-all hover:rounded-xl">
          <Plus className="w-5 h-5 text-slate-400 dark:text-[#76ABAE]" />
        </button>
      </div>

      {/* Left Sidebar */}
      <div className="w-64 bg-blue-600 dark:bg-[#222831] flex flex-col border-r border-blue-500/50 dark:border-[#76ABAE]/20 transition-colors duration-500">
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
          <button onClick={() => setAddMemberModalOpen(true)} className="w-full mt-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/30 dark:bg-[#76ABAE]/20 hover:bg-blue-500/50 dark:hover:bg-[#76ABAE]/30 rounded-xl transition-colors text-white dark:text-[#76ABAE] text-sm font-semibold">
            <UserPlus className="w-4 h-4" /> Add Member
          </button>
        </div>
        <div className="p-3">
          <SearchBar channels={channels.filter(c => !c.name?.startsWith('DM-'))} users={allUsers} workspaceId={activeWorkspace._id} />
        </div>
        <div className="flex-1 overflow-y-auto px-2">
          <div className="mb-4">
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2 text-blue-200 dark:text-[#EEEEEE]/50 text-xs font-semibold">
                <ChevronDown className="w-3 h-3" /><span>CHANNELS</span>
              </div>
              <button onClick={() => setCreateChannelModalOpen(true)} className="w-5 h-5 hover:bg-blue-500 dark:hover:bg-[#31363F] rounded flex items-center justify-center transition-colors">
                <Plus className="w-3 h-3 text-blue-200 dark:text-[#EEEEEE]/50" />
              </button>
            </div>
            <div className="space-y-0.5">
              {channels.filter(c => !c.name?.startsWith('DM-')).map((channel) => (
                <button key={channel._id} onClick={() => handleSelectChannel(channel)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all group ${activeChat && activeChat.type === 'channel' && activeChat.id === channel._id ? 'bg-blue-500 dark:bg-[#76ABAE]/30 text-white' : 'text-blue-100 dark:text-[#EEEEEE]/70 hover:bg-blue-500/60 dark:hover:bg-[#31363F]'}`}>
                  <div className="flex items-center gap-2">
                    {channel.isPrivate ? <Lock className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
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
          <div className="mb-4">
            <DirectMessageList users={allUsers.filter(u => u.id !== appUser.id)} onSelectUser={handleSelectUser} activeChat={activeChat} onOpenCreateDmModal={() => setCreateDmModalOpen(true)} />
          </div>
        </div>
        {/* User Profile Footer */}
        <div className="p-3 border-t border-blue-500/50 dark:border-[#76ABAE]/20">
          <div className="relative">
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="w-full flex items-center gap-3 p-2 hover:bg-blue-500/60 dark:hover:bg-[#31363F] rounded-lg transition-colors group">
              <div className="relative">
                <UserAvatar avatarUrl={appUser.avatarUrl} initials={appUser.avatar} color={appUser.color} />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-blue-600 dark:border-[#222831] rounded-full"></div>
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-white text-sm font-semibold truncate">{appUser.name}</div>
                <div className="text-blue-200 dark:text-[#EEEEEE]/50 text-xs">{appUser.status}</div>
              </div>
              <MoreVertical className="w-4 h-4 text-blue-200 dark:text-[#EEEEEE]/50 group-hover:text-white transition-colors flex-shrink-0" />
            </button>
            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white/90 dark:bg-[#31363F]/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-200/50 dark:border-[#76ABAE]/20 overflow-hidden z-30">
                <button onClick={() => { setShowUserMenu(false); navigate('/settings'); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-[#222831]/60 transition-colors">
                  <Settings className="w-4 h-4 text-slate-600 dark:text-[#EEEEEE]/50" />
                  <span className="text-sm font-medium text-slate-900 dark:text-[#EEEEEE]">Settings</span>
                </button>
                <button onClick={() => { toggleDarkMode(); setShowUserMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-[#222831]/60 transition-colors">
                  {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                  <span className="text-sm font-medium text-slate-900 dark:text-[#EEEEEE]">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <div className="border-t border-slate-200/50 dark:border-[#76ABAE]/20"></div>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400">
                  <LogOut className="w-4 h-4" /><span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <ChatView chatDetails={activeChat} messages={messages} onSendMessage={handleSendMessage} onReaction={handleReaction} onDeleteMessage={handleDeleteMessage} currentUser={appUser} onShowInvite={handleShowInvite} />

      {/* Modals */}
      <CreateChannelModal isOpen={isCreateChannelModalOpen} onClose={() => setCreateChannelModalOpen(false)} onCreateChannel={handleCreateChannel} onJoinChannel={handleJoinChannel} />
      <CreateDirectMessageModal isOpen={isCreateDmModalOpen} onClose={() => setCreateDmModalOpen(false)} users={allUsers.filter(u => u.id !== appUser.id)} onSelectUser={handleCreateDm} />
      <AddMemberModal isOpen={isAddMemberModalOpen} onClose={() => setAddMemberModalOpen(false)} workspaceId={activeWorkspace._id} />

      {/* Invite Code Popup */}
      {showInviteCode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowInviteCode(false)}>
          <div className="bg-white/95 dark:bg-[#31363F]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 dark:border-[#76ABAE]/20 p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-[#EEEEEE] mb-1">Invite Code</h3>
            <p className="text-sm text-slate-500 dark:text-[#EEEEEE]/50 mb-4">Share this code to invite members to this private channel</p>
            <div className="flex gap-2 mb-4">
              <div className="flex-1 bg-slate-50 dark:bg-[#222831]/80 border border-slate-200 dark:border-[#76ABAE]/30 px-4 py-3 rounded-xl flex items-center gap-2">
                <Hash className="w-4 h-4 text-blue-600 dark:text-[#76ABAE] flex-shrink-0" />
                <span className="text-sm font-mono font-bold tracking-widest text-blue-600 dark:text-[#76ABAE]">{showInviteCode}</span>
              </div>
              <button onClick={handleCopyInviteCode} className={`px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all border ${copiedInvite ? 'bg-green-500 text-white border-green-500' : 'bg-blue-600 dark:bg-[#76ABAE] text-white dark:text-[#222831] border-transparent hover:shadow-lg'}`}>
                {copiedInvite ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedInvite ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <button onClick={() => setShowInviteCode(false)} className="w-full py-2.5 bg-slate-100 dark:bg-[#222831]/80 text-slate-700 dark:text-[#EEEEEE]/70 rounded-xl hover:bg-slate-200 dark:hover:bg-[#222831] transition-all font-medium text-sm">Close</button>
          </div>
        </div>
      )}

      {/* Right Sidebar - Online Users */}
      <div className="w-64 bg-slate-50 dark:bg-[#222831] border-l border-slate-200 dark:border-[#76ABAE]/20 overflow-y-auto transition-colors duration-500">
        <div className="p-4">
          <h3 className="text-xs font-bold text-slate-500 dark:text-[#EEEEEE]/50 uppercase tracking-wider mb-4">Online — {allUsers.filter(u => u.status === 'online').length}</h3>
          <div className="space-y-2">
            {allUsers.filter(u => u.status === 'online').map((user) => (
              <button key={user.id} onClick={() => handleSelectUser(user)} className="w-full flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-[#31363F] rounded-lg transition-colors group">
                <div className="relative">
                  <UserAvatar avatarUrl={user.avatarUrl} initials={user.avatar} color={user.color} className="shadow-lg" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-slate-50 dark:border-[#222831] rounded-full"></div>
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-[#EEEEEE] truncate">{user.name}</span>
              </button>
            ))}
          </div>
          <h3 className="text-xs font-bold text-slate-500 dark:text-[#EEEEEE]/50 uppercase tracking-wider mb-4 mt-6">Away — {allUsers.filter(u => u.status === 'away').length}</h3>
          <div className="space-y-2">
            {allUsers.filter(u => u.status === 'away').map((user) => (
              <button key={user.id} onClick={() => handleSelectUser(user)} className="w-full flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-[#31363F] rounded-lg transition-colors group">
                <div className="relative">
                  <UserAvatar avatarUrl={user.avatarUrl} initials={user.avatar} color={user.color} className="shadow-lg opacity-60" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-yellow-500 border-2 border-slate-50 dark:border-[#222831] rounded-full"></div>
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-[#EEEEEE] opacity-60 truncate">{user.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper: map a backend message to the shape the ChatView expects
function mapMessage(msg, currentUserId) {
  const senderId = msg.sender?._id || msg.sender;
  const rawReactions = msg.reactions || {};
  const senderAvatar = msg.sender?.avatar || '';
  const isUrl = senderAvatar && (senderAvatar.startsWith('http') || senderAvatar.startsWith('data:'));
  return {
    id: msg._id,
    odId: msg._id,
    odUserId: senderId,
    text: msg.text,
    time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    reactions: formatReactions(rawReactions, currentUserId),
    name: msg.sender?.fullName || msg.sender?.email || 'Unknown',
    avatar: (msg.sender?.fullName || 'U').substring(0, 2).toUpperCase(),
    avatarUrl: isUrl ? senderAvatar : '',
    color: senderId === currentUserId ? 'from-pink-500 to-rose-500' : 'from-blue-500 to-cyan-500',
    userId: senderId,
  };
}

// Helper: convert { "👍": ["uid1","uid2"] } into { "👍": { count: 2, userReacted: true/false } }
function formatReactions(raw, currentUserId) {
  const formatted = {};
  if (!raw) return formatted;
  const entries = raw instanceof Map ? Array.from(raw.entries()) : Object.entries(raw);
  for (const [emoji, users] of entries) {
    const arr = Array.isArray(users) ? users : [];
    formatted[emoji] = {
      count: arr.length,
      userReacted: arr.some(uid => String(uid) === String(currentUserId)),
    };
  }
  return formatted;
}

export default DashboardPage;