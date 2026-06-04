# SocialApp

一個全端社交平台，支援好友系統、即時私訊、語音訊息、動態牆與 WebRTC 語音通話。

## 技術棧

| 層 | 技術 |
| --- | --- |
| 前端 | React 18 + Vite + Tailwind CSS |
| 後端 API | PHP 8 + SQLite（PDO） |
| 即時通訊 | Node.js + Socket.io |
| 語音通話 | WebRTC（P2P） |

## 功能

- **帳號系統**：註冊、登入、登出、個人資料
- **好友系統**：搜尋用戶、送出 / 接受好友邀請、移除好友
- **動態牆**：發文、按讚（toggle）、留言，顯示自己與好友的貼文
- **即時私訊**：文字訊息透過 Socket.io 即時推送，支援語音訊息錄音上傳
- **語音通話**：WebRTC P2P 音訊通話，透過 Node.js 完成 signaling
- **通知**：好友邀請、訊息、按讚、留言通知，支援即時 badge

## 專案結構

```text
.
├── backend/                  # PHP REST API（SQLite）
│   ├── config/
│   │   ├── db.php            # SQLite PDO 連線（首次啟動自動建表）
│   │   └── cors.php          # CORS + session_start
│   ├── api/
│   │   ├── auth/             # register / login / logout / me
│   │   ├── friends/          # list / pending / request / accept / remove
│   │   ├── users/            # search
│   │   ├── messages/         # inbox / thread / send / voice
│   │   ├── feed/             # list / post / like / comment
│   │   └── notifications/    # list / read
│   ├── uploads/
│   │   ├── voices/           # 語音訊息 .webm
│   │   └── avatars/          # 大頭貼
│   ├── data/
│   │   └── social.db         # SQLite 資料庫（自動產生）
│   └── schema_sqlite.sql     # 資料表定義
│
├── signaling/                # Node.js + Socket.io（Port 3001）
│   ├── server.js
│   └── package.json
│
├── src/                      # React 前端
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── FeedPage.jsx
│   │   ├── FriendsPage.jsx
│   │   ├── InboxPage.jsx
│   │   ├── ChatPage.jsx
│   │   ├── CallPage.jsx
│   │   └── ProfilePage.jsx
│   ├── components/
│   │   ├── AuthGuard.jsx
│   │   ├── Layout.jsx
│   │   ├── FeedPost.jsx
│   │   ├── NotifBadge.jsx
│   │   ├── VoiceRecorder.jsx
│   │   ├── VoicePlayer.jsx
│   │   └── WebRTCCall.jsx
│   ├── hooks/
│   │   ├── useAuth.jsx
│   │   ├── useSocket.js
│   │   └── useWebRTC.js
│   └── api/
│       ├── auth.js
│       ├── friends.js
│       ├── messages.js
│       ├── feed.js
│       └── notifications.js
│
├── .env
├── vite.config.js
└── tailwind.config.js
```

## 快速啟動

需要同時啟動三個服務：PHP backend、Node.js signaling server、React dev server。

### 1. PHP Backend（Port 8080）

```bash
cd backend
php -S localhost:8080
```

> 第一次啟動會自動建立 `data/social.db` 並套用所有資料表，無需手動執行 SQL。

### 2. Node.js Signaling Server（Port 3001）

```bash
cd signaling
npm install      # 第一次需要
node server.js
```

### 3. React 前端（Port 3000）

```bash
npm install      # 第一次需要
npm run dev
```

開啟瀏覽器前往 [http://localhost:3000](http://localhost:3000)

## Port 對照表

| 服務 | Port |
| --- | --- |
| React（Vite dev server） | 3000 |
| PHP backend | 8080 |
| Node.js signaling | 3001 |

Vite 已設定 proxy，前端對 `/api` 和 `/uploads` 的請求會自動轉發至 PHP（port 8080）。

## API 端點

### Auth

| Method | 路徑 | 說明 |
| --- | --- | --- |
| POST | `/api/auth/register.php` | 註冊 |
| POST | `/api/auth/login.php` | 登入 |
| GET | `/api/auth/logout.php` | 登出 |
| GET | `/api/auth/me.php` | 取得目前登入用戶 |

### Friends

| Method | 路徑 | 說明 |
| --- | --- | --- |
| GET | `/api/friends/list.php` | 好友清單 |
| GET | `/api/friends/pending.php` | 待處理邀請 |
| POST | `/api/friends/request.php` | 送出邀請 `{ receiver_id }` |
| POST | `/api/friends/accept.php` | 接受邀請 `{ friendship_id }` |
| DELETE | `/api/friends/remove.php` | 刪除好友 `{ friendship_id }` |
| GET | `/api/users/search.php?q=` | 搜尋用戶 |

### Messages

| Method | 路徑 | 說明 |
| --- | --- | --- |
| GET | `/api/messages/inbox.php` | 收件匣 |
| GET | `/api/messages/thread.php?user_id=` | 對話紀錄 |
| POST | `/api/messages/send.php` | 傳文字訊息 |
| POST | `/api/messages/voice.php` | 上傳語音訊息 |

### Feed

| Method | 路徑 | 說明 |
| --- | --- | --- |
| GET | `/api/feed/list.php` | 好友動態 |
| POST | `/api/feed/post.php` | 發文 |
| POST | `/api/feed/like.php` | 按讚（toggle） |
| POST | `/api/feed/comment.php` | 留言 |

### Notifications

| Method | 路徑 | 說明 |
| --- | --- | --- |
| GET | `/api/notifications/list.php` | 通知清單 |
| POST | `/api/notifications/read.php` | 標記已讀 |

## Socket.io 事件

| 事件（emit） | 方向 | 說明 |
| --- | --- | --- |
| `register` | Client → Server | 綁定 userId 與 socket |
| `send_message` | Client → Server | 推送新訊息給對方 |
| `webrtc_offer` | Client → Server | WebRTC offer |
| `webrtc_answer` | Client → Server | WebRTC answer |
| `webrtc_ice` | Client → Server | ICE candidate |
| `new_message` | Server → Client | 收到新訊息 |
| `webrtc_offer` | Server → Client | 收到通話邀請 |
| `webrtc_answer` | Server → Client | 收到通話回應 |
| `webrtc_ice` | Server → Client | 收到 ICE candidate |
| `notification` | Server → Client | 即時通知 |

## 使用說明

1. **註冊帳號**：前往 `/register`，填寫用戶名、Email、密碼
2. **搜尋好友**：進入「Friends」→「Find People」分頁，輸入用戶名搜尋
3. **發送邀請**：點擊「Add Friend」送出邀請
4. **接受邀請**：切換到「Requests」分頁，接受待處理的邀請
5. **聊天**：進入「Messages」→ 點選好友開始對話；長按麥克風按鈕錄製語音訊息
6. **語音通話**：在聊天頁面點擊「📞 Call」啟動 WebRTC 通話
7. **動態牆**：接受好友後，雙方的貼文都會出現在「Feed」

## 注意事項

- 動態牆只顯示**自己與好友**的貼文，需要先建立好友關係
- WebRTC 語音通話在 localhost 可直接使用；部署至生產環境需要 HTTPS + TURN server
- 語音訊息上傳大小限制為 10 MB
- SQLite 資料庫存放於 `backend/data/social.db`，刪除此檔案可重置所有資料
- PHP session 搭配 Vite proxy 使用，前端 fetch 必須加 `credentials: 'include'`

## 環境變數（.env）

```ini
DB_HOST=localhost
DB_NAME=social_db
DB_USER=root
DB_PASS=

VITE_SOCKET_URL=http://localhost:3001
```

目前使用 SQLite，`DB_*` 變數無作用。若要切換至 MySQL，修改 `backend/config/db.php`。
