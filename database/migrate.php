<?php
/**
 * INKLET STUDIOS — Database Migration & Seeder CLI Runner
 * Run via CLI: php database/migrate.php
 */

if (php_sapi_name() !== 'cli' && (!isset($_GET['key']) || $_GET['key'] !== 'InkletMigrate2026Safe')) {
    http_response_code(403);
    die("Access Denied: Migrations must be run via CLI or with authorized secret key.");
}

require_once __DIR__ . '/../backend/config/database.php';

echo "========================================================\n";
echo " Inklet Studios — Database Setup & Migration\n";
echo " Philosophy: 'Ink with Intent'\n";
echo "========================================================\n\n";

try {
    $dsn = sprintf("mysql:host=%s;port=%d;charset=%s", DB_HOST, DB_PORT, DB_CHARSET);
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
    ]);

    // Ensure database exists
    echo "[1/3] Ensuring database `" . DB_NAME . "` exists...\n";
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET " . DB_CHARSET . " COLLATE " . DB_COLLATE);
    $pdo->exec("USE `" . DB_NAME . "`");
    echo "      Database ready.\n\n";

    // Execute schema.sql
    echo "[2/3] Executing schema.sql (15 tables)...\n";
    $schemaSql = file_get_contents(__DIR__ . '/schema.sql');
    if (!$schemaSql) {
        throw new Exception("Unable to read database/schema.sql");
    }
    $pdo->exec($schemaSql);
    echo "      Tables created successfully.\n\n";

    // Execute seed.sql
    echo "[3/3] Executing seed.sql (Initial data & development samples)...\n";
    $seedSql = file_get_contents(__DIR__ . '/seed.sql');
    if (!$seedSql) {
        throw new Exception("Unable to read database/seed.sql");
    }
    $pdo->exec($seedSql);
    echo "      Seed data inserted successfully.\n\n";

    echo "========================================================\n";
    echo " Migration complete! System is ready.\n";
    echo " Default Admin: admin@inkletstudios.com\n";
    echo " Default Password: AdminPassword2026!\n";
    echo "========================================================\n";

} catch (PDOException $e) {
    echo "\n[ERROR] Database error: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "\n[ERROR] General error: " . $e->getMessage() . "\n";
    exit(1);
}
