<?php
/**
 * INKLET STUDIOS — Email Notification & Delivery Service
 * Philosophy: "Ink with Intent"
 * 
 * Accurately distinguishes between database persistence and actual email dispatch.
 */

require_once __DIR__ . '/../config/config.php';

class Mailer {
    /**
     * Send email using PHP mail() or configured SMTP
     * Returns array with ['success' => bool, 'message' => string]
     */
    public static function send(string $to, string $subject, string $htmlBody, string $textBody = ''): array {
        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            return ['success' => false, 'message' => 'Invalid destination email address.'];
        }

        $fromEmail = STUDIO_OFFICIAL_EMAIL;
        $fromName  = 'Inklet Studios';

        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=UTF-8',
            "From: {$fromName} <{$fromEmail}>",
            "Reply-To: {$fromName} <{$fromEmail}>",
            'X-Mailer: InkletStudios-System/1.0'
        ];

        // Format email layout with brand styling
        $formattedHtml = self::wrapTemplate($subject, $htmlBody);

        // Attempt delivery
        $sent = false;
        try {
            // Note: In local development without configured local sendmail, mail() may return false
            $sent = @mail($to, $subject, $formattedHtml, implode("\r\n", $headers));
        } catch (Throwable $e) {
            error_log("Mailer Exception: " . $e->getMessage());
            $sent = false;
        }

        if ($sent) {
            return ['success' => true, 'message' => 'Email delivered successfully.'];
        } else {
            // Honest reporting: Log the failure, never falsify dispatch
            error_log(sprintf("[MAIL DELIVERY NOTICE] Could not dispatch email to '%s' with subject '%s'. Configure production SMTP.", $to, $subject));
            return [
                'success' => false,
                'message' => 'Email delivery could not be completed at this time due to mail server configuration.'
            ];
        }
    }

    /**
     * Send booking receipt to client
     */
    public static function sendBookingClientConfirmation(array $booking): array {
        $subject = "Booking Received: {$booking['booking_ref']} — Inklet Studios";
        $body = "
            <h2 style='color:#111827;font-family:serif;'>Thank you for your enquiry, " . htmlspecialchars($booking['client_name']) . ".</h2>
            <p style='color:#4B5563;line-height:1.6;'>
                Your project brief has been securely logged with reference: 
                <strong style='color:#D4AF69;font-size:1.1em;background:#111827;padding:2px 8px;border-radius:4px;'>{$booking['booking_ref']}</strong>
            </p>
            <p style='color:#4B5563;line-height:1.6;'>
                <strong>Project:</strong> " . htmlspecialchars($booking['project_title']) . "<br>
                <strong>Service Discipline:</strong> " . htmlspecialchars($booking['service_name'] ?? 'Creative Service') . "<br>
                <strong>Current Status:</strong> <span style='color:#2563EB;'>Under Review</span>
            </p>
            <div style='background:#F8F5EF;border-left:4px solid #D4AF69;padding:16px;margin:20px 0;'>
                <p style='margin:0;color:#1F2937;font-size:0.95em;'>
                    <em>“Ink with Intent”</em> means every project receives deliberate creative scrutiny. 
                    Our studio in Chuka will review your project scope and respond within 24 to 48 business hours with availability and next steps.
                </p>
            </div>
            <p style='color:#6B7280;font-size:0.85em;'>
                Need an urgent update? You can message our studio directly via WhatsApp quoting your reference <code>{$booking['booking_ref']}</code>.
            </p>
        ";
        return self::send($booking['client_email'], $subject, $body);
    }

    /**
     * Send booking alert to studio owner/admin
     */
    public static function sendBookingAdminAlert(array $booking): array {
        $subject = "[NEW ENQUIRY] Ref: {$booking['booking_ref']} — {$booking['client_name']}";
        $body = "
            <h2 style='color:#111827;'>New Client Enquiry Received</h2>
            <p><strong>Reference:</strong> {$booking['booking_ref']}</p>
            <p><strong>Client:</strong> " . htmlspecialchars($booking['client_name']) . " (" . htmlspecialchars($booking['client_email']) . ")</p>
            <p><strong>Phone / WhatsApp:</strong> " . htmlspecialchars($booking['client_phone'] ?? 'N/A') . "</p>
            <p><strong>Service:</strong> " . htmlspecialchars($booking['service_name'] ?? 'N/A') . "</p>
            <p><strong>Project Title:</strong> " . htmlspecialchars($booking['project_title']) . "</p>
            <p><strong>Budget Range:</strong> " . htmlspecialchars($booking['budget_range'] ?? 'Undisclosed') . "</p>
            <p><strong>Deadline:</strong> " . htmlspecialchars($booking['deadline_date'] ?? 'Flexible') . "</p>
            <hr>
            <h4>Project Brief:</h4>
            <p style='white-space:pre-wrap;background:#F9FAFB;padding:12px;border:1px solid #E5E7EB;'>" . htmlspecialchars($booking['project_description']) . "</p>
            <p><a href='" . APP_URL . "/adminbookingdetail.html?ref={$booking['booking_ref']}'>Inspect in Admin Portal</a></p>
        ";
        return self::send(STUDIO_ADMIN_EMAIL, $subject, $body);
    }

    private static function wrapTemplate(string $title, string $content): string {
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <title>" . htmlspecialchars($title) . "</title>
        </head>
        <body style='margin:0;padding:0;background-color:#F8F5EF;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif;'>
            <table width='100%' cellpadding='0' cellspacing='0' style='background-color:#F8F5EF;padding:32px 16px;'>
                <tr>
                    <td align='center'>
                        <table width='600' cellpadding='0' cellspacing='0' style='background-color:#FFFFFF;border:1px solid #E5E7EB;border-top:4px solid #D4AF69;padding:32px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);'>
                            <tr>
                                <td style='padding-bottom:24px;border-bottom:1px solid #F3F4F6;'>
                                    <span style='font-size:20px;font-weight:700;color:#111827;letter-spacing:-0.5px;'>INKLET STUDIOS</span>
                                    <span style='display:block;font-size:11px;color:#D4AF69;letter-spacing:1px;text-transform:uppercase;'>Ink with Intent • Chuka, Kenya</span>
                                </td>
                            </tr>
                            <tr>
                                <td style='padding:24px 0;'>
                                    {$content}
                                </td>
                            </tr>
                            <tr>
                                <td style='padding-top:24px;border-top:1px solid #F3F4F6;font-size:12px;color:#9CA3AF;text-align:center;'>
                                    Inklet Studios • Chuka, Tharaka Nithi County, Kenya<br>
                                    hello@inkletstudios.com • " . STUDIO_PHONE . "<br>
                                    &copy; " . date('Y') . " Inklet Studios. All rights reserved.
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>";
    }
}
