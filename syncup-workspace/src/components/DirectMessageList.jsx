import React from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import UserAvatar from './UserAvatar';

const DirectMessageList = ({ users, onSelectUser, activeChat, onOpenCreateDmModal }) => {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2 text-blue-200 dark:text-[#EEEEEE]/50 text-xs font-semibold">
          <ChevronDown className="w-3 h-3" />
          <span>DIRECT MESSAGES</span>
        </div>
        <button onClick={onOpenCreateDmModal} className="w-5 h-5 hover:bg-blue-500 dark:hover:bg-[#31363F] rounded flex items-center justify-center transition-colors">
          <Plus className="w-3 h-3 text-blue-200 dark:text-[#EEEEEE]/50" />
        </button>
      </div>
      <div className="space-y-0.5">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => onSelectUser(user)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all group ${
              activeChat && activeChat.type === 'dm' && activeChat.id === user.id
                ? 'bg-blue-500 dark:bg-[#76ABAE]/30 text-white'
                : 'text-blue-100 dark:text-[#EEEEEE]/70 hover:bg-blue-500 dark:hover:bg-[#31363F]'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <UserAvatar avatarUrl={user.avatarUrl} initials={user.avatar} color={user.color} size="w-7 h-7" textSize="text-xs" />
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${user.status === 'online' ? 'bg-green-500' : user.status === 'away' ? 'bg-yellow-500' : 'bg-slate-400'} border-2 border-blue-600 dark:border-[#222831] rounded-full`}></div>
              </div>
              <span className="text-sm font-medium">{user.name}</span>
            </div>
            {user.unread > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full shadow-sm whitespace-nowrap">
                {user.unread >= 9 ? '9+ new messages' : user.unread === 1 ? '1 new message' : `${user.unread} new messages`}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DirectMessageList;
