<?php
/**
 * INKLET STUDIOS — Audit Logger & Diagnostics
 * Philosophy: "Ink with Intent"
 */

require_once __DIR__ . '/db.php';

class Logger {
    public static function audit(?int $adminId, string $action, string $entity, ?int $entityId = null, array $details = []): void {
        try {
            $pdo = DB::getConnection();
            $stmt = $pdo->prepare("
                INSERT INTO audit_logs (admin_id, action, entity, entity_id, details, ip_address)
                VALUES (:admin_id, :action, :entity, :entity_id, :details, :ip)
            ");
            $stmt->execute([
                'admin_id'  => $adminId,
                'action'    => $action,
                'entity'    => $entity,
                'entity_id' => $entityId,
                'details'   => !empty($details) ? json_encode($details) : null,
                'ip'        => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
            ]);
        } catch (Throwable $e) {
            error_log("Failed to write audit log: " . $e->getMessage());
        }
    }
}
