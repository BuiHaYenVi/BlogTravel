<?php
namespace App\Utils;

class Validator {
    /**
     * Kiểm tra các field bắt buộc
     */
    public static function required($data, $fields) {
        foreach ($fields as $field) {
            if (empty($data[$field])) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * Validate email format
     */
    public static function email($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
    
    /**
     * Validate password strength
     */
    public static function password($password, $minLength = 6, $requireComplex = true) {
        if (strlen($password) < $minLength) {
            return false;
        }
        if ($requireComplex) {
            return preg_match('/[A-Za-z]/', $password) && preg_match('/[0-9]/', $password);
        }
        return true;
    }
}
?>