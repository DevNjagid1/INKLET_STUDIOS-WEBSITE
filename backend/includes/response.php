<?php
/**
 * INKLET STUDIOS — Standardized API JSON Response Helper
 * Philosophy: "Ink with Intent"
 */

class Response {
    public static function json(array $data, int $statusCode = 200): void {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function success(mixed $data = null, string $message = 'Operation successful', int $statusCode = 200, array $extra = []): void {
        $payload = array_merge([
            'success' => true,
            'message' => $message,
            'data'    => $data,
            'time'    => date('c')
        ], $extra);
        self::json($payload, $statusCode);
    }

    public static function error(string $message = 'An error occurred', int $statusCode = 400, array $errors = []): void {
        $payload = [
            'success' => false,
            'message' => $message,
            'errors'  => $errors,
            'time'    => date('c')
        ];
        self::json($payload, $statusCode);
    }

    public static function unauthorized(string $message = 'Authentication required'): void {
        self::error($message, 401);
    }

    public static function forbidden(string $message = 'Access forbidden'): void {
        self::error($message, 403);
    }

    public static function notFound(string $message = 'Resource not found'): void {
        self::error($message, 404);
    }
}
