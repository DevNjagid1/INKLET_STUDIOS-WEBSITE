<?php
/**
 * INKLET STUDIOS — Services API Endpoint
 * Handles public service offerings and administrative service catalog management
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/response.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/validator.php';
require_once __DIR__ . '/../includes/logger.php';

header('Content-Type: application/json; charset=utf-8');

$pdo = DB::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Single service
if ($method === 'GET' && (isset($_GET['slug']) || isset($_GET['id']))) {
    $slug = $_GET['slug'] ?? null;
    $id = $_GET['id'] ?? null;

    $query = "SELECT * FROM services WHERE " . ($slug ? "slug = :param" : "id = :param");
    if (!Auth::checkAdmin()) {
        $query .= " AND is_active = 1";
    }

    $stmt = $pdo->prepare($query);
    $stmt->execute(['param' => $slug ?: $id]);
    $service = $stmt->fetch();

    if (!$service) {
        Response::notFound('Service not found.');
    }

    $service['deliverables'] = json_decode($service['deliverables'], true) ?: [];
    Response::success($service);
}

// List services
if ($method === 'GET') {
    $query = "SELECT * FROM services";
    if (!Auth::checkAdmin()) {
        $query .= " WHERE is_active = 1";
    }
    $query .= " ORDER BY sort_order ASC, id ASC";

    $stmt = $pdo->query($query);
    $services = $stmt->fetchAll();

    foreach ($services as &$s) {
        $s['deliverables'] = json_decode($s['deliverables'], true) ?: [];
    }
    unset($s);

    Response::success($services);
}

// Update Service (Admin)
if ($method === 'POST' || $method === 'PUT') {
    $admin = Auth::requireAdmin();
    $id = (int)($_GET['id'] ?? 0);
    $raw = json_decode(file_get_contents('php://input'), true) ?? $_POST;

    if (!$id && !empty($raw['id'])) {
        $id = (int)$raw['id'];
    }

    if (!$id) {
        Response::error('Service ID is required', 400);
    }

    $stmt = $pdo->prepare("SELECT id FROM services WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $id]);
    if (!$stmt->fetch()) {
        Response::notFound('Service not found');
    }

    $fields = [];
    $params = ['id' => $id];

    $allowed = [
        'name', 'slug', 'summary', 'description', 'deliverables',
        'intended_audience', 'process_overview', 'timeline_estimate',
        'starting_price_kes', 'is_active', 'sort_order'
    ];

    foreach ($allowed as $f) {
        if (array_key_exists($f, $raw)) {
            $fields[] = "`{$f}` = :{$f}";
            $params[$f] = is_array($raw[$f]) ? json_encode($raw[$f]) : $raw[$f];
        }
    }

    if (!empty($fields)) {
        $sql = "UPDATE services SET " . implode(', ', $fields) . ", updated_at = NOW() WHERE id = :id";
        $updateStmt = $pdo->prepare($sql);
        $updateStmt->execute($params);
        Logger::audit($admin['id'], 'UPDATE_SERVICE', 'services', $id);
    }

    Response::success(null, 'Service updated successfully');
}

Response::error('Method not allowed', 405);
