<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}
$me = $_SESSION['user_id'];

$stmt = $pdo->prepare("
    SELECT f.id AS friendship_id,
           u.id, u.username, u.avatar_path, u.bio
    FROM friendships f
    JOIN users u ON (
        CASE WHEN f.requester_id = ? THEN f.receiver_id ELSE f.requester_id END = u.id
    )
    WHERE (f.requester_id = ? OR f.receiver_id = ?)
      AND f.status = 'accepted'
    ORDER BY u.username ASC
");
$stmt->execute([$me, $me, $me]);
echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
