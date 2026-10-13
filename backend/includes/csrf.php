<?php
/**
 * INKLET STUDIOS — Cross-Site Request Forgery (CSRF) Protection
 * Philosophy: "Ink with Intent"
 */

class CSRF {
    public static function getToken(): string {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }

    public static function validate(?string $token): bool {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        if (empty($_SESSION['csrf_token']) || empty($token)) {
            return false;
        }
        return hash_equals($_SESSION['csrf_token'], $token);
    }

    public static function verifyOrDie(): void {
        $headers = getallheaders();
        $token = $_POST['csrf_token'] ?? $headers['X-CSRF-Token'] ?? $headers['x-csrf-token'] ?? null;
        if (!self::validate($token)) {
            require_once __DIR__ . '/response.php';
            Response::error('Invalid or expired CSRF security token', 403);
        }
    }
}
