<?php
$dbDir  = __DIR__ . '/../data';
$dbPath = $dbDir . '/social.db';
$isNew  = !file_exists($dbPath);

if (!is_dir($dbDir)) {
    mkdir($dbDir, 0755, true);
}

try {
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec('PRAGMA foreign_keys = ON');
    $pdo->exec('PRAGMA journal_mode = WAL');
    $pdo->exec('PRAGMA synchronous = NORMAL');   // WAL 下安全且更快（預設 FULL）
    $pdo->exec('PRAGMA cache_size = -32000');    // 32 MB page cache
    $pdo->exec('PRAGMA temp_store = MEMORY');    // 暫存表放記憶體

    if ($isNew) {
        $schema = file_get_contents(__DIR__ . '/../schema_sqlite.sql');
        $pdo->exec($schema);
    } else {
        // Migration: add 'call' to messages.type CHECK constraint if not present
        $sql = $pdo->query("SELECT sql FROM sqlite_master WHERE type='table' AND name='messages'")->fetchColumn();
        if ($sql && strpos($sql, "'call'") === false) {
            $pdo->exec('PRAGMA foreign_keys = OFF');
            $pdo->exec("CREATE TABLE messages_new (
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
            )");
            $pdo->exec("INSERT INTO messages_new SELECT * FROM messages");
            $pdo->exec("DROP TABLE messages");
            $pdo->exec("ALTER TABLE messages_new RENAME TO messages");
            $pdo->exec('PRAGMA foreign_keys = ON');
        }
    }

    // Ensure group tables exist (idempotent — safe to run on every request)
    $pdo->exec("CREATE TABLE IF NOT EXISTS \"groups\" (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        avatar_path TEXT,
        created_by INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    )");
    $pdo->exec("CREATE TABLE IF NOT EXISTS group_members (
        id INTEGER PRIMARY KEY,
        group_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES \"groups\"(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(group_id, user_id)
    )");
    $pdo->exec("CREATE TABLE IF NOT EXISTS group_messages (
        id INTEGER PRIMARY KEY,
        group_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        type TEXT DEFAULT 'text' CHECK(type IN ('text', 'voice')),
        body TEXT,
        file_path TEXT,
        duration_seconds INTEGER,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES \"groups\"(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    )");

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $e->getMessage()]);
    exit;
}
