<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}
$me = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data          = json_decode(file_get_contents('php://input'), true);
$friendship_id = (int)($data['friendship_id'] ?? 0);

$stmt = $pdo->prepare('DELETE FROM friendships WHERE id = ? AND (requester_id = ? OR receiver_id = ?)');
$stmt->execute([$friendship_id, $me, $me]);
echo json_encode(['success' => true]);
