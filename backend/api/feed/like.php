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

$data    = json_decode(file_get_contents('php://input'), true);
$post_id = (int)($data['post_id'] ?? 0);

if (!$post_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'post_id required']);
    exit;
}

$check = $pdo->prepare('SELECT id FROM likes WHERE post_id = ? AND user_id = ?');
$check->execute([$post_id, $me]);

if ($check->fetch()) {
    $pdo->prepare('DELETE FROM likes WHERE post_id = ? AND user_id = ?')->execute([$post_id, $me]);
    $liked = false;
} else {
    $pdo->prepare('INSERT INTO likes (post_id, user_id) VALUES (?, ?)')->execute([$post_id, $me]);
    $liked = true;
}

$countStmt = $pdo->prepare('SELECT COUNT(*) FROM likes WHERE post_id = ?');
$countStmt->execute([$post_id]);
echo json_encode(['success' => true, 'data' => ['liked' => $liked, 'count' => (int)$countStmt->fetchColumn()]]);
