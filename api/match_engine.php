<?php
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

$matches = [];

// Haversine distance formula in kilometers
function calculateDistance($lat1, $lon1, $lat2, $lon2) {
    $earthRadius = 6371; // km
    
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    
    $a = sin($dLat / 2) * sin($dLat / 2) +
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
         sin($dLon / 2) * sin($dLon / 2);
         
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
    return $earthRadius * $c;
}

// Score single pair matching
function calculateMatchScore($donation, $request) {
    // 1. Category must match exactly
    if (strtolower($donation['category']) !== strtolower($request['category'])) {
        return null;
    }
    
    // 2. Geolocation distance score (Weight: 40%)
    $lat1 = $donation['location']['lat'] ?? 6.9271;
    $lon1 = $donation['location']['lng'] ?? 79.8612;
    $lat2 = $request['location']['lat'] ?? 6.9271;
    $lon2 = $request['location']['lng'] ?? 79.8612;
    
    $distance = calculateDistance($lat1, $lon1, $lat2, $lon2);
    
    // Closer distance gets higher score. Scale 0 - 50km
    $maxDistance = 50.0;
    if ($distance >= $maxDistance) {
        $distanceScore = 0;
    } else {
        $distanceScore = (( $maxDistance - $distance ) / $maxDistance) * 100;
    }
    
    // 3. Quantity fulfillment score (Weight: 40%)
    $reqQty = $request['quantityRequired'] ?? 1;
    $recQty = $request['quantityReceived'] ?? 0;
    $remainingNeeded = max(0, $reqQty - $recQty);
    $donQty = $donation['quantity'] ?? 1;
    
    if ($remainingNeeded <= 0) {
        return null; // Already fully satisfied
    }
    
    // If donor quantity satisfies the need or covers a good portion
    if ($donQty >= $remainingNeeded) {
        $quantityScore = 100; // Perfect match or surplus
    } else {
        $quantityScore = ($donQty / $remainingNeeded) * 100;
    }
    
    // Calculate final weighted score (60% distance, 40% quantity match)
    $finalScore = ($distanceScore * 0.60) + ($quantityScore * 0.40);
    
    return [
        'score' => round($finalScore, 1),
        'distance' => round($distance, 2),
        'distanceScore' => round($distanceScore, 1),
        'quantityScore' => round($quantityScore, 1),
        'remainingNeeded' => $remainingNeeded
    ];
}

// Execute matching based on inputs
if ($targetRequestId) {
    // Find matching donations for a single receiver request
    $targetRequest = null;
    foreach ($requests as $r) {
        if ($r['id'] === $targetRequestId) {
            $targetRequest = $r;
            break;
        }
    }
    
    if (!$targetRequest) {
        http_response_code(404);
        echo json_encode(['error' => 'Target request not found.']);
        exit;
    }
    
    foreach ($donations as $donation) {
        if (($donation['status'] ?? 'available') !== 'available') continue;
        
        $metrics = calculateMatchScore($donation, $targetRequest);
        if ($metrics !== null) {
            $matches[] = array_merge($donation, [
                'matchMetrics' => $metrics,
                'matchingScore' => $metrics['score']
            ]);
        }
    }
} elseif ($targetDonationId) {
    // Find matching requests for a single donation listing
    $targetDonation = null;
    foreach ($donations as $d) {
        if ($d['id'] === $targetDonationId) {
            $targetDonation = $d;
            break;
        }
    }
    
    if (!$targetDonation) {
        http_response_code(404);
        echo json_encode(['error' => 'Target donation not found.']);
        exit;
    }
    
    foreach ($requests as $request) {
        if (($request['status'] ?? 'pending') !== 'pending' && ($request['status'] ?? 'pending') !== 'matched') continue;
        
        $metrics = calculateMatchScore($targetDonation, $request);
        if ($metrics !== null) {
            $matches[] = array_merge($request, [
                'matchMetrics' => $metrics,
                'matchingScore' => $metrics['score']
            ]);
        }
    }
} else {
    // Run global cross matching (all pairs)
    foreach ($donations as $donation) {
        if (($donation['status'] ?? 'available') !== 'available') continue;
        
        foreach ($requests as $request) {
            if (($request['status'] ?? 'pending') !== 'pending' && ($request['status'] ?? 'pending') !== 'matched') continue;
            
            $metrics = calculateMatchScore($donation, $request);
            if ($metrics !== null && $metrics['score'] >= 30) { // filter lower match scoring pairs
                $matches[] = [
                    'id' => 'match_' . uniqid(),
                    'donationId' => $donation['id'],
                    'donationName' => $donation['itemName'],
                    'donorName' => $donation['donorName'],
                    'donorId' => $donation['donorId'],
                    'requestId' => $request['id'],
                    'requestName' => $request['itemName'],
                    'receiverName' => $request['receiverName'],
                    'receiverId' => $request['receiverId'],
                    'category' => $donation['category'],
                    'score' => $metrics['score'],
                    'distance' => $metrics['distance'],
                    'status' => 'matched',
                    'createdAt' => date('Y-m-d\TH:i:s\Z')
                ];
            }
        }
    }
}

// Sort by matching score descending
usort($matches, function($a, $b) {
    $scoreA = $a['matchingScore'] ?? $a['score'] ?? 0;
    $scoreB = $b['matchingScore'] ?? $b['score'] ?? 0;
    return $scoreB <=> $scoreA;
});

echo json_encode([
    'success' => true,
    'count' => count($matches),
    'matches' => $matches
]);
