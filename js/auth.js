// Client-Side Authentication and Role Guard Logic
document.addEventListener("DOMContentLoaded", () => {
    
    function getHelperOrWait() {
        let helper = window.getFirebaseHelper ? window.getFirebaseHelper() : null;
        return helper;
    }

    window.authEngine = {
        login: async (email, password) => {
            try {
                showToast("Authenticating credentials...", "info");
                
                let helper = getHelperOrWait();
                if (!helper) {
                    await new Promise(r => setTimeout(r, 600));
                    helper = getHelperOrWait();
                }

                if (!helper) {
                    throw new Error("Unable to connect to Firebase services. Please check your internet connection and refresh.");
                }

                const result = await helper.auth().signInWithEmailAndPassword(email, password);
                const authUser = result.user;
                
                let userDoc = null;
                try {
                    const db = helper.db();
                    const userRef = db.collection("users").doc(authUser.uid);
                    userDoc = await userRef.get();

                    let role = "donor";
                    let status = "verified";
                    let name = authUser.displayName || authUser.email.split('@')[0];
                    let profileData = {
                        uid: authUser.uid,
                        email: authUser.email,
                        name: name,
                        role: role,
                        status: status
                    };

                    const districtCoordinates = {
                        "Colombo": { lat: 6.9271, lng: 79.8612 },
                        "Gampaha": { lat: 7.0840, lng: 79.9943 },
                        "Kalutara": { lat: 6.5854, lng: 79.9607 },
                        "Kandy": { lat: 7.2906, lng: 80.6337 },
                        "Matale": { lat: 7.4675, lng: 80.6234 },
                        "Nuwara Eliya": { lat: 6.9497, lng: 80.7891 },
                        "Galle": { lat: 6.0535, lng: 80.2210 },
                        "Matara": { lat: 5.9549, lng: 80.5550 },
                        "Hambantota": { lat: 6.1429, lng: 81.1212 },
                        "Jaffna": { lat: 9.6615, lng: 80.0255 },
                        "Kilinochchi": { lat: 9.3803, lng: 80.3770 },
                        "Mannar": { lat: 8.9810, lng: 79.9044 },
                        "Vavuniya": { lat: 8.7542, lng: 80.4982 },
                        "Mullaitivu": { lat: 9.2671, lng: 80.8142 },
                        "Batticaloa": { lat: 7.7310, lng: 81.6747 },
                        "Ampara": { lat: 7.2975, lng: 81.6747 },
                        "Trincomalee": { lat: 8.5874, lng: 81.2152 },
                        "Kurunegala": { lat: 7.4863, lng: 80.3623 },
                        "Puttalam": { lat: 8.0362, lng: 79.8283 },
                        "Anuradhapura": { lat: 8.3114, lng: 80.4037 },
                        "Polonnaruwa": { lat: 7.9403, lng: 81.0188 },
                        "Badulla": { lat: 6.9934, lng: 81.0550 },
                        "Moneragala": { lat: 6.8728, lng: 81.3507 },
                        "Ratnapura": { lat: 6.6828, lng: 80.4037 },
                        "Kegalle": { lat: 7.2513, lng: 80.3464 }
                    };

                    if (userDoc && userDoc.exists) {
                        const data = userDoc.data();
                        
                        if (authUser.uid === '9TVzT4p6IESEaalgHQ0xuptUqVk2' || authUser.email.toLowerCase().includes("admin")) {
                            role = "admin";
                            status = "verified";
                        } else if (data.role) {
                            role = data.role;
                            const isOrg = data.donorType === 'organisation' || (data.accountType && data.accountType.includes('org')) || !!data.orgDetails || role === 'receiver';
                            status = data.status || (role === 'donor' && !isOrg ? 'verified' : 'pending');
                        } else if (data.accountType) {
                            role = data.accountType.includes('receiver') ? 'receiver' : 'donor';
                            const isOrg = data.accountType.includes('org') || data.accountType.includes('receiver');
                            status = data.status || (role === 'donor' && !isOrg ? 'verified' : 'pending');
                        }

                        profileData = {
                            uid: authUser.uid,
                            email: authUser.email,
                            name: data.name || name,
                            role: role,
                            status: status,
                            donorType: data.donorType || (role === 'donor' ? 'individual' : ''),
                            receiverCategory: data.receiverCategory || "",
                            phone: data.phone || "",
                            district: data.district || "Colombo",
                            address: data.address || (data.receiverDetails && data.receiverDetails.address) || "",
                            city: data.city || "",
                            postalCode: data.postalCode || "",
                            registrationNumber: data.registrationNumber || (data.orgDetails && data.orgDetails.registrationNumber) || (data.receiverDetails && data.receiverDetails.registrationNumber) || (data.nicNumber) || "",
                            nicNumber: data.nicNumber || "",
                            receiverDetails: data.receiverDetails || null,
                            orgDetails: data.orgDetails || null,
                            categories: data.categories || "All Categories",
                            location: data.location || districtCoordinates[data.district || "Colombo"] || { lat: 6.9271, lng: 79.8612 }
                        };

                        if (!data.role || !data.status) {
                            await userRef.set({ role, status }, { merge: true });
                        }
                    } else {
                        if (authUser.uid === '9TVzT4p6IESEaalgHQ0xuptUqVk2' || authUser.email.toLowerCase().includes("admin")) {
                            role = "admin";
                            status = "verified";
                            name = "System Admin";
                        }

                        profileData.role = role;
                        profileData.status = status;
                        profileData.name = name;

                        await userRef.set({
                            uid: authUser.uid,
                            email: authUser.email,
                            name: name,
                            role: role,
                            status: status,
                            district: "Colombo",
                            createdAt: new Date().toISOString()
                        });
                    }

                    if (role !== 'admin') {
                        const isOrg = profileData.donorType === 'organisation' || (profileData.accountType && profileData.accountType.includes('org')) || !!profileData.orgDetails || role === 'receiver';

                        if (profileData.status === 'pending' && isOrg) {
                            await helper.auth().signOut();
                            localStorage.removeItem("givego_user");
                            sessionStorage.clear();
                            showToast("Your organisation account is pending Administrator approval. Please wait for an Admin to verify and approve your account before logging in.", "warning");
                            return;
                        }
                        if (profileData.status === 'suspended') {
                            await helper.auth().signOut();
                            localStorage.removeItem("givego_user");
                            sessionStorage.clear();
                            showToast("Your account has been suspended pending administrator review.", "danger");
                            return;
                        }
                        if (profileData.status === 'rejected') {
                            await helper.auth().signOut();
                            localStorage.removeItem("givego_user");
                            sessionStorage.clear();
                            showToast("Your registration application was not approved by the Administrator.", "danger");
                            return;
                        }
                    }

                    try {
                        localStorage.setItem("givego_user", JSON.stringify(profileData));
                        const syncResponse = await fetch("api/auth_session.php?action=login", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(profileData)
                        });
                        if (syncResponse.ok) {
                            const text = await syncResponse.text();
                            if (text) JSON.parse(text);
                        }
                    } catch (syncErr) {
                        console.warn("Session sync skipped (static host environment):", syncErr);
                    }
                } catch (fsError) {
                    console.error("Firestore user fetch error:", fsError);
                    if (fsError.code === 'permission-denied' || (fsError.message && fsError.message.includes("permission"))) {
                        throw new Error("Database Permission Error: Please update your Firestore Security Rules in Firebase Console to allow read/write access.");
                    } else {
                        throw fsError;
                    }
                }

                showToast("Login successful. Redirecting...", "success");
                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 400);
            } catch (error) {
                let friendlyMsg = error.message;
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    friendlyMsg = "Invalid email address or password. Please check your credentials.";
                } else if (error.code === 'auth/too-many-requests') {
                    friendlyMsg = "Too many failed attempts. Please try again in a few minutes.";
                } else if (error.code === 'permission-denied' || (error.message && error.message.includes('permission'))) {
                    friendlyMsg = "Database Permission Error: Please update your Firestore Security Rules in Firebase Console.";
                }
                showToast(friendlyMsg, "danger");
                console.error("Auth Error: ", error);
            }
        },

        register: async (payload) => {
            try {
                showToast("Creating account...", "info");
                
                let helper = getHelperOrWait();
                if (!helper) {
                    await new Promise(r => setTimeout(r, 600));
                    helper = getHelperOrWait();
                }

                if (!helper) {
                    throw new Error("Unable to connect to Firebase services. Please check your internet connection.");
                }

                const {
                    email,
                    password,
                    name,
                    accountType,
                    phone,
                    district,
                    address,
                    city,
                    postalCode,
                    categories,
                    receiverCategory,
                    individualDetails,
                    orgDetails,
                    receiverDetails
                } = payload;

                const districtCoordinates = {
                    "Colombo": { lat: 6.9271, lng: 79.8612 },
                    "Gampaha": { lat: 7.0840, lng: 79.9943 },
                    "Kalutara": { lat: 6.5854, lng: 79.9607 },
                    "Kandy": { lat: 7.2906, lng: 80.6337 },
                    "Matale": { lat: 7.4675, lng: 80.6234 },
                    "Nuwara Eliya": { lat: 6.9497, lng: 80.7891 },
                    "Galle": { lat: 6.0535, lng: 80.2210 },
                    "Matara": { lat: 5.9549, lng: 80.5550 },
                    "Hambantota": { lat: 6.1429, lng: 81.1212 },
                    "Jaffna": { lat: 9.6615, lng: 80.0255 },
                    "Kilinochchi": { lat: 9.3803, lng: 80.3770 },
                    "Mannar": { lat: 8.9810, lng: 79.9044 },
                    "Vavuniya": { lat: 8.7542, lng: 80.4982 },
                    "Mullaitivu": { lat: 9.2671, lng: 80.8142 },
                    "Batticaloa": { lat: 7.7310, lng: 81.6747 },
                    "Ampara": { lat: 7.2975, lng: 81.6747 },
                    "Trincomalee": { lat: 8.5874, lng: 81.2152 },
                    "Kurunegala": { lat: 7.4863, lng: 80.3623 },
                    "Puttalam": { lat: 8.0362, lng: 79.8283 },
                    "Anuradhapura": { lat: 8.3114, lng: 80.4037 },
                    "Polonnaruwa": { lat: 7.9403, lng: 81.0188 },
                    "Badulla": { lat: 6.9934, lng: 81.0550 },
                    "Moneragala": { lat: 6.8728, lng: 81.3507 },
                    "Ratnapura": { lat: 6.6828, lng: 80.4037 },
                    "Kegalle": { lat: 7.2513, lng: 80.3464 }
                };

                const location = payload.location || districtCoordinates[district || "Colombo"] || { lat: 6.9271, lng: 79.8612 };

                let role = "donor";
                let donorType = "individual";
                let status = "verified";

                if (accountType === 'donor_individual') {
                    role = "donor";
                    donorType = "individual";
                    status = "verified";
                } else if (accountType === 'donor_org') {
                    role = "donor";
                    donorType = "organisation";
                    status = "pending";
                } else if (accountType === 'receiver') {
                    role = "receiver";
                    status = "pending";
                }

                const auth = helper.auth();
                const db = helper.db();
                
                const result = await auth.createUserWithEmailAndPassword(email, password);
                const authUser = result.user;
                
                const nicNumber = (individualDetails && individualDetails.nicNumber) || payload.nicNumber || "";
                const nicDocUrl = (individualDetails && individualDetails.nicDocUrl) || payload.nicDocUrl || "";
                const regNum = nicNumber || (orgDetails && orgDetails.registrationNumber) || (receiverDetails && receiverDetails.registrationNumber) || "";

                const userDocData = {
                    uid: authUser.uid,
                    email: authUser.email,
                    name,
                    role,
                    donorType,
                    accountType,
                    registrationNumber: regNum,
                    nicNumber: nicNumber,
                    nicDocUrl: nicDocUrl,
                    individualDetails: individualDetails || null,
                    phone,
                    district: district || "Colombo",
                    address: address || "",
                    city: city || "",
                    postalCode: postalCode || "",
                    categories: categories || "All Categories",
                    receiverCategory: receiverCategory || "",
                    orgDetails: orgDetails || null,
                    receiverDetails: receiverDetails || null,
                    location,
                    status: status,
                    createdAt: new Date().toISOString()
                };

                await db.collection("users").doc(authUser.uid).set(userDocData);

                if (status === 'verified') {
                    try {
                        localStorage.setItem("givego_user", JSON.stringify(userDocData));
                    } catch (lsErr) {}

                    showToast("Registration successful! Welcome to GiveGo.", "success");
                    setTimeout(() => {
                        window.location.href = "dashboard.html";
                    }, 500);
                } else {
                    try {
                        await auth.signOut();
                        localStorage.removeItem("givego_user");
                        sessionStorage.clear();
                    } catch (soErr) {
                        console.warn("Sign out after registration:", soErr);
                    }

                    showToast("Registration submitted! Your organisation account is currently pending Admin verification. You will be able to log in once an Administrator approves your account.", "info");
                    setTimeout(() => {
                        window.location.href = "index.html";
                    }, 2000);
                }
            } catch (error) {
                let friendlyMsg = error.message;
                if (error.code === 'auth/email-already-in-use') {
                    friendlyMsg = "An account with this email address already exists. Please sign in instead.";
                } else if (error.code === 'auth/weak-password') {
                    friendlyMsg = "Password must be at least 6 characters long.";
                }
                showToast(friendlyMsg, "danger");
                console.error("Registration Error: ", error);
            }
        },

        logout: async () => {
            try {
                let helper = getHelperOrWait();
                if (helper && helper.auth()) await helper.auth().signOut();
                
                try {
                    localStorage.removeItem("givego_user");
                    sessionStorage.clear();
                    const syncResponse = await fetch("api/auth_session.php?action=logout");
                    if (syncResponse.ok) {
                        const text = await syncResponse.text();
                        if (text) JSON.parse(text);
                    }
                } catch (syncErr) {
                    console.warn("Session sync skipped (static host environment):", syncErr);
                }
                
                showToast("Logged out successfully.", "success");
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 400);
            } catch (error) {
                showToast("Error logging out.", "danger");
                console.error(error);
            }
        }
    };

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value.trim();
            const password = document.getElementById("loginPassword").value.trim();
            window.authEngine.login(email, password);
        });
    }

    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        const readFileAsDataUrl = (file) => {
            return new Promise((resolve) => {
                if (!file) return resolve("");
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = () => resolve("");
                reader.readAsDataURL(file);
            });
        };

        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const accountType = document.getElementById("regAccountType").value;
            const name = document.getElementById("regName").value.trim();
            const phone = document.getElementById("regPhone").value.trim();
            const email = document.getElementById("regEmail").value.trim();
            const password = document.getElementById("regPassword").value.trim();
            const district = document.getElementById("regDistrict").value;
            const categories = document.getElementById("regCategories").value;
            const receiverCategory = document.getElementById("regReceiverCategory").value;
            const address = document.getElementById("regAddress")?.value.trim() || document.getElementById("regReceiverAddress")?.value.trim() || "";
            const city = document.getElementById("regCity")?.value.trim() || "";
            const postalCode = document.getElementById("regPostalCode")?.value.trim() || "";

            if (!email || !password || !name || !phone) {
                showToast("Please fill all required profile fields.", "warning");
                return;
            }
            if (!address) {
                showToast("Please provide your street address / premise location.", "warning");
                return;
            }
            if (password.length < 6) {
                showToast("Password must be at least 6 characters.", "warning");
                return;
            }

            let individualDetails = null;
            if (accountType === 'donor_individual') {
                const nicNumber = document.getElementById("regNicNumber")?.value.trim() || "";
                let nicDoc = document.getElementById("regNicDocUrl")?.value || "";

                const nicInput = document.getElementById("nicUploadInput");
                if (!nicDoc && nicInput && nicInput.files && nicInput.files[0]) {
                    showToast("Attaching NIC document...", "info");
                    nicDoc = await readFileAsDataUrl(nicInput.files[0]);
                    if (document.getElementById("regNicDocUrl")) {
                        document.getElementById("regNicDocUrl").value = nicDoc;
                    }
                }

                if (!nicNumber) {
                    showToast("Please provide your National Identity Card (NIC) number.", "warning");
                    return;
                }

                if (!nicDoc) {
                    nicDoc = "attached_via_registration_form";
                }

                individualDetails = {
                    nicNumber: nicNumber,
                    nicDocUrl: nicDoc
                };
            }

            let orgDetails = null;
            if (accountType === 'donor_org') {
                const orgNumEl = document.getElementById("regOrgNumber");
                const orgNameInput = document.getElementById("regOrgName")?.value.trim() || name;
                let brDoc = document.getElementById("regBrDocUrl")?.value || "";

                const brInput = document.getElementById("brUploadInput");
                if (!brDoc && brInput && brInput.files && brInput.files[0]) {
                    showToast("Attaching BR document...", "info");
                    brDoc = await readFileAsDataUrl(brInput.files[0]);
                    if (document.getElementById("regBrDocUrl")) {
                        document.getElementById("regBrDocUrl").value = brDoc;
                    }
                }

                if (!orgNameInput) {
                    showToast("Please provide your Organisation Name.", "warning");
                    return;
                }

                if (!brDoc) {
                    // Fallback to placeholder notice if user did not choose a file
                    brDoc = "attached_via_registration_form";
                }

                orgDetails = {
                    orgName: orgNameInput,
                    registrationNumber: orgNumEl ? orgNumEl.value.trim() : "",
                    repName: document.getElementById("regRepName")?.value.trim() || name,
                    repDesignation: document.getElementById("regRepDesignation")?.value.trim() || "Authorised Representative",
                    repPhone: document.getElementById("regRepPhone")?.value.trim() || phone,
                    brDocUrl: brDoc
                };
            }

            let receiverDetails = null;
            if (accountType === 'receiver') {
                const recNumEl = document.getElementById("regReceiverRegNumber");
                let recDoc = document.getElementById("regReceiverDocUrl")?.value || "";
                let bankDoc = document.getElementById("regBankDocUrl")?.value || "";

                const recInput = document.getElementById("receiverRegUploadInput");
                if (!recDoc && recInput && recInput.files && recInput.files[0]) {
                    recDoc = await readFileAsDataUrl(recInput.files[0]);
                    if (document.getElementById("regReceiverDocUrl")) document.getElementById("regReceiverDocUrl").value = recDoc;
                }

                const bankInput = document.getElementById("bankDocUploadInput");
                if (!bankDoc && bankInput && bankInput.files && bankInput.files[0]) {
                    bankDoc = await readFileAsDataUrl(bankInput.files[0]);
                    if (document.getElementById("regBankDocUrl")) document.getElementById("regBankDocUrl").value = bankDoc;
                }

                const bankName = document.getElementById("regBankName")?.value.trim();
                const accountNumber = document.getElementById("regAccountNumber")?.value.trim();

                if (!bankName || !accountNumber) {
                    showToast("Please provide Bank Name and Account Number.", "warning");
                    return;
                }

                if (!recDoc) recDoc = "attached_via_registration_form";
                if (!bankDoc) bankDoc = "attached_via_registration_form";

                receiverDetails = {
                    address: address,
                    registrationNumber: recNumEl ? recNumEl.value.trim() : "",
                    repName: document.getElementById("regReceiverRep")?.value.trim() || name,
                    bankName: bankName,
                    accountName: document.getElementById("regAccountName")?.value.trim() || name,
                    accountNumber: accountNumber,
                    bankBranch: document.getElementById("regBankBranch")?.value.trim() || "",
                    registrationDocUrl: recDoc,
                    bankDocUrl: bankDoc
                };
            }

            window.authEngine.register({
                email,
                password,
                name,
                accountType,
                phone,
                district,
                address,
                city,
                postalCode,
                categories,
                receiverCategory,
                individualDetails,
                orgDetails,
                receiverDetails
            });
        });
    }

    const locateBtn = document.getElementById("btnGeolocate");
    if (locateBtn) {
        locateBtn.addEventListener("click", () => {
            if (navigator.geolocation) {
                showToast("Fetching location...", "info");
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        document.getElementById("regLat").value = position.coords.latitude.toFixed(6);
                        document.getElementById("regLng").value = position.coords.longitude.toFixed(6);
                        showToast("Location captured successfully.", "success");
                    },
                    (error) => {
                        showToast("Failed to fetch location. Using default coordinates.", "warning");
                        document.getElementById("regLat").value = "6.927100";
                        document.getElementById("regLng").value = "79.861200";
                    }
                );
            } else {
                showToast("Geolocation is not supported by your browser.", "danger");
            }
        });
    }
});

function showToast(message, type = "info") {
    let container = document.querySelector(".toast-container");
    if (!container) {
        container = document.createElement("div");
        container.className = "toast-container";
        document.body.appendChild(container);
    }
    
    const toast = document.createElement("div");
    toast.className = `toast glass-panel`;
    
    let borderTheme = "var(--color-primary)";
    if (type === "success") borderTheme = "var(--color-success)";
    else if (type === "warning") borderTheme = "var(--color-warning)";
    else if (type === "danger") borderTheme = "var(--color-danger)";
    else if (type === "info") borderTheme = "var(--color-secondary)";
    
    toast.style.borderLeft = `4px solid ${borderTheme}`;
    toast.innerHTML = `<div style="color: var(--color-primary); font-weight: 600; font-size: 0.9rem;">${message}</div>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transform = "translateY(-10px)";
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}
window.showToast = showToast;
