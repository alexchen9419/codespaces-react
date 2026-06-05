CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_path TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS friendships (
  id INTEGER PRIMARY KEY,
  requester_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(requester_id, receiver_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  type TEXT DEFAULT 'text' CHECK(type IN ('text', 'voice', 'call')),
  body TEXT,
  file_path TEXT,
  duration_seconds INTEGER,
  is_read INTEGER DEFAULT 0,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  image_path TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS likes (
  id INTEGER PRIMARY KEY,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('friend_request', 'message', 'like', 'comment')),
  ref_id INTEGER,
  is_read INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
