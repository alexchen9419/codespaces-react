<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}
$me = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data        = json_decode(file_get_contents('php://input'), true);
$receiver_id = (int)($data['receiver_id'] ?? 0);
$body        = trim($data['body'] ?? '');

if (!$receiver_id || !$body) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'receiver_id and body required']);
    exit;
}

$stmt = $pdo->prepare("INSERT INTO messages (sender_id, receiver_id, type, body) VALUES (?, ?, 'text', ?)");
$stmt->execute([$me, $receiver_id, $body]);
$id = (int)$pdo->lastInsertId();

$u = $pdo->prepare('SELECT username, avatar_path FROM users WHERE id = ?');
$u->execute([$me]);
$sender = $u->fetch();

echo json_encode(['success' => true, 'data' => [
    'id'          => $id,
    'sender_id'   => $me,
    'receiver_id' => $receiver_id,
    'type'        => 'text',
    'body'        => $body,
    'is_read'     => 0,
    'sent_at'     => date('Y-m-d H:i:s'),
    'username'    => $sender['username'],
    'avatar_path' => $sender['avatar_path'],
]]);
