<?php
// Session configuration
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

if ($action === 'login') {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);
    
    if ($input && isset($input['uid'])) {
        $_SESSION['user'] = [
            'uid' => $input['uid'],
            'email' => $input['email'] ?? '',
            'name' => $input['name'] ?? '',
            'role' => $input['role'] ?? '',
            'status' => $input['status'] ?? 'pending',
            'location' => $input['location'] ?? null
        ];
        echo json_encode([
            'success' => true, 
            'message' => 'PHP Session synchronized successfully.',
            'session' => $_SESSION['user']
        ]);
        exit;
    }
    
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid user data payload.']);
    exit;
}

if ($action === 'logout') {
    $_SESSION = array();
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
    echo json_encode(['success' => true, 'message' => 'PHP Session terminated.']);
    exit;
}

if ($action === 'status') {
    if (isset($_SESSION['user'])) {
        echo json_encode([
            'authenticated' => true,
            'user' => $_SESSION['user']
        ]);
    } else {
        echo json_encode([
            'authenticated' => false,
            'user' => null
        ]);
    }
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Endpoint action not defined.']);
