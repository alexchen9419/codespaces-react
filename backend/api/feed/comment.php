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
$body    = trim($data['body'] ?? '');

if (!$post_id || !$body) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'post_id and body required']);
    exit;
}

$stmt = $pdo->prepare('INSERT INTO comments (post_id, user_id, body) VALUES (?, ?, ?)');
$stmt->execute([$post_id, $me, $body]);
$id = (int)$pdo->lastInsertId();

$stmt = $pdo->prepare('
    SELECT c.*, u.username, u.avatar_path
    FROM comments c JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
');
$stmt->execute([$id]);
echo json_encode(['success' => true, 'data' => $stmt->fetch()]);
