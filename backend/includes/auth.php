<?php
/**
 * INKLET STUDIOS — Authentication & Access Control
 * Philosophy: "Ink with Intent"
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/response.php';

class Auth {
    public static function checkAdmin(): bool {
        return !empty($_SESSION['admin_id']) && !empty($_SESSION['admin_role']);
    }

    public static function requireAdmin(): array {
        if (!self::checkAdmin()) {
            Response::unauthorized('Administrative authentication required.');
        }
        return [
            'id'    => $_SESSION['admin_id'],
            'name'  => $_SESSION['admin_name'],
            'email' => $_SESSION['admin_email'],
            'role'  => $_SESSION['admin_role']
        ];
    }

    public static function loginAdmin(string $email, string $password): ?array {
        $pdo = DB::getConnection();
        $stmt = $pdo->prepare("SELECT id, name, email, password_hash, role, status FROM administrators WHERE email = :email LIMIT 1");
        $stmt->execute(['email' => strtolower(trim($email))]);
        $admin = $stmt->fetch();

        if (!$admin || $admin['status'] !== 'active') {
            return null;
        }

        if (!password_verify($password, $admin['password_hash'])) {
            return null;
        }

        // Regenerate session ID to prevent fixation
        session_regenerate_id(true);
        $_SESSION['admin_id'] = $admin['id'];
        $_SESSION['admin_name'] = $admin['name'];
        $_SESSION['admin_email'] = $admin['email'];
        $_SESSION['admin_role'] = $admin['role'];

        // Update last login timestamp
        $update = $pdo->prepare("UPDATE administrators SET last_login_at = NOW() WHERE id = :id");
        $update->execute(['id' => $admin['id']]);

        return [
            'id'    => $admin['id'],
            'name'  => $admin['name'],
            'email' => $admin['email'],
            'role'  => $admin['role']
        ];
    }

    public static function logout(): void {
        if (session_status() === PHP_SESSION_ACTIVE) {
            $_SESSION = [];
            if (ini_get("session.use_cookies")) {
                $params = session_get_cookie_params();
                setcookie(
                    session_name(),
                    '',
                    time() - 42000,
                    $params["path"],
                    $params["domain"],
                    $params["secure"],
                    $params["httponly"]
                );
            }
            session_destroy();
        }
    }
}
