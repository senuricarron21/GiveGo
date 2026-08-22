<?php
/**
 * Class AuthGuard
 * Encapsulates session initialization, authentication, and authorization guard checks.
 */
class AuthGuard {
    /**
     * Initializes secure PHP session if not already started.
     */
    public static function startSession(): void {
        if (session_status() === PHP_SESSION_NONE) {
            ini_set('session.cookie_httponly', 1);
            ini_set('session.use_only_cookies', 1);
            session_start();
        }
    }

    /**
     * Check if the current session user has a specific access role.
     * Redirects to landing page or dashboard if authorization check fails.
     */
    public static function restrictAccessTo(array $allowedRoles): void {
        self::startSession();

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
}
