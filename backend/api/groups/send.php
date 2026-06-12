<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

if (empty($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['success' => false]); exit; }
$me = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }

$data    = json_decode(file_get_contents('php://input'), true);
$groupId = (int)($data['group_id'] ?? 0);
$body    = trim($data['body'] ?? '');

if (!$groupId || !$body) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'group_id and body required']);
    exit;
}

// Verify membership
$check = $pdo->prepare('SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?');
$check->execute([$groupId, $me]);
if (!$check->fetch()) { http_response_code(403); exit; }

$pdo->prepare("INSERT INTO group_messages (group_id, sender_id, type, body) VALUES (?, ?, 'text', ?)")
    ->execute([$groupId, $me, $body]);
$id = (int)$pdo->lastInsertId();

$u = $pdo->prepare('SELECT username, avatar_path FROM users WHERE id = ?');
$u->execute([$me]);
$sender = $u->fetch();

echo json_encode(['success' => true, 'data' => [
    'id'         => $id,
    'group_id'   => $groupId,
    'sender_id'  => $me,
    'type'       => 'text',
    'body'       => $body,
    'sent_at'    => date('Y-m-d H:i:s'),
    'username'   => $sender['username'],
    'avatar_path'=> $sender['avatar_path'],
]]);
