<?php
/**
 * INKLET STUDIOS — Auth API Endpoint
 * Routes: login, logout, me, csrf, register, forgot-password, reset-password
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/response.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/csrf.php';
require_once __DIR__ . '/../includes/validator.php';
require_once __DIR__ . '/../includes/logger.php';

header('Content-Type: application/json; charset=utf-8');

$action = $_GET['action'] ?? $_POST['action'] ?? '';

// Return current CSRF token
if ($action === 'csrf') {
    Response::success(['token' => CSRF::getToken()]);
}

// Check current session
if ($action === 'me') {
    if (Auth::checkAdmin()) {
        Response::success([
            'authenticated' => true,
            'user' => [
                'id'    => $_SESSION['admin_id'],
                'name'  => $_SESSION['admin_name'],
                'email' => $_SESSION['admin_email'],
                'role'  => $_SESSION['admin_role'],
                'type'  => 'admin'
            ],
            'csrf_token' => CSRF::getToken()
        ]);
    } else {
        Response::success([
            'authenticated' => false,
            'user' => null,
            'csrf_token' => CSRF::getToken()
        ]);
    }
}

// Logout
if ($action === 'logout') {
    $adminId = $_SESSION['admin_id'] ?? null;
    if ($adminId) {
        Logger::audit($adminId, 'LOGOUT', 'administrators', $adminId);
    }
    Auth::logout();
    Response::success(null, 'Logged out successfully');
}

// Login
if ($action === 'login') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::error('Method not allowed', 405);
    }

    $raw = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $validator = new Validator($raw);
    $validator->required('email')->email('email')->required('password');

    if (!$validator->isValid()) {
        Response::error('Please fill in all required credentials.', 422, $validator->getErrors());
    }

    $admin = Auth::loginAdmin($raw['email'], $raw['password']);
    if ($admin) {
        Logger::audit($admin['id'], 'LOGIN_SUCCESS', 'administrators', $admin['id']);
        Response::success([
            'user' => $admin,
            'csrf_token' => CSRF::getToken()
        ], 'Authentication successful');
    } else {
        Response::error('Invalid email or password credentials.', 401);
    }
}

// Forgot Password Request
if ($action === 'forgot_password') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::error('Method not allowed', 405);
    }
    $raw = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $email = trim($raw['email'] ?? '');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        Response::error('Please provide a valid email address.', 422);
    }

    // Generate token and store hash
    $pdo = DB::getConnection();
    $stmt = $pdo->prepare("SELECT id FROM administrators WHERE email = :email LIMIT 1");
    $stmt->execute(['email' => strtolower($email)]);
    $admin = $stmt->fetch();

    if ($admin) {
        $token = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);
        $expires = date('Y-m-d H:i:s', time() + 3600); // 1 hour

        $ins = $pdo->prepare("INSERT INTO password_resets (email, token_hash, expires_at) VALUES (:email, :token_hash, :expires)");
        $ins->execute([
            'email' => strtolower($email),
            'token_hash' => $tokenHash,
            'expires' => $expires
        ]);

        // In production, send email with reset link. In dev, log instructions
        error_log("[PASSWORD RESET INSTRUCTION] Reset link: " . APP_URL . "/resetpassword.html?token=" . $token . "&email=" . urlencode($email));
    }

    // Always return safe generic confirmation to prevent user enumeration
    Response::success(null, 'If an account exists for that email, password reset instructions have been dispatched.');
}

// Reset Password with Token
if ($action === 'reset_password') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::error('Method not allowed', 405);
    }
    $raw = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $token = trim($raw['token'] ?? '');
    $email = strtolower(trim($raw['email'] ?? ''));
    $newPassword = $raw['password'] ?? '';

    if (strlen($newPassword) < 8) {
        Response::error('Password must be at least 8 characters in length.', 422);
    }

    $tokenHash = hash('sha256', $token);
    $pdo = DB::getConnection();
    $stmt = $pdo->prepare("
        SELECT id FROM password_resets 
        WHERE email = :email AND token_hash = :hash AND expires_at > NOW() AND used_at IS NULL 
        ORDER BY id DESC LIMIT 1
    ");
    $stmt->execute(['email' => $email, 'hash' => $tokenHash]);
    $resetRecord = $stmt->fetch();

    if (!$resetRecord) {
        Response::error('The password reset token is invalid, expired, or has already been used.', 400);
    }

    // Update admin password
    $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
    $upd = $pdo->prepare("UPDATE administrators SET password_hash = :hash, updated_at = NOW() WHERE email = :email");
    $upd->execute(['hash' => $newHash, 'email' => $email]);

    // Mark reset record as used
    $mark = $pdo->prepare("UPDATE password_resets SET used_at = NOW() WHERE id = :id");
    $mark->execute(['id' => $resetRecord['id']]);

    Response::success(null, 'Password has been successfully reset. You may now log in.');
}

Response::error('Invalid auth action specified.', 400);
