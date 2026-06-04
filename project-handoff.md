# Social Platform — Claude Code 開發手冊

## 專案概述

一個社交平台，核心功能包含好友系統、即時私訊、語音訊息、動態牆和 WebRTC 語音通話。

**技術棧**

| 層 | 技術 |
|---|---|
| 前端 | React + Vite + Tailwind CSS |
| 後端（業務邏輯） | PHP 8+ + MySQL |
| 後端（即時通訊） | Node.js + Socket.io |
| 資料庫 | MySQL 8 |
| 語音通話 | WebRTC（P2P）+ Node.js signaling |

---

## 資料夾結構

```
project/
├── backend/                  # PHP REST API
│   ├── config/
│   │   ├── db.php            # PDO 連線（所有 service 共用）
│   │   └── cors.php          # 允許 React dev server 跨域
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.php
│   │   │   ├── logout.php
│   │   │   ├── register.php
│   │   │   └── me.php
│   │   ├── friends/
│   │   │   ├── list.php
│   │   │   ├── request.php
│   │   │   ├── accept.php
│   │   │   ├── remove.php
│   │   │   └── pending.php
│   │   ├── messages/
│   │   │   ├── inbox.php
│   │   │   ├── thread.php    # ?user_id=
│   │   │   ├── send.php
│   │   │   └── voice.php     # multipart/form-data 語音上傳
│   │   ├── feed/
│   │   │   ├── list.php
│   │   │   ├── post.php
│   │   │   ├── like.php
│   │   │   └── comment.php
│   │   └── notifications/
│   │       ├── list.php
│   │       └── read.php
│   ├── uploads/
│   │   ├── voices/           # 語音訊息 .webm
│   │   └── avatars/          # 大頭貼
│   └── schema.sql
│
├── signaling/                # Node.js + Socket.io
│   ├── server.js             # 主程式，port 3000
│   ├── package.json
│   └── events/
│       ├── chat.js           # DM 即時推送
│       ├── webrtc.js         # offer / answer / ICE candidate
│       └── notif.js          # 好友請求通知
│
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── FeedPage.jsx
│   │   │   ├── FriendsPage.jsx
│   │   │   ├── InboxPage.jsx
│   │   │   ├── ChatPage.jsx
│   │   │   ├── CallPage.jsx  # WebRTC 通話介面
│   │   │   └── ProfilePage.jsx
│   │   ├── components/
│   │   │   ├── AuthGuard.jsx
│   │   │   ├── VoiceRecorder.jsx
│   │   │   ├── VoicePlayer.jsx
│   │   │   ├── WebRTCCall.jsx
│   │   │   ├── FeedPost.jsx
│   │   │   └── NotifBadge.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useSocket.js
│   │   │   └── useWebRTC.js
│   │   ├── api/
│   │   │   ├── auth.js
│   │   │   ├── friends.js
│   │   │   ├── messages.js
│   │   │   └── feed.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── .env
```

---

## MySQL Schema

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_path VARCHAR(255),
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE friendships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requester_id INT NOT NULL,
  receiver_id INT NOT NULL,
  status ENUM('pending', 'accepted', 'blocked') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_pair (requester_id, receiver_id)
);

CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  type ENUM('text', 'voice') DEFAULT 'text',
  body TEXT,
  file_path VARCHAR(255),
  duration_seconds INT,
  is_read TINYINT(1) DEFAULT 0,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  image_path VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_like (post_id, user_id)
);

CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('friend_request', 'message', 'like', 'comment') NOT NULL,
  ref_id INT,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## PHP API 規格

所有 API 回傳 JSON，統一格式：

```json
{ "success": true, "data": {} }
{ "success": false, "message": "錯誤訊息" }
```

### Auth

| Method | 路徑 | 說明 |
|---|---|---|
| POST | `/api/auth/register.php` | 註冊，`password_hash()` 儲存 |
| POST | `/api/auth/login.php` | 登入，寫 `$_SESSION['user_id']` |
| GET | `/api/auth/logout.php` | 登出，`session_destroy()` |
| GET | `/api/auth/me.php` | 取得目前登入使用者資料 |

### Friends

| Method | 路徑 | 說明 |
|---|---|---|
| GET | `/api/friends/list.php` | 已接受的好友清單 |
| GET | `/api/friends/pending.php` | 待處理的好友邀請 |
| POST | `/api/friends/request.php` | 送出好友邀請，body: `{ receiver_id }` |
| POST | `/api/friends/accept.php` | 接受邀請，body: `{ friendship_id }` |
| DELETE | `/api/friends/remove.php` | 刪除好友，body: `{ friendship_id }` |

### Messages

| Method | 路徑 | 說明 |
|---|---|---|
| GET | `/api/messages/inbox.php` | 收件匣（每人最新一則） |
| GET | `/api/messages/thread.php?user_id=X` | 與某人的完整對話 |
| POST | `/api/messages/send.php` | 傳文字訊息，body: `{ receiver_id, body }` |
| POST | `/api/messages/voice.php` | 上傳語音，`multipart/form-data`，欄位: `receiver_id`, `audio`（blob） |

### Feed

| Method | 路徑 | 說明 |
|---|---|---|
| GET | `/api/feed/list.php` | 好友動態，依時間降序 |
| POST | `/api/feed/post.php` | 發文，body: `{ content }`，可含 image |
| POST | `/api/feed/like.php` | 按讚，body: `{ post_id }` |
| POST | `/api/feed/comment.php` | 留言，body: `{ post_id, body }` |

### Notifications

| Method | 路徑 | 說明 |
|---|---|---|
| GET | `/api/notifications/list.php` | 取得通知清單 |
| POST | `/api/notifications/read.php` | 標記已讀，body: `{ id }` 或 `{ all: true }` |

---

## PHP 基礎設定

### config/db.php

```php
<?php
$host = $_ENV['DB_HOST'] ?? 'localhost';
$db   = $_ENV['DB_NAME'] ?? 'social_db';
$user = $_ENV['DB_USER'] ?? 'root';
$pass = $_ENV['DB_PASS'] ?? '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'DB connection failed']);
    exit;
}
```

### config/cors.php

```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

session_start();
```

### Auth guard（在需要登入的 API 最頂端引入）

```php
<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$me = $_SESSION['user_id'];
```

---

## Node.js Signaling Server

### package.json

```json
{
  "name": "signaling",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "socket.io": "^4.7.0",
    "express": "^4.18.0"
  }
}
```

### server.js 骨架

```js
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
});

// 儲存 socket id 對應 user id
const onlineUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  // 使用者上線，綁定 userId
  socket.on('register', (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  // DM 即時推送
  socket.on('send_message', ({ to, message }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit('new_message', message);
    }
  });

  // WebRTC signaling
  socket.on('webrtc_offer', ({ to, offer }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) io.to(targetSocket).emit('webrtc_offer', { from: socket.id, offer });
  });

  socket.on('webrtc_answer', ({ to, answer }) => {
    io.to(to).emit('webrtc_answer', { answer });
  });

  socket.on('webrtc_ice', ({ to, candidate }) => {
    io.to(to).emit('webrtc_ice', { candidate });
  });

  // 通知推送
  socket.on('notify', ({ to, notification }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) io.to(targetSocket).emit('notification', notification);
  });

  socket.on('disconnect', () => {
    for (const [uid, sid] of onlineUsers.entries()) {
      if (sid === socket.id) { onlineUsers.delete(uid); break; }
    }
  });
});

httpServer.listen(3000, () => console.log('Signaling server on :3000'));
```

---

## React 設定

### vite.config.js

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:80',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

### hooks/useAuth.js 骨架

```js
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me.php', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.success) setUser(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const r = await fetch('/api/auth/login.php', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const d = await r.json();
    if (d.success) setUser(d.data);
    return d;
  };

  const logout = async () => {
    await fetch('/api/auth/logout.php', { credentials: 'include' });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### hooks/useSocket.js 骨架

```js
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';

let socket = null;

export function useSocket() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    socket = io('http://localhost:3000', { withCredentials: true });
    socket.emit('register', user.id);
    return () => socket.disconnect();
  }, [user]);

  return socket;
}
```

---

## 語音訊息流程

```
1. 前端 VoiceRecorder.jsx
   └── MediaRecorder API 錄音 → Blob (.webm)

2. 上傳
   └── FormData append('audio', blob)
   └── POST /api/messages/voice.php

3. PHP voice.php
   └── move_uploaded_file() → uploads/voices/{uuid}.webm
   └── INSERT INTO messages (type='voice', file_path, duration_seconds)
   └── 觸發 Socket.io notify 給 receiver

4. 前端 VoicePlayer.jsx
   └── <audio src="/uploads/voices/{file}" controls />
```

---

## WebRTC 通話流程

```
呼叫方 A                    Node.js Signaling              接收方 B
   |                               |                           |
   |── webrtc_offer ─────────────>|                           |
   |                               |── webrtc_offer ─────────>|
   |                               |                           |── 建立 RTCPeerConnection
   |                               |<── webrtc_answer ────────|
   |<── webrtc_answer ────────────|                           |
   |── webrtc_ice ───────────────>|── webrtc_ice ────────────>|
   |<── webrtc_ice ───────────────|<── webrtc_ice ────────────|
   |                                                           |
   |<══════════════ P2P 音訊串流（不經伺服器）════════════════>|
```

---

## 開發啟動順序

```bash
# 1. 資料庫
mysql -u root -p < backend/schema.sql

# 2. PHP（需要 Apache / Nginx 或 PHP built-in server）
cd backend
php -S localhost:80

# 3. Node.js signaling
cd signaling
npm install
node server.js

# 4. React
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## 實作優先順序

1. `schema.sql` — 建立所有資料表
2. `config/db.php` + `config/cors.php`
3. Auth API（register / login / logout / me）
4. `useAuth.js` + `AuthGuard.jsx` + LoginPage
5. Friends API + FriendsPage
6. Messages API（text）+ `useSocket.js` + ChatPage
7. Feed API + FeedPage
8. Voice messages（VoiceRecorder + voice.php）
9. Notifications
10. WebRTC（`useWebRTC.js` + CallPage + signaling/webrtc.js）

---

## 注意事項

- PHP session + React fetch 需要 `credentials: 'include'`，且 CORS `Access-Control-Allow-Credentials: true`
- `uploads/` 目錄加 `.htaccess` 防止執行 PHP：`php_flag engine off`
- 語音檔建議限制大小（`upload_max_filesize = 10M`）
- WebRTC 在 localhost 可以直接跑；部署到生產環境需要 HTTPS + TURN server
- Node.js signaling 和 PHP 共用同一個 MySQL，Node.js 驗證使用者時直接查 DB
