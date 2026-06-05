const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    credentials: false,
  },
});

// userId (string) -> socketId
const onlineUsers = new Map();
// socketId -> userId (for reverse lookup)
const socketToUser = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('register', (userId) => {
    const uid = String(userId);
    onlineUsers.set(uid, socket.id);
    socketToUser.set(socket.id, uid);
    console.log(`User ${uid} registered as ${socket.id}`);
  });

  // Real-time DM push
  socket.on('send_message', ({ to, message }) => {
    const targetSocket = onlineUsers.get(String(to));
    if (targetSocket) {
      io.to(targetSocket).emit('new_message', message);
    }
  });

  // Phase 1: caller rings receiver
  socket.on('call_ring', ({ to, fromUsername }) => {
    const targetSocket = onlineUsers.get(String(to));
    const fromUserId = socketToUser.get(socket.id);
    if (targetSocket && fromUserId) {
      io.to(targetSocket).emit('call_incoming', { from: fromUserId, fromUsername });
    }
  });

  // Receiver accepted — tell caller
  socket.on('call_accept', ({ to }) => {
    const targetSocket = onlineUsers.get(String(to));
    if (targetSocket) {
      io.to(targetSocket).emit('call_accepted');
    }
  });

  // Receiver's useWebRTC is ready for the offer
  socket.on('call_ready', ({ to }) => {
    const targetSocket = onlineUsers.get(String(to));
    if (targetSocket) {
      io.to(targetSocket).emit('call_ready');
    }
  });

  // Receiver rejected
  socket.on('call_reject', ({ to }) => {
    const targetSocket = onlineUsers.get(String(to));
    if (targetSocket) {
      io.to(targetSocket).emit('call_rejected');
    }
  });

  // Either side ended the call
  socket.on('call_end', ({ to }) => {
    const targetSocket = onlineUsers.get(String(to));
    if (targetSocket) {
      io.to(targetSocket).emit('call_ended');
    }
  });

  // WebRTC signaling (all use userId for routing)
  socket.on('webrtc_offer', ({ to, offer }) => {
    const targetSocket = onlineUsers.get(String(to));
    if (targetSocket) {
      io.to(targetSocket).emit('webrtc_offer', { offer });
    }
  });

  socket.on('webrtc_answer', ({ to, answer }) => {
    const targetSocket = onlineUsers.get(String(to));
    if (targetSocket) {
      io.to(targetSocket).emit('webrtc_answer', { answer });
    }
  });

  socket.on('webrtc_ice', ({ to, candidate }) => {
    const targetSocket = onlineUsers.get(String(to));
    if (targetSocket) {
      io.to(targetSocket).emit('webrtc_ice', { candidate });
    }
  });

  // Generic notification push
  socket.on('notify', ({ to, notification }) => {
    const targetSocket = onlineUsers.get(String(to));
    if (targetSocket) {
      io.to(targetSocket).emit('notification', notification);
    }
  });

  socket.on('disconnect', () => {
    const uid = socketToUser.get(socket.id);
    if (uid) {
      onlineUsers.delete(uid);
      socketToUser.delete(socket.id);
      console.log(`User ${uid} disconnected`);
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Signaling server running on :${PORT}`));
