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
    SELECT p.*, u.username, u.avatar_path,
           (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count,
           (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) AS liked_by_me,
           (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.user_id = ?
       OR p.user_id IN (
           SELECT CASE WHEN requester_id = ? THEN receiver_id ELSE requester_id END
           FROM friendships
           WHERE (requester_id = ? OR receiver_id = ?) AND status = 'accepted'
       )
    ORDER BY p.created_at DESC
    LIMIT 50
");
$stmt->execute([$me, $me, $me, $me, $me]);
$posts = $stmt->fetchAll();

foreach ($posts as &$post) {
    $post['liked_by_me']   = (bool)$post['liked_by_me'];
    $post['like_count']    = (int)$post['like_count'];
    $post['comment_count'] = (int)$post['comment_count'];

    $c = $pdo->prepare('
        SELECT c.*, u.username, u.avatar_path
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC
    ');
    $c->execute([$post['id']]);
    $post['comments'] = $c->fetchAll();
}

echo json_encode(['success' => true, 'data' => $posts]);
