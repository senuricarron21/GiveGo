<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Handle CSV export download
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['download'])) {
    if (!isset($_SESSION['last_report_data'])) {
        http_response_code(400);
        echo "No report data found. Please run the report from the dashboard first.";
        exit;
    }
    
    $data = $_SESSION['last_report_data'];
    $filename = "GiveGo_System_Report_" . date('Ymd_His') . ".csv";
    
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=' . $filename);
    
    $output = fopen('php://output', 'w');
    
    // Title & Metadata
    fputcsv($output, ["GIVEGO DONATION PLATFORM - SYSTEM ACTIVITY REPORT"]);
    fputcsv($output, ["Generated At:", date('Y-m-d H:i:s')]);
    fputcsv($output, []);
    
    // Users Summary Section
    fputcsv($output, ["--- USER ROLES SUMMARY ---"]);
    fputcsv($output, ["Role", "Count"]);
    foreach ($data['usersSummary'] as $role => $count) {
        fputcsv($output, [ucfirst($role), $count]);
    }
    fputcsv($output, []);
    
    // Category Distribution Section
    fputcsv($output, ["--- CATEGORY DISTRIBUTION ---"]);
    fputcsv($output, ["Category", "Total Listings"]);
    foreach ($data['categoryStats'] as $category => $count) {
        fputcsv($output, [$category, $count]);
    }
    fputcsv($output, []);
    
    // Master Donations Record Table
    fputcsv($output, ["--- MASTER DONATIONS LIST ---"]);
    fputcsv($output, ["Donation ID", "Item Name", "Category", "Quantity", "Condition", "Urgency", "Donor Name", "Status", "Created At"]);
    
    if (isset($data['rawDonations']) && is_array($data['rawDonations'])) {
        foreach ($data['rawDonations'] as $d) {
            fputcsv($output, [
                $d['id'] ?? '',
                $d['itemName'] ?? '',
                $d['category'] ?? '',
                $d['quantity'] ?? '',
                $d['condition'] ?? '',
                $d['urgency'] ?? '',
                $d['donorName'] ?? '',
                $d['status'] ?? '',
                $d['createdAt'] ?? ''
            ]);
        }
    }
    
    fclose($output);
    exit;
}

// Otherwise, process POST request to generate report json
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

$users = $input['users'] ?? [];
$donations = $input['donations'] ?? [];
$requests = $input['requests'] ?? [];
$matches = $input['matches'] ?? [];

// Calculate Statistics
$usersSummary = ['admin' => 0, 'donor' => 0, 'receiver' => 0];
foreach ($users as $u) {
    $role = strtolower($u['role'] ?? '');
    if (array_key_exists($role, $usersSummary)) {
        $usersSummary[$role]++;
    }
}

$donationStats = [
    'total' => count($donations),
    'available' => 0,
    'matched' => 0,
    'completed' => 0
];
$categoryStats = [];

foreach ($donations as $d) {
    $status = strtolower($d['status'] ?? 'available');
    if (array_key_exists($status, $donationStats)) {
        $donationStats[$status]++;
    } else {
        $donationStats['available']++; // default fallback
    }
    
    $cat = $d['category'] ?? 'Uncategorized';
    if (!isset($categoryStats[$cat])) {
        $categoryStats[$cat] = 0;
    }
    $categoryStats[$cat]++;
}

$requestStats = [
    'total' => count($requests),
    'pending' => 0,
    'matched' => 0,
    'completed' => 0
];
foreach ($requests as $r) {
    $status = strtolower($r['status'] ?? 'pending');
    if (array_key_exists($status, $requestStats)) {
        $requestStats[$status]++;
    }
}

$matchStats = [
    'total' => count($matches),
    'active' => 0,
    'completed' => 0
];
foreach ($matches as $m) {
    $status = strtolower($m['status'] ?? 'matched');
    if ($status === 'completed') {
        $matchStats['completed']++;
    } else {
        $matchStats['active']++;
    }
}

// Save calculations to session for potential CSV export
$reportData = [
    'usersSummary' => $usersSummary,
    'donationStats' => $donationStats,
    'requestStats' => $requestStats,
    'matchStats' => $matchStats,
    'categoryStats' => $categoryStats,
    'rawDonations' => $donations,
    'generatedAt' => date('Y-m-d H:i:s')
];

$_SESSION['last_report_data'] = $reportData;

echo json_encode([
    'success' => true,
    'data' => $reportData
]);
