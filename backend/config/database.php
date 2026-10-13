<?php
/**
 * INKLET STUDIOS — Database Configuration
 * Philosophy: "Ink with Intent"
 */

defined('DB_HOST') or define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
defined('DB_PORT') or define('DB_PORT', (int)(getenv('DB_PORT') ?: 3306));
defined('DB_NAME') or define('DB_NAME', getenv('DB_NAME') ?: 'inklet_studios');
defined('DB_USER') or define('DB_USER', getenv('DB_USER') ?: 'root');
defined('DB_PASS') or define('DB_PASS', getenv('DB_PASS') ?: '');
defined('DB_CHARSET') or define('DB_CHARSET', 'utf8mb4');
defined('DB_COLLATE') or define('DB_COLLATE', 'utf8mb4_unicode_ci');
