<?php
/**
 * INKLET STUDIOS — Secure Asset Upload Manager
 * Philosophy: "Ink with Intent"
 */

require_once __DIR__ . '/../config/config.php';

class UploadHandler {
    private const ALLOWED_MIMES = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
        'image/svg+xml' => 'svg'
    ];

    public static function process(array $fileInput, string $subfolder = 'projects'): array {
        if (!isset($fileInput['error']) || is_array($fileInput['error'])) {
            return ['success' => false, 'error' => 'Invalid file parameter provided.'];
        }

        switch ($fileInput['error']) {
            case UPLOAD_ERR_OK:
                break;
            case UPLOAD_ERR_NO_FILE:
                return ['success' => false, 'error' => 'No file was uploaded.'];
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                return ['success' => false, 'error' => 'File exceeds maximum permissible size limit (5MB).'];
            default:
                return ['success' => false, 'error' => 'Unknown upload error occurred.'];
        }

        if ($fileInput['size'] > MAX_UPLOAD_SIZE_BYTES) {
            return ['success' => false, 'error' => 'File size exceeds 5MB limit.'];
        }

        // Validate MIME type securely using finfo
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($fileInput['tmp_name']);

        if (!array_key_exists($mime, self::ALLOWED_MIMES)) {
            // Check SVG XML fallback if finfo reports text/plain or text/xml
            if (in_array($mime, ['text/plain', 'text/xml', 'application/xml'], true)) {
                $content = file_get_contents($fileInput['tmp_name']);
                if (str_contains($content, '<svg')) {
                    $ext = 'svg';
                } else {
                    return ['success' => false, 'error' => 'Invalid file format. Allowed formats: JPG, PNG, WebP, SVG.'];
                }
            } else {
                return ['success' => false, 'error' => 'Invalid file format. Allowed formats: JPG, PNG, WebP, SVG.'];
            }
        } else {
            $ext = self::ALLOWED_MIMES[$mime];
        }

        // Generate cryptographically secure filename
        $safeName = sprintf(
            'ink_%s_%s.%s',
            date('Ymd_His'),
            bin2hex(random_bytes(6)),
            $ext
        );

        $targetDir = PUBLIC_PATH . '/assets/' . trim($subfolder, '/');
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        $targetPath = $targetDir . '/' . $safeName;

        if (!move_uploaded_file($fileInput['tmp_name'], $targetPath)) {
            return ['success' => false, 'error' => 'Failed to store uploaded file on server.'];
        }

        // Set safe file permissions
        chmod($targetPath, 0644);

        $relativeUrl = 'assets/' . trim($subfolder, '/') . '/' . $safeName;

        return [
            'success'      => true,
            'file_name'    => $safeName,
            'relative_url' => $relativeUrl,
            'size'         => $fileInput['size'],
            'mime'         => $mime
        ];
    }
}
