<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
header('Content-Type: application/json');

// Ensure upload directory exists
$uploadDir = __DIR__ . '/../uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Check request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use POST.']);
    exit;
}

// Basic session validation (optional, depending on configuration)
// if (!isset($_SESSION['user'])) {
//     http_response_code(401);
//     echo json_encode(['error' => 'Unauthorized access. Please log in.']);
//     exit;
// }

if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded under key "file".']);
    exit;
}

$file = $_FILES['file'];
$fileName = $file['name'];
$fileTmp = $file['tmp_name'];
$fileSize = $file['size'];
$fileError = $file['error'];

// Validations
if ($fileError !== UPLOAD_ERR_OK) {
    http_response_code(500);
    echo json_encode(['error' => 'File upload error code: ' . $fileError]);
    exit;
}

// Size limit: 5MB
if ($fileSize > 5 * 1024 * 1024) {
    http_response_code(400);
    echo json_encode(['error' => 'File size exceeds maximum 5MB threshold.']);
    exit;
}

// Allowed extensions
$fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
$allowed = ['jpg', 'jpeg', 'png', 'pdf'];

if (!in_array($fileExt, $allowed)) {
    http_response_code(400);
    echo json_encode(['error' => 'Unsupported format. Allowed: ' . implode(', ', $allowed)]);
    exit;
}

// Secure filename generation
$newFileName = uniqid('upload_', true) . '.' . $fileExt;
$destPath = $uploadDir . $newFileName;

if (move_uploaded_files_wrapper($fileTmp, $destPath)) {
    // Return relative URL for storage in database
    $relativeUrl = 'uploads/' . $newFileName;
    echo json_encode([
        'success' => true,
        'message' => 'File uploaded successfully.',
        'filePath' => $relativeUrl,
        'fileName' => $fileName
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save uploaded file on local disk.']);
}

// Wrapper function to handle environments
function move_uploaded_files_wrapper($tmp, $dest) {
    // If it's a simulated environment, check file upload
    if (is_uploaded_file($tmp)) {
        return move_uploaded_file($tmp, $dest);
    }
    // Fallback copy for local CLI scripts testing
    return copy($tmp, $dest);
}
