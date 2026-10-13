<?php
/**
 * INKLET STUDIOS — Contact Inquiries API
 * Handles public direct contact messages and administrative inbox
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/response.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/validator.php';
require_once __DIR__ . '/../includes/mailer.php';
require_once __DIR__ . '/../includes/logger.php';

header('Content-Type: application/json; charset=utf-8');

$pdo = DB::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Public Contact Form Submission
if ($method === 'POST' && (!isset($_GET['action']) || $_GET['action'] === 'send')) {
    $raw = json_decode(file_get_contents('php://input'), true) ?? $_POST;

    // Spam honeypot
    if (!empty($raw['contact_company_hp'])) {
        Response::success(null, 'Message received.');
    }

    $validator = new Validator($raw);
    $validator->required('name')
              ->required('email')
              ->email('email')
              ->required('subject')
              ->required('message')
              ->minLength('message', 10);

    if (!empty($raw['phone'])) {
        $validator->phone('phone');
    }

    if (!$validator->isValid()) {
        Response::error('Please fill in all required message fields.', 422, $validator->getErrors());
    }

    $stmt = $pdo->prepare("
        INSERT INTO contact_messages (name, email, phone, subject, message, is_read, status, ip_address)
        VALUES (:name, :email, :phone, :subject, :message, 0, 'unread', :ip)
    ");

    $stmt->execute([
        'name'    => trim($raw['name']),
        'email'   => strtolower(trim($raw['email'])),
        'phone'   => trim($raw['phone'] ?? ''),
        'subject' => trim($raw['subject']),
        'message' => trim($raw['message']),
        'ip'      => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
    ]);

    // Send notification alert to studio
    $alertHtml = "
        <h3>New Contact Message Received</h3>
        <p><strong>From:</strong> " . htmlspecialchars($raw['name']) . " &lt;" . htmlspecialchars($raw['email']) . "&gt;</p>
        <p><strong>Phone:</strong> " . htmlspecialchars($raw['phone'] ?? 'None provided') . "</p>
        <p><strong>Subject:</strong> " . htmlspecialchars($raw['subject']) . "</p>
        <hr>
        <p style='white-space:pre-wrap;'>" . htmlspecialchars($raw['message']) . "</p>
    ";
    Mailer::send(STUDIO_ADMIN_EMAIL, "[CONTACT] " . trim($raw['subject']), $alertHtml);

    Response::success(null, 'Your message has been received. Our team in Chuka will respond promptly.', 201);
}

// Admin: Retrieve Messages
if ($method === 'GET') {
    $admin = Auth::requireAdmin();
    $status = $_GET['status'] ?? null;

    $where = [];
    $params = [];
    if ($status && $status !== 'all') {
        $where[] = "status = :st";
        $params['st'] = $status;
    }

    $whereSql = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";
    $stmt = $pdo->prepare("SELECT * FROM contact_messages {$whereSql} ORDER BY is_read ASC, id DESC LIMIT 50");
    $stmt->execute($params);
    $messages = $stmt->fetchAll();

    $unreadCount = (int)$pdo->query("SELECT COUNT(*) FROM contact_messages WHERE is_read = 0")->fetchColumn();

    Response::success($messages, 'Messages retrieved', 200, [
        'unread_count' => $unreadCount
    ]);
}

// Admin: Mark Read / Status Update
if ($method === 'PATCH' || ($method === 'POST' && ($_GET['action'] ?? '') === 'status')) {
    $admin = Auth::requireAdmin();
    $raw = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $id = (int)($raw['id'] ?? $_GET['id'] ?? 0);
    $newStatus = $raw['status'] ?? 'read';

    if (!$id) {
        Response::error('Message ID is required', 400);
    }

    $isRead = ($newStatus === 'unread') ? 0 : 1;
    $upd = $pdo->prepare("UPDATE contact_messages SET status = :st, is_read = :rd WHERE id = :id");
    $upd->execute(['st' => $newStatus, 'rd' => $isRead, 'id' => $id]);

    Response::success(null, 'Message updated successfully');
}

Response::error('Method not allowed', 405);
