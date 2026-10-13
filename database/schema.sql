-- =====================================================================
-- INKLET STUDIOS — DATABASE SCHEMA
-- Philosophy: "Ink with Intent"
-- Engine: MySQL 8.0+ / MariaDB 10.5+
-- Charset: utf8mb4 / Collation: utf8mb4_unicode_ci
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `password_resets`;
DROP TABLE IF EXISTS `class_registrations`;
DROP TABLE IF EXISTS `classes`;
DROP TABLE IF EXISTS `contact_messages`;
DROP TABLE IF EXISTS `booking_notes`;
DROP TABLE IF EXISTS `booking_status_history`;
DROP TABLE IF EXISTS `bookings`;
DROP TABLE IF EXISTS `services`;
DROP TABLE IF EXISTS `project_images`;
DROP TABLE IF EXISTS `projects`;
DROP TABLE IF EXISTS `project_categories`;
DROP TABLE IF EXISTS `site_settings`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `administrators`;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. ADMINISTRATORS
-- ---------------------------------------------------------------------
CREATE TABLE `administrators` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('superadmin', 'admin', 'editor') NOT NULL DEFAULT 'admin',
  `status` ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  `last_login_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_admin_role_status` (`role`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. USERS (Optional client accounts)
-- ---------------------------------------------------------------------
CREATE TABLE `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `phone` VARCHAR(45) NULL,
  `company_name` VARCHAR(150) NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `status` ENUM('active', 'pending_verification', 'suspended') NOT NULL DEFAULT 'active',
  `verification_token` VARCHAR(100) NULL,
  `email_verified_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. PROJECT CATEGORIES
-- ---------------------------------------------------------------------
CREATE TABLE `project_categories` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(120) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. PROJECTS (Portfolio items)
-- ---------------------------------------------------------------------
CREATE TABLE `projects` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `slug` VARCHAR(220) NOT NULL UNIQUE,
  `client_name` VARCHAR(150) NULL,
  `project_year` YEAR NOT NULL DEFAULT 2026,
  `overview` TEXT NOT NULL,
  `client_brief` TEXT NULL,
  `creative_direction` TEXT NULL,
  `design_process` TEXT NULL,
  `tools_used` VARCHAR(255) NULL,
  `deliverables` TEXT NULL,
  `verified_outcomes` TEXT NULL,
  `cover_image` VARCHAR(255) NOT NULL,
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `is_published` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `meta_title` VARCHAR(255) NULL,
  `meta_description` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_projects_category` FOREIGN KEY (`category_id`) REFERENCES `project_categories` (`id`) ON DELETE RESTRICT,
  INDEX `idx_projects_published_sort` (`is_published`, `sort_order`),
  INDEX `idx_projects_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. PROJECT IMAGES (Gallery & mockups)
-- ---------------------------------------------------------------------
CREATE TABLE `project_images` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT UNSIGNED NOT NULL,
  `image_url` VARCHAR(255) NOT NULL,
  `caption` VARCHAR(255) NULL,
  `alt_text` VARCHAR(255) NOT NULL,
  `is_cover` TINYINT(1) NOT NULL DEFAULT 0,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_project_images_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  INDEX `idx_proj_images_sort` (`project_id`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. SERVICES (7 Disciplines)
-- ---------------------------------------------------------------------
CREATE TABLE `services` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(180) NOT NULL UNIQUE,
  `summary` VARCHAR(300) NOT NULL,
  `description` TEXT NOT NULL,
  `deliverables` JSON NOT NULL,
  `intended_audience` TEXT NULL,
  `process_overview` TEXT NULL,
  `timeline_estimate` VARCHAR(100) NULL,
  `starting_price_kes` INT UNSIGNED NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_services_active` (`is_active`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. BOOKINGS & PROJECT ENQUIRIES
-- ---------------------------------------------------------------------
CREATE TABLE `bookings` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `booking_ref` VARCHAR(32) NOT NULL UNIQUE,
  `user_id` INT UNSIGNED NULL,
  `client_name` VARCHAR(150) NOT NULL,
  `client_email` VARCHAR(191) NOT NULL,
  `client_phone` VARCHAR(45) NULL,
  `preferred_channel` ENUM('email', 'whatsapp', 'phone') NOT NULL DEFAULT 'email',
  `service_id` INT UNSIGNED NOT NULL,
  `project_title` VARCHAR(200) NOT NULL,
  `project_description` TEXT NOT NULL,
  `intended_audience` TEXT NULL,
  `service_specific_data` JSON NULL,
  `budget_range` VARCHAR(100) NULL,
  `deadline_date` DATE NULL,
  `status` ENUM('NEW', 'REVIEWING', 'AWAITING_CLIENT', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'DECLINED', 'CANCELLED') NOT NULL DEFAULT 'NEW',
  `client_notified` TINYINT(1) NOT NULL DEFAULT 0,
  `owner_notified` TINYINT(1) NOT NULL DEFAULT 0,
  `ip_address` VARCHAR(45) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_bookings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_bookings_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE RESTRICT,
  INDEX `idx_bookings_ref` (`booking_ref`),
  INDEX `idx_bookings_status` (`status`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 8. BOOKING STATUS HISTORY
-- ---------------------------------------------------------------------
CREATE TABLE `booking_status_history` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `booking_id` INT UNSIGNED NOT NULL,
  `previous_status` VARCHAR(50) NULL,
  `new_status` VARCHAR(50) NOT NULL,
  `changed_by_admin_id` INT UNSIGNED NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_bsh_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bsh_admin` FOREIGN KEY (`changed_by_admin_id`) REFERENCES `administrators` (`id`) ON DELETE SET NULL,
  INDEX `idx_bsh_booking` (`booking_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 9. BOOKING PRIVATE NOTES
-- ---------------------------------------------------------------------
CREATE TABLE `booking_notes` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `booking_id` INT UNSIGNED NOT NULL,
  `admin_id` INT UNSIGNED NOT NULL,
  `note_content` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_bn_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bn_admin` FOREIGN KEY (`admin_id`) REFERENCES `administrators` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 10. CONTACT MESSAGES
-- ---------------------------------------------------------------------
CREATE TABLE `contact_messages` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(45) NULL,
  `subject` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `status` ENUM('unread', 'read', 'replied', 'archived') NOT NULL DEFAULT 'unread',
  `ip_address` VARCHAR(45) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_contact_status` (`status`, `is_read`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 11. GRAPHIC DESIGN CLASSES
-- ---------------------------------------------------------------------
CREATE TABLE `classes` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `slug` VARCHAR(220) NOT NULL UNIQUE,
  `level` ENUM('Beginner', 'Intermediate', 'Advanced', 'Comprehensive') NOT NULL DEFAULT 'Beginner',
  `duration_weeks` INT UNSIGNED NOT NULL DEFAULT 4,
  `format` ENUM('In-Person (Chuka)', 'Online Live', 'Hybrid') NOT NULL DEFAULT 'In-Person (Chuka)',
  `summary` VARCHAR(300) NOT NULL,
  `description` TEXT NOT NULL,
  `learning_outcomes` JSON NOT NULL,
  `syllabus_modules` JSON NOT NULL,
  `schedule_notes` VARCHAR(255) NULL,
  `price_kes` INT UNSIGNED NOT NULL,
  `is_enrolling` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_classes_enrolling` (`is_enrolling`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 12. CLASS REGISTRATIONS
-- ---------------------------------------------------------------------
CREATE TABLE `class_registrations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `class_id` INT UNSIGNED NOT NULL,
  `student_name` VARCHAR(150) NOT NULL,
  `student_email` VARCHAR(191) NOT NULL,
  `student_phone` VARCHAR(45) NOT NULL,
  `experience_level` VARCHAR(100) NULL,
  `learning_goals` TEXT NULL,
  `status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_class_reg_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE RESTRICT,
  INDEX `idx_class_reg_status` (`class_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 13. SITE SETTINGS
-- ---------------------------------------------------------------------
CREATE TABLE `site_settings` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` TEXT NOT NULL,
  `setting_group` VARCHAR(50) NOT NULL DEFAULT 'general',
  `description` VARCHAR(255) NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_settings_group` (`setting_group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 14. PASSWORD RESETS
-- ---------------------------------------------------------------------
CREATE TABLE `password_resets` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL,
  `token_hash` VARCHAR(64) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `used_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_resets_token` (`token_hash`, `expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 15. AUDIT LOGS
-- ---------------------------------------------------------------------
CREATE TABLE `audit_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `admin_id` INT UNSIGNED NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity` VARCHAR(50) NOT NULL,
  `entity_id` INT UNSIGNED NULL,
  `details` JSON NULL,
  `ip_address` VARCHAR(45) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_audit_admin` FOREIGN KEY (`admin_id`) REFERENCES `administrators` (`id`) ON DELETE SET NULL,
  INDEX `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
