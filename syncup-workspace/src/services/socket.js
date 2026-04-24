// export * from './api';

import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket?.connected) return;

    // Vite proxy forwards /socket.io to backend
    this.socket = io('/', {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    // Reattach all listeners
    for (const [event, callbacks] of this.listeners.entries()) {
      callbacks.forEach((callback) => {
        this.socket.on(event, callback);
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      if (callback) {
        this.listeners.get(event).delete(callback);
        if (this.socket) this.socket.off(event, callback);
      } else {
        this.listeners.delete(event);
        if (this.socket) this.socket.off(event);
      }
    }
  }

  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit:', event);
    }
  }

  // Common Events Actions
  joinWorkspace(workspaceId) {
    this.emit('join-workspace', { workspaceId, userId: window.localStorage.getItem('userId') || '' }); // Backend expects object
  }

  leaveWorkspace(workspaceId) {
    this.emit('leave-workspace', { workspaceId });
  }

  joinChannel(channelId) {
    this.emit('join-channel', { channelId });
  }

  leaveChannel(channelId) {
    this.emit('leave-channel', { channelId });
  }

  sendMessage(message) {
    this.emit('send-message', message);
  }

  typing(data) {
    this.emit('typing', data); // { channelId, username }
  }
}

export const socketService = new SocketService();
