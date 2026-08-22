<?php
require_once __DIR__ . '/Location.php';

/**
 * Class MatchEngine
 * Encapsulates matching logic between donation listings and receiver requests.
 */
class MatchEngine {
    private array $donations;
    private array $requests;

    public function __construct(array $donations = [], array $requests = []) {
        $this->donations = $donations;
        $this->requests = $requests;
    }

    /**
     * Scores a single pair of donation and request.
     * Returns metrics array or null if invalid match.
     */
    public function calculateMatchScore(array $donation, array $request): ?array {
        // 1. Category must match exactly
        if (strtolower($donation['category'] ?? '') !== strtolower($request['category'] ?? '')) {
            return null;
        }
        
        // 2. Geolocation distance score (Weight: 40%)
        $donLoc = Location::fromArray($donation['location'] ?? []);
        $reqLoc = Location::fromArray($request['location'] ?? []);
        
        $distance = $donLoc->calculateDistanceTo($reqLoc);
        
        $maxDistance = 50.0;
        if ($distance >= $maxDistance) {
            $distanceScore = 0;
        } else {
            $distanceScore = (($maxDistance - $distance) / $maxDistance) * 100;
        }
        
        // 3. Urgency score (Weight: 35%)
        $urgency = strtolower($request['urgency'] ?? 'low');
        $urgencyScore = 30; // Low default
        if ($urgency === 'high') {
            $urgencyScore = 100;
        } elseif ($urgency === 'medium') {
            $urgencyScore = 70;
        }
        
        // 4. Quantity fulfillment score (Weight: 25%)
        $reqQty = $request['quantityRequired'] ?? 1;
        $recQty = $request['quantityReceived'] ?? 0;
        $remainingNeeded = max(0, $reqQty - $recQty);
        $donQty = $donation['quantity'] ?? 1;
        
        if ($remainingNeeded <= 0) {
            return null; // Already fully satisfied
        }
        
        if ($donQty >= $remainingNeeded) {
            $quantityScore = 100; // Perfect match or surplus
        } else {
            $quantityScore = ($donQty / $remainingNeeded) * 100;
        }
        
        // Final weighted score
        $finalScore = ($distanceScore * 0.40) + ($urgencyScore * 0.35) + ($quantityScore * 0.25);
        
        return [
            'score' => round($finalScore, 1),
            'distance' => round($distance, 2),
            'distanceScore' => round($distanceScore, 1),
            'urgencyScore' => $urgencyScore,
            'quantityScore' => round($quantityScore, 1),
            'remainingNeeded' => $remainingNeeded
        ];
    }

    /**
     * Find matching donations for a specific request ID.
     */
    public function findMatchesForRequest(string $targetRequestId): array {
        $targetRequest = null;
        foreach ($this->requests as $r) {
            if (($r['id'] ?? null) === $targetRequestId) {
                $targetRequest = $r;
                break;
            }
        }
        
        if (!$targetRequest) {
            return [];
        }
        
        $matches = [];
        foreach ($this->donations as $donation) {
            if (($donation['status'] ?? 'available') !== 'available') continue;
            
            $metrics = $this->calculateMatchScore($donation, $targetRequest);
            if ($metrics !== null) {
                $matches[] = array_merge($donation, [
                    'matchMetrics' => $metrics,
                    'matchingScore' => $metrics['score']
                ]);
            }
        }
        
        return $this->sortMatchesDescending($matches);
    }

    /**
     * Find matching requests for a specific donation ID.
     */
    public function findMatchesForDonation(string $targetDonationId): array {
        $targetDonation = null;
        foreach ($this->donations as $d) {
            if (($d['id'] ?? null) === $targetDonationId) {
                $targetDonation = $d;
                break;
            }
        }
        
        if (!$targetDonation) {
            return [];
        }
        
        $matches = [];
        foreach ($this->requests as $request) {
            $status = $request['status'] ?? 'pending';
            if ($status !== 'pending' && $status !== 'matched') continue;
            
            $metrics = $this->calculateMatchScore($targetDonation, $request);
            if ($metrics !== null) {
                $matches[] = array_merge($request, [
                    'matchMetrics' => $metrics,
                    'matchingScore' => $metrics['score']
                ]);
            }
        }
        
        return $this->sortMatchesDescending($matches);
    }

    /**
     * Run global cross matching across all donations and requests.
     */
    public function generateGlobalMatches(float $minScore = 30.0): array {
        $matches = [];
        foreach ($this->donations as $donation) {
            if (($donation['status'] ?? 'available') !== 'available') continue;
            
            foreach ($this->requests as $request) {
                $status = $request['status'] ?? 'pending';
                if ($status !== 'pending' && $status !== 'matched') continue;
                
                $metrics = $this->calculateMatchScore($donation, $request);
                if ($metrics !== null && $metrics['score'] >= $minScore) {
                    $matches[] = [
                        'id' => 'match_' . uniqid(),
                        'donationId' => $donation['id'] ?? '',
                        'donationName' => $donation['itemName'] ?? '',
                        'donorName' => $donation['donorName'] ?? '',
                        'donorId' => $donation['donorId'] ?? '',
                        'requestId' => $request['id'] ?? '',
                        'requestName' => $request['itemName'] ?? '',
                        'receiverName' => $request['receiverName'] ?? '',
                        'receiverId' => $request['receiverId'] ?? '',
                        'category' => $donation['category'] ?? '',
                        'score' => $metrics['score'],
                        'distance' => $metrics['distance'],
                        'status' => 'matched',
                        'createdAt' => date('Y-m-d\TH:i:s\Z')
                    ];
                }
            }
        }
        
        return $this->sortMatchesDescending($matches);
    }

    /**
     * Sorts matches by matching score descending.
     */
    private function sortMatchesDescending(array $matches): array {
        usort($matches, function($a, $b) {
            $scoreA = $a['matchingScore'] ?? $a['score'] ?? 0;
            $scoreB = $b['matchingScore'] ?? $b['score'] ?? 0;
            return $scoreB <=> $scoreA;
        });
        return $matches;
    }
}
