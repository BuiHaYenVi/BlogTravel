<?php
$ch = curl_init('http://localhost/Project_DuLichMXH/public/api/trips');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
echo "HTTP Code: $httpcode\n";
echo "Response: $response\n";
curl_close($ch);
