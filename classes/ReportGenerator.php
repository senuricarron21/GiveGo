<?php
/**
 * Class ReportGenerator
 * Encapsulates calculation of system metrics and CSV report exports.
 */
class ReportGenerator {
    private array $users;
    private array $donations;
    private array $requests;
    private array $matches;

    public function __construct(array $input = []) {
        $this->users = $input['users'] ?? [];
        $this->donations = $input['donations'] ?? [];
        $this->requests = $input['requests'] ?? [];
        $this->matches = $input['matches'] ?? [];
    }

    /**
     * Generates and returns system activity statistics.
     */
    public function generateReportData(): array {
        // Calculate user summary
        $usersSummary = ['admin' => 0, 'donor' => 0, 'receiver' => 0];
        foreach ($this->users as $u) {
            $role = strtolower($u['role'] ?? '');
            if (array_key_exists($role, $usersSummary)) {
                $usersSummary[$role]++;
            }
        }

        // Calculate donation stats
        $donationStats = [
            'total' => count($this->donations),
            'available' => 0,
            'matched' => 0,
            'completed' => 0
        ];
        $categoryStats = [];

        foreach ($this->donations as $d) {
            $status = strtolower($d['status'] ?? 'available');
            if (array_key_exists($status, $donationStats)) {
                $donationStats[$status]++;
            } else {
                $donationStats['available']++;
            }
            
            $cat = $d['category'] ?? 'Uncategorized';
            if (!isset($categoryStats[$cat])) {
                $categoryStats[$cat] = 0;
            }
            $categoryStats[$cat]++;
        }

        // Calculate request stats
        $requestStats = [
            'total' => count($this->requests),
            'pending' => 0,
            'matched' => 0,
            'completed' => 0
        ];
        foreach ($this->requests as $r) {
            $status = strtolower($r['status'] ?? 'pending');
            if (array_key_exists($status, $requestStats)) {
                $requestStats[$status]++;
            }
        }

        // Calculate match stats
        $matchStats = [
            'total' => count($this->matches),
            'active' => 0,
            'completed' => 0
        ];
        foreach ($this->matches as $m) {
            $status = strtolower($m['status'] ?? 'matched');
            if ($status === 'completed') {
                $matchStats['completed']++;
            } else {
                $matchStats['active']++;
            }
        }

        return [
            'usersSummary' => $usersSummary,
            'donationStats' => $donationStats,
            'requestStats' => $requestStats,
            'matchStats' => $matchStats,
            'categoryStats' => $categoryStats,
            'rawDonations' => $this->donations,
            'generatedAt' => date('Y-m-d H:i:s')
        ];
    }

    /**
     * Downloads CSV file based on report data array.
     */
    public static function downloadCsv(array $data): void {
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
        foreach (($data['usersSummary'] ?? []) as $role => $count) {
            fputcsv($output, [ucfirst($role), $count]);
        }
        fputcsv($output, []);
        
        // Category Distribution Section
        fputcsv($output, ["--- CATEGORY DISTRIBUTION ---"]);
        fputcsv($output, ["Category", "Total Listings"]);
        foreach (($data['categoryStats'] ?? []) as $category => $count) {
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
}
