<?php
/**
 * INKLET STUDIOS — Site Settings API
 * Handles website configuration, contact information, social links, and SEO metadata
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/response.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/logger.php';

header('Content-Type: application/json; charset=utf-8');

$pdo = DB::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// GET: Settings
if ($method === 'GET') {
    $stmt = $pdo->query("SELECT setting_key, setting_value, setting_group, description FROM site_settings");
    $rawSettings = $stmt->fetchAll();

    $settings = [];
    foreach ($rawSettings as $row) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }

    Response::success($settings);
}

// POST: Update Settings (Admin)
if ($method === 'POST') {
    $admin = Auth::requireAdmin();
    $raw = json_decode(file_get_contents('php://input'), true) ?? $_POST;

    $stmt = $pdo->prepare("
        INSERT INTO site_settings (setting_key, setting_value)
        VALUES (:key, :val)
        ON DUPLICATE KEY UPDATE setting_value = :val2, updated_at = NOW()
    ");

    foreach ($raw as $key => $val) {
        if (!is_string($key) || !is_scalar($val)) {
            continue;
        }
        $stmt->execute([
            'key'  => $key,
            'val'  => (string)$val,
            'val2' => (string)$val
        ]);
    }

    Logger::audit($admin['id'], 'UPDATE_SETTINGS', 'site_settings');
    Response::success(null, 'Site settings updated successfully');
}

Response::error('Method not allowed', 405);
