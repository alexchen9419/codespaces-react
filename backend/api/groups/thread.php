<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

if (empty($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['success' => false]); exit; }
$me = $_SESSION['user_id'];

$groupId = (int)($_GET['group_id'] ?? 0);
if (!$groupId) { http_response_code(400); exit; }

// Verify membership
$check = $pdo->prepare('SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?');
$check->execute([$groupId, $me]);
if (!$check->fetch()) { http_response_code(403); exit; }

$gstmt = $pdo->prepare('SELECT * FROM "groups" WHERE id = ?');
$gstmt->execute([$groupId]);
$group = $gstmt->fetch();

$mstmt = $pdo->prepare('
    SELECT u.id, u.username, u.avatar_path
    FROM group_members gm
    JOIN users u ON u.id = gm.user_id
    WHERE gm.group_id = ?
    ORDER BY u.username ASC
');
$mstmt->execute([$groupId]);
$members = $mstmt->fetchAll();

$stmt = $pdo->prepare('
    SELECT gm.*, u.username, u.avatar_path
    FROM group_messages gm
    JOIN users u ON u.id = gm.sender_id
    WHERE gm.group_id = ?
    ORDER BY gm.sent_at ASC
    LIMIT 200
');
$stmt->execute([$groupId]);
$messages = $stmt->fetchAll();

echo json_encode([
    'success' => true,
    'data'    => $messages,
    'group'   => $group,
    'members' => $members,
]);
