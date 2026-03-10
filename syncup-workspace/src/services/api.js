// In a real application, you would use a library like axios or fetch.
// For this example, we'll simulate API calls with mock data.

const mockUsers = [
  { id: 1, name: 'Alice', online: true, avatar: 'https://i.pravatar.cc/40?u=alice' },
  { id: 2, name: 'Bob', online: false, avatar: 'https://i.pravatar.cc/40?u=bob' },
  { id: 3, name: 'Charlie', online: true, avatar: 'https://i.pravatar.cc/40?u=charlie' },
];

const mockChannels = [
  { id: 1, name: 'general' },
  { id: 2, name: 'random' },
  { id: 3, name: 'tech' },
];

const mockMessages = [
  { id: 1, text: 'Hello world!', channelId: 1, userId: 1 },
  { id: 2, text: 'This is a test message in the general channel.', channelId: 1, userId: 2 },
  { id: 3, text: 'Anyone see the new movie?', channelId: 2, userId: 3 },
];

/**
 * Simulates a backend API call to search for channels, users, and messages.
 * @param {string} query The search query.
 * @returns {Promise<object>} A promise that resolves to the search results.
 */
export const searchApi = async (query) => {
  console.log(`Searching for: ${query}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  if (!query) {
    return {
      channels: [],
      users: [],
      messages: [],
    };
  }

  const lowerCaseQuery = query.toLowerCase();

  const channels = mockChannels.filter(c => c.name.toLowerCase().includes(lowerCaseQuery));
  const users = mockUsers.filter(u => u.name.toLowerCase().includes(lowerCaseQuery));
  const messages = mockMessages.filter(m => m.text.toLowerCase().includes(lowerCaseQuery));

  return { channels, users, messages };
};
