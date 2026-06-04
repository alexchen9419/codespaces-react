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
$content = trim($data['content'] ?? '');

if (!$content) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Content required']);
    exit;
}

$stmt = $pdo->prepare('INSERT INTO posts (user_id, content) VALUES (?, ?)');
$stmt->execute([$me, $content]);
$id = (int)$pdo->lastInsertId();

$stmt = $pdo->prepare('
    SELECT p.*, u.username, u.avatar_path
    FROM posts p JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
');
$stmt->execute([$id]);
$post = $stmt->fetch();
$post['like_count']    = 0;
$post['liked_by_me']  = false;
$post['comment_count'] = 0;
$post['comments']      = [];

echo json_encode(['success' => true, 'data' => $post]);
