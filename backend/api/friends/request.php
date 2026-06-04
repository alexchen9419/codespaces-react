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

$data        = json_decode(file_get_contents('php://input'), true);
$receiver_id = (int)($data['receiver_id'] ?? 0);

if (!$receiver_id || $receiver_id === $me) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid receiver']);
    exit;
}

try {
    $stmt = $pdo->prepare('INSERT INTO friendships (requester_id, receiver_id) VALUES (?, ?)');
    $stmt->execute([$me, $receiver_id]);

    $n = $pdo->prepare("INSERT INTO notifications (user_id, type, ref_id) VALUES (?, 'friend_request', ?)");
    $n->execute([$receiver_id, $me]);

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'Request already exists']);
}
