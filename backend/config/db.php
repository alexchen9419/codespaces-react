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
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $e->getMessage()]);
    exit;
}
