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

$receiver_id = (int)($_POST['receiver_id'] ?? 0);
if (!$receiver_id || !isset($_FILES['audio'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'receiver_id and audio required']);
    exit;
}

$file = $_FILES['audio'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Upload error']);
    exit;
}

if ($file['size'] > 10 * 1024 * 1024) {
    http_response_code(413);
    echo json_encode(['success' => false, 'message' => 'File too large (max 10 MB)']);
    exit;
}

$filename = bin2hex(random_bytes(16)) . '.webm';
$destDir  = __DIR__ . '/../../../uploads/voices/';
if (!is_dir($destDir)) {
    mkdir($destDir, 0755, true);
}
$dest = $destDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $dest)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Upload failed']);
    exit;
}

$duration  = (int)($_POST['duration'] ?? 0);
$file_path = 'uploads/voices/' . $filename;

$stmt = $pdo->prepare("INSERT INTO messages (sender_id, receiver_id, type, file_path, duration_seconds) VALUES (?, ?, 'voice', ?, ?)");
$stmt->execute([$me, $receiver_id, $file_path, $duration]);
$id = (int)$pdo->lastInsertId();

$u = $pdo->prepare('SELECT username, avatar_path FROM users WHERE id = ?');
$u->execute([$me]);
$sender = $u->fetch();

echo json_encode(['success' => true, 'data' => [
    'id'               => $id,
    'sender_id'        => $me,
    'receiver_id'      => $receiver_id,
    'type'             => 'voice',
    'file_path'        => $file_path,
    'duration_seconds' => $duration,
    'is_read'          => 0,
    'sent_at'          => date('Y-m-d H:i:s'),
    'username'         => $sender['username'],
    'avatar_path'      => $sender['avatar_path'],
]]);
