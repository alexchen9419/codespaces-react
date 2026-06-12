# SocialApp

一個全端社交平台，支援好友系統、即時私訊、語音訊息、群組聊天、動態牆與 WebRTC 語音通話。

## 技術棧

| 層 | 技術 |
|---|---|
| 前端 | React 18 + Vite + Tailwind CSS |
| 後端 API | PHP 8 + SQLite（PDO） |
| 即時通訊 | Node.js + Socket.io |
| 語音通話 | WebRTC（P2P，STUN） |

## 功能

- **帳號系統**：註冊、登入、登出、個人資料與大頭貼
- **好友系統**：搜尋用戶、送出／接受／拒絕好友邀請、移除好友
- **動態牆**：發文、按讚（toggle）、留言，顯示自己與好友的貼文
- **即時私訊**：文字訊息透過 Socket.io 即時推送；支援語音訊息錄音上傳（WebM）
- **群組聊天**：建立群組、邀請好友加入、即時群組訊息（Socket.io room）
- **語音通話**：WebRTC P2P 音訊通話；通話紀錄自動寫入聊天記錄
- **通知**：好友邀請、按讚、留言通知，即時 badge，開啟即自動標記已讀

## 專案結構

```
.
├── backend/                        # PHP REST API（SQLite）
│   ├── config/
│   │   ├── db.php                  # SQLite PDO 連線 + 自動 migration
│   │   └── cors.php                # CORS headers + session_start
│   ├── api/
│   │   ├── auth/                   # register / login / logout / me
│   │   ├── friends/                # list / pending / request / accept / remove
│   │   ├── users/                  # search
│   │   ├── messages/               # inbox / thread / send / voice / call
│   │   ├── groups/                 # create / list / thread / send
│   │   ├── feed/                   # list / post / like / comment
│   │   └── notifications/          # list / read
│   ├── uploads/
│   │   ├── voices/                 # 語音訊息 .webm
│   │   └── avatars/                # 大頭貼
│   ├── data/
│   │   └── social.db               # SQLite 資料庫（自動產生）
│   └── schema_sqlite.sql           # 所有資料表定義
│
├── signaling/                      # Node.js + Socket.io（Port 3001）
│   ├── server.js
│   └── package.json
│
└── src/                            # React 前端
    ├── pages/
    │   ├── LoginPage.jsx
    │   ├── RegisterPage.jsx
    │   ├── FeedPage.jsx
    │   ├── FriendsPage.jsx
    │   ├── InboxPage.jsx           # 私訊＋群組 tab，建立群組 modal
    │   ├── ChatPage.jsx            # 私訊頁（文字、語音、通話紀錄）
    │   ├── GroupChatPage.jsx       # 群組聊天頁
    │   ├── CallPage.jsx            # WebRTC 通話頁
    │   └── ProfilePage.jsx
    ├── components/
    │   ├── AuthGuard.jsx
    │   ├── Layout.jsx
    │   ├── IncomingCall.jsx        # 來電 modal（全域，掛在 Layout 內）
    │   ├── FeedPost.jsx
    │   ├── NotifBadge.jsx
    │   ├── VoiceRecorder.jsx
    │   ├── VoicePlayer.jsx
    │   └── WebRTCCall.jsx
    ├── hooks/
    │   ├── useAuth.jsx
    │   ├── useSocket.js            # 單例 socket，重連後自動重新 register
    │   └── useWebRTC.js            # WebRTC 通話邏輯（兩階段握手）
    └── api/
        ├── auth.js
        ├── friends.js
        ├── messages.js
        ├── groups.js
        ├── feed.js
        └── notifications.js
```

## 快速啟動

需要同時啟動三個服務。

### 1. PHP Backend（Port 8080）

```bash
cd backend
php -S localhost:8080
```

> 第一次啟動時自動建立 `data/social.db` 並套用所有資料表，無需手動執行 SQL。

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

## Port 對照

| 服務 | Port |
|---|---|
| React（Vite dev server） | 3000 |
| PHP backend | 8080 |
| Node.js signaling | 3001 |

Vite 已設定 proxy，`/api` 與 `/uploads` 的請求自動轉發至 PHP（port 8080）。

---

## API 端點

### Auth

| Method | 路徑 | 說明 |
|---|---|---|
| POST | `/api/auth/register.php` | 註冊 `{ username, email, password }` |
| POST | `/api/auth/login.php` | 登入 `{ email, password }` |
| GET | `/api/auth/logout.php` | 登出 |
| GET | `/api/auth/me.php` | 取得目前登入用戶 |

### Friends

| Method | 路徑 | 說明 |
|---|---|---|
| GET | `/api/friends/list.php` | 好友清單 |
| GET | `/api/friends/pending.php` | 待處理邀請 |
| POST | `/api/friends/request.php` | 送出邀請 `{ receiver_id }` |
| POST | `/api/friends/accept.php` | 接受邀請 `{ friendship_id }` |
| DELETE | `/api/friends/remove.php` | 刪除好友 `{ friendship_id }` |
| GET | `/api/users/search.php?q=` | 搜尋用戶 |

### Messages（私訊）

| Method | 路徑 | 說明 |
|---|---|---|
| GET | `/api/messages/inbox.php` | 收件匣（每位聯絡人最新一則） |
| GET | `/api/messages/thread.php?user_id=` | 對話紀錄 |
| POST | `/api/messages/send.php` | 傳文字訊息 `{ receiver_id, body }` |
| POST | `/api/messages/voice.php` | 上傳語音訊息（multipart） |
| POST | `/api/messages/call.php` | 寫入通話紀錄 `{ receiver_id, duration, status }` |

### Groups（群組）

| Method | 路徑 | 說明 |
|---|---|---|
| GET | `/api/groups/list.php` | 我加入的群組 |
| POST | `/api/groups/create.php` | 建立群組 `{ name, member_ids[] }` |
| GET | `/api/groups/thread.php?group_id=` | 群組訊息＋成員列表 |
| POST | `/api/groups/send.php` | 傳送群組訊息 `{ group_id, body }` |

### Feed

| Method | 路徑 | 說明 |
|---|---|---|
| GET | `/api/feed/list.php` | 自己與好友的動態 |
| POST | `/api/feed/post.php` | 發文 `{ content }` |
| POST | `/api/feed/like.php` | 按讚 toggle `{ post_id }` |
| POST | `/api/feed/comment.php` | 留言 `{ post_id, body }` |

### Notifications

| Method | 路徑 | 說明 |
|---|---|---|
| GET | `/api/notifications/list.php` | 通知清單 |
| POST | `/api/notifications/read.php` | 標記已讀 `{ all: true }` 或 `{ id }` |

---

## Socket.io 事件

### 私訊

| 事件 | 方向 | 說明 |
|---|---|---|
| `register` | Client → Server | 綁定 userId（重連後自動重送） |
| `send_message` | Client → Server | 推送新訊息給對方 `{ to, message }` |
| `new_message` | Server → Client | 收到新私訊 |

### 群組

| 事件 | 方向 | 說明 |
|---|---|---|
| `join_group` | Client → Server | 加入群組 socket room `groupId` |
| `send_group_message` | Client → Server | 廣播群組訊息 `{ groupId, message }` |
| `group_message` | Server → Client | 收到群組訊息 |

### WebRTC 通話（兩階段握手）

| 事件 | 方向 | 說明 |
|---|---|---|
| `call_ring` | Client → Server | 發起通話 `{ to, fromUsername }` |
| `call_incoming` | Server → Client | 收到來電 `{ from, fromUsername }` |
| `call_accept` | Client → Server | 接受通話 `{ to }` |
| `call_accepted` | Server → Client | 對方已接受 |
| `call_ready` | Client → Server | Receiver 端 WebRTC 準備好 `{ to }` |
| `call_ready` | Server → Client | 通知 Caller 可以送 offer |
| `call_reject` | Client → Server | 拒絕通話 `{ to }` |
| `call_rejected` | Server → Client | 對方拒絕了通話 |
| `call_end` | Client → Server | 掛斷 `{ to }` |
| `call_ended` | Server → Client | 對方掛斷（含來電 modal 關閉） |
| `webrtc_offer` | Client ↔ Server ↔ Client | SDP offer |
| `webrtc_answer` | Client ↔ Server ↔ Client | SDP answer |
| `webrtc_ice` | Client ↔ Server ↔ Client | ICE candidate |

### 通知

| 事件 | 方向 | 說明 |
|---|---|---|
| `notify` | Client → Server | 推送通知給對方 `{ to, notification }` |
| `notification` | Server → Client | 收到即時通知 |

---

## 資料庫 Schema

```sql
users           -- 帳號
friendships     -- 好友關係（pending / accepted / blocked）
messages        -- 私訊（type: text / voice / call）
groups          -- 群組
group_members   -- 群組成員
group_messages  -- 群組訊息（type: text / voice）
posts           -- 動態貼文
likes           -- 按讚
comments        -- 留言
notifications   -- 通知
```

`backend/config/db.php` 每次請求時會自動建立缺少的資料表（`CREATE TABLE IF NOT EXISTS`），並在必要時執行 migration（例如 CHECK constraint 變更），不需手動執行 SQL。

---

## 使用說明

1. **註冊帳號**：前往 `/register`，填寫用戶名、Email、密碼
2. **搜尋好友**：進入「Friends」→「Find People」分頁，輸入用戶名搜尋
3. **接受邀請**：切換到「Requests」分頁，接受待處理的好友邀請
4. **私訊**：進入「Messages」私訊 tab → 點選好友開始對話
5. **語音訊息**：聊天頁按住麥克風按鈕錄音，放開後自動傳送
6. **語音通話**：聊天頁點擊「📞 Call」啟動 WebRTC 通話；通話結束後自動在對話中寫入通話紀錄
7. **群組聊天**：「Messages」切到「群組」tab → 點「＋ 建立」→ 輸入名稱並勾選成員 → 進入群組後點 👥 查看成員
8. **動態牆**：與好友建立關係後，Feed 頁面顯示雙方的貼文；可按讚與留言

---

## 注意事項

- WebRTC 語音通話在 `localhost` 可直接使用；部署至生產環境需要 **HTTPS + TURN server**
- 動態牆只顯示**自己與好友**的貼文，需要先互加好友
- 語音訊息上傳大小限制為 10 MB
- SQLite 資料庫存放於 `backend/data/social.db`，刪除此檔案可重置所有資料
- 前端所有 fetch 請求必須加 `credentials: 'include'`（session cookie）

## 環境變數（.env）

```ini
VITE_SOCKET_URL=http://localhost:3001
```
