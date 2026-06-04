<?php
require_once '../../config/cors.php';
session_destroy();
echo json_encode(['success' => true]);
