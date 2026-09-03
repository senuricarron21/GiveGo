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
    <title>Register | GiveGo</title>
    
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

    <div class="container" style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px 24px;">
        <div class="glass-panel fade-in" style="width: 100%; max-width: 800px; padding: 40px; border-radius: var(--radius-lg); position: relative; overflow: hidden; background: #FFFFFF;">
            
            <!-- Header section -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border-bottom: 2px solid var(--color-border); padding-bottom: 16px;">
                <div>
                    <img src="uploads/logo.png" alt="GiveGo Logo" style="max-height: 60px; width: auto; object-fit: contain;">
                </div>
                <a href="index.php" style="color: var(--color-primary); text-decoration: none; font-size: 0.9rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; transition: var(--transition-smooth);">
                    Back to Sign In
                </a>
            </div>

            <h2 style="font-size: 2rem; color: var(--color-primary); margin-bottom: 6px;">Join the GiveGo Network</h2>
            <p style="color: var(--color-text-muted); font-size: 0.95rem; margin-bottom: 24px;">Register as a Donor or a Receiver Organisation to manage essential charitable support.</p>
            
            <form id="registerForm">
                <!-- 1. Account Role Selection -->
                <div class="form-group" style="margin-bottom: 24px;">
                    <label class="form-label" for="regAccountType">Account Type</label>
                    <select class="form-control form-select" id="regAccountType" required style="font-weight: 700; font-size: 1rem;">
                        <option value="donor_individual">Donor — Individual</option>
                        <option value="donor_org">Donor — Organisation / Corporate</option>
                        <option value="receiver">Receiver Organisation (Hospital, Elders' Home, Orphanage, Disaster Relief)</option>
                    </select>
                </div>

                <!-- 2. Basic Profile Credentials (All Users) -->
                <div class="grid-cols-2">
                    <div class="form-group">
                        <label class="form-label" for="regName" id="lblRegName">Full Name</label>
                        <input class="form-control" type="text" id="regName" placeholder="e.g. Anura Silva" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="regPhone">Contact Phone Number</label>
                        <input class="form-control" type="tel" id="regPhone" placeholder="e.g. +94 77 123 4567" required>
                    </div>
                </div>

                <!-- Email Address with Detailed Error Feedback -->
                <div class="form-group" style="margin-bottom: 18px;">
                    <label class="form-label" for="regEmail">Email Address <span style="color:#E53E3E;">*</span></label>
                    <input class="form-control" type="email" id="regEmail" placeholder="e.g. user@givego.lk or name@example.com" required autocomplete="email">
                    <div id="emailValidationFeedback" class="validation-msg-error" style="display: none;"></div>
                </div>

                <!-- Password & Confirm Password (Min 8 characters + Special Character) -->
                <div class="grid-cols-2">
                    <div class="form-group">
                        <label class="form-label" for="regPassword">Password (Min. 8 chars with special char) <span style="color:#E53E3E;">*</span></label>
                        <input class="form-control" type="password" id="regPassword" placeholder="e.g. Secret@2026" required autocomplete="new-password">
                        <div id="passwordValidationFeedback" class="validation-msg-error" style="display: none;"></div>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="regConfirmPassword">Confirm Password <span style="color:#E53E3E;">*</span></label>
                        <input class="form-control" type="password" id="regConfirmPassword" placeholder="Re-enter your password" required autocomplete="new-password">
                        <div id="confirmPasswordValidationFeedback" class="validation-msg-error" style="display: none;"></div>
                    </div>
                </div>

                <div class="grid-cols-2">
                    <div class="form-group">
                        <label class="form-label" for="regDistrict">District / Operating Location</label>
                        <select class="form-control form-select" id="regDistrict" required>
                            <option value="Colombo">Colombo</option>
                            <option value="Gampaha">Gampaha</option>
                            <option value="Kalutara">Kalutara</option>
                            <option value="Kandy">Kandy</option>
                            <option value="Matale">Matale</option>
                            <option value="Nuwara Eliya">Nuwara Eliya</option>
                            <option value="Galle">Galle</option>
                            <option value="Matara">Matara</option>
                            <option value="Hambantota">Hambantota</option>
                            <option value="Jaffna">Jaffna</option>
                            <option value="Kilinochchi">Kilinochchi</option>
                            <option value="Mannar">Mannar</option>
                            <option value="Vavuniya">Vavuniya</option>
                            <option value="Mullaitivu">Mullaitivu</option>
                            <option value="Batticaloa">Batticaloa</option>
                            <option value="Ampara">Ampara</option>
                            <option value="Trincomalee">Trincomalee</option>
                            <option value="Kurunegala">Kurunegala</option>
                            <option value="Puttalam">Puttalam</option>
                            <option value="Anuradhapura">Anuradhapura</option>
                            <option value="Polonnaruwa">Polonnaruwa</option>
                            <option value="Badulla">Badulla</option>
                            <option value="Moneragala">Moneragala</option>
                            <option value="Ratnapura">Ratnapura</option>
                            <option value="Kegalle">Kegalle</option>
                        </select>
                    </div>

                    <div class="form-group" id="groupReceiverCategory" style="display: none;">
                        <label class="form-label" for="regReceiverCategory">Receiver Category <span style="color:#E53E3E;">*</span></label>
                        <select class="form-control form-select" id="regReceiverCategory">
                            <option value="Hospital">Hospital / Medical Clinic</option>
                            <option value="Elders' Home">Elders' Home / Senior Citizen Care</option>
                            <option value="Children's Orphanage">Children's Orphanage / Child Care Home</option>
                            <option value="Disaster-Management Organisation">Disaster-Management / Emergency Relief Organisation</option>
                            <option value="School / Educational Institution">School / Educational Institution / Low-Income School</option>
                            <option value="Special Needs & Disability Care">Special Needs & Disability Rehabilitation Center</option>
                            <option value="Community Welfare Center">Community Welfare Center / Village Development Society</option>
                            <option value="Animal Shelter / Veterinary Welfare">Animal Shelter / Veterinary Welfare Rescue</option>
                            <option value="Religious & Interfaith Charity">Religious & Interfaith Charity / Community Kitchen</option>
                            <option value="Women's Shelter & Support">Women's Shelter & Maternal Support Center</option>
                            <option value="Youth & Vocational Training">Youth & Vocational Training Center</option>
                            <option value="Mental Health & Counseling">Mental Health & Counseling Foundation</option>
                            <option value="Other Registered NGO">Other Registered NGO / Charitable Trust</option>
                        </select>
                    </div>
                </div>

                <!-- 3. Organisational Donor Specific Fields -->
                <div id="sectionOrgDonor" style="display: none; background: #FBF5DD; padding: 20px; border-radius: var(--radius-md); border: 1px solid var(--color-border-dark); margin-bottom: 20px;">
                    <h4 style="color: var(--color-primary); margin-bottom: 12px; font-size: 1rem;">Organisational Details</h4>
                    
                    <div class="grid-cols-2">
                        <div class="form-group">
                            <label class="form-label" for="regOrgName">Organisation Official Name</label>
                            <input class="form-control" type="text" id="regOrgName" placeholder="e.g. Apex Global Foundation">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="regRepName">Authorised Representative Name</label>
                            <input class="form-control" type="text" id="regRepName" placeholder="e.g. Dr. Nimal Jayasinghe">
                        </div>
                    </div>

                    <div class="grid-cols-2">
                        <div class="form-group">
                            <label class="form-label" for="regRepDesignation">Representative Designation</label>
                            <input class="form-control" type="text" id="regRepDesignation" placeholder="e.g. CSR Manager / Director">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="regRepPhone">Representative Phone</label>
                            <input class="form-control" type="tel" id="regRepPhone" placeholder="e.g. +94 71 987 6543">
                        </div>
                    </div>

                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label">Business Registration (BR) Document (PDF / Image)</label>
                        <input type="file" id="brUploadInput" class="form-control" accept=".pdf,.png,.jpg,.jpeg">
                        <input type="hidden" id="regBrDocUrl" value="">
                    </div>
                </div>

                <!-- 4. Receiver Specific Fields & Official Bank Details -->
                <div id="sectionReceiver" style="display: none; background: #FBF5DD; padding: 20px; border-radius: var(--radius-md); border: 1px solid var(--color-border-dark); margin-bottom: 20px;">
                    <h4 style="color: var(--color-primary); margin-bottom: 12px; font-size: 1rem;">Receiver Organisation Details & Official Bank Account</h4>
                    
                    <div class="form-group">
                        <label class="form-label" for="regReceiverAddress">Full Official Address</label>
                        <input class="form-control" type="text" id="regReceiverAddress" placeholder="e.g. No 45, Kandy Road, Peradeniya">
                    </div>

                    <div class="grid-cols-2">
                        <div class="form-group">
                            <label class="form-label" for="regReceiverRep">Authorised Representative Name</label>
                            <input class="form-control" type="text" id="regReceiverRep" placeholder="e.g. Rev. Sister Mary">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="regBankName">Bank Name</label>
                            <input class="form-control" type="text" id="regBankName" placeholder="e.g. Bank of Ceylon">
                        </div>
                    </div>

                    <div class="grid-cols-3">
                        <div class="form-group">
                            <label class="form-label" for="regAccountName">Account Name</label>
                            <input class="form-control" type="text" id="regAccountName" placeholder="e.g. Grace Elders Home Fund">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="regAccountNumber">Account Number</label>
                            <input class="form-control" type="text" id="regAccountNumber" placeholder="e.g. 789012345">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="regBankBranch">Branch</label>
                            <input class="form-control" type="text" id="regBankBranch" placeholder="e.g. Kandy Main Branch">
                        </div>
                    </div>

                    <div class="grid-cols-2" style="margin-bottom: 0;">
                        <div class="form-group">
                            <label class="form-label">Registration Certificate (PDF/Image)</label>
                            <input type="file" id="receiverRegUploadInput" class="form-control" accept=".pdf,.png,.jpg,.jpeg">
                            <input type="hidden" id="regReceiverDocUrl" value="">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Official Bank Account Proof (PDF/Image)</label>
                            <input type="file" id="bankDocUploadInput" class="form-control" accept=".pdf,.png,.jpg,.jpeg">
                            <input type="hidden" id="regBankDocUrl" value="">
                        </div>
                    </div>
                </div>

                <!-- 5. Geolocation Coordinates -->
                <div class="glass-panel" style="padding: 16px; border-radius: var(--radius-md); margin-bottom: 24px; background: #FBF5DD;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <label class="form-label" style="margin-bottom: 0;">GPS Location Coordinates</label>
                        <button type="button" id="btnGeolocate" class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.8rem; border-radius: 4px;">
                            Detect Location
                        </button>
                    </div>
                    
                    <div class="grid-cols-2" style="gap: 16px;">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label" style="font-size: 0.75rem;">Latitude</label>
                            <input class="form-control" type="number" step="any" id="regLat" value="6.927100" required>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label" style="font-size: 0.75rem;">Longitude</label>
                            <input class="form-control" type="number" step="any" id="regLng" value="79.861200" required>
                        </div>
                    </div>
                </div>

                <button class="btn btn-primary" type="submit" style="width: 100%; font-size: 1rem; padding: 12px;">
                    Complete Registration
                </button>
            </form>
        </div>
    </div>

    <!-- Core Javascript Files -->
    <script src="js/firebase-config.js"></script>
    <script src="js/auth.js"></script>
    <script>
        document.addEventListener("DOMContentLoaded", () => {
            const accTypeSelect = document.getElementById("regAccountType");
            const secOrgDonor = document.getElementById("sectionOrgDonor");
            const secReceiver = document.getElementById("sectionReceiver");
            const groupDonorCat = document.getElementById("groupDonorCategories");
            const groupRecCat = document.getElementById("groupReceiverCategory");
            const lblName = document.getElementById("lblRegName");

            function toggleAccountTypeUI() {
                const val = accTypeSelect.value;
                if (val === 'donor_individual') {
                    if (secOrgDonor) secOrgDonor.style.display = "none";
                    if (secReceiver) secReceiver.style.display = "none";
                    if (groupRecCat) groupRecCat.style.display = "none";
                    lblName.textContent = "Full Name";
                } else if (val === 'donor_org') {
                    if (secOrgDonor) secOrgDonor.style.display = "block";
                    if (secReceiver) secReceiver.style.display = "none";
                    if (groupRecCat) groupRecCat.style.display = "none";
                    lblName.textContent = "Contact Person Name";
                } else if (val === 'receiver') {
                    if (secOrgDonor) secOrgDonor.style.display = "none";
                    if (secReceiver) secReceiver.style.display = "block";
                    if (groupRecCat) groupRecCat.style.display = "block";
                    lblName.textContent = "Official Organisation Name";
                }
            }

            accTypeSelect.addEventListener("change", toggleAccountTypeUI);
            toggleAccountTypeUI();

            async function bindFileUpload(inputId, hiddenFieldId) {
                const input = document.getElementById(inputId);
                const hidden = document.getElementById(hiddenFieldId);
                if (!input || !hidden) return;

                input.addEventListener("change", async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    const formData = new FormData();
                    formData.append("file", file);
                    if (window.showToast) window.showToast("Uploading document...", "info");

                    try {
                        const response = await fetch("api/upload_handler.php", {
                            method: "POST",
                            body: formData
                        });
                        const result = await response.json();
                        if (result.success) {
                            hidden.value = result.filePath;
                            if (window.showToast) window.showToast("Document uploaded successfully", "success");
                        } else {
                            if (window.showToast) window.showToast(result.error || "Upload failed.", "danger");
                            input.value = "";
                        }
                    } catch (err) {
                        if (window.showToast) window.showToast("Upload server error.", "danger");
                        console.error(err);
                    }
                });
            }

            bindFileUpload("brUploadInput", "regBrDocUrl");
            bindFileUpload("receiverRegUploadInput", "regReceiverDocUrl");
            bindFileUpload("bankDocUploadInput", "regBankDocUrl");
        });
    </script>
</body>
</html>
