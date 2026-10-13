<?php
/**
 * INKLET STUDIOS — File & Image Upload API Endpoint
 * Handles secure file uploads for administrative portfolio media
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../includes/response.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/upload.php';
require_once __DIR__ . '/../includes/logger.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

$admin = Auth::requireAdmin();

if (empty($_FILES['image'])) {
    Response::error('No image file was supplied in request.', 400);
}

$subfolder = $_POST['subfolder'] ?? 'projects';
$result = UploadHandler::process($_FILES['image'], $subfolder);

if (!$result['success']) {
    Response::error($result['error'], 422);
}

Logger::audit($admin['id'], 'UPLOAD_ASSET', 'assets', null, ['file' => $result['file_name']]);

Response::success([
    'url'       => $result['relative_url'],
    'file_name' => $result['file_name'],
    'size'      => $result['size']
], 'Image uploaded successfully.', 201);
