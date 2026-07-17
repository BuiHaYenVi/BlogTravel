<?php
return [
    'app' => [
        'name' => 'PROJECT_DULICHMXH',
        'debug' => getenv('APP_DEBUG') === 'true',
    ],
    
    'jwt' => [
        'secret' => getenv('JWT_SECRET') ?: 'your-secret-key-change-in-production',
        'algorithm' => 'HS256',
        'expires_in' => 604800, // 7 ngày (giây)
    ],
    
    'password' => [
        'min_length' => 6,
        'require_letters_and_numbers' => true,
    ],
];
?>