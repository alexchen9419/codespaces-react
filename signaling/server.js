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

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('register', (userId) => {
    const uid = String(userId);
    onlineUsers.set(uid, socket.id);
    console.log(`User ${uid} registered as ${socket.id}`);
  });

  // Real-time DM push
  socket.on('send_message', ({ to, message }) => {
    const targetSocket = onlineUsers.get(String(to));
    if (targetSocket) {
      io.to(targetSocket).emit('new_message', message);
    }
  });

  // WebRTC signaling
  socket.on('webrtc_offer', ({ to, offer }) => {
    const targetSocket = onlineUsers.get(String(to));
    if (targetSocket) {
      io.to(targetSocket).emit('webrtc_offer', { from: socket.id, offer });
    }
  });

  socket.on('webrtc_answer', ({ to, answer }) => {
    io.to(to).emit('webrtc_answer', { answer });
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
    for (const [uid, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        onlineUsers.delete(uid);
        console.log(`User ${uid} disconnected`);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Signaling server running on :${PORT}`));
