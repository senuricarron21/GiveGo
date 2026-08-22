<?php
/**
 * Class Location
 * Encapsulates geographic coordinates (latitude, longitude) and distance math.
 */
class Location {
    private float $latitude;
    private float $longitude;

    public function __construct(float $latitude = 6.9271, float $longitude = 79.8612) {
        $this->latitude = $latitude;
        $this->longitude = $longitude;
    }

    public function getLatitude(): float {
        return $this->latitude;
    }

    public function getLongitude(): float {
        return $this->longitude;
    }

    /**
     * Calculates Haversine distance in kilometers to another Location.
     */
    public function calculateDistanceTo(Location $target): float {
        $earthRadius = 6371; // km
        
        $dLat = deg2rad($target->getLatitude() - $this->latitude);
        $dLon = deg2rad($target->getLongitude() - $this->longitude);
        
        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($this->latitude)) * cos(deg2rad($target->getLatitude())) *
             sin($dLon / 2) * sin($dLon / 2);
             
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return $earthRadius * $c;
    }

    /**
     * Helper factory method to create Location from associative array.
     */
    public static function fromArray(array $locArray): Location {
        $lat = isset($locArray['lat']) ? (float)$locArray['lat'] : 6.9271;
        $lng = isset($locArray['lng']) ? (float)$locArray['lng'] : 79.8612;
        return new self($lat, $lng);
    }
}
