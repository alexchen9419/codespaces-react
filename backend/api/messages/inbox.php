<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}
$me = $_SESSION['user_id'];

// Latest message per conversation partner
$stmt = $pdo->prepare('
    SELECT m.*,
           u.id AS other_id, u.username, u.avatar_path,
           (SELECT COUNT(*) FROM messages m2
            WHERE m2.sender_id = u.id AND m2.receiver_id = ? AND m2.is_read = 0) AS unread_count
    FROM messages m
    JOIN users u ON (
        CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END = u.id
    )
    WHERE (m.sender_id = ? OR m.receiver_id = ?)
      AND m.id = (
          SELECT MAX(m3.id) FROM messages m3
          WHERE (m3.sender_id = m.sender_id AND m3.receiver_id = m.receiver_id)
             OR (m3.sender_id = m.receiver_id AND m3.receiver_id = m.sender_id)
      )
    GROUP BY u.id
    ORDER BY m.sent_at DESC
');
$stmt->execute([$me, $me, $me, $me]);
echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
