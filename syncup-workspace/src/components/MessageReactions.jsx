import React, { useState, useRef, useEffect } from 'react';
import { Smile } from 'lucide-react';

const availableReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const MessageReactions = ({ reactions, onReaction }) => {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReactionClick = (emoji) => {
    onReaction(emoji);
    setShowPicker(false);
  };

  // reactions is { emoji: { count, userReacted } } or { emoji: count } (legacy)
  const existingReactions = reactions
    ? Object.entries(reactions).filter(([, val]) => {
        const count = typeof val === 'object' ? val.count : val;
        return count > 0;
      })
    : [];

  return (
    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
      {existingReactions.map(([emoji, val]) => {
        const count = typeof val === 'object' ? val.count : val;
        const userReacted = typeof val === 'object' ? val.userReacted : false;
        return (
          <button
            key={emoji}
            onClick={() => handleReactionClick(emoji)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 border cursor-pointer ${
              userReacted
                ? 'bg-blue-50 dark:bg-[#76ABAE]/15 border-blue-300 dark:border-[#76ABAE]/60 text-blue-700 dark:text-[#76ABAE] shadow-sm hover:bg-blue-100 dark:hover:bg-[#76ABAE]/25'
                : 'bg-slate-100 dark:bg-[#31363F] border-slate-200 dark:border-[#76ABAE]/15 text-slate-600 dark:text-[#EEEEEE]/70 hover:bg-slate-200 dark:hover:bg-[#31363F]/80 hover:border-slate-300 dark:hover:border-[#76ABAE]/30'
            }`}
          >
            <span className="text-base leading-none">{emoji}</span>
            <span>{count}</span>
          </button>
        );
      })}

      <div className="relative" ref={pickerRef}>
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="inline-flex items-center justify-center w-7 h-7 rounded-full hover:bg-slate-100 dark:hover:bg-[#31363F] transition-all hover:scale-110"
        >
          <Smile className="w-4 h-4 text-slate-400 dark:text-[#EEEEEE]/40" />
        </button>

        {showPicker && (
          <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-[#31363F] rounded-xl shadow-2xl border border-slate-200 dark:border-[#76ABAE]/20 p-1.5 flex gap-0.5 z-30">
            {availableReactions.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleReactionClick(emoji)}
                className="w-8 h-8 text-lg rounded-lg hover:bg-slate-100 dark:hover:bg-[#222831] transition-all hover:scale-125 flex items-center justify-center"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageReactions;
