<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}
$me    = $_SESSION['user_id'];
$other = (int)($_GET['user_id'] ?? 0);

if (!$other) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'user_id required']);
    exit;
}

// Mark incoming messages as read
$pdo->prepare('UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ?')
    ->execute([$other, $me]);

$stmt = $pdo->prepare('
    SELECT m.*, u.username, u.avatar_path
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE (m.sender_id = ? AND m.receiver_id = ?)
       OR (m.sender_id = ? AND m.receiver_id = ?)
    ORDER BY m.sent_at ASC
    LIMIT 200
');
$stmt->execute([$me, $other, $other, $me]);

// Also return the other user's info
$uStmt = $pdo->prepare('SELECT id, username, avatar_path, bio FROM users WHERE id = ?');
$uStmt->execute([$other]);
$otherUser = $uStmt->fetch();

echo json_encode(['success' => true, 'data' => $stmt->fetchAll(), 'other_user' => $otherUser]);
