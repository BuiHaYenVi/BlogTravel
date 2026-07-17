<?php

namespace App\Utils;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class MailHelper {
    /**
     * Gửi Email chứa mã OTP bằng PHPMailer
     * 
     * @param string $to Email người nhận
     * @param string $otp Mã OTP 5 số
     * @return bool
     */
    public static function sendOTP($to, $otp) {
        $mail = new PHPMailer(true);

        try {
            // Cấu hình Server (SMTP)
            $mail->isSMTP();
            $mail->Host       = Env::get('MAIL_HOST', 'smtp.gmail.com');                     // Đặt SMTP server
            $mail->SMTPAuth   = true;                                 // Bật xác thực SMTP
            $mail->Username   = Env::get('MAIL_USERNAME', 'EMAIL_CUA_BAN@GMAIL.COM');            // SMTP username
            $mail->Password   = Env::get('MAIL_PASSWORD', 'MAT_KHAU_UNG_DUNG_16_KY_TU');         // SMTP password (App Password)
            
            $encryption = Env::get('MAIL_ENCRYPTION', 'ssl');
            if (strtolower($encryption) === 'tls') {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;          // Kích hoạt mã hóa TLS (STARTTLS)
                $mail->Port       = (int)Env::get('MAIL_PORT', 587);         // Cổng kết nối TCP cho STARTTLS
            } else {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;             // Kích hoạt mã hóa TLS ngầm định (SMTPS)
                $mail->Port       = (int)Env::get('MAIL_PORT', 465);         // Cổng kết nối TCP cho SMTPS
            }

            // Người gửi và người nhận
            $fromAddress = Env::get('MAIL_FROM_ADDRESS', $mail->Username);
            $fromName    = Env::get('MAIL_FROM_NAME', 'Blog Travel');
            $mail->setFrom($fromAddress, $fromName);
            $mail->addAddress($to);

            // Nội dung Email
            $mail->isHTML(true);                                  // Đặt định dạng email thành HTML
            $mail->CharSet = 'UTF-8';
            $mail->Subject = 'Mã xác thực khôi phục mật khẩu - Blog Travel';
            $mail->Body    = "
                <html>
                <head>
                    <title>Blog Travel OTP</title>
                </head>
                <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                    <h2 style='color: #14b8a6;'>Blog Travel - Xác thực tài khoản</h2>
                    <p>Chào bạn,</p>
                    <p>Mã OTP của bạn là: <strong style='font-size: 24px; color: #f59e0b;'>$otp</strong></p>
                    <p>Mã này có hiệu lực trong vòng 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
                    <br>
                    <p>Trân trọng,<br>Đội ngũ Blog Travel</p>
                </body>
                </html>
            ";
            $mail->AltBody = "Blog Travel - Mã OTP của bạn là: $otp (Hiệu lực 5 phút)";

            $mail->send();
            return true;
        } catch (Exception $e) {
            $errorMsg = "Không thể gửi email. Mailer Error: " . $mail->ErrorInfo . " | Exception: " . $e->getMessage();
            error_log($errorMsg);
            file_put_contents(__DIR__ . '/../../mail_errors.log', "[" . date('Y-m-d H:i:s') . "] " . $errorMsg . PHP_EOL, FILE_APPEND);
            return false;
        }
    }
}
