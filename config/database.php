<?php
// GiveGo Global Configuration and Database Helper
// Sets up server-side environment states, session headers, and utility constants

if (session_status() === PHP_SESSION_NONE) {
    // Enable session cookies safety flags
    ini_set('session.cookie_httponly', 1);
    ini_set('session.use_only_cookies', 1);
    
    // Start session
    session_start();
}

// Define Environment Constants
define('APP_NAME', 'GiveGo');
define('APP_VERSION', '1.0.0');
define('DEFAULT_LATITUDE', 6.9271);  // Colombo base
define('DEFAULT_LONGITUDE', 79.8612);

// Timezone Setup
date_default_timezone_set('Asia/Colombo');

/**
 * Utility: Check if the current session user has a specific access role.
 * Redirects to landing page if authorization check fails.
 *
 * @param array $allowedRoles
 */
function restrictAccessTo($allowedRoles) {
    if (!isset($_SESSION['user'])) {
        header("Location: index.php");
        exit;
    }
    
    $userRole = $_SESSION['user']['role'] ?? '';
    if (!in_array($userRole, $allowedRoles)) {
        header("Location: dashboard.php");
        exit;
    }
}
