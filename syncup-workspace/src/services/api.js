// Search API using actual mockData instead of separate mock arrays
import { users, channels, messages } from '../data/mockData';

/**
 * Searches channels, users, and messages from the actual mock data.
 * @param {string} query The search query.
 * @returns {Promise<object>} A promise that resolves to the search results.
 */
export const searchApi = async (query) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));

  if (!query) {
    return { channels: [], users: [], messages: [] };
  }

  const lowerCaseQuery = query.toLowerCase();

  // Search channels by name
  const matchedChannels = channels.filter(c =>
    c.name.toLowerCase().includes(lowerCaseQuery)
  );

  // Search users by name
  const matchedUsers = users.filter(u =>
    u.name.toLowerCase().includes(lowerCaseQuery)
  );

  // Search messages across all channels and DMs
  const matchedMessages = [];

  // Search channel messages
  if (messages.channel) {
    Object.entries(messages.channel).forEach(([channelId, msgs]) => {
      msgs.forEach(msg => {
        if (msg.text && msg.text.toLowerCase().includes(lowerCaseQuery)) {
          const sender = users.find(u => u.id === msg.userId);
          matchedMessages.push({
            id: msg.id,
            text: msg.text,
            channelId: parseInt(channelId),
            senderName: sender?.name || 'Unknown',
            time: msg.time,
            type: 'channel',
          });
        }
      });
    });
  }

  // Search DM messages
  if (messages.dm) {
    Object.entries(messages.dm).forEach(([dmUserId, msgs]) => {
      msgs.forEach(msg => {
        if (msg.text && msg.text.toLowerCase().includes(lowerCaseQuery)) {
          const sender = users.find(u => u.id === msg.userId);
          matchedMessages.push({
            id: msg.id,
            text: msg.text,
            dmUserId: parseInt(dmUserId),
            senderName: sender?.name || 'Unknown',
            time: msg.time,
            type: 'dm',
          });
        }
      });
    });
  }

  return {
    channels: matchedChannels,
    users: matchedUsers,
    messages: matchedMessages,
  };
};
