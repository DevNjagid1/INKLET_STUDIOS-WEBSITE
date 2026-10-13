<?php
/**
 * INKLET STUDIOS — Dashboard Metrics & Business Stats API
 * Philosophy: "Ink with Intent"
 * 
 * Accurately calculates real business telemetry from MySQL. Never fabricates metrics.
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/response.php';
require_once __DIR__ . '/../includes/auth.php';

header('Content-Type: application/json; charset=utf-8');

$admin = Auth::requireAdmin();
$pdo = DB::getConnection();

// Project metrics
$projTotal     = (int)$pdo->query("SELECT COUNT(*) FROM projects")->fetchColumn();
$projPublished = (int)$pdo->query("SELECT COUNT(*) FROM projects WHERE is_published = 1")->fetchColumn();
$projDraft     = (int)$pdo->query("SELECT COUNT(*) FROM projects WHERE is_published = 0")->fetchColumn();
$projFeatured  = (int)$pdo->query("SELECT COUNT(*) FROM projects WHERE is_featured = 1")->fetchColumn();

// Booking metrics
$bookTotal    = (int)$pdo->query("SELECT COUNT(*) FROM bookings")->fetchColumn();
$bookNew      = (int)$pdo->query("SELECT COUNT(*) FROM bookings WHERE status = 'NEW'")->fetchColumn();
$bookReview   = (int)$pdo->query("SELECT COUNT(*) FROM bookings WHERE status = 'REVIEWING'")->fetchColumn();
$bookAccepted = (int)$pdo->query("SELECT COUNT(*) FROM bookings WHERE status = 'ACCEPTED'")->fetchColumn();
$bookComplete = (int)$pdo->query("SELECT COUNT(*) FROM bookings WHERE status = 'COMPLETED'")->fetchColumn();

// Message metrics
$msgTotal  = (int)$pdo->query("SELECT COUNT(*) FROM contact_messages")->fetchColumn();
$msgUnread = (int)$pdo->query("SELECT COUNT(*) FROM contact_messages WHERE is_read = 0")->fetchColumn();

// Class registration metrics
$classEnrolled = (int)$pdo->query("SELECT COUNT(*) FROM class_registrations WHERE status = 'CONFIRMED'")->fetchColumn();
$classPending  = (int)$pdo->query("SELECT COUNT(*) FROM class_registrations WHERE status = 'PENDING'")->fetchColumn();

// Recent 5 Bookings
$recentBookings = $pdo->query("
    SELECT b.id, b.booking_ref, b.client_name, b.project_title, b.status, b.created_at, s.name AS service_name
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    ORDER BY b.id DESC
    LIMIT 5
")->fetchAll();

// Recent 5 Messages
$recentMessages = $pdo->query("
    SELECT id, name, email, subject, is_read, created_at
    FROM contact_messages
    ORDER BY id DESC
    LIMIT 5
")->fetchAll();

Response::success([
    'projects' => [
        'total'     => $projTotal,
        'published' => $projPublished,
        'draft'     => $projDraft,
        'featured'  => $projFeatured
    ],
    'bookings' => [
        'total'     => $bookTotal,
        'new'       => $bookNew,
        'reviewing' => $bookReview,
        'accepted'  => $bookAccepted,
        'completed' => $bookComplete
    ],
    'messages' => [
        'total'  => $msgTotal,
        'unread' => $msgUnread
    ],
    'classes' => [
        'confirmed' => $classEnrolled,
        'pending'   => $classPending
    ],
    'recent_bookings' => $recentBookings,
    'recent_messages' => $recentMessages
]);
