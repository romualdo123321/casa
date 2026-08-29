import express from 'express';
import http from 'http';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import type { ChatMessage, UserProfile, VoteBanSession } from './src/types';

const app = express();
const PORT = 3000;
const httpServer = http.createServer(app);

// Initialize Socket.io with high payload limit for audio notes / photos
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 1e8, // 100MB
});

app.use(express.json({ limit: '100mb' }));

// 3 Hours Message Retention
const MESSAGE_LIFETIME_MS = 3 * 60 * 60 * 1000;

// Server In-Memory State
const socketToUser = new Map<string, UserProfile>();
let messageHistory: ChatMessage[] = [
  {
    id: 'msg-welcome-system',
    type: 'system',
    content: '🎉 Bem-vindo ao Salão Principal do Bate-Papo MSN! Respeite as regras e divirta-se.',
    sender: {
      id: 'system-msn',
      nick: 'MSN Messenger',
      email: 'bot@msn.com',
      avatar: 'https://images.unsplash.com/photo-1557008075-7f2c5efa4cfd?w=200&h=200&fit=crop&crop=faces&q=80',
      status: 'online',
      subNick: 'Bate-Papo Oficial Conectado',
      userColor: '#0284c7',
    },
    timestamp: Date.now(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

let activeVoteBan: VoteBanSession | null = null;
const bannedUserIds = new Set<string>();

// Helper to get unique active users list
function getUniqueActiveUsers(): UserProfile[] {
  const userMap = new Map<string, UserProfile>();
  for (const user of socketToUser.values()) {
    if (user && user.id) {
      userMap.set(user.id, user);
    }
  }
  return Array.from(userMap.values());
}

// Auto-purge messages older than 3 hours
function purgeExpiredMessages() {
  const now = Date.now();
  messageHistory = messageHistory.filter((m) => now - m.timestamp < MESSAGE_LIFETIME_MS);
}
setInterval(purgeExpiredMessages, 30 * 1000);

// API Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    connectedSockets: socketToUser.size,
    onlineUsersCount: getUniqueActiveUsers().length,
    messagesCount: messageHistory.length,
  });
});

app.get('/api/users', (req, res) => {
  res.json(getUniqueActiveUsers());
});

app.get('/api/messages', (req, res) => {
  purgeExpiredMessages();
  res.json(messageHistory);
});

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log(`🔌 [Socket.io] Nova conexão estabelecida: ${socket.id}`);

  // User Join Event
  socket.on('user:join', (user: UserProfile) => {
    if (!user || !user.id) return;

    if (bannedUserIds.has(user.id)) {
      socket.emit('user:banned', { reason: 'Você foi banido do bate-papo.' });
      socket.disconnect(true);
      return;
    }

    socketToUser.set(socket.id, user);
    purgeExpiredMessages();

    // Send initial state to the newly joined client
    socket.emit('init:state', {
      users: getUniqueActiveUsers(),
      messages: messageHistory,
      activeVoteBan,
    });

    // Broadcast updated user list to all connected clients
    io.emit('user:list', getUniqueActiveUsers());
    io.emit('user:joined', user);

    console.log(`👤 [User Join] ${user.nick} (${user.id}) conectado. Total online: ${getUniqueActiveUsers().length}`);
  });

  // User Update (Status / Subnick / Avatar)
  socket.on('user:update', (updatedUser: UserProfile) => {
    if (!updatedUser || !updatedUser.id) return;
    socketToUser.set(socket.id, updatedUser);
    io.emit('user:list', getUniqueActiveUsers());
    io.emit('user:updated', updatedUser);
  });

  // Chat Message Broadcast
  socket.on('chat:send_message', (msg: ChatMessage) => {
    if (!msg || !msg.sender) return;

    if (bannedUserIds.has(msg.sender.id)) {
      socket.emit('user:banned', { reason: 'Você foi banido.' });
      return;
    }

    // Ensure timestamp
    const finalizedMsg: ChatMessage = {
      ...msg,
      id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: msg.timestamp || Date.now(),
      time: msg.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    purgeExpiredMessages();

    // If it's a private message, broadcast or route (clients will filter if needed)
    if (!finalizedMsg.isPrivate) {
      messageHistory.push(finalizedMsg);
      // Keep max 500 messages in memory
      if (messageHistory.length > 500) {
        messageHistory = messageHistory.slice(-500);
      }
    }

    // Broadcast to everyone
    io.emit('chat:message', finalizedMsg);
  });

  // Nudge / Chamar Atenção
  socket.on('chat:send_nudge', (data: { sender: UserProfile; recipientId?: string; isPrivate?: boolean }) => {
    io.emit('chat:nudge', data);
  });

  // Message Reaction
  socket.on('chat:react', ({ messageId, emoji, userId }: { messageId: string; emoji: string; userId: string }) => {
    const targetMsg = messageHistory.find((m) => m.id === messageId);
    if (targetMsg) {
      const reactions = targetMsg.reactions || {};
      const currentList = reactions[emoji] || [];
      if (currentList.includes(userId)) {
        reactions[emoji] = currentList.filter((id) => id !== userId);
        if (reactions[emoji].length === 0) delete reactions[emoji];
      } else {
        reactions[emoji] = [...currentList, userId];
      }
      targetMsg.reactions = { ...reactions };
      io.emit('chat:reaction_updated', { messageId, reactions: targetMsg.reactions });
    }
  });

  // Admin Broadcasts
  socket.on('admin:announcement', (announcementMsg: ChatMessage) => {
    messageHistory.push(announcementMsg);
    io.emit('chat:message', announcementMsg);
  });

  socket.on('admin:banner', (bannerMsg: ChatMessage) => {
    messageHistory.push(bannerMsg);
    io.emit('chat:message', bannerMsg);
  });

  socket.on('admin:clear_chat', () => {
    messageHistory = [];
    io.emit('chat:cleared');
  });

  socket.on('admin:kick', ({ targetUserId, reason }: { targetUserId: string; reason: string }) => {
    for (const [sockId, user] of socketToUser.entries()) {
      if (user.id === targetUserId) {
        const targetSocket = io.sockets.sockets.get(sockId);
        if (targetSocket) {
          targetSocket.emit('user:kicked', { userId: targetUserId, reason });
          targetSocket.disconnect(true);
        }
        socketToUser.delete(sockId);
      }
    }
    io.emit('user:list', getUniqueActiveUsers());
  });

  socket.on('admin:ban', ({ targetUserId, reason }: { targetUserId: string; reason: string }) => {
    bannedUserIds.add(targetUserId);
    for (const [sockId, user] of socketToUser.entries()) {
      if (user.id === targetUserId) {
        const targetSocket = io.sockets.sockets.get(sockId);
        if (targetSocket) {
          targetSocket.emit('user:banned', { reason });
          targetSocket.disconnect(true);
        }
        socketToUser.delete(sockId);
      }
    }
    io.emit('user:list', getUniqueActiveUsers());
  });

  // VoteBan Sync
  socket.on('voteban:start', (session: VoteBanSession) => {
    activeVoteBan = session;
    io.emit('voteban:update', activeVoteBan);
  });

  socket.on('voteban:vote', ({ sessionId, userId }: { sessionId: string; userId: string }) => {
    if (activeVoteBan && activeVoteBan.id === sessionId) {
      if (!activeVoteBan.votes.includes(userId)) {
        activeVoteBan.votes.push(userId);
        if (activeVoteBan.votes.length >= activeVoteBan.requiredVotes) {
          activeVoteBan.status = 'passed';
          bannedUserIds.add(activeVoteBan.targetUser.id);
        }
        io.emit('voteban:update', activeVoteBan);
      }
    }
  });

  socket.on('voteban:end', (sessionId: string) => {
    if (activeVoteBan && activeVoteBan.id === sessionId) {
      activeVoteBan = null;
      io.emit('voteban:update', null);
    }
  });

  // WebRTC P2P Video Call Signaling Handlers
  socket.on('webrtc:call_user', ({ targetUserId, caller, offer }) => {
    console.log(`📹 [WebRTC] Chamada iniciada de ${caller.nick} (${caller.id}) para ${targetUserId}`);
    for (const [sockId, user] of socketToUser.entries()) {
      if (user.id === targetUserId) {
        io.to(sockId).emit('webrtc:incoming_call', { caller, offer });
      }
    }
  });

  socket.on('webrtc:answer_call', ({ callerId, responder, answer }) => {
    console.log(`📹 [WebRTC] Chamada atendida por ${responder.nick} para ${callerId}`);
    for (const [sockId, user] of socketToUser.entries()) {
      if (user.id === callerId) {
        io.to(sockId).emit('webrtc:call_accepted', { responder, answer });
      }
    }
  });

  socket.on('webrtc:ice_candidate', ({ targetUserId, senderId, candidate }) => {
    for (const [sockId, user] of socketToUser.entries()) {
      if (user.id === targetUserId) {
        io.to(sockId).emit('webrtc:ice_candidate', { senderId, candidate });
      }
    }
  });

  socket.on('webrtc:end_call', ({ targetUserId, senderId }) => {
    console.log(`📹 [WebRTC] Chamada encerrada por ${senderId} para ${targetUserId}`);
    for (const [sockId, user] of socketToUser.entries()) {
      if (user.id === targetUserId) {
        io.to(sockId).emit('webrtc:call_ended', { senderId });
      }
    }
  });

  socket.on('webrtc:reject_call', ({ callerId, responderId, reason }) => {
    console.log(`📹 [WebRTC] Chamada recusada por ${responderId} para ${callerId}`);
    for (const [sockId, user] of socketToUser.entries()) {
      if (user.id === callerId) {
        io.to(sockId).emit('webrtc:call_rejected', { responderId, reason });
      }
    }
  });

  // Disconnect Handler
  socket.on('disconnect', () => {
    const user = socketToUser.get(socket.id);
    socketToUser.delete(socket.id);

    if (user) {
      console.log(`🔌 [User Leave] ${user.nick} saiu.`);
      io.emit('user:left', user.id);
      io.emit('user:list', getUniqueActiveUsers());
    }
  });
});

// Vite middleware or Static serving setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor Bate-Papo MSN Online rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer();
