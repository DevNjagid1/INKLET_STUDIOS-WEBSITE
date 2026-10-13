<?php
/**
 * INKLET STUDIOS — Security Headers & Safeguards
 * Philosophy: "Ink with Intent"
 */

function applySecurityHeaders(): void {
    if (headers_sent()) {
        return;
    }

    // Prevent MIME-sniffing
    header("X-Content-Type-Options: nosniff");

    // Prevent Clickjacking Redress Attacks
    header("X-Frame-Options: SAMEORIGIN");

    // XSS Protection for legacy user agents
    header("X-XSS-Protection: 1; mode=block");

    // Referrer policy: send origin only on cross-origin requests
    header("Referrer-Policy: strict-origin-when-cross-origin");

    // Permissions policy: disable unneeded device sensor access
    header("Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()");

    // Cross-Origin Isolation Safeguards
    header("Cross-Origin-Opener-Policy: same-origin-allow-popups");
    header("Cross-Origin-Resource-Policy: same-origin");

    // Content Security Policy (CSP)
    $csp = [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        "connect-src 'self'",
        "frame-ancestors 'self'",
        "base-uri 'self'",
        "form-action 'self' https://wa.me mailto:"
    ];
    header("Content-Security-Policy: " . implode("; ", $csp));

    // HTTP Strict Transport Security (HSTS) when running on HTTPS
    if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
        header("Strict-Transport-Security: max-age=31536000; includeSubDomains; preload");
    }
}

/**
 * Escape HTML output to prevent Cross-Site Scripting (XSS)
 */
function e(?string $value): string {
    return htmlspecialchars((string)($value ?? ''), ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

/**
 * Sanitize uploaded file names to avoid directory traversal
 */
function sanitizeFilename(string $filename): string {
    $clean = preg_replace('/[^a-zA-Z0-9_\.-]/', '_', basename($filename));
    return preg_replace('/\.+/', '.', $clean);
}

// Automatically enforce security headers upon module inclusion
applySecurityHeaders();

