<?php
require_once __DIR__ . '/../classes/AuthGuard.php';
require_once __DIR__ . '/../classes/ReportGenerator.php';

AuthGuard::startSession();

// Handle CSV export download
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['download'])) {
    if (!isset($_SESSION['last_report_data'])) {
        http_response_code(400);
        echo "No report data found. Please run the report from the dashboard first.";
        exit;
    }
    
    ReportGenerator::downloadCsv($_SESSION['last_report_data']);
    exit;
}

// Process POST request to generate report JSON
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use POST.']);
    exit;
}

header('Content-Type: application/json');
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid data payload.']);
    exit;
}

// Instantiate ReportGenerator OOP object
$generator = new ReportGenerator($input);
$reportData = $generator->generateReportData();

// Store report in session for potential CSV export download
$_SESSION['last_report_data'] = $reportData;

echo json_encode([
    'success' => true,
    'data' => $reportData
]);
