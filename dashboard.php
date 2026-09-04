<?php
session_start();
if (!isset($_SESSION['user'])) {
    header("Location: index.php");
    exit;
}

$user = $_SESSION['user'];
$role = $user['role'];
$name = $user['name'];
$email = $user['email'];
$status = $user['status'] ?? 'pending';

function isMenu($pageName) {
    return '';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard | GiveGo</title>
    
    <!-- CSS styles -->
    <link rel="stylesheet" href="css/styles.css">
    <link rel="stylesheet" href="css/dashboard.css">
    
    <!-- Google Maps JavaScript API Styles & Fonts -->
    
    <!-- Firebase Compat SDKs (CDN) -->
    <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-storage-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics-compat.js"></script>
</head>
<body>

    <div class="dashboard-container">
        
        <!-- SIDEBAR NAVIGATION -->
        <aside class="sidebar">
            <div>
                <!-- Brand logo area -->
                <div class="brand-section">
                    <img src="uploads/logo.png" alt="GiveGo Logo" class="brand-logo-img-sidebar">
                </div>
                
                <!-- Role-based navigation lists -->
                <nav>
                    <ul class="menu-list">
                        <li class="menu-item active">
                            <a href="#overview">Overview</a>
                        </li>
                        
                        <?php if ($status === 'verified' || $role === 'admin'): ?>
                            <?php if ($role === 'admin'): ?>
                                <li class="menu-item">
                                    <a href="#users">Accounts</a>
                                </li>
                                <li class="menu-item">
                                    <a href="#approvals">Approvals</a>
                                </li>
                                <li class="menu-item">
                                    <a href="#announcements">Announcements</a>
                                </li>
                                <li class="menu-item">
                                    <a href="#system-directory">System Directory</a>
                                </li>
                            <?php elseif ($role === 'donor'): ?>
                                <li class="menu-item">
                                    <a href="#listings">My Donations</a>
                                </li>
                                <li class="menu-item">
                                    <a href="#needs-catalogue">Requests Catalogue</a>
                                </li>
                                <li class="menu-item">
                                    <a href="#matching">Matches & Connections</a>
                                </li>
                                <li class="menu-item">
                                    <a href="#chat">Messages</a>
                                </li>
                            <?php elseif ($role === 'receiver'): ?>
                                <li class="menu-item">
                                    <a href="#requests">Material Requests</a>
                                </li>
                                <li class="menu-item">
                                    <a href="#inventory">Inventory Lookup</a>
                                </li>
                                <li class="menu-item">
                                    <a href="#matching">Matches & Connections</a>
                                </li>
                                <li class="menu-item">
                                    <a href="#chat">Messages</a>
                                </li>
                            <?php endif; ?>
                        <?php endif; ?>
                        
                        <li class="menu-item">
                            <a href="#available-items">Available Items</a>
                        </li>
                        <li class="menu-item">
                            <a href="#history">History</a>
                        </li>
                        
                        <li class="menu-item">
                            <a href="#notifications">Notifications</a>
                        </li>
                    </ul>
                </nav>
            </div>
            
            <!-- User profile footer info inside Sidebar -->
            <div class="user-profile-menu">
                <div class="profile-avatar" style="background-image: url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80');"></div>
                <div class="profile-info">
                    <div class="profile-name" title="<?php echo htmlspecialchars($name); ?>">
                        <?php echo htmlspecialchars($name); ?>
                    </div>
                    <div class="profile-role">
                        <?php echo htmlspecialchars($role); ?>
                        <?php if ($status === 'verified'): ?>
                            <span style="color: var(--color-success); font-size: 0.75rem; font-weight:700;">Verified</span>
                        <?php else: ?>
                            <span style="color: var(--color-warning); font-size: 0.75rem; font-weight:700;">Pending</span>
                        <?php endif; ?>
                    </div>
                </div>
                <button class="btn-logout" id="btnLogout" title="Log Out">Log Out</button>
            </div>
        </aside>
        
        <!-- MAIN DASHBOARD CONTENT AREA -->
        <main class="main-content">
            
            <!-- Header Panel -->
            <header class="header-panel">
                <div class="welcome-section">
                    <h1 class="gradient-text">Hello, <?php echo htmlspecialchars(explode(' ', $name)[0]); ?></h1>
                    <p>Welcome to your GiveGo dashboard. Manage records and activities below.</p>
                </div>
                
                <div class="actions-section">
                    <div class="notification-bell glass-panel" style="padding: 8px 16px; border-radius: var(--radius-sm);" id="btnNotificationsToggle">
                        <span style="font-size: 0.85rem; font-weight:700; color: var(--color-primary);">Alerts</span>
                        <span class="notification-dot" id="notiDot" style="display: none;"></span>
                    </div>
                </div>
            </header>
            
            <!-- Dynamic Role-Based Views -->
            <div id="dashboardViewContainer">
                <?php if ($status === 'verified' || $role === 'admin'): ?>
                    <?php
                    if ($role === 'admin') {
                        include 'admin.php';
                    } elseif ($role === 'donor') {
                        include 'donor.php';
                    } elseif ($role === 'receiver') {
                        include 'receiver.php';
                    } else {
                        echo "<p>Invalid account configuration.</p>";
                    }
                    include 'available_items.php';
                    include 'history.php';
                    ?>
                <?php else: ?>
                    <!-- Pending Review Layout -->
                    <div class="glass-panel" style="padding: 40px; text-align: center; max-width: 600px; margin: 40px auto; border-left: 4px solid var(--color-warning); background:#FFFFFF;">
                        <h2 style="font-size: 1.8rem; margin-bottom: 12px; color: var(--color-primary);">Verification Pending</h2>
                        <p style="color: var(--color-text-muted); font-size: 1.05rem; line-height: 1.6; margin-bottom: 24px;">
                            Thank you for registering with <strong>GiveGo</strong>.<br>
                            Your credentials and uploaded verification documents are currently under review by our administration team. 
                        </p>
                        <p style="font-size: 0.9rem; color: var(--color-text-muted);">
                            You will receive dashboard access automatically once your verification is approved.
                        </p>
                    </div>
                <?php endif; ?>
            </div>
            
        </main>
        
    </div>

    <!-- Google Maps JavaScript API -->
    <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBy8_Ic4K9OEPV6P6aKdm0w95A3qvLFudE&libraries=places,geometry&callback=onGoogleMapsLoaded" async defer></script>

    <!-- Core Javascript Files -->
    <script src="js/firebase-config.js"></script>
    <script src="js/auth.js"></script>
    <script src="js/app.js"></script>
    
    <script>
        document.getElementById("btnLogout").addEventListener("click", () => {
            if (window.authEngine) {
                window.authEngine.logout();
            }
        });
    </script>
</body>
</html>
