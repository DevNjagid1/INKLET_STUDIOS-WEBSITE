<?php
/**
 * INKLET STUDIOS — Booking & Project Enquiry API
 * Philosophy: "Ink with Intent"
 * 
 * Accurately logs briefs, generates unique references, handles notifications,
 * and maintains complete status audit trails.
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

// =====================================================================
// PUBLIC: Submit New Project Enquiry / Booking Request
// =====================================================================
if ($method === 'POST' && (!isset($_GET['action']) || $_GET['action'] === 'submit')) {
    $raw = json_decode(file_get_contents('php://input'), true) ?? $_POST;

    // Spam honeypot detection
    if (!empty($raw['website_hp'])) {
        // Silently discard bot submission
        Response::success(['booking_ref' => 'INK-' . date('Ym') . '-0000'], 'Enquiry received.');
    }

    $validator = new Validator($raw);
    $validator->required('client_name')
              ->required('client_email')
              ->email('client_email')
              ->required('service_id')
              ->required('project_title')
              ->required('project_description')
              ->minLength('project_description', 20, 'Please provide more details about your project scope.');

    if (!empty($raw['client_phone'])) {
        $validator->phone('client_phone');
    }

    if (!$validator->isValid()) {
        Response::error('Please correct the highlighted errors in your brief.', 422, $validator->getErrors());
    }

    // Verify service exists
    $serviceStmt = $pdo->prepare("SELECT id, name FROM services WHERE id = :sid AND is_active = 1 LIMIT 1");
    $serviceStmt->execute(['sid' => (int)$raw['service_id']]);
    $service = $serviceStmt->fetch();

    if (!$service) {
        Response::error('The selected service discipline is invalid or unavailable.', 400);
    }

    // Generate unique cryptographically solid booking reference: INK-YYYYMM-XXXX
    $refBase = 'INK-' . date('Ym') . '-';
    do {
        $candidateRef = $refBase . strtoupper(bin2hex(random_bytes(2)));
        $check = $pdo->prepare("SELECT id FROM bookings WHERE booking_ref = :ref LIMIT 1");
        $check->execute(['ref' => $candidateRef]);
    } while ($check->fetch());

    $serviceSpecific = !empty($raw['service_specific_data']) && is_array($raw['service_specific_data'])
        ? json_encode($raw['service_specific_data'])
        : null;

    $deadline = !empty($raw['deadline_date']) ? date('Y-m-d', strtotime($raw['deadline_date'])) : null;

    $stmt = $pdo->prepare("
        INSERT INTO bookings (
            booking_ref, client_name, client_email, client_phone, preferred_channel,
            service_id, project_title, project_description, intended_audience,
            service_specific_data, budget_range, deadline_date, status, ip_address
        ) VALUES (
            :ref, :name, :email, :phone, :channel,
            :sid, :title, :desc, :audience,
            :spec_data, :budget, :deadline, 'NEW', :ip
        )
    ");

    $stmt->execute([
        'ref'       => $candidateRef,
        'name'      => trim($raw['client_name']),
        'email'     => strtolower(trim($raw['client_email'])),
        'phone'     => trim($raw['client_phone'] ?? ''),
        'channel'   => in_array($raw['preferred_channel'] ?? '', ['email', 'whatsapp', 'phone']) ? $raw['preferred_channel'] : 'email',
        'sid'       => $service['id'],
        'title'     => trim($raw['project_title']),
        'desc'      => trim($raw['project_description']),
        'audience'  => trim($raw['intended_audience'] ?? ''),
        'spec_data' => $serviceSpecific,
        'budget'    => trim($raw['budget_range'] ?? 'Undisclosed'),
        'deadline'  => $deadline,
        'ip'        => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
    ]);

    $bookingId = (int)$pdo->lastInsertId();

    // Log initial history record
    $hist = $pdo->prepare("
        INSERT INTO booking_status_history (booking_id, previous_status, new_status, notes)
        VALUES (:bid, NULL, 'NEW', 'Initial client brief submitted via web platform')
    ");
    $hist->execute(['bid' => $bookingId]);

    // Dispatch emails honestly
    $bookingData = [
        'booking_ref'         => $candidateRef,
        'client_name'         => trim($raw['client_name']),
        'client_email'        => strtolower(trim($raw['client_email'])),
        'client_phone'        => trim($raw['client_phone'] ?? ''),
        'service_name'        => $service['name'],
        'project_title'       => trim($raw['project_title']),
        'project_description' => trim($raw['project_description']),
        'budget_range'        => trim($raw['budget_range'] ?? 'Undisclosed'),
        'deadline_date'       => $deadline
    ];

    $clientMailResult = Mailer::sendBookingClientConfirmation($bookingData);
    $adminMailResult  = Mailer::sendBookingAdminAlert($bookingData);

    // Update notification status flags in DB
    $updNotif = $pdo->prepare("
        UPDATE bookings 
        SET client_notified = :cn, owner_notified = :on 
        WHERE id = :bid
    ");
    $updNotif->execute([
        'cn'  => $clientMailResult['success'] ? 1 : 0,
        'on'  => $adminMailResult['success'] ? 1 : 0,
        'bid' => $bookingId
    ]);

    // Build WhatsApp direct message link for client's immediate convenience
    $whatsappText = urlencode(sprintf(
        "Hello Inklet Studios! I just submitted project brief %s for '%s' (%s). Looking forward to discussing next steps with your team in Chuka.",
        $candidateRef,
        $bookingData['project_title'],
        $service['name']
    ));
    $whatsappUrl = "https://wa.me/" . STUDIO_WHATSAPP . "?text=" . $whatsappText;

    Response::success([
        'booking_ref'          => $candidateRef,
        'client_name'          => $bookingData['client_name'],
        'service_name'         => $service['name'],
        'status'               => 'NEW',
        'email_confirmation'   => $clientMailResult['success'],
        'whatsapp_direct_url'  => $whatsappUrl,
        'notice'               => $clientMailResult['success']
            ? 'Your project brief is received and a confirmation has been dispatched to your email.'
            : 'Your project brief has been securely logged in our system. Email notification is pending server dispatch.'
    ], 'Project enquiry successfully submitted.', 201);
}

// =====================================================================
// ADMIN: List Bookings
// =====================================================================
if ($method === 'GET' && !isset($_GET['id']) && !isset($_GET['ref'])) {
    $admin = Auth::requireAdmin();

    $statusFilter = $_GET['status'] ?? null;
    $serviceFilter = (int)($_GET['service_id'] ?? 0);
    $search = trim($_GET['search'] ?? '');
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(50, max(1, (int)($_GET['limit'] ?? 15)));
    $offset = ($page - 1) * $limit;

    $where = [];
    $params = [];

    if ($statusFilter && $statusFilter !== 'ALL') {
        $where[] = "b.status = :status";
        $params['status'] = $statusFilter;
    }

    if ($serviceFilter > 0) {
        $where[] = "b.service_id = :sid";
        $params['sid'] = $serviceFilter;
    }

    if ($search !== '') {
        $where[] = "(b.booking_ref LIKE :s OR b.client_name LIKE :s OR b.client_email LIKE :s OR b.project_title LIKE :s)";
        $params['s'] = '%' . $search . '%';
    }

    $whereSql = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";

    $countStmt = $pdo->prepare("SELECT COUNT(*) AS total FROM bookings b {$whereSql}");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetch()['total'];

    $stmt = $pdo->prepare("
        SELECT b.id, b.booking_ref, b.client_name, b.client_email, b.client_phone, 
               b.preferred_channel, b.project_title, b.budget_range, b.deadline_date, 
               b.status, b.client_notified, b.created_at,
               s.name AS service_name
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        {$whereSql}
        ORDER BY b.id DESC
        LIMIT :limit OFFSET :offset
    ");

    foreach ($params as $k => $v) {
        $stmt->bindValue($k, $v);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $bookings = $stmt->fetchAll();

    // Summary counts by status for quick triage
    $countsStmt = $pdo->query("SELECT status, COUNT(*) AS cnt FROM bookings GROUP BY status");
    $statusCounts = $countsStmt->fetchAll(PDO::FETCH_KEY_PAIR);

    Response::success($bookings, 'Bookings retrieved', 200, [
        'pagination' => [
            'total'       => $total,
            'page'        => $page,
            'limit'       => $limit,
            'total_pages' => ceil($total / $limit)
        ],
        'status_counts' => $statusCounts
    ]);
}

// =====================================================================
// ADMIN: Single Booking Detail Inspection
// =====================================================================
if ($method === 'GET' && (isset($_GET['id']) || isset($_GET['ref']))) {
    $admin = Auth::requireAdmin();
    $id = $_GET['id'] ?? null;
    $ref = $_GET['ref'] ?? null;

    $stmt = $pdo->prepare("
        SELECT b.*, s.name AS service_name, s.starting_price_kes
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        WHERE " . ($ref ? "b.booking_ref = :p" : "b.id = :p")
    );
    $stmt->execute(['p' => $ref ?: $id]);
    $booking = $stmt->fetch();

    if (!$booking) {
        Response::notFound('Booking record not found.');
    }

    $booking['service_specific_data'] = json_decode($booking['service_specific_data'] ?? '[]', true);

    // Fetch status history
    $histStmt = $pdo->prepare("
        SELECT h.*, a.name AS changed_by_name
        FROM booking_status_history h
        LEFT JOIN administrators a ON h.changed_by_admin_id = a.id
        WHERE h.booking_id = :bid
        ORDER BY h.id ASC
    ");
    $histStmt->execute(['bid' => $booking['id']]);
    $booking['history'] = $histStmt->fetchAll();

    // Fetch private internal notes
    $noteStmt = $pdo->prepare("
        SELECT n.*, a.name AS admin_name
        FROM booking_notes n
        JOIN administrators a ON n.admin_id = a.id
        WHERE n.booking_id = :bid
        ORDER BY n.id DESC
    ");
    $noteStmt->execute(['bid' => $booking['id']]);
    $booking['notes'] = $noteStmt->fetchAll();

    Response::success($booking);
}

// =====================================================================
// ADMIN: Update Booking Status
// =====================================================================
if ($method === 'PATCH' || ($method === 'POST' && ($_GET['action'] ?? '') === 'status')) {
    $admin = Auth::requireAdmin();
    $raw = json_decode(file_get_contents('php://input'), true) ?? $_POST;

    $id = (int)($raw['id'] ?? $_GET['id'] ?? 0);
    $newStatus = trim($raw['status'] ?? '');
    $notes = trim($raw['notes'] ?? '');

    $allowedStatuses = ['NEW', 'REVIEWING', 'AWAITING_CLIENT', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'DECLINED', 'CANCELLED'];
    if (!in_array($newStatus, $allowedStatuses, true)) {
        Response::error('Invalid booking status provided.', 422);
    }

    $currStmt = $pdo->prepare("SELECT id, status, booking_ref, client_name, client_email FROM bookings WHERE id = :id LIMIT 1");
    $currStmt->execute(['id' => $id]);
    $current = $currStmt->fetch();

    if (!$current) {
        Response::notFound('Booking not found.');
    }

    $prevStatus = $current['status'];

    $upd = $pdo->prepare("UPDATE bookings SET status = :status, updated_at = NOW() WHERE id = :id");
    $upd->execute(['status' => $newStatus, 'id' => $id]);

    $hist = $pdo->prepare("
        INSERT INTO booking_status_history (booking_id, previous_status, new_status, changed_by_admin_id, notes)
        VALUES (:bid, :prev, :new, :admin, :notes)
    ");
    $hist->execute([
        'bid'   => $id,
        'prev'  => $prevStatus,
        'new'   => $newStatus,
        'admin' => $admin['id'],
        'notes' => $notes ?: "Status updated to {$newStatus}"
    ]);

    Logger::audit($admin['id'], 'UPDATE_BOOKING_STATUS', 'bookings', $id, [
        'ref' => $current['booking_ref'],
        'from' => $prevStatus,
        'to' => $newStatus
    ]);

    Response::success([
        'previous_status' => $prevStatus,
        'new_status'      => $newStatus
    ], 'Booking status updated successfully.');
}

// =====================================================================
// ADMIN: Add Private Note
// =====================================================================
if ($method === 'POST' && ($_GET['action'] ?? '') === 'note') {
    $admin = Auth::requireAdmin();
    $raw = json_decode(file_get_contents('php://input'), true) ?? $_POST;

    $id = (int)($raw['booking_id'] ?? $_GET['id'] ?? 0);
    $content = trim($raw['note_content'] ?? '');

    if (!$id || mb_strlen($content) < 2) {
        Response::error('Please provide note content.', 422);
    }

    $stmt = $pdo->prepare("INSERT INTO booking_notes (booking_id, admin_id, note_content) VALUES (:bid, :aid, :content)");
    $stmt->execute([
        'bid'     => $id,
        'aid'     => $admin['id'],
        'content' => $content
    ]);

    Logger::audit($admin['id'], 'ADD_BOOKING_NOTE', 'bookings', $id);
    Response::success(null, 'Private note added successfully.');
}

Response::error('Method not allowed', 405);
