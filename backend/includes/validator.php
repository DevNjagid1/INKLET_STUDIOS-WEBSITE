<?php
/**
 * INKLET STUDIOS — Input Sanitization & Validation Engine
 * Philosophy: "Ink with Intent"
 */

class Validator {
    private array $data;
    private array $errors = [];

    public function __construct(array $data) {
        $this->data = $data;
    }

    public function required(string $field, string $customMsg = ''): self {
        if (!isset($this->data[$field]) || trim((string)$this->data[$field]) === '') {
            $this->errors[$field] = $customMsg ?: ucfirst(str_replace('_', ' ', $field)) . ' is required.';
        }
        return $this;
    }

    public function email(string $field, string $customMsg = ''): self {
        if (!empty($this->data[$field])) {
            $val = trim((string)$this->data[$field]);
            if (!filter_var($val, FILTER_VALIDATE_EMAIL)) {
                $this->errors[$field] = $customMsg ?: 'Please provide a valid email address.';
            }
        }
        return $this;
    }

    public function minLength(string $field, int $min, string $customMsg = ''): self {
        if (!empty($this->data[$field])) {
            if (mb_strlen(trim((string)$this->data[$field])) < $min) {
                $this->errors[$field] = $customMsg ?: ucfirst(str_replace('_', ' ', $field)) . " must be at least {$min} characters.";
            }
        }
        return $this;
    }

    public function maxLength(string $field, int $max, string $customMsg = ''): self {
        if (!empty($this->data[$field])) {
            if (mb_strlen(trim((string)$this->data[$field])) > $max) {
                $this->errors[$field] = $customMsg ?: ucfirst(str_replace('_', ' ', $field)) . " cannot exceed {$max} characters.";
            }
        }
        return $this;
    }

    public function phone(string $field, string $customMsg = ''): self {
        if (!empty($this->data[$field])) {
            // Allows international + formats and Kenyan standard phone digits
            if (!preg_match('/^\+?[0-9\s\-()]{7,20}$/', trim((string)$this->data[$field]))) {
                $this->errors[$field] = $customMsg ?: 'Please provide a valid telephone/WhatsApp number.';
            }
        }
        return $this;
    }

    public function inArray(string $field, array $allowed, string $customMsg = ''): self {
        if (!empty($this->data[$field])) {
            if (!in_array($this->data[$field], $allowed, true)) {
                $this->errors[$field] = $customMsg ?: 'Selected value is invalid.';
            }
        }
        return $this;
    }

    public function isValid(): bool {
        return empty($this->errors);
    }

    public function getErrors(): array {
        return $this->errors;
    }

    public function getFirstError(): string {
        return reset($this->errors) ?: '';
    }

    public static function sanitize(string $input): string {
        return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
    }

    public static function sanitizeArray(array $input): array {
        $clean = [];
        foreach ($input as $k => $v) {
            if (is_array($v)) {
                $clean[$k] = self::sanitizeArray($v);
            } else {
                $clean[$k] = is_string($v) ? self::sanitize($v) : $v;
            }
        }
        return $clean;
    }
}
