<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

if (empty($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['success' => false]); exit; }
$me = $_SESSION['user_id'];

$stmt = $pdo->prepare("
    SELECT
        g.id, g.name, g.avatar_path, g.created_by,
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) AS member_count,
        gm.body        AS last_body,
        gm.type        AS last_type,
        gm.sent_at     AS last_sent_at,
        u.username     AS last_sender
    FROM \"groups\" g
    JOIN group_members me ON me.group_id = g.id AND me.user_id = ?
    LEFT JOIN group_messages gm ON gm.id = (
        SELECT id FROM group_messages WHERE group_id = g.id ORDER BY sent_at DESC LIMIT 1
    )
    LEFT JOIN users u ON u.id = gm.sender_id
    ORDER BY COALESCE(gm.sent_at, g.created_at) DESC
");
$stmt->execute([$me]);
echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
