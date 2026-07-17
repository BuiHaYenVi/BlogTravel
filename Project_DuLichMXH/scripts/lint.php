<?php
$files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(__DIR__));
$phpFiles = new RegexIterator($files, '/\.php$/');

$hasErrors = false;
foreach ($phpFiles as $file) {
    $code = file_get_contents($file->getRealPath());
    // Linter requires php binary, but we can do a basic token check or use token_get_all to catch missing braces
    // Actually, running `php -l` via exec might work if the server has php in path
    exec('php -l ' . escapeshellarg($file->getRealPath()) . ' 2>&1', $output, $returnVar);
    if ($returnVar !== 0 && strpos(implode("\n", $output), 'not recognized') === false) {
        echo "Error in " . $file->getRealPath() . ":\n" . implode("\n", $output) . "\n\n";
        $hasErrors = true;
    }
}
if (!$hasErrors) {
    echo "No syntax errors found (or php executable not available).\n";
}
