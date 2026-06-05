<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}
$me = $_SESSION['user_id'];

$data = json_decode(file_get_contents('php://input'), true);
$receiver_id = (int)($data['receiver_id'] ?? 0);
$duration    = (int)($data['duration'] ?? 0);
$status      = $data['status'] ?? 'completed'; // completed | cancelled

if (!$receiver_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'receiver_id required']);
    exit;
}

$stmt = $pdo->prepare(
    "INSERT INTO messages (sender_id, receiver_id, type, body, duration_seconds)
     VALUES (?, ?, 'call', ?, ?)"
);
$stmt->execute([$me, $receiver_id, $status, $duration]);
$id = (int)$pdo->lastInsertId();

$u = $pdo->prepare('SELECT username, avatar_path FROM users WHERE id = ?');
$u->execute([$me]);
$sender = $u->fetch();

echo json_encode(['success' => true, 'data' => [
    'id'               => $id,
    'sender_id'        => $me,
    'receiver_id'      => $receiver_id,
    'type'             => 'call',
    'body'             => $status,
    'duration_seconds' => $duration,
    'is_read'          => 0,
    'sent_at'          => date('Y-m-d H:i:s'),
    'username'         => $sender['username'],
    'avatar_path'      => $sender['avatar_path'],
]]);
