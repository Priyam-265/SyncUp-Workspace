import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Hash, Lock, Video, Phone, MoreVertical, Send, Smile, AtSign, Paperclip, Plus, Image, FileText, Download, ArrowLeft, X, File, Film, Music, Trash2
} from 'lucide-react';
import MessageReactions from './MessageReactions';
import TypingIndicator from './TypingIndicator';

const availableEmojis = ['😀', '😂', '😍', '🤔', '👍', '❤️', '🔥', '🎉', '💯', '😮', '😢', '🙏', '✅', '🚀', '💪', '🎨', '☕', '🌟', '👀', '😎'];

const ChatView = ({ chatDetails, messages, onSendMessage, onReaction, onDeleteMessage, currentUser }) => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [typingUser, setTypingUser] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, messageId, isOwn }
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const filePickerRef = useRef(null);
  const contextMenuRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close pickers on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
      if (filePickerRef.current && !filePickerRef.current.contains(e.target)) {
        setShowFilePicker(false);
      }
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close context menu on scroll
  useEffect(() => {
    const handleScroll = () => setContextMenu(null);
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []);

  const handleTyping = (e) => {
    setMessage(e.target.value);

    if (e.target.value.trim()) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      setTypingUser(currentUser?.name || 'Someone');
      typingTimerRef.current = setTimeout(() => {
        setTypingUser(null);
      }, 3000);
    } else {
      setTypingUser(null);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      setTypingUser(null);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleContextMenu = (e, msg) => {
    e.preventDefault();
    const isOwn = msg.userId === currentUser?.id;
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      messageId: msg.id,
      isOwn,
    });
  };

  const handleDeleteClick = () => {
    if (contextMenu && onDeleteMessage) {
      onDeleteMessage(contextMenu.messageId);
    }
    setContextMenu(null);
  };

  if (!chatDetails || !currentUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-[#222831] h-full transition-colors duration-500">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-[#EEEEEE]">Welcome to SyncUp</h2>
          <p className="text-slate-500 dark:text-[#EEEEEE]/50 mt-2">Select a channel or direct message to start communicating.</p>
        </div>
      </div>
    );
  }

  const isChannel = chatDetails.type === 'channel';

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#222831] transition-colors duration-500">
      {/* Chat Header */}
      <div className="h-16 border-b border-slate-200 dark:border-[#76ABAE]/20 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          {isChannel ? (
            <Hash className="w-5 h-5 text-slate-600 dark:text-[#EEEEEE]/50" />
          ) : (
            <div className="relative">
              <div className={`w-8 h-8 bg-gradient-to-br ${chatDetails.color || 'from-blue-500 to-cyan-500'} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                {chatDetails.avatar}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${chatDetails.status === 'online' ? 'bg-green-500' : 'bg-slate-400'} border-2 border-white dark:border-[#222831] rounded-full`}></div>
            </div>
          )}
          <h2 className="text-lg font-bold text-slate-900 dark:text-[#EEEEEE]">
            {chatDetails.name}
          </h2>
          <span className="text-sm text-slate-500 dark:text-[#EEEEEE]/50">
            {isChannel ? `${chatDetails.memberCount || 0} members` : (chatDetails.status === 'online' ? 'Online' : 'Offline')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 hover:bg-slate-100 dark:hover:bg-[#31363F] rounded-lg flex items-center justify-center transition-colors">
            <Phone className="w-4 h-4 text-slate-600 dark:text-[#EEEEEE]/50" />
          </button>
          <button className="w-9 h-9 hover:bg-slate-100 dark:hover:bg-[#31363F] rounded-lg flex items-center justify-center transition-colors">
            <Video className="w-4 h-4 text-slate-600 dark:text-[#EEEEEE]/50" />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-[#31363F] rounded-2xl flex items-center justify-center mb-4">
              {isChannel ? <Hash className="w-8 h-8 text-slate-400 dark:text-[#EEEEEE]/40" /> : <Send className="w-8 h-8 text-slate-400 dark:text-[#EEEEEE]/40" />}
            </div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-[#EEEEEE]/70 mb-1">
              {isChannel ? `Welcome to #${chatDetails.name}` : `Chat with ${chatDetails.name}`}
            </h3>
            <p className="text-sm text-slate-500 dark:text-[#EEEEEE]/40">
              Send a message to start the conversation.
            </p>
          </div>
        )}
        {messages.map((msg) => {
          const isOwnMessage = msg.userId === currentUser.id;
          return (
            <div
              key={msg.id}
              className={`flex gap-3 group ${isOwnMessage ? 'justify-end' : ''}`}
              onContextMenu={(e) => handleContextMenu(e, msg)}
            >
              {!isOwnMessage && (
                <div className="relative flex-shrink-0">
                  <div className={`w-10 h-10 bg-gradient-to-br ${msg.color} rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                    {msg.avatar}
                  </div>
                </div>
              )}
              <div className={`flex-1 min-w-0 ${isOwnMessage ? 'text-right' : ''}`}>
                <div className={`flex items-baseline gap-2 mb-1 ${isOwnMessage ? 'justify-end' : ''}`}>
                  <span className="font-bold text-slate-900 dark:text-[#EEEEEE] text-sm">
                    {msg.name}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-[#EEEEEE]/40">
                    {msg.time}
                  </span>
                  {/* Hover delete button for own messages */}
                  {isOwnMessage && onDeleteMessage && (
                    <button
                      onClick={() => onDeleteMessage(msg.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center"
                      title="Delete message"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  )}
                </div>
                <div className={`inline-block p-3 rounded-xl ${isOwnMessage ? 'bg-blue-500 dark:bg-[#76ABAE] text-white dark:text-[#222831]' : 'bg-slate-100 dark:bg-[#31363F] text-slate-900 dark:text-[#EEEEEE]'}`}>
                  {msg.text && (
                    <p className="leading-relaxed">
                      {msg.text}
                    </p>
                  )}
                  {msg.file && (
                    <div className="mt-2 max-w-md">
                      {msg.file.type === 'image' ? (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-[#31363F] dark:to-[#222831] rounded-xl p-4 border border-slate-200 dark:border-[#76ABAE]/20 hover:shadow-lg transition-shadow">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-[#76ABAE] dark:to-[#76ABAE]/80 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                              <Image className="w-6 h-6 text-white dark:text-[#222831]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-slate-900 dark:text-[#EEEEEE] text-sm truncate">
                                {msg.file.name}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-[#EEEEEE]/40">
                                {msg.file.size}
                              </div>
                            </div>
                            <button className="w-9 h-9 bg-blue-600 dark:bg-[#76ABAE] hover:bg-blue-700 dark:hover:bg-[#76ABAE]/80 rounded-lg flex items-center justify-center transition-colors shadow-lg flex-shrink-0">
                              <Download className="w-4 h-4 text-white dark:text-[#222831]" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-[#31363F] dark:to-[#222831] rounded-xl p-4 border border-slate-200 dark:border-[#76ABAE]/20 hover:shadow-lg transition-shadow">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                              <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-slate-900 dark:text-[#EEEEEE] text-sm truncate">
                                {msg.file.name}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-[#EEEEEE]/40">
                                {msg.file.size}
                              </div>
                            </div>
                            <button className="w-9 h-9 bg-orange-600 hover:bg-orange-700 rounded-lg flex items-center justify-center transition-colors shadow-lg flex-shrink-0">
                              <Download className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <MessageReactions reactions={msg.reactions} onReaction={(emoji) => onReaction(msg.id, emoji)} />
              </div>
              {isOwnMessage && (
                <div className="relative flex-shrink-0">
                  <div className={`w-10 h-10 bg-gradient-to-br ${currentUser.color} rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                    {currentUser.avatar}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Right-click context menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-white dark:bg-[#31363F] rounded-xl shadow-2xl border border-slate-200 dark:border-[#76ABAE]/20 py-1 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.isOwn && onDeleteMessage && (
            <button
              onClick={handleDeleteClick}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-medium">Delete Message</span>
            </button>
          )}
          {!contextMenu.isOwn && (
            <div className="px-4 py-2.5 text-sm text-slate-500 dark:text-[#EEEEEE]/40">
              No actions available
            </div>
          )}
        </div>
      )}

      {/* Typing Indicator */}
      <TypingIndicator typingUser={typingUser} />

      {/* Message Input */}
      <div className="p-4 border-t border-slate-200 dark:border-[#76ABAE]/20">
        <form onSubmit={handleSendMessage} className="flex items-end gap-3">
          <div className="flex-1 bg-slate-100 dark:bg-[#31363F] rounded-2xl border border-slate-200 dark:border-[#76ABAE]/20 focus-within:border-blue-500 dark:focus-within:border-[#76ABAE] focus-within:ring-2 focus-within:ring-blue-500/20 dark:focus-within:ring-[#76ABAE]/20 transition-all">
            <div className="flex items-center gap-2 px-4 py-3">

              {/* Attachment button */}
              <div className="relative" ref={filePickerRef}>
                <button
                  type="button"
                  onClick={() => { setShowFilePicker(!showFilePicker); setShowEmojiPicker(false); }}
                  className="w-8 h-8 hover:bg-slate-200 dark:hover:bg-[#222831] rounded-lg flex items-center justify-center transition-all hover:scale-110"
                >
                  <Paperclip className="w-5 h-5 text-slate-600 dark:text-[#EEEEEE]/50" />
                </button>

                {/* File Picker UI */}
                {showFilePicker && (
                  <div className="absolute bottom-full mb-2 left-0 bg-white/90 dark:bg-[#31363F]/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-200/50 dark:border-[#76ABAE]/20 p-3 w-56 z-20">
                    <p className="text-xs font-bold text-slate-500 dark:text-[#EEEEEE]/50 uppercase tracking-wider mb-2 px-1">Attach a file</p>
                    {[
                      { icon: Image, label: 'Photos & Images', color: 'text-blue-500 dark:text-[#76ABAE]' },
                      { icon: FileText, label: 'Documents', color: 'text-orange-500' },
                      { icon: Film, label: 'Videos', color: 'text-purple-500' },
                      { icon: Music, label: 'Audio Files', color: 'text-pink-500' },
                      { icon: File, label: 'Other Files', color: 'text-slate-500 dark:text-[#EEEEEE]/50' },
                    ].map(({ icon: Icon, label, color }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setShowFilePicker(false)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#222831]/60 transition-colors group"
                      >
                        <Icon className={`w-4 h-4 ${color} group-hover:scale-110 transition-transform`} />
                        <span className="text-sm font-medium text-slate-700 dark:text-[#EEEEEE]/80">{label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input
                type="text"
                value={message}
                onChange={handleTyping}
                placeholder={`Message ${isChannel ? '#' : ''}${chatDetails.name}`}
                className="flex-1 bg-transparent outline-none text-slate-900 dark:text-[#EEEEEE] placeholder-slate-500 dark:placeholder-[#EEEEEE]/40"
              />

              {/* Emoji button */}
              <div className="relative" ref={emojiPickerRef}>
                <button
                  type="button"
                  onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowFilePicker(false); }}
                  className="w-8 h-8 hover:bg-slate-200 dark:hover:bg-[#222831] rounded-lg flex items-center justify-center transition-all hover:scale-110"
                >
                  <Smile className="w-5 h-5 text-slate-600 dark:text-[#EEEEEE]/50" />
                </button>

                {/* Improved Emoji Picker */}
                {showEmojiPicker && (
                  <div className="absolute bottom-full mb-3 right-0 z-50 bg-white dark:bg-[#31363F] backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/60 dark:border-[#76ABAE]/20 p-3"
                    style={{ width: '224px', transform: 'translateX(0)' }}
                  >

                    {/* Header with accent bar */}
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <div className="w-1 h-3.5 rounded-full bg-gradient-to-b from-[#76ABAE] to-[#76ABAE]/50" />
                      <p className="text-xs font-bold text-slate-400 dark:text-[#EEEEEE]/40 uppercase tracking-widest">
                        React
                      </p>
                    </div>

                    {/* Emoji Grid — 4 cols to avoid overflow */}
                    <div className="grid grid-cols-4 gap-1">
                      {availableEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleEmojiSelect(emoji)}
                          className="p-2 text-xl rounded-xl hover:bg-slate-100 dark:hover:bg-[#222831]/70 active:scale-90 transition-all duration-150 hover:scale-110"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    {/* Footer hint */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-[#76ABAE]/10 text-center">
                      <span className="text-[10px] text-slate-400 dark:text-[#EEEEEE]/30 tracking-wide">
                        click to add · click again to remove
                      </span>
                    </div>

                  </div>
                )}
              </div>

            </div>
          </div>

          <button
            type="submit"
            disabled={!message.trim()}
            className="w-12 h-12 bg-blue-600 dark:bg-[#76ABAE] hover:bg-blue-700 dark:hover:bg-[#76ABAE]/80 hover:shadow-lg hover:shadow-blue-500/30 dark:hover:shadow-[#76ABAE]/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all"
          >
            <Send className="w-5 h-5 text-white dark:text-[#222831]" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatView;