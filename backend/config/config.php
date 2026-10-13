<?php
/**
 * INKLET STUDIOS — Global Application Configuration
 * Philosophy: "Ink with Intent"
 */

// Application Environment
defined('APP_ENV') or define('APP_ENV', getenv('APP_ENV') ?: 'development');
defined('APP_DEBUG') or define('APP_DEBUG', APP_ENV === 'development');
defined('APP_URL') or define('APP_URL', getenv('APP_URL') ?: 'http://localhost:8000');
defined('APP_NAME') or define('APP_NAME', 'Inklet Studios');
defined('APP_TAGLINE') or define('APP_TAGLINE', 'Ink with Intent');

// Business Metadata
defined('STUDIO_LOCATION') or define('STUDIO_LOCATION', 'Chuka, Kenya');
defined('STUDIO_OFFICIAL_EMAIL') or define('STUDIO_OFFICIAL_EMAIL', 'hello@inkletstudios.com');
defined('STUDIO_ADMIN_EMAIL') or define('STUDIO_ADMIN_EMAIL', 'admin@inkletstudios.com');
defined('STUDIO_PHONE') or define('STUDIO_PHONE', '+254 700 000 000');
defined('STUDIO_WHATSAPP') or define('STUDIO_WHATSAPP', '+254700000000');

// Paths
defined('ROOT_PATH') or define('ROOT_PATH', dirname(__DIR__, 2));
defined('PUBLIC_PATH') or define('PUBLIC_PATH', ROOT_PATH . '/public');
defined('UPLOAD_PATH') or define('UPLOAD_PATH', PUBLIC_PATH . '/assets/projects');
defined('MAX_UPLOAD_SIZE_BYTES') or define('MAX_UPLOAD_SIZE_BYTES', 5 * 1024 * 1024); // 5 MB

// Session Configuration
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.cookie_samesite', 'Lax');
    if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
        ini_set('session.cookie_secure', '1');
    }
    session_start();
}
