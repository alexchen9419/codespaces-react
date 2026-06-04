<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}
$me = $_SESSION['user_id'];

$stmt = $pdo->prepare('
    SELECT f.id AS friendship_id,
           u.id, u.username, u.avatar_path
    FROM friendships f
    JOIN users u ON f.requester_id = u.id
    WHERE f.receiver_id = ? AND f.status = "pending"
    ORDER BY f.created_at DESC
');
$stmt->execute([$me]);
echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
