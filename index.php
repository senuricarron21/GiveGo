<?php
session_start();
if (isset($_SESSION['user'])) {
    header("Location: dashboard.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GiveGo | From your hands to the hearts that need it</title>
    
    <!-- External CSS -->
    <link rel="stylesheet" href="css/styles.css">
    
    <!-- Firebase Compat SDKs (CDN) -->
    <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-storage-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics-compat.js"></script>
</head>
<body style="background-color: var(--color-bg-base);">

    <!-- Main Landing Layout -->
    <div class="container" style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px 24px;">
        <div class="grid-cols-2" style="align-items: center; width: 100%; max-width: 1100px;">
            
            <!-- Left Side: Platform Mission Branding -->
            <div class="fade-in" style="padding-right: 20px;">
                <div style="margin-bottom: 24px;">
                    <img src="uploads/logo.png" alt="GiveGo - From your hands to the hearts that need it." style="max-height: 110px; width: auto; object-fit: contain;">
                </div>
                
                <h1 class="gradient-text" style="font-size: 2.8rem; line-height: 1.15; margin-bottom: 16px;">
                    Connecting generous donors with <span class="gradient-accent-text">verified receiver needs.</span>
                </h1>
                
                <p style="color: var(--color-text-muted); font-size: 1.05rem; margin-bottom: 28px; max-width: 500px;">
                    GiveGo is an intelligent, location-aware donation platform designed for transparent material support, monetary funding tracking with 14-day utilisation proof, and coordinated volunteer activities.
                </p>
                
                <!-- Quick Stats -->
                <div style="display: flex; gap: 40px; margin-top: 20px;">
                    <div>
                        <div style="font-size: 1.8rem; font-weight: 800; color: var(--color-primary);" id="landingStatMatches">0</div>
                        <div style="font-size: 0.8rem; color: var(--color-text-muted); font-weight: 700; text-transform: uppercase;">Matches Made</div>
                    </div>
                    <div>
                        <div style="font-size: 1.8rem; font-weight: 800; color: var(--color-secondary);" id="landingStatDonations">0</div>
                        <div style="font-size: 0.8rem; color: var(--color-text-muted); font-weight: 700; text-transform: uppercase;">Materials Listed</div>
                    </div>
                    <div>
                        <div style="font-size: 1.8rem; font-weight: 800; color: var(--color-primary);" id="landingStatRequests">0</div>
                        <div style="font-size: 0.8rem; color: var(--color-text-muted); font-weight: 700; text-transform: uppercase;">Verified Needs</div>
                    </div>
                </div>
            </div>
            
            <!-- Right Side: Login Panel -->
            <div class="glass-panel fade-in" style="padding: 40px; border-radius: var(--radius-lg); position: relative; overflow: hidden; background: #FFFFFF;">
                <div style="position: relative; z-index: 2;">
                    <h2 style="font-size: 2rem; color: var(--color-primary); margin-bottom: 8px;">Welcome Back</h2>
                    <p style="color: var(--color-text-muted); font-size: 0.95rem; margin-bottom: 30px;">Sign in to access your GiveGo donation dashboard.</p>
                    
                    <form id="loginForm">
                        <div class="form-group">
                            <label class="form-label" for="loginEmail">Email Address</label>
                            <input class="form-control" type="email" id="loginEmail" placeholder="e.g. donor@givego.lk" required>
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 24px;">
                            <label class="form-label" for="loginPassword">Password</label>
                            <input class="form-control" type="password" id="loginPassword" placeholder="••••••••" required>
                        </div>
                        
                        <button class="btn btn-primary" type="submit" style="width: 100%; margin-bottom: 20px; font-size: 1rem; padding: 12px;">
                            Sign In
                        </button>
                    </form>
                    
                    <div style="text-align: center; font-size: 0.95rem; color: var(--color-text-muted);">
                        New to GiveGo? 
                        <a href="register.php" style="color: var(--color-primary); text-decoration: none; font-weight: 700; margin-left: 4px;">
                            Create an Account
                        </a>
                    </div>
                </div>
            </div>
            
        </div>
    </div>

    <!-- Core Javascript Files -->
    <script src="js/firebase-config.js"></script>
    <script src="js/auth.js"></script>
    <script>
        document.addEventListener("DOMContentLoaded", () => {
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            if (helper && helper.db()) {
                const db = helper.db();
                db.collection("matches").onSnapshot(snap => {
                    const el = document.getElementById("landingStatMatches");
                    if (el) el.textContent = snap.size;
                });
                db.collection("donations").onSnapshot(snap => {
                    const el = document.getElementById("landingStatDonations");
                    if (el) el.textContent = snap.size;
                });
                db.collection("requests").onSnapshot(snap => {
                    const el = document.getElementById("landingStatRequests");
                    if (el) el.textContent = snap.size;
                });
            }
        });
    </script>
</body>
</html>
