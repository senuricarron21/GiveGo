<?php
require_once __DIR__ . '/../classes/MatchEngine.php';

header('Content-Type: application/json');

// Check request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use POST.']);
    exit;
}

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

if (!$input || !isset($input['donations']) || !isset($input['requests'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing donations or requests dataset.']);
    exit;
}

$donations = $input['donations'];
$requests = $input['requests'];
$targetRequestId = $input['requestId'] ?? null;
$targetDonationId = $input['donationId'] ?? null;

// Instantiate MatchEngine OOP object
$engine = new MatchEngine($donations, $requests);

if ($targetRequestId) {
    $matches = $engine->findMatchesForRequest($targetRequestId);
} elseif ($targetDonationId) {
    $matches = $engine->findMatchesForDonation($targetDonationId);
} else {
    $matches = $engine->generateGlobalMatches(30.0);
}

echo json_encode([
    'success' => true,
    'count' => count($matches),
    'matches' => $matches
]);
