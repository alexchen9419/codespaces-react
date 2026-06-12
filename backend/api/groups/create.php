<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

if (empty($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['success' => false]); exit; }
$me = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }

$data       = json_decode(file_get_contents('php://input'), true);
$name       = trim($data['name'] ?? '');
$memberIds  = $data['member_ids'] ?? [];

if (!$name) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'name required']);
    exit;
}

$pdo->beginTransaction();
try {
    $pdo->prepare('INSERT INTO "groups" (name, created_by) VALUES (?, ?)')->execute([$name, $me]);
    $groupId = (int)$pdo->lastInsertId();

    $pdo->prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)')->execute([$groupId, $me]);

    $stmt = $pdo->prepare('INSERT OR IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)');
    foreach ($memberIds as $uid) {
        $uid = (int)$uid;
        if ($uid && $uid !== (int)$me) {
            $stmt->execute([$groupId, $uid]);
        }
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'data' => ['id' => $groupId, 'name' => $name]]);
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
