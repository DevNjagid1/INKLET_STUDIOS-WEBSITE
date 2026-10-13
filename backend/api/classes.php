<?php
/**
 * INKLET STUDIOS — Graphic Design Classes & Training API
 * Handles public course listings, student enrollments, and admin course management
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

// Public: Student Enrollment Submission
if ($method === 'POST' && ($_GET['action'] ?? '') === 'enroll') {
    $raw = json_decode(file_get_contents('php://input'), true) ?? $_POST;

    $validator = new Validator($raw);
    $validator->required('class_id')
              ->required('student_name')
              ->required('student_email')
              ->email('student_email')
              ->required('student_phone')
              ->phone('student_phone');

    if (!$validator->isValid()) {
        Response::error('Please fill in all required registration fields.', 422, $validator->getErrors());
    }

    $clsStmt = $pdo->prepare("SELECT id, title, price_kes FROM classes WHERE id = :cid AND is_enrolling = 1 LIMIT 1");
    $clsStmt->execute(['cid' => (int)$raw['class_id']]);
    $course = $clsStmt->fetch();

    if (!$course) {
        Response::error('Selected design course is currently not enrolling.', 400);
    }

    $stmt = $pdo->prepare("
        INSERT INTO class_registrations (
            class_id, student_name, student_email, student_phone, experience_level, learning_goals, status
        ) VALUES (
            :cid, :name, :email, :phone, :exp, :goals, 'PENDING'
        )
    ");

    $stmt->execute([
        'cid'   => $course['id'],
        'name'  => trim($raw['student_name']),
        'email' => strtolower(trim($raw['student_email'])),
        'phone' => trim($raw['student_phone']),
        'exp'   => trim($raw['experience_level'] ?? 'Beginner'),
        'goals' => trim($raw['learning_goals'] ?? '')
    ]);

    // Send confirmation to student
    $regId = (int)$pdo->lastInsertId();
    $studentBody = "
        <h2>Welcome to Inklet Studios Design Academy</h2>
        <p>Hello " . htmlspecialchars($raw['student_name']) . ",</p>
        <p>Your enrollment registration for <strong>" . htmlspecialchars($course['title']) . "</strong> has been received.</p>
        <p>Our studio instructors in Chuka will contact you via WhatsApp/Phone with cohort schedule onboarding details and fee settlement instructions.</p>
        <p><em>“Ink with Intent”</em></p>
    ";
    Mailer::send(trim($raw['student_email']), "Enrollment Received: " . $course['title'], $studentBody);

    Response::success([
        'registration_id' => $regId,
        'course_title'    => $course['title'],
        'status'          => 'PENDING'
    ], 'Enrollment submitted successfully. We will contact you with timetable details.', 201);
}

// Single course
if ($method === 'GET' && (isset($_GET['slug']) || isset($_GET['id']))) {
    $param = $_GET['slug'] ?? $_GET['id'];
    $stmt = $pdo->prepare("SELECT * FROM classes WHERE slug = :p OR id = :p LIMIT 1");
    $stmt->execute(['p' => $param]);
    $course = $stmt->fetch();

    if (!$course) {
        Response::notFound('Course not found');
    }

    $course['learning_outcomes'] = json_decode($course['learning_outcomes'], true) ?: [];
    $course['syllabus_modules']  = json_decode($course['syllabus_modules'], true) ?: [];
    Response::success($course);
}

// List courses
if ($method === 'GET') {
    $query = "SELECT * FROM classes";
    if (!Auth::checkAdmin()) {
        $query .= " WHERE is_enrolling = 1";
    }
    $query .= " ORDER BY sort_order ASC, id ASC";

    $courses = $pdo->query($query)->fetchAll();
    foreach ($courses as &$c) {
        $c['learning_outcomes'] = json_decode($c['learning_outcomes'], true) ?: [];
        $c['syllabus_modules']  = json_decode($c['syllabus_modules'], true) ?: [];
    }
    unset($c);

    Response::success($courses);
}

// Admin: Save / Update Course
if ($method === 'POST' || $method === 'PUT') {
    $admin = Auth::requireAdmin();
    $raw = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $id = (int)($raw['id'] ?? $_GET['id'] ?? 0);

    $validator = new Validator($raw);
    $validator->required('title')->required('price_kes');

    if (!$validator->isValid()) {
        Response::error('Please fill in all required course information.', 422, $validator->getErrors());
    }

    $slug = !empty($raw['slug']) 
        ? strtolower(preg_replace('/[^a-z0-9]+/i', '-', trim($raw['slug'])))
        : strtolower(preg_replace('/[^a-z0-9]+/i', '-', trim($raw['title'])));

    $outcomes = is_array($raw['learning_outcomes'] ?? null) ? json_encode($raw['learning_outcomes']) : '[]';
    $syllabus = is_array($raw['syllabus_modules'] ?? null) ? json_encode($raw['syllabus_modules']) : '[]';

    if ($id) {
        $upd = $pdo->prepare("
            UPDATE classes SET 
                title = :title, slug = :slug, level = :level, duration_weeks = :dur,
                format = :fmt, summary = :summary, description = :desc,
                learning_outcomes = :outcomes, syllabus_modules = :syllabus,
                schedule_notes = :sched, price_kes = :price, is_enrolling = :enrolling,
                sort_order = :sort, updated_at = NOW()
            WHERE id = :id
        ");
        $upd->execute([
            'title'     => trim($raw['title']),
            'slug'      => $slug,
            'level'     => $raw['level'] ?? 'Beginner',
            'dur'       => (int)($raw['duration_weeks'] ?? 4),
            'fmt'       => $raw['format'] ?? 'In-Person (Chuka)',
            'summary'   => trim($raw['summary'] ?? ''),
            'desc'      => trim($raw['description'] ?? ''),
            'outcomes'  => $outcomes,
            'syllabus'  => $syllabus,
            'sched'     => trim($raw['schedule_notes'] ?? ''),
            'price'     => (int)$raw['price_kes'],
            'enrolling' => !empty($raw['is_enrolling']) ? 1 : 0,
            'sort'      => (int)($raw['sort_order'] ?? 0),
            'id'        => $id
        ]);
        Logger::audit($admin['id'], 'UPDATE_CLASS', 'classes', $id);
        Response::success(['id' => $id], 'Class updated successfully');
    } else {
        $ins = $pdo->prepare("
            INSERT INTO classes (
                title, slug, level, duration_weeks, format, summary, description,
                learning_outcomes, syllabus_modules, schedule_notes, price_kes, is_enrolling, sort_order
            ) VALUES (
                :title, :slug, :level, :dur, :fmt, :summary, :desc,
                :outcomes, :syllabus, :sched, :price, :enrolling, :sort
            )
        ");
        $ins->execute([
            'title'     => trim($raw['title']),
            'slug'      => $slug,
            'level'     => $raw['level'] ?? 'Beginner',
            'dur'       => (int)($raw['duration_weeks'] ?? 4),
            'fmt'       => $raw['format'] ?? 'In-Person (Chuka)',
            'summary'   => trim($raw['summary'] ?? ''),
            'desc'      => trim($raw['description'] ?? ''),
            'outcomes'  => $outcomes,
            'syllabus'  => $syllabus,
            'sched'     => trim($raw['schedule_notes'] ?? ''),
            'price'     => (int)$raw['price_kes'],
            'enrolling' => !empty($raw['is_enrolling']) ? 1 : 0,
            'sort'      => (int)($raw['sort_order'] ?? 0)
        ]);
        $newId = (int)$pdo->lastInsertId();
        Logger::audit($admin['id'], 'CREATE_CLASS', 'classes', $newId);
        Response::success(['id' => $newId], 'Class created successfully', 201);
    }
}

Response::error('Method not allowed', 405);
