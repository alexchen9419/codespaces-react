<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}
$me = $_SESSION['user_id'];

$q = trim($_GET['q'] ?? '');
if ($q === '') {
    echo json_encode(['success' => true, 'data' => []]);
    exit;
}

$stmt = $pdo->prepare("
    SELECT u.id, u.username, u.avatar_path,
           f.status AS friendship_status, f.id AS friendship_id
    FROM users u
    LEFT JOIN friendships f ON (
        (f.requester_id = ? AND f.receiver_id = u.id)
        OR (f.receiver_id = ? AND f.requester_id = u.id)
    )
    WHERE u.id != ? AND u.username LIKE ?
    LIMIT 20
");
$stmt->execute([$me, $me, $me, '%' . $q . '%']);
echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
