import React from 'react';

/**
 * Renders a user avatar — shows an <img> if avatarUrl is a URL,
 * otherwise renders initials on a gradient background.
 */
const UserAvatar = ({ avatarUrl, initials, color = 'from-blue-500 to-cyan-500', size = 'w-9 h-9', textSize = 'text-sm', className = '' }) => {
  const isImageUrl = avatarUrl && (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:') || avatarUrl.startsWith('/'));

  if (isImageUrl) {
    return (
      <img
        src={avatarUrl}
        alt={initials || 'Avatar'}
        className={`${size} rounded-lg object-cover ${className}`}
      />
    );
  }

  return (
    <div className={`${size} bg-gradient-to-br ${color} rounded-lg flex items-center justify-center text-white font-bold ${textSize} ${className}`}>
      {initials || 'U'}
    </div>
  );
};

export default UserAvatar;
